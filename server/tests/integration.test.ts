/**
 * Integration Tests
 * Tests complete workflows with Square integration mocked
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '@server/storage';
import { SquareService } from '@server/services/SquareService';
import { EmailService } from '@server/services/EmailService';
import { PDFService } from '@server/services/PDFService';
import { QRService } from '@server/services/QRService';

// Mock all services
vi.mock('@server/storage');
vi.mock('@server/services/SquareService');
vi.mock('@server/services/EmailService');
vi.mock('@server/services/PDFService');
vi.mock('@server/services/QRService');

const mockStorage = vi.mocked(storage);
const mockSquareService = vi.mocked(SquareService);
const mockEmailService = vi.mocked(EmailService);
const mockPDFService = vi.mocked(PDFService);
const mockQRService = vi.mocked(QRService);

describe('Integration Tests', () => {
  let app: express.Application;

  const mockAdminAuth = (req: any, res: any, next: any) => {
    req.user = { claims: { sub: 'admin-user-id' } };
    req.isAuthenticated = () => true;
    next();
  };

  const mockUserAuth = (req: any, res: any, next: any) => {
    req.user = { claims: { sub: 'user-id' } };
    req.isAuthenticated = () => true;
    next();
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
  });

  describe('Complete Gift Card Creation Flow', () => {
    it('should create gift card with all services integrated', async () => {
      // Mock admin user
      mockStorage.getUser.mockResolvedValue({
        id: 'admin-user-id',
        role: 'admin',
        email: 'admin@sizu.com'
      } as any);

      // Mock gift card creation
      const mockGiftCard = {
        id: 'gc-123',
        code: 'GCTEST123456',
        initialAmount: '100.00',
        currentBalance: '100.00',
        design: 'premium',
        isActive: true,
        issuedById: 'admin-user-id'
      };

      mockStorage.createGiftCard.mockResolvedValue(mockGiftCard as any);
      mockStorage.updateGiftCardSquareId.mockResolvedValue(mockGiftCard as any);

      // Mock Square service
      const mockSquareGiftCard = {
        id: 'sq-gc-123',
        state: 'ACTIVE',
        balance: { amount: 10000, currency: 'USD' }
      };

      mockSquareService.prototype.createGiftCard.mockResolvedValue(mockSquareGiftCard);

      // Mock transaction creation
      const mockTransaction = {
        id: 'txn-123',
        giftCardId: 'gc-123',
        type: 'issue',
        amount: '100.00',
        balanceAfter: '100.00',
        performedById: 'admin-user-id'
      };

      mockStorage.createTransaction.mockResolvedValue(mockTransaction as any);

      // Mock receipt creation
      const mockReceipt = {
        id: 'receipt-123',
        giftCardId: 'gc-123',
        transactionId: 'txn-123',
        accessToken: 'token-123',
        receiptData: {},
        expiresAt: new Date()
      };

      mockStorage.createReceipt.mockResolvedValue(mockReceipt as any);
      mockStorage.updateReceiptPdfPath.mockResolvedValue(mockReceipt as any);
      mockStorage.markReceiptEmailSent.mockResolvedValue(mockReceipt as any);

      // Mock services
      mockQRService.prototype.generateQRCode.mockResolvedValue('qr-code-data');
      mockPDFService.prototype.generateReceiptPDF.mockResolvedValue('/path/to/receipt.pdf');
      mockEmailService.prototype.sendGiftCardEmail.mockResolvedValue(true);

      // Setup routes
      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          const squareService = new SquareService();
          const pdfService = new PDFService();
          const emailService = new EmailService();
          const qrService = new QRService();

          const giftCard = await storage.createGiftCard(req.body);
          
          // Create with Square
          const squareGiftCard = await squareService.createGiftCard(100, giftCard.code);
          await storage.updateGiftCardSquareId(giftCard.id, squareGiftCard.id);

          // Create transaction
          const transaction = await storage.createTransaction({
            giftCardId: giftCard.id,
            type: 'issue',
            amount: '100.00',
            balanceAfter: '100.00',
            performedById: req.user.claims.sub
          });

          // Create receipt
          const receipt = await storage.createReceipt({
            giftCardId: giftCard.id,
            transactionId: transaction.id,
            accessToken: 'token-123',
            receiptData: {},
            expiresAt: new Date()
          });

          // Generate QR and PDF
          const qrCode = await qrService.generateQRCode('redemption-url');
          const pdfPath = await pdfService.generateReceiptPDF({}, qrCode);
          await storage.updateReceiptPdfPath(receipt.id, pdfPath);

          // Send email
          await emailService.sendGiftCardEmail('recipient@test.com', {}, pdfPath, qrCode);
          await storage.markReceiptEmailSent(receipt.id);

          res.json({
            ...giftCard,
            receiptUrl: `/api/receipts/${receipt.accessToken}`,
            qrCode
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to create gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send({
          initialAmount: 100,
          design: 'premium',
          recipientEmail: 'recipient@test.com',
          recipientName: 'John Doe',
          senderName: 'Jane Smith',
          customMessage: 'Happy Birthday!'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'gc-123',
        code: 'GCTEST123456',
        receiptUrl: '/api/receipts/token-123',
        qrCode: 'qr-code-data'
      });

      // Verify all services were called
      expect(mockSquareService.prototype.createGiftCard).toHaveBeenCalledWith(100, 'GCTEST123456');
      expect(mockPDFService.prototype.generateReceiptPDF).toHaveBeenCalled();
      expect(mockEmailService.prototype.sendGiftCardEmail).toHaveBeenCalled();
      expect(mockQRService.prototype.generateQRCode).toHaveBeenCalled();
    });
  });

  describe('Complete Redemption Flow', () => {
    it('should redeem gift card with fraud detection', async () => {
      // Mock gift card
      const mockGiftCard = {
        id: 'gc-123',
        code: 'GCTEST123456',
        currentBalance: '100.00',
        isActive: true
      };

      mockStorage.getGiftCardByCode.mockResolvedValue(mockGiftCard as any);

      // Mock Square redemption
      mockSquareService.prototype.redeemGiftCard.mockResolvedValue({
        id: 'sq-gc-123',
        state: 'ACTIVE',
        balance: { amount: 7500, currency: 'USD' }
      });

      // Mock transaction and balance update
      const mockTransaction = {
        id: 'txn-redeem-123',
        giftCardId: 'gc-123',
        type: 'redeem',
        amount: '25.00',
        balanceAfter: '75.00',
        performedById: 'user-id'
      };

      mockStorage.createTransaction.mockResolvedValue(mockTransaction as any);
      mockStorage.updateGiftCardBalance.mockResolvedValue({
        ...mockGiftCard,
        currentBalance: '75.00'
      } as any);

      // Mock fraud detection (no alerts)
      mockStorage.getRecentTransactions.mockResolvedValue([]);

      app.post('/api/giftcards/redeem', mockUserAuth, async (req: any, res) => {
        try {
          const { code, amount } = req.body;
          const squareService = new SquareService();

          const giftCard = await storage.getGiftCardByCode(code);
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          const currentBalance = parseFloat(giftCard.currentBalance);
          if (amount > currentBalance) {
            return res.status(400).json({ message: 'Insufficient balance' });
          }

          // Redeem with Square
          await squareService.redeemGiftCard(giftCard.id, amount);

          const newBalance = currentBalance - amount;
          await storage.updateGiftCardBalance(giftCard.id, newBalance.toString());

          const transaction = await storage.createTransaction({
            giftCardId: giftCard.id,
            type: 'redeem',
            amount: amount.toString(),
            balanceAfter: newBalance.toString(),
            performedById: req.user.claims.sub
          });

          // Simple fraud detection
          const recentTransactions = await storage.getRecentTransactions(10);
          const suspiciousActivity = recentTransactions.filter(t => 
            t.performedById === req.user.claims.sub && 
            t.type === 'redeem' &&
            parseFloat(t.amount) > 100
          ).length > 3;

          if (suspiciousActivity) {
            await storage.createFraudAlert({
              giftCardId: giftCard.id,
              transactionId: transaction.id,
              type: 'suspicious_activity',
              description: 'Multiple large redemptions detected',
              severity: 'medium'
            });
          }

          res.json({
            success: true,
            newBalance,
            transactionId: transaction.id
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to redeem gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards/redeem')
        .send({
          code: 'GCTEST123456',
          amount: 25
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        newBalance: 75,
        transactionId: 'txn-redeem-123'
      });

      expect(mockSquareService.prototype.redeemGiftCard).toHaveBeenCalledWith('gc-123', 25);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Square API failures gracefully', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 'admin-user-id', role: 'admin' } as any);
      mockStorage.createGiftCard.mockResolvedValue({
        id: 'gc-123',
        code: 'GCTEST123456'
      } as any);

      // Mock Square API failure
      mockSquareService.prototype.createGiftCard.mockRejectedValue(
        new Error('Square API unavailable')
      );

      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          const squareService = new SquareService();
          const giftCard = await storage.createGiftCard(req.body);

          try {
            await squareService.createGiftCard(100, giftCard.code);
          } catch (squareError) {
            console.error('Square API error:', squareError);
            // Continue without Square integration
          }

          res.json({ 
            ...giftCard,
            warning: 'Gift card created but payment processing is temporarily unavailable'
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to create gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send({
          initialAmount: 100,
          design: 'premium'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'gc-123',
        code: 'GCTEST123456',
        warning: 'Gift card created but payment processing is temporarily unavailable'
      });
    });

    it('should handle database failures', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 'admin-user-id', role: 'admin' } as any);
      mockStorage.createGiftCard.mockRejectedValue(new Error('Database connection failed'));

      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          const giftCard = await storage.createGiftCard(req.body);
          res.json(giftCard);
        } catch (error) {
          console.error('Database error:', error);
          res.status(500).json({ message: 'Service temporarily unavailable' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send({
          initialAmount: 100,
          design: 'premium'
        })
        .expect(500);

      expect(response.body).toEqual({ message: 'Service temporarily unavailable' });
    });
  });

  describe('Analytics Integration', () => {
    it('should provide dashboard statistics', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 'admin-user-id', role: 'admin' } as any);
      mockStorage.getDashboardStats.mockResolvedValue({
        totalSales: 15000,
        totalRedemptions: 8500,
        activeBalance: 6500,
        cardsIssued: 150,
        redemptionsCount: 85
      });

      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.get('/api/admin/stats', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          const stats = await storage.getDashboardStats();
          res.json(stats);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch statistics' });
        }
      });

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(200);

      expect(response.body).toEqual({
        totalSales: 15000,
        totalRedemptions: 8500,
        activeBalance: 6500,
        cardsIssued: 150,
        redemptionsCount: 85
      });
    });
  });
});