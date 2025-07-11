import { Router, Request, Response } from 'express';
import { SquareWebhookService } from './services/SquareWebhookService';

const router = Router();
const webhookService = new SquareWebhookService();

// Square webhook endpoint
router.post('/square', async (req: Request, res: Response) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-square-signature'] as string | undefined;

    // Verify webhook signature
    const verificationResult = webhookService.verifyWebhookSignature(rawBody, signature);
    if (!verificationResult.isValid) {
      console.error('Webhook signature verification failed:', verificationResult.error);
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: verificationResult.error 
      });
    }

    // Parse and process the event
    const event = req.body;
    console.log(`Received Square webhook: ${event.type}`);

    // Process event asynchronously
    webhookService.processWebhookEvent(event).catch(error => {
      console.error('Error processing webhook event:', error);
    });

    // Always respond quickly to Square
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check endpoint for webhook configuration
router.get('/square/health', (req: Request, res: Response) => {
  const isConfigured = webhookService.isConfigured();
  
  res.json({
    status: isConfigured ? 'configured' : 'not_configured',
    endpoint: '/api/webhooks/square',
    signatureKeyPresent: isConfigured,
    timestamp: new Date().toISOString()
  });
});

export const webhooksRouter = router;