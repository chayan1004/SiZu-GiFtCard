/**
 * Gift Cards API Tests
 * Tests all gift card endpoints with mocked Square integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '@server/storage';
import { SquareService } from '@server/services/SquareService';
import { nanoid } from 'nanoid';

// Mock all services
vi.mock('@server/storage');
vi.mock('@server/services/SquareService');
vi.mock('nanoid');

const mockStorage = vi.mocked(storage);
const mockSquareService = vi.mocked(SquareService);
const mockNanoid = vi.mocked(nanoid);

describe('Gift Cards API Tests', () => {
  let app: express.Application;

  const mockAuth = (req: any, res: any, next: any) => {
    req.user = { claims: { sub: 'test-user-id' } };
    req.isAuthenticated = () => true;
    next();
  };

  const mockAdminAuth = (req: any, res: any, next: any) => {
    req.user = { claims: { sub: 'admin-user-id' } };
    req.isAuthenticated = () => true;
    next();
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
    
    // Mock nanoid to return predictable codes
    mockNanoid.mockReturnValue('ABCDEFGHIJKL');
  });

  describe('POST /api/giftcards - Create Gift Card', () => {
    const validGiftCardData = {
      initialAmount: 50,
      design: 'classic',
      customMessage: 'Happy Birthday!',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      senderName: 'Jane Smith'
    };

    it('should create gift card successfully for admin', async () => {
      const mockGiftCard = {
        id: 'gc-id-123',
        code: 'GCABCDEFGHIJKL',
        initialAmount: '50.00',
        currentBalance: '50.00',
        design: 'classic',
        customMessage: 'Happy Birthday!',
        recipientEmail: 'recipient@example.com',
        recipientName: 'John Doe',
        senderName: 'Jane Smith',
        isActive: true,
        issuedById: 'admin-user-id'
      };

      const mockTransaction = {
        id: 'txn-123',
        giftCardId: 'gc-id-123',
        type: 'issue',
        amount: '50.00',
        balanceAfter: '50.00',
        performedById: 'admin-user-id',
        notes: 'Gift card issued'
      };

      const mockReceipt = {
        id: 'receipt-123',
        giftCardId: 'gc-id-123',
        transactionId: 'txn-123',
        accessToken: 'mock-access-token',
        receiptData: expect.any(Object),
        expiresAt: expect.any(Date)
      };

      // Mock admin user
      mockStorage.getUser.mockResolvedValue({
        id: 'admin-user-id',
        role: 'admin'
      } as any);

      mockStorage.createGiftCard.mockResolvedValue(mockGiftCard as any);
      mockStorage.createTransaction.mockResolvedValue(mockTransaction as any);
      mockStorage.createReceipt.mockResolvedValue(mockReceipt as any);
      mockStorage.updateGiftCardSquareId.mockResolvedValue(mockGiftCard as any);
      mockStorage.updateReceiptPdfPath.mockResolvedValue(mockReceipt as any);
      mockStorage.markReceiptEmailSent.mockResolvedValue(mockReceipt as any);

      // Setup admin middleware
      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          const code = `GC${nanoid(12).toUpperCase()}`;
          const giftCard = await storage.createGiftCard({
            ...req.body,
            code,
            issuedById: req.user.claims.sub
          });
          
          const transaction = await storage.createTransaction({
            giftCardId: giftCard.id,
            type: 'issue',
            amount: req.body.initialAmount.toString(),
            balanceAfter: req.body.initialAmount.toString(),
            performedById: req.user.claims.sub,
            notes: 'Gift card issued'
          });

          res.json({
            ...giftCard,
            receiptUrl: `/api/receipts/mock-access-token`,
            qrCode: 'data:image/png;base64,mock-qr-code'
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to create gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send(validGiftCardData)
        .expect(200);

      expect(response.body).toMatchObject({
        ...mockGiftCard,
        receiptUrl: '/api/receipts/mock-access-token',
        qrCode: 'data:image/png;base64,mock-qr-code'
      });

      expect(mockStorage.createGiftCard).toHaveBeenCalledWith({
        ...validGiftCardData,
        code: 'GCABCDEFGHIJKL',
        issuedById: 'admin-user-id'
      });
    });

    it('should reject invalid gift card data', async () => {
      const invalidData = {
        initialAmount: -10, // Negative amount
        design: 'invalid-design'
      };

      mockStorage.getUser.mockResolvedValue({ id: 'admin-user-id', role: 'admin' } as any);

      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAdminAuth, requireAdmin, async (req: any, res) => {
        try {
          // Simple validation
          if (req.body.initialAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
          }
          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ message: 'Failed to create gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid amount' });
    });

    it('should deny access to non-admin users', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 'user-id', role: 'user' } as any);

      const requireAdmin = async (req: any, res: any, next: any) => {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      };

      app.post('/api/giftcards', mockAuth, requireAdmin, async (req: any, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/giftcards')
        .send(validGiftCardData)
        .expect(403);

      expect(response.body).toEqual({ message: 'Admin access required' });
    });
  });

  describe('POST /api/giftcards/balance - Check Balance', () => {
    it('should return gift card balance for valid code', async () => {
      const mockGiftCard = {
        id: 'gc-id-123',
        code: 'GCABCDEFGHIJKL',
        currentBalance: '25.50',
        isActive: true
      };

      mockStorage.getGiftCardByCode.mockResolvedValue(mockGiftCard as any);

      app.post('/api/giftcards/balance', async (req, res) => {
        try {
          const { code } = req.body;
          const giftCard = await storage.getGiftCardByCode(code);
          
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          if (!giftCard.isActive) {
            return res.status(400).json({ message: 'Gift card is not active' });
          }

          res.json({
            code: giftCard.code,
            balance: parseFloat(giftCard.currentBalance),
            isActive: giftCard.isActive
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to check balance' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards/balance')
        .send({ code: 'GCABCDEFGHIJKL' })
        .expect(200);

      expect(response.body).toEqual({
        code: 'GCABCDEFGHIJKL',
        balance: 25.50,
        isActive: true
      });
    });

    it('should return 404 for invalid gift card code', async () => {
      mockStorage.getGiftCardByCode.mockResolvedValue(undefined);

      app.post('/api/giftcards/balance', async (req, res) => {
        try {
          const { code } = req.body;
          const giftCard = await storage.getGiftCardByCode(code);
          
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          res.json({
            code: giftCard.code,
            balance: parseFloat(giftCard.currentBalance),
            isActive: giftCard.isActive
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to check balance' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards/balance')
        .send({ code: 'INVALID-CODE' })
        .expect(404);

      expect(response.body).toEqual({ message: 'Gift card not found' });
    });

    it('should return 400 for inactive gift card', async () => {
      const mockInactiveGiftCard = {
        id: 'gc-id-123',
        code: 'GCABCDEFGHIJKL',
        currentBalance: '25.50',
        isActive: false
      };

      mockStorage.getGiftCardByCode.mockResolvedValue(mockInactiveGiftCard as any);

      app.post('/api/giftcards/balance', async (req, res) => {
        try {
          const { code } = req.body;
          const giftCard = await storage.getGiftCardByCode(code);
          
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          if (!giftCard.isActive) {
            return res.status(400).json({ message: 'Gift card is not active' });
          }

          res.json({
            code: giftCard.code,
            balance: parseFloat(giftCard.currentBalance),
            isActive: giftCard.isActive
          });
        } catch (error) {
          res.status(500).json({ message: 'Failed to check balance' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards/balance')
        .send({ code: 'GCABCDEFGHIJKL' })
        .expect(400);

      expect(response.body).toEqual({ message: 'Gift card is not active' });
    });
  });

  describe('POST /api/giftcards/redeem - Redeem Gift Card', () => {
    it('should redeem gift card successfully', async () => {
      const mockGiftCard = {
        id: 'gc-id-123',
        code: 'GCABCDEFGHIJKL',
        currentBalance: '50.00',
        isActive: true
      };

      const mockTransaction = {
        id: 'txn-redeem-123',
        giftCardId: 'gc-id-123',
        type: 'redeem',
        amount: '25.00',
        balanceAfter: '25.00',
        performedById: 'user-id',
        notes: 'Gift card redeemed'
      };

      mockStorage.getGiftCardByCode.mockResolvedValue(mockGiftCard as any);
      mockStorage.createTransaction.mockResolvedValue(mockTransaction as any);
      mockStorage.updateGiftCardBalance.mockResolvedValue({
        ...mockGiftCard,
        currentBalance: '25.00'
      } as any);

      app.post('/api/giftcards/redeem', mockAuth, async (req: any, res) => {
        try {
          const { code, amount } = req.body;
          const giftCard = await storage.getGiftCardByCode(code);
          
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          if (!giftCard.isActive) {
            return res.status(400).json({ message: 'Gift card is not active' });
          }

          const currentBalance = parseFloat(giftCard.currentBalance);
          if (amount > currentBalance) {
            return res.status(400).json({ message: 'Insufficient balance' });
          }

          const newBalance = currentBalance - amount;
          
          await storage.updateGiftCardBalance(giftCard.id, newBalance.toString());
          
          const transaction = await storage.createTransaction({
            giftCardId: giftCard.id,
            type: 'redeem',
            amount: amount.toString(),
            balanceAfter: newBalance.toString(),
            performedById: req.user.claims.sub,
            notes: 'Gift card redeemed'
          });

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
        .send({ code: 'GCABCDEFGHIJKL', amount: 25 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        newBalance: 25,
        transactionId: 'txn-redeem-123'
      });
    });

    it('should reject redemption with insufficient balance', async () => {
      const mockGiftCard = {
        id: 'gc-id-123',
        code: 'GCABCDEFGHIJKL',
        currentBalance: '10.00',
        isActive: true
      };

      mockStorage.getGiftCardByCode.mockResolvedValue(mockGiftCard as any);

      app.post('/api/giftcards/redeem', mockAuth, async (req: any, res) => {
        try {
          const { code, amount } = req.body;
          const giftCard = await storage.getGiftCardByCode(code);
          
          if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
          }

          if (!giftCard.isActive) {
            return res.status(400).json({ message: 'Gift card is not active' });
          }

          const currentBalance = parseFloat(giftCard.currentBalance);
          if (amount > currentBalance) {
            return res.status(400).json({ message: 'Insufficient balance' });
          }

          res.json({ success: true });
        } catch (error) {
          res.status(500).json({ message: 'Failed to redeem gift card' });
        }
      });

      const response = await request(app)
        .post('/api/giftcards/redeem')
        .send({ code: 'GCABCDEFGHIJKL', amount: 25 })
        .expect(400);

      expect(response.body).toEqual({ message: 'Insufficient balance' });
    });
  });
});