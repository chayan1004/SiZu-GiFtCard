
import { Router } from 'express';
import { SquarePaymentsService } from './services/SquarePaymentsService';
import { storage } from './storage';
import { 
  generalRateLimit, 
  validateInput, 
  validateGiftCardAmount,
  secureLogger 
} from './middleware/security';
import { z } from 'zod';

const router = Router();

// Initialize payments service only if Square access token is available
let paymentsService: SquarePaymentsService | null = null;
try {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    paymentsService = new SquarePaymentsService();
  }
} catch (error) {
  console.log('Square payments service not available - Square access token not provided');
}

// Payment request schema
const paymentRequestSchema = z.object({
  amount: z.number().min(1).max(500),
  currency: z.string().default('USD'),
  paymentMethod: z.object({
    type: z.enum(['card', 'ach', 'google_pay', 'apple_pay', 'cash_app_pay']),
    sourceId: z.string(),
    verificationToken: z.string().optional(),
    deviceFingerprint: z.string().optional(),
  }),
  orderId: z.string().optional(),
  referenceId: z.string().optional(),
  note: z.string().optional(),
  customerId: z.string().optional(),
  buyerEmailAddress: z.string().email().optional(),
  billingAddress: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    locality: z.string().optional(),
    administrativeDistrictLevel1: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('US'),
  }).optional(),
  shippingAddress: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    locality: z.string().optional(),
    administrativeDistrictLevel1: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('US'),
  }).optional(),
});

// Process payment for gift card purchase
router.post('/process', 
  generalRateLimit,
  validateInput,
  validateGiftCardAmount,
  secureLogger,
  async (req, res) => {
    try {
      const paymentData = paymentRequestSchema.parse(req.body);
      
      if (!paymentsService || !paymentsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          errorMessage: 'Payment processing temporarily unavailable',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      // Validate payment method
      if (!paymentsService.isValidPaymentMethod(paymentData.paymentMethod.type)) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Invalid payment method',
          errorCode: 'INVALID_PAYMENT_METHOD'
        });
      }

      let paymentResult;

      // Route to appropriate payment processor based on method type
      switch (paymentData.paymentMethod.type) {
        case 'card':
        case 'google_pay':
        case 'apple_pay':
          paymentResult = await paymentsService.processPayment(paymentData);
          break;
        
        case 'ach':
          paymentResult = await paymentsService.processACHPayment(paymentData);
          break;
        
        case 'cash_app_pay':
          paymentResult = await paymentsService.processCashAppPayment(paymentData);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            errorMessage: 'Unsupported payment method',
            errorCode: 'UNSUPPORTED_PAYMENT_METHOD'
          });
      }

      if (paymentResult.success) {
        // Store payment record
        await storage.createPaymentRecord({
          paymentId: paymentResult.paymentId!,
          orderId: paymentResult.orderId,
          amount: paymentData.amount.toString(),
          currency: paymentData.currency,
          paymentMethod: paymentData.paymentMethod.type,
          status: paymentResult.status,
          buyerEmail: paymentData.buyerEmailAddress,
          referenceId: paymentData.referenceId,
          receiptNumber: paymentResult.receiptNumber,
          cardDetails: paymentResult.cardDetails,
        });

        res.json(paymentResult);
      } else {
        // Log failed payment attempt
        await storage.createPaymentRecord({
          paymentId: paymentResult.paymentId || 'failed',
          amount: paymentData.amount.toString(),
          currency: paymentData.currency,
          paymentMethod: paymentData.paymentMethod.type,
          status: 'failed',
          buyerEmail: paymentData.buyerEmailAddress,
          referenceId: paymentData.referenceId,
          errorMessage: paymentResult.errorMessage,
          errorCode: paymentResult.errorCode,
        });

        res.status(400).json(paymentResult);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Invalid payment data',
          errorCode: 'VALIDATION_ERROR',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        errorMessage: 'Payment processing failed',
        errorCode: 'INTERNAL_ERROR'
      });
    }
  }
);

// Get payment status
router.get('/status/:paymentId',
  generalRateLimit,
  secureLogger,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Payment ID is required'
        });
      }

      const payment = await paymentsService.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          errorMessage: 'Payment not found'
        });
      }

      // Return safe payment information
      res.json({
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amountMoney,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        receiptNumber: payment.receiptNumber,
        receiptUrl: payment.receiptUrl,
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        errorMessage: 'Failed to fetch payment status'
      });
    }
  }
);

// Complete payment (for async payments like ACH)
router.post('/complete/:paymentId',
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Payment ID is required'
        });
      }

      const result = await paymentsService.completePayment(paymentId);
      
      if (result.success) {
        // Update payment record in database
        await storage.updatePaymentStatus(paymentId, result.status);
      }

      res.json(result);
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        errorMessage: 'Failed to complete payment'
      });
    }
  }
);

// Cancel payment
router.post('/cancel/:paymentId',
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Payment ID is required'
        });
      }

      const success = await paymentsService.cancelPayment(paymentId);
      
      if (success) {
        // Update payment record in database
        await storage.updatePaymentStatus(paymentId, 'canceled');
        
        res.json({
          success: true,
          message: 'Payment canceled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          errorMessage: 'Failed to cancel payment'
        });
      }
    } catch (error) {
      console.error('Error canceling payment:', error);
      res.status(500).json({
        success: false,
        errorMessage: 'Failed to cancel payment'
      });
    }
  }
);

// Get supported payment methods
router.get('/methods',
  generalRateLimit,
  async (req, res) => {
    try {
      const methods = [
        {
          type: 'card',
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard, American Express, Discover',
          processingTime: 'Instant',
          fees: 'Standard processing fees apply',
          supported: true
        },
        {
          type: 'google_pay',
          name: 'Google Pay',
          description: 'Pay with your Google account',
          processingTime: 'Instant',
          fees: 'No additional fees',
          supported: true
        },
        {
          type: 'apple_pay',
          name: 'Apple Pay',
          description: 'Pay with Touch ID or Face ID',
          processingTime: 'Instant',
          fees: 'No additional fees',
          supported: true
        },
        {
          type: 'cash_app_pay',
          name: 'Cash App Pay',
          description: 'Pay with your Cash App account',
          processingTime: 'Instant',
          fees: 'No additional fees',
          supported: true
        },
        {
          type: 'ach',
          name: 'Bank Transfer (ACH)',
          description: 'Direct transfer from your bank account',
          processingTime: '1-3 business days',
          fees: 'Lower processing fees',
          supported: true
        }
      ];

      res.json({
        success: true,
        methods,
        available: paymentsService.isAvailable()
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        errorMessage: 'Failed to fetch payment methods'
      });
    }
  }
);

export { router as paymentsRouter };
