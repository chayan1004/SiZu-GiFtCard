import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAnyAuth, requireCustomerAuth, getAuthenticatedUser } from "./middleware/customerAuth";
import { AuthService } from "./services/AuthService";
import { SquareService } from "./services/SquareService";
import { SquareCustomerService } from "./services/SquareCustomerService";
import { PDFService } from "./services/PDFService";
import { EmailService } from "./services/EmailService";
import { QRService } from "./services/QRService";
import { aiService } from "./services/aiService";
import { paymentsRouter } from "./routes-payments";
import { webhooksRouter } from "./routes-webhooks";
import { paymentLinksRouter } from "./routes-payment-links";
import { refundsRouter } from "./routes-refunds";
import { disputesRouter } from "./routes-disputes";
import { oauthRouter } from "./routes-oauth";
import { webhookSubscriptionsRouter } from "./routes-webhooks-subscriptions";
import { emailTemplatesRouter } from "./routes-email-templates";
import { giftCardDesignsRouter } from "./routes-gift-card-designs";
import { systemSettingsRouter } from "./routes-system-settings";
import { auditLogsRouter } from "./routes-audit-logs";
import { databaseToolsRouter } from "./routes-database-tools";
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
  secureLogger,
  validateGiftCardCode,
  validateId,
  sanitizeString
} from "./middleware/security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const squareService = new SquareService();
  const squareCustomerService = new SquareCustomerService();

  // Initialize payments service only if Square access token is available
  let paymentsService: any = null;
  try {
    if (process.env.SQUARE_ACCESS_TOKEN) {
      const { SquarePaymentsService } = await import('./services/SquarePaymentsService');
      paymentsService = new SquarePaymentsService();
    }
  } catch (error) {
    console.log('Square payments service not available - Square access token not provided');
  }

  // Configure secure sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    name: 'sizu.sid'
  }));

  const pdfService = new PDFService();
  const emailService = new EmailService();
  const qrService = new QRService();

  // Security middleware
  app.use(httpsRedirect);
  app.use(securityHeaders);
  app.use(cors(corsOptions));

  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin) {
      res.setHeader('Vary', 'Origin');
    }

    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  });

  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development' && 
        (req.path.startsWith('/@') || 
         req.path.startsWith('/src') || 
         req.path.startsWith('/node_modules'))) {
      return next();
    }
    generalRateLimit(req, res, next);
  });

  // Apply input validation middleware except for webhook, payment-links, payments, and auth endpoints
  app.use((req, res, next) => {
    // Skip validation for webhook endpoints - they receive legitimate JSON from external services
    // Also skip payment endpoints as they need to accept tokens with special characters
    // Skip auth endpoints as passwords need to contain special characters
    if (req.path.startsWith('/api/webhooks/') || 
        req.path.startsWith('/api/payment-links/') ||
        req.path.startsWith('/api/payments/') ||
        req.path.startsWith('/api/auth/') ||
        req.path === '/api/login' ||
        req.path === '/api/callback' ||
        req.path === '/api/logout') {
      return next();
    }
    validateInput(req, res, next);
  });
  app.use(secureLogger);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        payments: paymentsService ? paymentsService.isAvailable() : false,
        square: squareService ? true : false,
        email: true // EmailService availability
      }
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Initialize AuthService
  const authService = new AuthService();

  // Add payment routes
  app.use('/api/payments', paymentsRouter);

  // Add webhook routes
  app.use('/api/webhooks', webhooksRouter);

  // Add payment links routes
  app.use('/api/payment-links', paymentLinksRouter);

  // Add refunds routes
  app.use('/api/refunds', refundsRouter);

  // Add disputes routes
  app.use('/api/disputes', disputesRouter);

  // Add OAuth routes
  app.use('/api/oauth', oauthRouter);

  // Add webhook subscriptions routes
  app.use('/api/webhooks/subscriptions', webhookSubscriptionsRouter);

  // Add email templates routes
  app.use('/api/email-templates', emailTemplatesRouter);

  // Add gift card designs routes
  app.use('/api/gift-card-designs', giftCardDesignsRouter);

  // Add system settings routes
  app.use('/api/system-settings', systemSettingsRouter);

  // Add audit logs routes
  app.use('/api/audit-logs', auditLogsRouter);

  // Add database tools routes (admin only)
  app.use('/api/admin/database', databaseToolsRouter);

  // Add missing critical endpoints

  // Transactions endpoint
  app.get('/api/transactions', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (user.isAdmin) {
        // Admin gets all transactions
        const transactions = await storage.getAllTransactions();
        res.json(transactions);
      } else {
        // Regular user gets only their transactions
        const giftCards = await storage.getGiftCardsByUser(user.id);
        const allTransactions = [];
        for (const card of giftCards) {
          const cardTransactions = await storage.getTransactionsByGiftCard(card.id);
          allTransactions.push(...cardTransactions.map(tx => ({
            ...tx,
            cardCode: card.code,
            cardDesign: card.design
          })));
        }
        allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json(allTransactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Receipts endpoint
  app.get('/api/receipts', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (user.isAdmin) {
        // Admin gets all receipts
        const receipts = await storage.getAllReceipts();
        res.json(receipts);
      } else {
        // Regular user gets only their receipts
        const giftCards = await storage.getGiftCardsByUser(user.id);
        const allReceipts = [];
        for (const card of giftCards) {
          const cardReceipts = await storage.getReceiptsByGiftCard(card.id);
          allReceipts.push(...cardReceipts);
        }
        allReceipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json(allReceipts);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  // Replit Auth routes (for admin)
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

  // Customer Authentication Routes
  app.post('/api/auth/register', authRateLimit, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const result = await authService.registerCustomer(email, password, firstName, lastName);

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post('/api/auth/login', authRateLimit, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authService.loginCustomer(email, password);

      // Create session
      req.session.userId = user.id;
      req.session.role = user.role;

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.post('/api/auth/verify-otp', authRateLimit, async (req, res) => {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        return res.status(400).json({ message: "User ID and OTP are required" });
      }

      const result = await authService.verifyEmail(userId, otp);

      // Automatically log them in after verification
      const user = await storage.getUser(userId);
      if (user) {
        req.session.userId = user.id;
        req.session.role = user.role;
      }

      res.json({ 
        message: "Email verified successfully",
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } : null
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Verification failed" });
    }
  });

  app.get('/api/auth/customer', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      res.json(user);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer info" });
    }
  });

  app.post('/api/auth/forgot-password', authRateLimit, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Password reset request failed" });
    }
  });

  app.post('/api/auth/reset-password', authRateLimit, async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Password reset failed" });
    }
  });

  // Customer session check
  app.get('/api/auth/customer', async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'customer') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: "Session check failed" });
    }
  });

  // Customer-specific endpoints (require customer authentication)
  app.get('/api/giftcards/mine', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const giftCards = await storage.getGiftCardsByUser(user.id);
      res.json(giftCards);
    } catch (error) {
      console.error("Error fetching user gift cards:", error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  app.get('/api/user/orders', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const result = await storage.getUserOrders(user.id, page, pageSize);
      res.json(result);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/user/orders/:orderId', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const orderId = req.params.orderId;
      
      const order = await storage.getUserOrderDetails(user.id, orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.get('/api/cards', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const savedCards = await storage.getUserSavedCards(user.id);
      res.json(savedCards);
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ message: "Failed to fetch saved cards" });
    }
  });

  app.get('/api/user/saved-cards', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const savedCards = await storage.getUserSavedCards(user.id);
      res.json(savedCards);
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ message: "Failed to fetch saved cards" });
    }
  });

  app.post('/api/cards', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const cardData = req.body;
      
      const savedCard = await storage.addSavedCard({
        ...cardData,
        userId: user.id
      });
      
      res.status(201).json(savedCard);
    } catch (error) {
      console.error("Error adding saved card:", error);
      res.status(500).json({ message: "Failed to add saved card" });
    }
  });

  app.delete('/api/cards/:id', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const cardId = req.params.id;
      
      await storage.deleteSavedCard(cardId, user.id);
      res.json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("Error deleting saved card:", error);
      res.status(500).json({ message: "Failed to delete saved card" });
    }
  });

  app.put('/api/cards/:id/default', requireCustomerAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      const cardId = req.params.id;
      
      await storage.setDefaultCard(cardId, user.id);
      res.json({ message: "Default card updated successfully" });
    } catch (error) {
      console.error("Error setting default card:", error);
      res.status(500).json({ message: "Failed to set default card" });
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

  // Gift Card Routes - Enhanced with payment integration

  // Create gift card with payment processing (Admin only)
  app.post('/api/giftcards', giftCardRateLimit, validateGiftCardAmount, validateEmail, isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const data = createGiftCardSchema.parse(req.body);
      const userId = req.user.claims.sub;

      // Process payment if payment information provided
      let paymentResult = null;
      if (req.body.paymentMethod && paymentsService) {
        const paymentRequest = {
          amount: parseFloat(data.initialAmount.toString()),
          currency: 'USD',
          paymentMethod: req.body.paymentMethod,
          referenceId: `admin-gc-${nanoid(10)}`,
          note: `Admin gift card creation - $${data.initialAmount}`,
        };

        paymentResult = await paymentsService.processPayment(paymentRequest);

        if (!paymentResult.success) {
          return res.status(400).json({
            message: "Payment failed",
            error: paymentResult.errorMessage
          });
        }
      }

      // Generate unique code
      const code = `GC${nanoid(12).toUpperCase()}`;

      // Create gift card in database
      const giftCard = await storage.createGiftCard({
        ...data,
        code,
        issuedById: userId,
        paymentId: paymentResult?.paymentId,
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
        notes: 'Gift card issued by admin',
        paymentId: paymentResult?.paymentId,
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
        paymentMethod: paymentResult?.cardDetails || null,
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

      // Generate QR code for premium receipt page
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      const qrCodeUrl = `${baseUrl}/receipt-view/${accessToken}`;
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
        paymentResult,
      });
    } catch (error) {
      console.error("Error creating gift card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create gift card" });
    }
  });

  // Public gift card purchase with payment processing
  app.post('/api/giftcards/purchase', giftCardRateLimit, async (req, res) => {
    try {
      const giftCardData = createGiftCardSchema.parse(req.body);
      const paymentData = req.body.paymentMethod;

      if (!paymentData) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      // Process payment first
      const paymentRequest = {
        amount: parseFloat(giftCardData.initialAmount.toString()),
        currency: 'USD',
        paymentMethod: paymentData,
        referenceId: `gc-purchase-${nanoid(10)}`,
        note: `Gift card purchase - $${giftCardData.initialAmount}`,
        buyerEmailAddress: giftCardData.recipientEmail || req.body.buyerEmail,
      };

      if (!paymentsService) {
        return res.status(503).json({
          success: false,
          message: "Payment service unavailable",
          error: "Square payment service is not configured"
        });
      }

      const paymentResult = await paymentsService.processPayment(paymentRequest);

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: "Payment failed",
          error: paymentResult.errorMessage
        });
      }

      // Generate gift card code
      const code = nanoid(10).toUpperCase();

      // Create gift card
      const giftCard = await storage.createGiftCard({
        ...giftCardData,
        code,
        initialAmount: giftCardData.initialAmount.toString(),
        paymentId: paymentResult.paymentId,
      });

      // Create issue transaction
      const transaction = await storage.createTransaction({
        giftCardId: giftCard.id,
        type: 'issue',
        amount: giftCardData.initialAmount.toString(),
        balanceAfter: giftCardData.initialAmount.toString(),
        notes: 'Gift card purchased online',
        paymentId: paymentResult.paymentId,
      });

      // Generate receipt and send email
      const receiptData = {
        giftCardCode: code,
        amount: parseFloat(giftCardData.initialAmount),
        design: giftCard.design,
        recipientName: giftCard.recipientName,
        recipientEmail: giftCard.recipientEmail,
        senderName: giftCard.senderName,
        customMessage: giftCard.customMessage,
        transactionId: transaction.id,
        timestamp: new Date().toISOString(),
        type: 'purchase',
        paymentMethod: paymentResult.cardDetails,
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

      // Generate QR code and PDF
      const qrCode = await qrService.generateQRCode(
        `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/balance?code=${code}`
      );

      const pdfPath = await pdfService.generateReceiptPDF(receiptData, qrCode);
      await storage.updateReceiptPdfPath(receipt.id, pdfPath);

      // Send email if recipient email provided
      if (giftCard.recipientEmail) {
        try {
          await emailService.sendGiftCardEmail({
            recipientEmail: giftCard.recipientEmail,
            recipientName: giftCard.recipientName || 'Valued Customer',
            senderName: giftCard.senderName || 'A Friend',
            amount: parseFloat(giftCardData.initialAmount),
            code: code,
            customMessage: giftCard.customMessage || '',
            receiptUrl: `/api/receipts/${accessToken}`,
          });
          await storage.markReceiptEmailSent(receipt.id);
        } catch (emailError) {
          console.error("Failed to send gift card email:", emailError);
        }
      }

      // Broadcast revenue update
      if ((global as any).broadcastRevenueUpdate) {
        (global as any).broadcastRevenueUpdate(transaction);
      }

      res.json({
        success: true,
        code: giftCard.code,
        giftCardId: giftCard.id,
        receiptUrl: `/api/receipts/${accessToken}`,
        amount: parseFloat(giftCardData.initialAmount),
        design: giftCard.design,
        paymentResult,
      });
    } catch (error) {
      console.error("Error purchasing gift card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to purchase gift card" });
    }
  });

  // Check balance (Public)
  app.post('/api/giftcards/balance', giftCardRateLimit, validateGiftCardCode, async (req, res) => {
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

  // Alternative check balance endpoint (Public) 
  app.post('/api/giftcards/check-balance', giftCardRateLimit, validateGiftCardCode, async (req, res) => {
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
  app.post('/api/giftcards/redeem', giftCardRateLimit, validateGiftCardCode, validateGiftCardAmount, async (req, res) => {
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

  // Admin endpoint alias for consistency
  app.get('/api/admin/giftcards', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const giftCards = await storage.getAllGiftCards();
      res.json(giftCards);
    } catch (error) {
      console.error("Error fetching gift cards:", error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Get user's gift cards
  app.get('/api/giftcards/mine', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
      const giftCards = await storage.getGiftCardsByUser(userId);
      res.json(giftCards);
    } catch (error) {
      console.error("Error fetching user gift cards:", error);
      res.status(500).json({ message: "Failed to fetch gift cards" });
    }
  });

  // Get transactions for a specific gift card
  app.get('/api/giftcards/:id/transactions', requireAnyAuth, validateId, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const giftCardId = req.params.id;

      // Verify the gift card belongs to the user
      const giftCard = await storage.getGiftCardById(giftCardId);
      if (!giftCard || giftCard.purchasedBy !== user.id) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      const transactions = await storage.getTransactionsByGiftCard(giftCardId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching gift card transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
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

      // Regenerate QR code for premium receipt page
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      const qrCodeUrl = `${baseUrl}/receipt-view/${token}`;
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

  app.post('/api/admin/fraud-alerts/:id/resolve', isAuthenticated, requireAdmin, validateId, async (req: any, res) => {
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

  // Admin Users Route  
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Get all users from the database
      const users = await storage.getAllUsers();

      // Remove sensitive data before sending
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        isActive: user.isActive !== false,
        hasProfilePicture: !!user.profilePicture,
        giftCardCount: user.giftCardCount || 0,
        totalSpent: user.totalSpent || 0
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User Dashboard Routes

  // Get dashboard stats
  app.get('/api/user/dashboard/stats', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user's gift cards
      const giftCards = await storage.getGiftCardsByUser(user.id);

      // Calculate statistics
      const totalBalance = giftCards.reduce((sum, card) => sum + parseFloat(card.balance), 0);
      const totalInitialValue = giftCards.reduce((sum, card) => sum + parseFloat(card.initialAmount), 0);
      const totalSpent = totalInitialValue - totalBalance;
      const activeCards = giftCards.filter(card => parseFloat(card.balance) > 0).length;

      // Get recent transactions
      const allTransactions = [];
      for (const card of giftCards) {
        const cardTransactions = await storage.getTransactionsByGiftCard(card.id);
        allTransactions.push(...cardTransactions);
      }

      // Sort by date and get recent ones
      const recentTransactions = allTransactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(tx => ({
          id: tx.id,
          amount: parseFloat(tx.amount),
          type: tx.type as 'purchase' | 'redemption',
          description: tx.description || `${tx.type} transaction`,
          date: tx.createdAt,
          status: 'completed' as const
        }));

      // Calculate monthly spending from actual transactions
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlySpending = [];

      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Calculate spending for this month
        const monthTransactions = allTransactions.filter(tx => {
          const txDate = new Date(tx.createdAt);
          return tx.type === 'redeem' && 
                 txDate >= monthStart && 
                 txDate <= monthEnd;
        });

        const monthAmount = monthTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        monthlySpending.push({
          month: monthNames[monthDate.getMonth()],
          amount: Math.round(monthAmount * 100) / 100
        });
      }

      res.json({
        totalBalance,
        totalSpent,
        activeCards,
        pendingTransactions: 0,
        monthlySpending,
        recentTransactions
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get user's transactions
  app.get('/api/user/transactions', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user's gift cards
      const giftCards = await storage.getGiftCardsByUser(user.id);

      // Get all transactions for user's cards
      const allTransactions = [];
      for (const card of giftCards) {
        const cardTransactions = await storage.getTransactionsByGiftCard(card.id);
        allTransactions.push(...cardTransactions.map(tx => ({
          ...tx,
          cardCode: card.code,
          cardDesign: card.design
        })));
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Order History Routes

  // Get user's order history (paginated)
  app.get('/api/user/orders', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
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
  app.get('/api/user/orders/:orderId', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
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
  app.get('/api/cards', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
      const cards = await storage.getUserSavedCards(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ message: "Failed to fetch saved cards" });
    }
  });

  // Alias endpoint for consistency with user namespace
  app.get('/api/user/saved-cards', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
      const cards = await storage.getUserSavedCards(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ message: "Failed to fetch saved cards" });
    }
  });

  // Add a new card
  app.post('/api/cards', authRateLimit, requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
      const data = addSavedCardSchema.parse(req.body);

      // Get user data
      const userData = await storage.getUser(userId);
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if Square integration is available
      if (!squareCustomerService.isAvailable()) {
        return res.status(503).json({ message: "Payment card service unavailable" });
      }

      // Create or update Square customer if needed
      let squareCustomerId = userData.squareCustomerId;
      if (!squareCustomerId) {
        try {
          const customer = await squareCustomerService.createCustomer(
            userData.email || undefined,
            userData.firstName || undefined,
            userData.lastName || undefined
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
  app.delete('/api/cards/:id', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
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
  app.put('/api/cards/:id/default', requireAnyAuth, async (req: any, res) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = user.id;
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

  // AI Routes

  // AI Design Suggestion
  app.post('/api/ai/suggest-design', async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const result = await aiService.suggestDesign(prompt);
      res.json(result);
    } catch (error: any) {
      console.error("Error suggesting design:", error);
      if (error.message.includes("API key")) {
        return res.status(503).json({ 
          message: "AI service not configured. Please provide OPENAI_API_KEY.",
          requiresApiKey: true 
        });
      }
      res.status(500).json({ message: "Failed to suggest design" });
    }
  });

  // AI Message Generation
  app.post('/api/ai/generate-message', async (req, res) => {
    try {
      const { occasion, recipient, tone, senderName } = req.body;

      if (!occasion || !recipient) {
        return res.status(400).json({ message: "Occasion and recipient are required" });
      }

      const result = await aiService.generateMessage({
        occasion,
        recipient,
        tone: tone || 'friendly',
        senderName
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error generating message:", error);
      if (error.message.includes("API key")) {
        return res.status(503).json({ 
          message: "AI service not configured. Please provide OPENAI_API_KEY.",
          requiresApiKey: true 
        });
      }
      res.status(500).json({ message: "Failed to generate message" });
    }
  });

  // AI Gift Ideas
  app.post('/api/ai/gift-ideas', async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Query is required" });
      }

      const result = await aiService.getGiftIdeas(query);
      res.json(result);
    } catch (error: any) {
      console.error("Error getting gift ideas:", error);
      if (error.message.includes("API key")) {
        return res.status(503).json({ 
          message: "AI service not configured. Please provide PERPLEXITY_API_KEY or OPENAI_API_KEY.",
          requiresApiKey: true 
        });
      }
      res.status(500).json({ message: "Failed to get gift ideas" });
    }
  });

  // AI Recipient Analysis
  app.post('/api/ai/analyze-recipient', async (req, res) => {
    try {
      const { description } = req.body;

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: "Description is required" });
      }

      const result = await aiService.analyzeRecipientPreferences(description);
      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing recipient:", error);
      if (error.message.includes("API key")) {
        return res.status(503).json({ 
          message: "AI service not configured. Please provide OPENAI_API_KEY.",
          requiresApiKey: true 
        });
      }
      res.status(500).json({ message: "Failed to analyze recipient" });
    }
  });

  // Public Routes

  // Public Purchase Gift Card (no auth required)
  app.post('/api/giftcards/purchase', giftCardRateLimit, async (req, res) => {
    try {
      const giftCardData = createGiftCardSchema.parse(req.body);

      // Generate gift card code
      const code = nanoid(10).toUpperCase();

      // Create gift card
      const giftCard = await storage.createGiftCard({
        ...giftCardData,
        code,
        initialAmount: giftCardData.initialAmount.toString(),
      });

      // Create issue transaction
      const transaction = await storage.createTransaction({
        giftCardId: giftCard.id,
        type: 'issue',
        amount: giftCardData.initialAmount.toString(),
        balanceAfter: giftCardData.initialAmount.toString(),
        notes: 'Gift card purchased',
      });

      // Generate receipt
      const receiptData = {
        giftCardCode: code,
        amount: parseFloat(giftCardData.initialAmount),
        design: giftCard.design,
        recipientName: giftCard.recipientName,
        recipientEmail: giftCard.recipientEmail,
        senderName: giftCard.senderName,
        customMessage: giftCard.customMessage,
        transactionId: transaction.id,
        timestamp: new Date().toISOString(),
        type: 'purchase',
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

      // Generate QR code
      const qrCode = await qrService.generateQRCode(
        `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/balance?code=${code}`
      );

      // Generate PDF receipt
      const pdfPath = await pdfService.generateReceiptPDF(receiptData, qrCode);
      await storage.updateReceiptPdfPath(receipt.id, pdfPath);

      // Send email if recipient email provided
      if (giftCard.recipientEmail) {
        try {
          await emailService.sendGiftCardEmail({
            recipientEmail: giftCard.recipientEmail,
            recipientName: giftCard.recipientName || 'Valued Customer',
            senderName: giftCard.senderName || 'A Friend',
            amount: parseFloat(giftCardData.initialAmount),
            code: code,
            customMessage: giftCard.customMessage || '',
            receiptUrl: `/api/receipts/${accessToken}`,
          });
          await storage.markReceiptEmailSent(receipt.id);
        } catch (emailError) {
          console.error("Failed to send gift card email:", emailError);
          // Don't fail the transaction if email fails
        }
      }

      // Broadcast revenue update
      if ((global as any).broadcastRevenueUpdate) {
        (global as any).broadcastRevenueUpdate(transaction);
      }

      res.json({
        success: true,
        code: giftCard.code,
        giftCardId: giftCard.id,
        receiptUrl: `/api/receipts/${accessToken}`,
        amount: parseFloat(giftCardData.initialAmount),
        design: giftCard.design,
      });
    } catch (error) {
      console.error("Error purchasing gift card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to purchase gift card" });
    }
  });

  // Public Order Lookup
  app.post('/api/public/orders', async (req, res) => {
    try {
      const { email, orderCode } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Get all gift cards for the email (either as sender or recipient)
      const allGiftCards = await storage.getAllGiftCards();
      let userGiftCards = allGiftCards.filter(card => 
        card.recipientEmail === email || 
        (card.senderName && card.senderName.toLowerCase().includes(email.toLowerCase()))
      );

      // If order code provided, filter by it
      if (orderCode) {
        userGiftCards = userGiftCards.filter(card => 
          card.code.toUpperCase() === orderCode.toUpperCase()
        );
      }

      // Format as orders
      const orders = await Promise.all(userGiftCards.map(async (card) => {
        const transactions = await storage.getTransactionsByGiftCard(card.id);
        const purchaseTransaction = transactions.find(t => t.type === 'issue');
        const redemptions = transactions.filter(t => t.type === 'redeem');
        const totalRedeemed = redemptions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
          id: card.id,
          code: card.code,
          amount: card.initialAmount,
          currentBalance: card.currentBalance,
          recipientName: card.recipientName,
          recipientEmail: card.recipientEmail,
          senderName: card.senderName,
          design: card.design,
          deliveryStatus: card.deliveryStatus,
          paymentMethodLast4: purchaseTransaction?.paymentMethodLast4,
          paymentMethodType: purchaseTransaction?.paymentMethodType,
          createdAt: card.createdAt,
          isRedeemed: totalRedeemed > 0,
          redeemedAmount: totalRedeemed.toFixed(2),
        };
      }));

      // Sort by mostrecent first
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json({ orders });
    } catch (error) {
      console.error("Error looking up orders:", error);
      res.status(500).json({ message: "Failed to look up orders" });
    }
  });

  // Public Recharge Gift Card (placeholder - requires payment integration)
  app.post('/api/giftcards/recharge', giftCardRateLimit, async (req, res) => {
    try {
      const { code, amount, paymentMethod } = req.body;

      if (!code || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid code and amount are required" });
      }

      const giftCard = await storage.getGiftCardByCode(code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      if (!giftCard.isActive) {
        return res.status(400).json({ message: "Gift card is not active" });
      }

      // Process payment
      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      if (!paymentsService) {
        return res.status(503).json({ 
          message: "Payment service unavailable. Please try again later." 
        });
      }

      // Process payment
      const paymentRequest = {
        amount: parseFloat(amount.toString()),
        currency: 'USD',
        paymentMethod: paymentMethod,
        referenceId: `recharge-${giftCard.code}-${nanoid(6)}`,
        note: `Gift card recharge - $${amount}`,
      };

      const paymentResult = await paymentsService.processPayment(paymentRequest);

      if (!paymentResult.success) {
        return res.status(400).json({
          message: "Payment failed",
          error: paymentResult.errorMessage
        });
      }

      // Update gift card balance
      const currentBalance = parseFloat(giftCard.currentBalance);
      const newBalance = currentBalance + amount;

      await storage.updateGiftCardBalance(giftCard.id, newBalance.toString());

      // Create recharge transaction
      const transaction = await storage.createTransaction({
        giftCardId: giftCard.id,
        type: 'recharge',
        amount: amount.toString(),
        balanceAfter: newBalance.toString(),
        notes: 'Gift card recharged',
        paymentId: paymentResult.paymentId,
      });

      // Generate receipt
      const receiptData = {
        giftCardCode: code,
        amount: amount,
        design: giftCard.design,
        transactionId: transaction.id,
        timestamp: new Date().toISOString(),
        type: 'recharge',
        paymentMethod: paymentResult.cardDetails,
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

      // Broadcast revenue update
      if ((global as any).broadcastRevenueUpdate) {
        (global as any).broadcastRevenueUpdate(transaction);
      }

      res.json({
        success: true,
        newBalance: newBalance,
        transactionId: transaction.id,
        receiptUrl: `/api/receipts/${accessToken}`,
        paymentResult,
      });
    } catch (error) {
      console.error("Error recharging gift card:", error);
      res.status(500).json({ message: "Failed to recharge gift card" });
    }
  });

  // Update check balance to return all card details
  app.post('/api/giftcards/check-balance', giftCardRateLimit, async (req, res) => {
    try {
      const { code } = checkBalanceSchema.parse(req.body);

      const giftCard = await storage.getGiftCardByCode(code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      res.json({
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
        initialAmount: giftCard.initialAmount,
        isActive: giftCard.isActive,
        design: giftCard.design,
        recipientName: giftCard.recipientName,
        senderName: giftCard.senderName,
        customMessage: giftCard.customMessage,
        createdAt: giftCard.createdAt,
      });
    } catch (error) {
      console.error("Error checking balance:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check balance" });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      services: {
        payments: paymentsService ? paymentsService.isAvailable() : false,
        square: !!process.env.SQUARE_ACCESS_TOKEN,
        email: true
      }
    });
  });

  // Catch-all for API routes that don't exist
  app.all('/api/*', (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time fraud alerts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const clientIP = req.socket.remoteAddress || 'unknown';
    console.log(`WebSocket client connected from ${clientIP}`);

    // Database-based rate limiting check
    try {
      const isAllowed = await storage.checkRateLimit(clientIP, 'websocket', 60000, 100);
      if (!isAllowed) {
        ws.close(1008, 'Rate limit exceeded');
        return;
      }

      // Increment rate limit counter
      await storage.incrementRateLimit(clientIP, 'websocket');
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Allow connection on error to prevent blocking legitimate users
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Validate message structure
        if (!data.type || typeof data.type !== 'string') {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
          return;
        }

        // Handle authenticated messages only
        if (data.type === 'auth') {
          // Implement WebSocket authentication
          if (!data.sessionId) {
            ws.send(JSON.stringify({ type: 'auth-error', message: 'Session ID required' }));
            return;
          }

          // Store authenticated state on the WebSocket connection
          (ws as any).isAuthenticated = true;
          (ws as any).sessionId = data.sessionId;
          ws.send(JSON.stringify({ type: 'auth-success', message: 'Authenticated successfully' }));
        } else if (!(ws as any).isAuthenticated) {
          ws.send(JSON.stringify({ type: 'auth-required', message: 'Authentication required' }));
          return;
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
        ws.send(JSON.stringify({ error: 'Message parsing failed' }));
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected from ${clientIP}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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

  // Admin users endpoint
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Remove sensitive data before sending
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        isActive: user.isActive !== false,
        hasProfilePicture: !!user.profilePicture,
        giftCardCount: user.giftCardCount || 0,
        totalSpent: user.totalSpent || 0
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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

  return httpServer;
}