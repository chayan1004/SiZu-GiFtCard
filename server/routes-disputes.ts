import { Router } from 'express';
import { squareDisputesService } from './services/SquareDisputesService';
import { storage } from './storage';
import { 
  generalRateLimit, 
  validateInput,
  secureLogger 
} from './middleware/security';
import { requireAnyAuth } from './middleware/customerAuth';
import { z } from 'zod';
import multer from 'multer';
import { join } from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Text evidence schema
const textEvidenceSchema = z.object({
  evidenceType: z.enum([
    'RECEIPT',
    'CARDHOLDER_COMMUNICATION',
    'CARDHOLDER_INFORMATION',
    'REFUND_DOCUMENTATION',
    'CANCELLATION_DOCUMENTATION',
    'PRODUCT_DESCRIPTION',
    'SHIPPING_DOCUMENTATION',
    'GENERIC_EVIDENCE'
  ]),
  evidenceText: z.string().min(1).max(20000)
});

// List disputes
router.get('/',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { states, cursor, limit = 20 } = req.query;
      
      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const disputeStates = states ? (Array.isArray(states) ? states : [states]) : undefined;
      
      const disputesResult = await squareDisputesService.listDisputes(
        disputeStates as string[],
        cursor as string,
        Number(limit)
      );

      if (!disputesResult.success) {
        return res.status(400).json({
          success: false,
          error: disputesResult.error || 'Failed to list disputes'
        });
      }

      // Format disputes with state info
      const disputes = (disputesResult.disputes || []).map(dispute => {
        const stateInfo = squareDisputesService.getDisputeStateInfo(dispute.state || '');
        return {
          id: dispute.id,
          state: dispute.state,
          stateInfo,
          reason: dispute.reason,
          amountMoney: dispute.amountMoney ? Number(dispute.amountMoney.amount) / 100 : 0,
          currency: dispute.amountMoney?.currency || 'USD',
          reportedDate: dispute.reportedDate,
          dueBy: dispute.evidenceDueBy,
          paymentId: dispute.disputedPayment?.paymentId,
          cardBrand: dispute.cardBrand,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt
        };
      });

      res.json({
        success: true,
        disputes,
        cursor: disputesResult.cursor,
        hasMore: !!disputesResult.cursor
      });
    } catch (error: any) {
      console.error('List disputes error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list disputes'
      });
    }
  }
);

// Get dispute details
router.get('/:disputeId',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { disputeId } = req.params;

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const disputeResult = await squareDisputesService.getDispute(disputeId);

      if (!disputeResult.success || !disputeResult.dispute) {
        return res.status(404).json({
          success: false,
          error: disputeResult.error || 'Dispute not found'
        });
      }

      const dispute = disputeResult.dispute;
      const stateInfo = squareDisputesService.getDisputeStateInfo(dispute.state || '');

      res.json({
        success: true,
        dispute: {
          id: dispute.id,
          state: dispute.state,
          stateInfo,
          reason: dispute.reason,
          amountMoney: dispute.amountMoney ? Number(dispute.amountMoney.amount) / 100 : 0,
          currency: dispute.amountMoney?.currency || 'USD',
          reportedDate: dispute.reportedDate,
          dueBy: dispute.evidenceDueBy,
          paymentId: dispute.disputedPayment?.paymentId,
          cardBrand: dispute.cardBrand,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt,
          evidence: dispute.evidence
        }
      });
    } catch (error: any) {
      console.error('Get dispute error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dispute details'
      });
    }
  }
);

// Accept dispute (lose the dispute)
router.post('/:disputeId/accept',
  requireAnyAuth,
  generalRateLimit,
  secureLogger,
  async (req, res) => {
    try {
      const { disputeId } = req.params;
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can accept disputes
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can accept disputes'
        });
      }

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const disputeResult = await squareDisputesService.acceptDispute(disputeId);

      if (!disputeResult.success || !disputeResult.dispute) {
        return res.status(400).json({
          success: false,
          error: disputeResult.error || 'Failed to accept dispute',
          errorCode: disputeResult.errorCode
        });
      }

      // Log dispute acceptance
      try {
        await storage.createTransaction({
          giftCardId: 'DISPUTE_ACCEPTED',
          transactionType: 'dispute',
          amount: String(disputeResult.dispute.amountMoney ? Number(disputeResult.dispute.amountMoney.amount) / 100 : 0),
          balanceAfter: '0',
          performedBy: userId,
          description: `Dispute accepted: ${disputeId}`,
          metadata: {
            disputeId,
            state: disputeResult.dispute.state,
            reason: disputeResult.dispute.reason
          }
        });
      } catch (dbError) {
        console.error('Failed to log dispute acceptance:', dbError);
      }

      res.json({
        success: true,
        dispute: disputeResult.dispute
      });
    } catch (error: any) {
      console.error('Accept dispute error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept dispute'
      });
    }
  }
);

// Upload text evidence
router.post('/:disputeId/evidence/text',
  requireAnyAuth,
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const { disputeId } = req.params;
      const validatedData = textEvidenceSchema.parse(req.body);
      const { evidenceType, evidenceText } = validatedData;

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const evidenceResult = await squareDisputesService.uploadTextEvidence(
        disputeId,
        evidenceType,
        evidenceText
      );

      if (!evidenceResult.success || !evidenceResult.evidence) {
        return res.status(400).json({
          success: false,
          error: evidenceResult.error || 'Failed to upload text evidence'
        });
      }

      res.json({
        success: true,
        evidence: {
          id: evidenceResult.evidence.id,
          type: evidenceResult.evidence.evidenceType,
          uploadedAt: evidenceResult.evidence.uploadedAt
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

      console.error('Upload text evidence error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload text evidence'
      });
    }
  }
);

// Upload file evidence
router.post('/:disputeId/evidence/file',
  requireAnyAuth,
  generalRateLimit,
  upload.single('file'),
  async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { evidenceType } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (!evidenceType) {
        return res.status(400).json({
          success: false,
          error: 'Evidence type is required'
        });
      }

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const evidenceResult = await squareDisputesService.uploadFileEvidence(
        disputeId,
        evidenceType,
        file.path,
        file.mimetype
      );

      if (!evidenceResult.success || !evidenceResult.evidence) {
        return res.status(400).json({
          success: false,
          error: evidenceResult.error || 'Failed to upload file evidence'
        });
      }

      res.json({
        success: true,
        evidence: {
          id: evidenceResult.evidence.id,
          type: evidenceResult.evidence.evidenceType,
          filename: evidenceResult.evidence.filename,
          uploadedAt: evidenceResult.evidence.uploadedAt
        }
      });
    } catch (error: any) {
      console.error('Upload file evidence error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload file evidence'
      });
    }
  }
);

// List evidence for a dispute
router.get('/:disputeId/evidence',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { disputeId } = req.params;
      const { cursor } = req.query;

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const evidenceResult = await squareDisputesService.listEvidence(
        disputeId,
        cursor as string
      );

      if (!evidenceResult.success) {
        return res.status(400).json({
          success: false,
          error: evidenceResult.error || 'Failed to list evidence'
        });
      }

      res.json({
        success: true,
        evidence: evidenceResult.evidence || [],
        cursor: evidenceResult.cursor,
        hasMore: !!evidenceResult.cursor
      });
    } catch (error: any) {
      console.error('List evidence error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list evidence'
      });
    }
  }
);

// Remove evidence
router.delete('/:disputeId/evidence/:evidenceId',
  requireAnyAuth,
  generalRateLimit,
  async (req, res) => {
    try {
      const { disputeId, evidenceId } = req.params;

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const result = await squareDisputesService.removeEvidence(disputeId, evidenceId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to remove evidence'
        });
      }

      res.json({
        success: true,
        message: 'Evidence removed successfully'
      });
    } catch (error: any) {
      console.error('Remove evidence error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove evidence'
      });
    }
  }
);

// Submit evidence for dispute
router.post('/:disputeId/submit',
  requireAnyAuth,
  generalRateLimit,
  async (req, res) => {
    try {
      const { disputeId } = req.params;
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can submit evidence
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can submit evidence'
        });
      }

      if (!squareDisputesService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Disputes service temporarily unavailable'
        });
      }

      const disputeResult = await squareDisputesService.submitEvidence(disputeId);

      if (!disputeResult.success || !disputeResult.dispute) {
        return res.status(400).json({
          success: false,
          error: disputeResult.error || 'Failed to submit evidence',
          errorCode: disputeResult.errorCode
        });
      }

      // Log evidence submission
      try {
        await storage.createTransaction({
          giftCardId: 'DISPUTE_EVIDENCE_SUBMITTED',
          transactionType: 'dispute',
          amount: '0',
          balanceAfter: '0',
          performedBy: userId,
          description: `Evidence submitted for dispute: ${disputeId}`,
          metadata: {
            disputeId,
            state: disputeResult.dispute.state
          }
        });
      } catch (dbError) {
        console.error('Failed to log evidence submission:', dbError);
      }

      res.json({
        success: true,
        dispute: disputeResult.dispute,
        message: 'Evidence submitted successfully'
      });
    } catch (error: any) {
      console.error('Submit evidence error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit evidence'
      });
    }
  }
);

export { router as disputesRouter };