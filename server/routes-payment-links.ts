import { Router, Request, Response } from 'express';
import { getSquarePaymentLinksService } from './services/SquarePaymentLinksService';
import { requireAnyAuth } from './middleware/customerAuth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createPaymentLinkSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().max(1000).optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(255).optional(),
  senderName: z.string().max(255).optional(),
  customMessage: z.string().max(500).optional(),
  paymentNote: z.string().max(1000).optional(),
  checkoutOptions: z.object({
    askForShippingAddress: z.boolean().optional(),
    acceptedPaymentMethods: z.object({
      applePay: z.boolean().optional(),
      googlePay: z.boolean().optional(),
      cashApp: z.boolean().optional(),
      afterpayClearpay: z.boolean().optional()
    }).optional(),
    allowTipping: z.boolean().optional(),
    customFields: z.array(z.object({
      title: z.string()
    })).optional(),
    redirectUrl: z.string().url().optional(),
    merchantSupportEmail: z.string().email().optional(),
    appFeeMoney: z.object({
      amount: z.number().positive(),
      currency: z.string().length(3).optional()
    }).optional(),
    shippingFee: z.object({
      name: z.string(),
      charge: z.object({
        amount: z.number().positive(),
        currency: z.string().length(3).optional()
      })
    }).optional()
  }).optional(),
  prePopulatedData: z.object({
    buyerEmail: z.string().email().optional(),
    buyerPhoneNumber: z.string().optional(),
    buyerAddress: z.object({
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      locality: z.string().optional(),
      administrativeDistrictLevel1: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional()
    }).optional()
  }).optional()
});

const quickPaySchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().max(1000).optional(),
  paymentNote: z.string().max(1000).optional(),
  checkoutOptions: z.object({
    askForShippingAddress: z.boolean().optional(),
    acceptedPaymentMethods: z.object({
      applePay: z.boolean().optional(),
      googlePay: z.boolean().optional(),
      cashApp: z.boolean().optional(),
      afterpayClearpay: z.boolean().optional()
    }).optional(),
    allowTipping: z.boolean().optional(),
    customFields: z.array(z.object({
      title: z.string()
    })).optional(),
    redirectUrl: z.string().url().optional(),
    merchantSupportEmail: z.string().email().optional(),
    appFeeMoney: z.object({
      amount: z.number().positive(),
      currency: z.string().length(3).optional()
    }).optional(),
    shippingFee: z.object({
      name: z.string(),
      charge: z.object({
        amount: z.number().positive(),
        currency: z.string().length(3).optional()
      })
    }).optional()
  }).optional(),
  prePopulatedData: z.object({
    buyerEmail: z.string().email().optional(),
    buyerPhoneNumber: z.string().optional(),
    buyerAddress: z.object({
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      locality: z.string().optional(),
      administrativeDistrictLevel1: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional()
    }).optional()
  }).optional()
});

const updatePaymentLinkSchema = z.object({
  checkoutOptions: z.object({
    askForShippingAddress: z.boolean().optional(),
    acceptedPaymentMethods: z.object({
      applePay: z.boolean().optional(),
      googlePay: z.boolean().optional(),
      cashApp: z.boolean().optional(),
      afterpayClearpay: z.boolean().optional()
    }).optional(),
    allowTipping: z.boolean().optional(),
    redirectUrl: z.string().url().optional(),
    merchantSupportEmail: z.string().email().optional()
  }).optional(),
  prePopulatedData: z.object({
    buyerEmail: z.string().email().optional(),
    buyerPhoneNumber: z.string().optional(),
    buyerAddress: z.object({
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      locality: z.string().optional(),
      administrativeDistrictLevel1: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional()
    }).optional()
  }).optional()
});

// Create a payment link for gift card purchase
router.post('/gift-card', requireAnyAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createPaymentLinkSchema.parse(req.body);
    
    const paymentLink = await getSquarePaymentLinksService().createGiftCardPaymentLink(validatedData);
    
    res.json({
      success: true,
      paymentLink
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    
    console.error('Error creating gift card payment link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment link'
    });
  }
});

// Create a quick pay link
router.post('/quick-pay', requireAnyAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = quickPaySchema.parse(req.body);
    
    const paymentLink = await getSquarePaymentLinksService().createQuickPayLink(validatedData);
    
    res.json({
      success: true,
      paymentLink
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    
    console.error('Error creating quick pay link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create quick pay link'
    });
  }
});

// Get payment link details
router.get('/:paymentLinkId', requireAnyAuth, async (req: Request, res: Response) => {
  try {
    const { paymentLinkId } = req.params;
    
    const paymentLink = await getSquarePaymentLinksService().getPaymentLink(paymentLinkId);
    
    res.json({
      success: true,
      paymentLink
    });
  } catch (error) {
    console.error('Error retrieving payment link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve payment link'
    });
  }
});

// Update payment link
router.patch('/:paymentLinkId', requireAnyAuth, async (req: Request, res: Response) => {
  try {
    const { paymentLinkId } = req.params;
    const validatedData = updatePaymentLinkSchema.parse(req.body);
    
    const paymentLink = await getSquarePaymentLinksService().updatePaymentLink(paymentLinkId, validatedData);
    
    res.json({
      success: true,
      paymentLink
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    
    console.error('Error updating payment link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment link'
    });
  }
});

// Delete payment link
router.delete('/:paymentLinkId', requireAnyAuth, async (req: Request, res: Response) => {
  try {
    const { paymentLinkId } = req.params;
    
    await getSquarePaymentLinksService().deletePaymentLink(paymentLinkId);
    
    res.json({
      success: true,
      message: 'Payment link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment link'
    });
  }
});

export const paymentLinksRouter = router;