import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireCustomerAuth, requireAnyAuth, getAuthenticatedUser } from "./middleware/customerAuth";
import { SquareService } from "./services/SquareService";
import { SquareCustomerService } from "./services/SquareCustomerService";
import { PDFService } from "./services/PDFService";
import { EmailService } from "./services/EmailService";
import { QRService } from "./services/QRService";
import { aiService } from "./services/aiService";
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
    name: 'sizu.sid' // Don't use default session name
  }));

  const pdfService = new PDFService();
  const emailService = new EmailService();
  const qrService = new QRService();

  // Security middleware
  app.use(httpsRedirect);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  
  // Set additional CORS headers for all responses
  app.use((req, res, next) => {
    // Ensure CORS headers are set for all responses
    const origin = req.get('origin');
    if (origin) {
      res.setHeader('Vary', 'Origin');
    }
    
    // Add security headers for API responses
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    next();
  });
  
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

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Import AuthService
  const { AuthService } = await import('./services/AuthService');

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
  app.post('/api/auth/register', authRateLimit, validateInput, validateEmail, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const { user, otp } = await AuthService.registerCustomer(email, password, firstName, lastName);
      
      // Send OTP email
      await emailService.sendOTPEmail(email, otp, firstName);

      res.status(201).json({ 
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id,
        email: user.email
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post('/api/auth/login', authRateLimit, validateInput, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await AuthService.loginCustomer(email, password);
      
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

  app.post('/api/auth/verify-otp', authRateLimit, validateInput, async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const user = await AuthService.verifyOTP(email, otp);
      
      // Automatically log them in after verification
      req.session.userId = user.id;
      req.session.role = user.role;
      
      res.json({ 
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Verification failed" });
    }
  });

  app.post('/api/auth/resend-otp', authRateLimit, validateInput, validateEmail, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const otp = await AuthService.resendOTP(email);
      const user = await storage.getUserByEmail(email);
      
      // Send new OTP email
      await emailService.sendOTPEmail(email, otp, user?.firstName);
      
      res.json({ message: "New verification code sent to your email" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to resend OTP" });
    }
  });

  app.post('/api/auth/forgot-password', authRateLimit, validateInput, validateEmail, async (req, res) => {
    try {
      const { email } = req.body;
      const resetToken = await AuthService.requestPasswordReset(email);
      
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);
      
      res.json({ message: "If that email exists, we've sent a password reset link" });
    } catch (error: any) {
      res.status(500).json({ message: "Password reset request failed" });
    }
  });

  app.post('/api/auth/reset-password', authRateLimit, validateInput, async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      await AuthService.resetPassword(token, password);
      res.json({ message: "Password reset successful" });
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

      // Generate QR code for premium receipt page
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${process.env.PORT || 5000}`;
      const qrCodeUrl = `${baseUrl}/receipt-view/${accessToken}`;
      console.log('Generating QR code for receipt URL:', qrCodeUrl);
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
      
      // Calculate monthly spending (mock data for now)
      const monthlySpending = [
        { month: 'Jan', amount: 125 },
        { month: 'Feb', amount: 89 },
        { month: 'Mar', amount: 156 },
        { month: 'Apr', amount: 234 },
        { month: 'May', amount: 189 },
        { month: 'Jun', amount: 298 }
      ];
      
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
      
      // Sort by most recent first
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
      
      // TODO: Process payment with Square API
      // For now, just return an error indicating payment processing is needed
      
      res.status(501).json({ 
        message: "Recharge functionality requires payment processing setup. Please contact support.",
        requiresPaymentSetup: true 
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Catch-all for API routes that don't exist
  app.all('/api/*', (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time fraud alerts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket rate limiting map
  const wsRateLimit = new Map<string, { count: number; resetTime: number }>();

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress || 'unknown';
    console.log(`WebSocket client connected from ${clientIP}`);
    
    // Rate limiting check
    const now = Date.now();
    const rateData = wsRateLimit.get(clientIP);
    if (rateData && now < rateData.resetTime && rateData.count > 100) {
      ws.close(1008, 'Rate limit exceeded');
      return;
    }
    
    // Update rate limit
    if (!rateData || now >= rateData.resetTime) {
      wsRateLimit.set(clientIP, { count: 1, resetTime: now + 60000 }); // 1 minute window
    } else {
      rateData.count++;
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
          // TODO: Implement WebSocket authentication
          console.log('WebSocket auth request received');
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

  return httpServer;
}
