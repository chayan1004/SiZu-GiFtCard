import { Router } from 'express';
import { squareRefundsService } from './services/SquareRefundsService';
import { storage } from './storage';
import { 
  generalRateLimit, 
  validateInput,
  secureLogger 
} from './middleware/security';
import { requireAnyAuth } from './middleware/customerAuth';
import { z } from 'zod';

const router = Router();

// Refund request schema
const refundRequestSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().optional(), // Optional for full refund
  reason: z.string().min(1).max(192), // Square limit: 192 chars
  teamMemberId: z.string().optional()
});

// Unlinked refund schema
const unlinkedRefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1).max(192),
  locationId: z.string().optional()
});

// Create refund for a payment
router.post('/create',
  requireAnyAuth,
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const validatedData = refundRequestSchema.parse(req.body);
      const { paymentId, amount, reason, teamMemberId } = validatedData;

      if (!squareRefundsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Refund service temporarily unavailable'
        });
      }

      // Get user information for audit
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;

      // Create refund with Square
      const refundResult = await squareRefundsService.refundPayment(
        paymentId,
        amount,
        reason,
        teamMemberId || userId
      );

      if (!refundResult.success || !refundResult.refund) {
        return res.status(400).json({
          success: false,
          error: refundResult.error || 'Failed to create refund',
          errorCode: refundResult.errorCode
        });
      }

      const refund = refundResult.refund;

      // Log refund in database for audit trail
      try {
        await storage.createTransaction({
          giftCardId: 'REFUND', // Special identifier for refunds
          transactionType: 'refund',
          amount: refund.amountMoney ? String(Number(refund.amountMoney.amount) / 100) : '0',
          balanceAfter: '0', // Not applicable for refunds
          performedBy: userId,
          description: `Refund: ${reason}`,
          metadata: {
            refundId: refund.id,
            paymentId,
            status: refund.status,
            locationId: refund.locationId
          }
        });
      } catch (dbError) {
        console.error('Failed to log refund in database:', dbError);
        // Continue - refund was successful even if logging failed
      }

      res.json({
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amountMoney ? Number(refund.amountMoney.amount) / 100 : 0,
          reason: refund.reason,
          paymentId: refund.paymentId,
          orderId: refund.orderId,
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt,
          processingFee: refund.processingFee ? refund.processingFee.map(fee => ({
            effectiveAt: fee.effectiveAt,
            type: fee.type,
            amount: fee.amountMoney ? Number(fee.amountMoney.amount) / 100 : 0
          })) : []
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      console.error('Refund creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process refund'
      });
    }
  }
);

// Get refund details
router.get('/:refundId',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { refundId } = req.params;

      if (!squareRefundsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Refund service temporarily unavailable'
        });
      }

      const refundResult = await squareRefundsService.getRefund(refundId);

      if (!refundResult.success || !refundResult.refund) {
        return res.status(404).json({
          success: false,
          error: refundResult.error || 'Refund not found'
        });
      }

      const refund = refundResult.refund;

      res.json({
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amountMoney ? Number(refund.amountMoney.amount) / 100 : 0,
          reason: refund.reason,
          paymentId: refund.paymentId,
          orderId: refund.orderId,
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Get refund error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get refund details'
      });
    }
  }
);

// List refunds
router.get('/',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { 
        beginTime, 
        endTime, 
        sortOrder = 'DESC',
        cursor,
        limit = 20
      } = req.query;

      if (!squareRefundsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Refund service temporarily unavailable'
        });
      }

      const refundsResult = await squareRefundsService.listRefunds(
        beginTime as string,
        endTime as string,
        sortOrder as 'ASC' | 'DESC',
        cursor as string,
        Number(limit)
      );

      if (!refundsResult.success) {
        return res.status(400).json({
          success: false,
          error: refundsResult.error || 'Failed to list refunds'
        });
      }

      const refunds = (refundsResult.refunds || []).map(refund => ({
        id: refund.id,
        status: refund.status,
        amount: refund.amountMoney ? Number(refund.amountMoney.amount) / 100 : 0,
        reason: refund.reason,
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      }));

      res.json({
        success: true,
        refunds,
        cursor: refundsResult.cursor,
        hasMore: !!refundsResult.cursor
      });
    } catch (error: any) {
      console.error('List refunds error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list refunds'
      });
    }
  }
);

// Create unlinked refund (cash refund)
router.post('/unlinked',
  requireAnyAuth,
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const validatedData = unlinkedRefundSchema.parse(req.body);
      const { amount, reason, locationId } = validatedData;

      if (!squareRefundsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Refund service temporarily unavailable'
        });
      }

      // Get user information for audit
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can create unlinked refunds
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can create unlinked refunds'
        });
      }

      // Create unlinked refund
      const refundResult = await squareRefundsService.createUnlinkedRefund(
        amount,
        reason,
        locationId
      );

      if (!refundResult.success || !refundResult.refund) {
        return res.status(400).json({
          success: false,
          error: refundResult.error || 'Failed to create unlinked refund',
          errorCode: refundResult.errorCode
        });
      }

      const refund = refundResult.refund;

      // Log unlinked refund
      try {
        await storage.createTransaction({
          giftCardId: 'UNLINKED_REFUND',
          transactionType: 'refund',
          amount: String(amount),
          balanceAfter: '0',
          performedBy: userId,
          description: `Unlinked refund: ${reason}`,
          metadata: {
            refundId: refund.id,
            status: refund.status,
            locationId: refund.locationId
          }
        });
      } catch (dbError) {
        console.error('Failed to log unlinked refund:', dbError);
      }

      res.json({
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amountMoney ? Number(refund.amountMoney.amount) / 100 : 0,
          reason: refund.reason,
          createdAt: refund.createdAt,
          locationId: refund.locationId
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      console.error('Unlinked refund error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create unlinked refund'
      });
    }
  }
);

export { router as refundsRouter };