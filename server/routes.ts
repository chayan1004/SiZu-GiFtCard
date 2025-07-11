import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SquareService } from "./services/SquareService";
import { SquareCustomerService } from "./services/SquareCustomerService";
import { PDFService } from "./services/PDFService";
import { EmailService } from "./services/EmailService";
import { QRService } from "./services/QRService";
import {
  createGiftCardSchema,
  redeemGiftCardSchema,
  checkBalanceSchema,
  addSavedCardSchema,
  deleteSavedCardSchema,
  setSavedCardDefaultSchema,
  type CreateGiftCardInput,
  type RedeemGiftCardInput,
  type CheckBalanceInput,
  type AddSavedCardInput,
  type DeleteSavedCardInput,
  type SetSavedCardDefaultInput,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  generalRateLimit,
  authRateLimit,
  giftCardRateLimit,
  securityHeaders,
  httpsRedirect,
  validateInput,
  validateGiftCardAmount,
  validateEmail,
  corsOptions,
  validateApiKey,
  secureLogger
} from "./middleware/security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const squareService = new SquareService();
  const squareCustomerService = new SquareCustomerService();
  const pdfService = new PDFService();
  const emailService = new EmailService();
  const qrService = new QRService();

  // Security middleware
  app.use(httpsRedirect);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  
  // Apply rate limiting only to API routes and not to Vite development routes
  app.use((req, res, next) => {
    // Skip rate limiting for Vite development routes
    if (process.env.NODE_ENV === 'development' && 
        (req.path.startsWith('/@') || 
         req.path.startsWith('/src') || 
         req.path.startsWith('/node_modules'))) {
      return next();
    }
    generalRateLimit(req, res, next);
  });
  
  app.use(validateInput);
  app.use(secureLogger);

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Gift Card Routes
  
  // Create gift card (Admin only)
  app.post('/api/giftcards', giftCardRateLimit, validateGiftCardAmount, validateEmail, isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const data = createGiftCardSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      // Generate unique code
      const code = `GC${nanoid(12).toUpperCase()}`;
      
      // Create gift card in database
      const giftCard = await storage.createGiftCard({
        ...data,
        code,
        issuedById: userId,
      });

      // Create with Square API
      try {
        const squareGiftCard = await squareService.createGiftCard(
          parseFloat(data.initialAmount.toString()),
          code
        );
        
        // Update with Square ID
        await storage.updateGiftCardSquareId(giftCard.id, squareGiftCard.id);
      } catch (squareError) {
        console.error("Square API error:", squareError);
        // Continue without Square integration for now
      }

      // Create issue transaction
      const transaction = await storage.createTransaction({
        giftCardId: giftCard.id,
        type: 'issue',
        amount: data.initialAmount.toString(),
        balanceAfter: data.initialAmount.toString(),
        performedById: userId,
        notes: 'Gift card issued',
      });

      // Broadcast revenue update
      if ((global as any).broadcastRevenueUpdate) {
        (global as any).broadcastRevenueUpdate(transaction);
      }

      // Generate receipt
      const receiptData = {
        giftCardCode: code,
        amount: data.initialAmount,
        design: data.design,
        customMessage: data.customMessage,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        senderName: data.senderName,
        transactionId: transaction.id,
        timestamp: new Date().toISOString(),
      };

      const accessToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const receipt = await storage.createReceipt({
        giftCardId: giftCard.id,
        transactionId: transaction.id,
        receiptData,
        accessToken,
        expiresAt,
      });

      // Generate QR code
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      const qrCodeUrl = `${baseUrl}/redeem?code=${code}`;
      console.log('Generating QR code for URL:', qrCodeUrl);
      const qrCode = await qrService.generateQRCode(qrCodeUrl);

      // Generate PDF receipt
      const pdfPath = await pdfService.generateReceiptPDF(receiptData, qrCode);
      await storage.updateReceiptPdfPath(receipt.id, pdfPath);

      // Send email if recipient email provided
      if (data.recipientEmail) {
        await emailService.sendGiftCardEmail(
          data.recipientEmail,
          receiptData,
          pdfPath,
          qrCode
        );
        await storage.markReceiptEmailSent(receipt.id);
      }

      res.json({
        ...giftCard,
        receiptUrl: `/api/receipts/${accessToken}`,
        qrCode,
      });
    } catch (error) {
      console.error("Error creating gift card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create gift card" });
    }
  });

  // Check balance (Public)
  app.post('/api/giftcards/balance', giftCardRateLimit, async (req, res) => {
    try {
      const { code } = checkBalanceSchema.parse(req.body);
      
      const giftCard = await storage.getGiftCardByCode(code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      if (!giftCard.isActive) {
        return res.status(400).json({ message: "Gift card is not active" });
      }

      res.json({
        code: giftCard.code,
        balance: parseFloat(giftCard.currentBalance),
        isActive: giftCard.isActive,
      });
    } catch (error) {
      console.error("Error checking balance:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check balance" });
    }
  });

  // Redeem gift card (Public)
  app.post('/api/giftcards/redeem', giftCardRateLimit, validateGiftCardAmount, async (req, res) => {
    try {
      const { code, amount } = redeemGiftCardSchema.parse(req.body);
      
      const giftCard = await storage.getGiftCardByCode(code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      if (!giftCard.isActive) {
        return res.status(400).json({ message: "Gift card is not active" });
      }

      const currentBalance = parseFloat(giftCard.currentBalance);
      if (amount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const newBalance = currentBalance - amount;

      // Update balance
      await storage.updateGiftCardBalance(giftCard.id, newBalance.toString());

      // Create redemption transaction
      const transaction = await storage.createTransaction({
        giftCardId: giftCard.id,
        type: 'redeem',
        amount: amount.toString(),
        balanceAfter: newBalance.toString(),
        notes: 'Gift card redeemed',
      });

      // Broadcast revenue update
      if ((global as any).broadcastRevenueUpdate) {
        (global as any).broadcastRevenueUpdate(transaction);
      }

      // Generate receipt for redemption
      const receiptData = {
        giftCardCode: code,
        amount: amount,
        remainingBalance: newBalance,
        transactionId: transaction.id,
        timestamp: new Date().toISOString(),
        type: 'redemption',
      };

      const accessToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const receipt = await storage.createReceipt({
        giftCardId: giftCard.id,
        transactionId: transaction.id,
        receiptData,
        accessToken,
        expiresAt,
      });

      // Generate QR code for receipt
      const qrCode = await qrService.generateQRCode(
        `${process.env.REPLIT_DOMAINS?.split(',')[0]}/receipt/${accessToken}`
      );

      // Generate PDF receipt
      const pdfPath = await pdfService.generateReceiptPDF(receiptData, qrCode);
      await storage.updateReceiptPdfPath(receipt.id, pdfPath);

      res.json({
        success: true,
        redeemedAmount: amount,
        remainingBalance: newBalance,
        receiptUrl: `/api/receipts/${accessToken}`,
        transactionId: transaction.id,
      });
    } catch (error) {
      console.error("Error redeeming gift card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to redeem gift card" });
    }
  });

  // Get all gift cards (Admin only)
  app.get('/api/giftcards', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const giftCards = await storage.getAllGiftCards();
      res.json(giftCards);
    } catch (error) {
      console.error("Error fetching gift cards:", error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Get user's gift cards
  app.get('/api/giftcards/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const giftCards = await storage.getGiftCardsByUser(userId);
      res.json(giftCards);
    } catch (error) {
      console.error("Error fetching user gift cards:", error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Receipt routes
  app.get('/api/receipts/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const receipt = await storage.getReceiptByToken(token);
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found or expired" });
      }

      // Regenerate QR code for the gift card
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      const qrCodeUrl = `${baseUrl}/redeem?code=${receipt.receiptData.giftCardCode}`;
      const qrCode = await qrService.generateQRCode(qrCodeUrl);

      res.json({
        ...receipt,
        qrCode
      });
    } catch (error) {
      console.error("Error fetching receipt:", error);
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });

  app.get('/api/receipts/:token/pdf', async (req, res) => {
    try {
      const { token } = req.params;
      const receipt = await storage.getReceiptByToken(token);
      
      if (!receipt || !receipt.pdfPath) {
        return res.status(404).json({ message: "Receipt PDF not found" });
      }

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(receipt.pdfPath)) {
        console.error(`PDF file not found: ${receipt.pdfPath}`);
        return res.status(404).json({ message: "Receipt PDF file not found on disk" });
      }

      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.id}.pdf"`);
      
      res.download(receipt.pdfPath, `receipt-${receipt.id}.pdf`);
    } catch (error) {
      console.error("Error serving PDF:", error);
      res.status(500).json({ message: "Failed to serve PDF" });
    }
  });

  // Admin Dashboard Routes
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/fraud-alerts', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getUnresolvedFraudAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
      res.status(500).json({ message: "Failed to fetch fraud alerts" });
    }
  });

  app.post('/api/admin/fraud-alerts/:id/resolve', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const alert = await storage.resolveFraudAlert(id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving fraud alert:", error);
      res.status(500).json({ message: "Failed to resolve fraud alert" });
    }
  });

  // Order History Routes
  
  // Get user's order history (paginated)
  app.get('/api/user/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // Validate pagination parameters
      if (page < 1 || pageSize < 1 || pageSize > 50) {
        return res.status(400).json({ message: "Invalid pagination parameters" });
      }
      
      const { orders, totalCount } = await storage.getUserOrders(userId, page, pageSize);
      
      res.json({
        orders,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch order history" });
    }
  });
  
  // Get specific order details
  app.get('/api/user/orders/:orderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;
      
      const orderDetails = await storage.getUserOrderDetails(userId, orderId);
      
      if (!orderDetails) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get revenue information
      const giftCardRevenue = await storage.getGiftCardRevenue(orderId);
      
      // Get recipient spending if they have an email
      let recipientSpending = { totalSpent: 0, purchaseCount: 0 };
      if (orderDetails.recipientEmail) {
        recipientSpending = await storage.getUserTotalSpending(orderDetails.recipientEmail);
      }
      
      res.json({
        ...orderDetails,
        revenue: {
          giftCardRevenue,
          recipientSpending
        }
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // Saved Card Routes
  
  // List user's saved cards
  app.get('/api/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cards = await storage.getUserSavedCards(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ message: "Failed to fetch saved cards" });
    }
  });

  // Add a new card
  app.post('/api/cards', authRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = addSavedCardSchema.parse(req.body);
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if Square integration is available
      if (!squareCustomerService.isAvailable()) {
        return res.status(503).json({ message: "Payment card service unavailable" });
      }

      // Create or update Square customer if needed
      let squareCustomerId = user.squareCustomerId;
      if (!squareCustomerId) {
        try {
          const customer = await squareCustomerService.createCustomer(
            user.email || undefined,
            user.firstName || undefined,
            user.lastName || undefined
          );
          squareCustomerId = customer.id!;
          await storage.updateUserSquareCustomerId(userId, squareCustomerId);
        } catch (error) {
          console.error("Error creating Square customer:", error);
          return res.status(500).json({ message: "Failed to create payment profile" });
        }
      }

      // Add card to Square customer
      let squareCard;
      try {
        squareCard = await squareCustomerService.addCardToCustomer(
          squareCustomerId,
          data.sourceId,
          data.verificationToken
        );
      } catch (error: any) {
        console.error("Error adding card to Square:", error);
        if (error.message?.includes("Card was declined")) {
          return res.status(400).json({ message: "Card was declined" });
        } else if (error.message?.includes("verification required")) {
          return res.status(400).json({ message: "Card verification required" });
        } else if (error.message?.includes("Invalid card")) {
          return res.status(400).json({ message: "Invalid card information" });
        }
        return res.status(500).json({ message: "Failed to add payment card" });
      }

      // Parse card details for storage
      const cardDetails = squareCustomerService.parseCardForStorage(squareCard);

      // Save card to database
      const savedCard = await storage.addSavedCard({
        userId,
        squareCardId: cardDetails.squareCardId,
        cardBrand: cardDetails.cardBrand,
        last4: cardDetails.last4,
        expMonth: cardDetails.expMonth,
        expYear: cardDetails.expYear,
        cardholderName: cardDetails.cardholderName,
        nickname: data.nickname,
        isDefault: data.isDefault || false,
      });

      res.json(savedCard);
    } catch (error: any) {
      console.error("Error adding saved card:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add payment card" });
    }
  });

  // Delete a saved card
  app.delete('/api/cards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = req.params.id;

      // Verify card ownership
      const card = await storage.getSavedCardById(cardId, userId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Delete from Square if integration is available
      if (squareCustomerService.isAvailable() && card.squareCardId) {
        try {
          await squareCustomerService.deleteCard(card.squareCardId);
        } catch (error) {
          console.error("Error deleting card from Square:", error);
          // Continue with local deletion even if Square deletion fails
        }
      }

      // Delete from database
      await storage.deleteSavedCard(cardId, userId);
      res.json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("Error deleting saved card:", error);
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  // Set card as default
  app.put('/api/cards/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = req.params.id;

      // Verify card ownership
      const card = await storage.getSavedCardById(cardId, userId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Set as default
      await storage.setDefaultCard(cardId, userId);
      res.json({ message: "Default card updated successfully" });
    } catch (error) {
      console.error("Error setting default card:", error);
      res.status(500).json({ message: "Failed to update default card" });
    }
  });

  // Fee Configuration Routes (Admin only)
  
  // Get all fee configurations
  app.get('/api/admin/fees', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const fees = await storage.getFeeConfigurations();
      res.json(fees);
    } catch (error) {
      console.error("Error fetching fee configurations:", error);
      res.status(500).json({ message: "Failed to fetch fee configurations" });
    }
  });

  // Create fee configuration
  app.post('/api/admin/fees', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const feeData = {
        ...req.body,
        updatedBy: user.id
      };

      const fee = await storage.createFeeConfiguration(feeData);
      res.json(fee);
    } catch (error) {
      console.error("Error creating fee configuration:", error);
      res.status(500).json({ message: "Failed to create fee configuration" });
    }
  });

  // Update fee configuration
  app.put('/api/admin/fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const feeData = {
        ...req.body,
        updatedBy: user.id
      };

      const fee = await storage.updateFeeConfiguration(id, feeData);
      res.json(fee);
    } catch (error) {
      console.error("Error updating fee configuration:", error);
      res.status(500).json({ message: "Failed to update fee configuration" });
    }
  });

  // Delete fee configuration
  app.delete('/api/admin/fees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteFeeConfiguration(id);
      res.json({ message: "Fee configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting fee configuration:", error);
      res.status(500).json({ message: "Failed to delete fee configuration" });
    }
  });

  // Public fee endpoint for shop
  app.get('/api/fees/active', async (req, res) => {
    try {
      const fees = await storage.getFeeConfigurations();
      const activeFees = fees.filter(fee => fee.isActive);
      res.json(activeFees);
    } catch (error) {
      console.error("Error fetching active fees:", error);
      res.status(500).json({ message: "Failed to fetch active fees" });
    }
  });

  // Public fee endpoint for shop
  app.get('/api/fees/active', async (req, res) => {
    try {
      const fees = await storage.getFeeConfigurations();
      const activeFees = fees.filter(fee => fee.isActive);
      res.json(activeFees);
    } catch (error) {
      console.error("Error fetching active fees:", error);
      res.status(500).json({ message: "Failed to fetch active fees" });
    }
  });

  // Calculate fee for gift card amount
  app.post('/api/fees/calculate', async (req, res) => {
    try {
      const { amount, feeType = 'standard' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const feeAmount = await storage.calculateFeeAmount(amount, feeType);
      const total = amount + feeAmount;

      res.json({
        amount,
        feeType,
        feeAmount,
        total
      });
    } catch (error) {
      console.error("Error calculating fee:", error);
      res.status(500).json({ message: "Failed to calculate fee" });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time fraud alerts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle client messages if needed
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Function to broadcast fraud alerts to all connected clients
  const broadcastFraudAlert = (alert: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'fraud-alert',
          data: alert
        }));
      }
    });
  };

  // Function to broadcast revenue updates to all connected clients
  const broadcastRevenueUpdate = (transaction: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'transaction',
          amount: parseFloat(transaction.amount),
          transactionType: transaction.type,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  // Export broadcast functions for use in services
  (global as any).broadcastFraudAlert = broadcastFraudAlert;
  (global as any).broadcastRevenueUpdate = broadcastRevenueUpdate;

  return httpServer;
}
