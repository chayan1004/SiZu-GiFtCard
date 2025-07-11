import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './replitAuth';
import { squareWebhookSubscriptionsService, WEBHOOK_EVENT_TYPES } from './services/SquareWebhookSubscriptionsService';
import { storage } from './storage';

const router = Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(255),
  notificationUrl: z.string().url(),
  eventTypes: z.array(z.string()),
  apiVersion: z.string().optional()
});

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  enabled: z.boolean().optional(),
  eventTypes: z.array(z.string()).optional(),
  notificationUrl: z.string().url().optional()
});

const listSubscriptionsSchema = z.object({
  cursor: z.string().optional(),
  includeDisabled: z.boolean().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().min(1).max(100).optional()
});

// List all webhook event types
router.get('/event-types', isAuthenticated, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      eventTypes: WEBHOOK_EVENT_TYPES
    });
  } catch (error: any) {
    console.error('Error fetching event types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event types'
    });
  }
});

// List webhook subscriptions
router.get('/subscriptions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const params = listSubscriptionsSchema.parse(req.query);
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    const result = await squareWebhookSubscriptionsService.listSubscriptions(
      params.cursor,
      params.includeDisabled,
      params.sortOrder,
      params.limit
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Store webhook subscriptions in database for tracking
    if (result.subscriptions && result.subscriptions.length > 0) {
      for (const subscription of result.subscriptions) {
        await storage.createWebhookSubscription({
          id: subscription.id,
          name: subscription.name || '',
          url: subscription.notificationUrl || '',
          eventTypes: subscription.eventTypes || [],
          enabled: subscription.enabled || false,
          apiVersion: subscription.apiVersion || '',
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt
        });
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error listing webhook subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list webhook subscriptions'
    });
  }
});

// Get webhook subscription details
router.get('/subscriptions/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    const result = await squareWebhookSubscriptionsService.getSubscription(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting webhook subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook subscription'
    });
  }
});

// Create webhook subscription
router.post('/subscriptions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = createSubscriptionSchema.parse(req.body);
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    // Validate webhook URL
    if (!squareWebhookSubscriptionsService.isValidWebhookUrl(data.notificationUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook URL. HTTPS is required in production.'
      });
    }

    const result = await squareWebhookSubscriptionsService.createSubscription(
      data.name,
      data.notificationUrl,
      data.eventTypes,
      data.apiVersion
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Store in database
    if (result.subscription) {
      await storage.createWebhookSubscription({
        id: result.subscription.id,
        name: result.subscription.name || '',
        url: result.subscription.notificationUrl || '',
        eventTypes: result.subscription.eventTypes || [],
        enabled: result.subscription.enabled || false,
        apiVersion: result.subscription.apiVersion || '',
        createdAt: result.subscription.createdAt,
        updatedAt: result.subscription.updatedAt
      });
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating webhook subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook subscription'
    });
  }
});

// Update webhook subscription
router.patch('/subscriptions/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateSubscriptionSchema.parse(req.body);
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    // Validate webhook URL if provided
    if (updates.notificationUrl && !squareWebhookSubscriptionsService.isValidWebhookUrl(updates.notificationUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook URL. HTTPS is required in production.'
      });
    }

    const result = await squareWebhookSubscriptionsService.updateSubscription(id, updates);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update in database
    if (result.subscription) {
      await storage.updateWebhookSubscription(id, {
        name: result.subscription.name,
        url: result.subscription.notificationUrl,
        eventTypes: result.subscription.eventTypes,
        enabled: result.subscription.enabled,
        apiVersion: result.subscription.apiVersion,
        updatedAt: result.subscription.updatedAt
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error updating webhook subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook subscription'
    });
  }
});

// Delete webhook subscription
router.delete('/subscriptions/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    const result = await squareWebhookSubscriptionsService.deleteSubscription(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Mark as deleted in database (soft delete)
    await storage.deleteWebhookSubscription(id);

    res.json(result);
  } catch (error: any) {
    console.error('Error deleting webhook subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook subscription'
    });
  }
});

// Test webhook subscription
router.post('/test', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { subscriptionId, eventType } = z.object({
      subscriptionId: z.string(),
      eventType: z.string().optional()
    }).parse(req.body);
    
    if (!squareWebhookSubscriptionsService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Webhook subscriptions service not available'
      });
    }

    const result = await squareWebhookSubscriptionsService.testSubscription(subscriptionId, eventType);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Test event sent successfully'
    });
  } catch (error: any) {
    console.error('Error testing webhook subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test webhook subscription'
    });
  }
});

// Get webhook signature key (for documentation)
router.get('/signature-key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const key = squareWebhookSubscriptionsService.getSignatureKey();
    
    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Webhook signature key not configured'
      });
    }

    // Only return that it's configured, not the actual key
    res.json({
      success: true,
      configured: true,
      keyLength: key.length
    });
  } catch (error: any) {
    console.error('Error getting signature key status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get signature key status'
    });
  }
});

export const webhookSubscriptionsRouter = router;