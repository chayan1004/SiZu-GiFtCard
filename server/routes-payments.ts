
import { Router } from 'express';
import { squarePaymentsService } from './services/SquarePaymentsService';
import { SquareOrdersService } from './services/SquareOrdersService';
import { storage } from './storage';
import { 
  generalRateLimit, 
  validateInput, 
  validateGiftCardAmount,
  secureLogger 
} from './middleware/security';
import { isAuthenticated } from './replitAuth';
import { z } from 'zod';

const router = Router();
const ordersService = new SquareOrdersService();

// Web Payments SDK configuration endpoint
router.get('/config', (req, res) => {
  const applicationId = process.env.SQUARE_APPLICATION_ID || '';
  const locationId = process.env.SQUARE_LOCATION_ID || '';
  const environment = process.env.SQUARE_ACCESS_TOKEN?.startsWith('sandbox') 
    ? 'sandbox' 
    : 'production';

  res.json({
    applicationId,
    locationId,
    environment
  });
});

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

// Create payment for gift card purchase
router.post('/create', 
  isAuthenticated,
  validateInput,
  validateGiftCardAmount,
  secureLogger,
  async (req, res) => {
    try {
      const { 
        sourceId,  // Card nonce or ACH token from Web Payments SDK
        amount, 
        giftCardId,
        recipientEmail,
        recipientName,
        message,
        designType,
        verificationToken, // 3D Secure verification token
        buyerEmailAddress, // Buyer's email for receipts
        paymentType // Payment type (e.g., 'ACH')
      } = req.body;

      if (!sourceId || !amount || !giftCardId) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields: sourceId, amount, and giftCardId are required" 
        });
      }

      if (!squarePaymentsService.isAvailable() || !ordersService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Payment processing temporarily unavailable',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userEmail = user.email || user.claims?.email || '';

      // Create order with Square Orders API
      const orderResult = await ordersService.createOrder(
        amount,
        [{
          name: `Gift Card - ${designType || 'Standard'}`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(Math.round(amount * 100)),
            currency: 'USD'
          },
          note: message || ''
        }],
        userEmail
      );

      if (!orderResult.success || !orderResult.orderId) {
        return res.status(400).json({
          success: false,
          error: orderResult.error || 'Failed to create order'
        });
      }

      // Log ACH payment type if applicable
      if (paymentType === 'ACH') {
        console.log('Processing ACH payment with token:', sourceId.substring(0, 10) + '...');
      }

      // Process payment with Square Payments API
      const paymentResult = await squarePaymentsService.createPayment(
        sourceId,
        amount,
        undefined, // customerId - optional
        orderResult.orderId,
        giftCardId, // referenceId
        `Gift card purchase: ${designType || 'Standard'} - ${recipientEmail || 'Self'} - ${paymentType === 'ACH' ? 'ACH Payment' : 'Card Payment'}`,
        false, // no verification needed for gift card purchase
        {
          verificationToken, // 3D Secure/SCA verification token
          buyerEmailAddress: buyerEmailAddress || userEmail, // Use buyer email for receipts
          // For ACH payments, we need to set autocomplete to true
          autocomplete: true
        }
      );

      if (!paymentResult.success || !paymentResult.paymentId) {
        // Cancel the order if payment fails
        // Note: In production, you might want to keep the order for retry
        return res.status(400).json({
          success: false,
          error: paymentResult.error || 'Payment processing failed'
        });
      }

      // Update gift card with Square ID if needed
      const giftCard = await storage.getGiftCardById(giftCardId);
      if (giftCard && !giftCard.squareGiftCardId) {
        // Activate gift card with Square
        const squareService = (await import('./services/SquareService')).default;
        const activationResult = await squareService.activateGiftCard(
          giftCard.id,
          orderResult.orderId,
          orderResult.lineItemUid || ''
        );

        if (activationResult.success && activationResult.activity) {
          await storage.updateGiftCardSquareId(
            giftCard.id,
            activationResult.activity.giftCardId || ''
          );
        }
      }

      // Create transaction record
      await storage.createTransaction({
        giftCardId,
        transactionType: 'purchase',
        amount: amount.toString(),
        balanceAfter: amount.toString(),
        performedBy: userId,
        recipientEmail,
        description: `Gift card purchase - ${designType || 'Standard'}`,
        metadata: {
          paymentId: paymentResult.paymentId,
          orderId: orderResult.orderId,
          recipientName,
          message,
          designType
        }
      });

      res.json({
        success: true,
        paymentId: paymentResult.paymentId,
        orderId: orderResult.orderId,
        giftCardId
      });
    } catch (error: any) {
      console.error('Payment creation error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to process payment' 
      });
    }
  }
);

// Process payment for gift card recharge
router.post('/recharge', 
  isAuthenticated,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const { 
        sourceId,  // Card nonce from Web Payments SDK
        amount, 
        giftCardId
      } = req.body;

      if (!sourceId || !amount || !giftCardId) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields: sourceId, amount, and giftCardId are required" 
        });
      }

      if (!squarePaymentsService.isAvailable() || !ordersService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Payment processing temporarily unavailable',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      // Get gift card details
      const giftCard = await storage.getGiftCardById(giftCardId);
      if (!giftCard) {
        return res.status(404).json({
          success: false,
          error: 'Gift card not found'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userEmail = user.email || user.claims?.email || '';

      // Create order for recharge
      const orderResult = await ordersService.createOrder(
        amount,
        [{
          name: `Gift Card Recharge`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(Math.round(amount * 100)),
            currency: 'USD'
          },
          note: `Recharge for card ending in ${giftCard.code.slice(-4)}`
        }],
        userEmail
      );

      if (!orderResult.success || !orderResult.orderId) {
        return res.status(400).json({
          success: false,
          error: orderResult.error || 'Failed to create order'
        });
      }

      // Process payment
      const paymentResult = await squarePaymentsService.createPayment(
        sourceId,
        amount,
        undefined,
        orderResult.orderId,
        giftCardId,
        `Gift card recharge - ${giftCard.code.slice(-4)}`,
        false
      );

      if (!paymentResult.success || !paymentResult.paymentId) {
        return res.status(400).json({
          success: false,
          error: paymentResult.error || 'Payment processing failed'
        });
      }

      // Load funds to Square gift card if it has a Square ID
      if (giftCard.squareGiftCardId) {
        const squareService = (await import('./services/SquareService')).default;
        const loadResult = await squareService.loadGiftCard(
          giftCard.squareGiftCardId,
          amount,
          orderResult.orderId,
          orderResult.lineItemUid
        );

        if (!loadResult.success) {
          console.error('Failed to load Square gift card:', loadResult.error);
        }
      }

      // Update gift card balance
      const newBalance = parseFloat(giftCard.balance) + amount;
      await storage.updateGiftCardBalance(giftCardId, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        giftCardId,
        transactionType: 'recharge',
        amount: amount.toString(),
        balanceAfter: newBalance.toString(),
        performedBy: userId,
        description: `Gift card recharge`,
        metadata: {
          paymentId: paymentResult.paymentId,
          orderId: orderResult.orderId
        }
      });

      res.json({
        success: true,
        paymentId: paymentResult.paymentId,
        orderId: orderResult.orderId,
        newBalance
      });
    } catch (error: any) {
      console.error('Recharge payment error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to process recharge' 
      });
    }
  }
);

// Get payment status
router.get('/status/:paymentId',
  isAuthenticated,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!squarePaymentsService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'Payment service temporarily unavailable'
        });
      }
      
      const payment = await squarePaymentsService.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          sourceType: payment.sourceType,
          cardDetails: payment.cardDetails ? {
            last4: payment.cardDetails.card?.last4,
            brand: payment.cardDetails.card?.cardBrand,
            expMonth: payment.cardDetails.card?.expMonth,
            expYear: payment.cardDetails.card?.expYear
          } : undefined,
          walletDetails: payment.walletDetails ? {
            status: payment.walletDetails.status,
            brand: payment.walletDetails.brand,
            cashAppDetails: payment.walletDetails.cashAppDetails ? {
              buyerCountryCode: payment.walletDetails.cashAppDetails.buyerCountryCode,
              buyerCashtag: payment.walletDetails.cashAppDetails.buyerCashtag
            } : undefined
          } : undefined,
          bankAccountDetails: payment.bankAccountDetails ? {
            bankName: payment.bankAccountDetails.bankName,
            transferType: payment.bankAccountDetails.transferType,
            accountOwnershipType: payment.bankAccountDetails.accountOwnershipType,
            fingerprint: payment.bankAccountDetails.fingerprint,
            country: payment.bankAccountDetails.country,
            achDetails: payment.bankAccountDetails.achDetails ? {
              routingNumber: payment.bankAccountDetails.achDetails.routingNumber,
              accountNumberSuffix: payment.bankAccountDetails.achDetails.accountNumberSuffix,
              accountType: payment.bankAccountDetails.achDetails.accountType
            } : undefined
          } : undefined
        }
      });
    } catch (error: any) {
      console.error('Payment status error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to get payment status' 
      });
    }
  }
);

// Get supported payment methods
router.get('/methods', async (req, res) => {
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
        name: 'Cash App',
        description: 'Pay with Cash App - quick and secure digital wallet',
        processingTime: 'Instant',
        fees: 'No additional fees',
        supported: true,
        walletType: 'CASH_APP'
      },
      {
        type: 'ach',
        name: 'Bank Transfer (ACH)',
        description: 'Pay directly from your bank account via Plaid',
        processingTime: '3-5 business days',
        fees: '1% processing fee (minimum $1)',
        supported: true,
        paymentType: 'ACH',
        notes: 'Powered by Square and Plaid partnership'
      }
    ];

    res.json({
      success: true,
      methods,
      available: squarePaymentsService.isAvailable()
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
});

export { router as paymentsRouter };
