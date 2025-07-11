import { 
  SquareClient, 
  SquareEnvironment,
  CreateWebhookSubscriptionRequest,
  CreateWebhookSubscriptionResponse,
  UpdateWebhookSubscriptionRequest,
  UpdateWebhookSubscriptionResponse,
  ListWebhookSubscriptionsResponse,
  RetrieveWebhookSubscriptionResponse,
  DeleteWebhookSubscriptionResponse,
  TestWebhookSubscriptionRequest,
  TestWebhookSubscriptionResponse,
  WebhookSubscription
} from "square";
import { nanoid } from "nanoid";

export interface WebhookSubscriptionResult {
  success: boolean;
  subscription?: WebhookSubscription;
  subscriptionId?: string;
  error?: string;
  errorCode?: string;
}

export interface WebhookListResult {
  success: boolean;
  subscriptions?: WebhookSubscription[];
  cursor?: string;
  error?: string;
}

// Available webhook event types
export const WEBHOOK_EVENT_TYPES = {
  // Payment events
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  
  // Refund events
  REFUND_CREATED: 'refund.created',
  REFUND_UPDATED: 'refund.updated',
  
  // Dispute events
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_STATE_UPDATED: 'dispute.state.updated',
  DISPUTE_EVIDENCE_ADDED: 'dispute.evidence.added_to_file',
  DISPUTE_EVIDENCE_REMOVED: 'dispute.evidence.removed_from_file',
  
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_FULFILLMENT_UPDATED: 'order.fulfillment.updated',
  
  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  
  // Gift card events
  GIFT_CARD_CREATED: 'gift_card.created',
  GIFT_CARD_UPDATED: 'gift_card.updated',
  GIFT_CARD_CUSTOMER_LINKED: 'gift_card.customer_linked',
  GIFT_CARD_CUSTOMER_UNLINKED: 'gift_card.customer_unlinked',
  GIFT_CARD_ACTIVITY_CREATED: 'gift_card_activity.created',
  GIFT_CARD_ACTIVITY_UPDATED: 'gift_card_activity.updated',
  
  // Payout events
  PAYOUT_SENT: 'payout.sent',
  PAYOUT_FAILED: 'payout.failed',
  
  // OAuth events
  OAUTH_AUTHORIZATION_REVOKED: 'oauth.authorization.revoked',
  
  // Online checkout events
  ONLINE_CHECKOUT_LOCATION_SETTINGS_UPDATED: 'online_checkout.location_settings.updated',
  ONLINE_CHECKOUT_MERCHANT_SETTINGS_UPDATED: 'online_checkout.merchant_settings.updated'
} as const;

export class SquareWebhookSubscriptionsService {
  private client: SquareClient;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.warn("Square access token not provided. Webhook subscription features will be limited.");
      return;
    }

    const environment = process.env.SQUARE_ACCESS_TOKEN.startsWith('sandbox') 
      ? SquareEnvironment.Sandbox 
      : SquareEnvironment.Production;

    this.client = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment
    });

    this.isInitialized = true;
    console.log(`Square Webhook Subscriptions Service initialized`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a new webhook subscription
   */
  async createSubscription(
    name: string,
    notificationUrl: string,
    eventTypes: string[],
    apiVersion?: string
  ): Promise<WebhookSubscriptionResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;
      const idempotencyKey = `webhook-sub-${nanoid()}`;

      const request: CreateWebhookSubscriptionRequest = {
        idempotencyKey,
        subscription: {
          name,
          enabled: true,
          eventTypes,
          notificationUrl,
          apiVersion: apiVersion || '2024-01-18' // Use latest API version
        }
      };

      const response: CreateWebhookSubscriptionResponse = await webhookSubscriptionsApi.createWebhookSubscription(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Webhook subscription creation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create webhook subscription',
          errorCode: error.code || 'SUBSCRIPTION_FAILED'
        };
      }

      if (!response.result.subscription) {
        return {
          success: false,
          error: 'No subscription returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const subscription = response.result.subscription;
      console.log(`Webhook subscription created successfully: ${subscription.id}`);

      return {
        success: true,
        subscription,
        subscriptionId: subscription.id
      };
    } catch (error: any) {
      console.error('Webhook subscription creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create webhook subscription',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Update an existing webhook subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      name?: string;
      enabled?: boolean;
      eventTypes?: string[];
      notificationUrl?: string;
    }
  ): Promise<WebhookSubscriptionResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;

      const request: UpdateWebhookSubscriptionRequest = {
        subscription: updates
      };

      const response: UpdateWebhookSubscriptionResponse = await webhookSubscriptionsApi.updateWebhookSubscription(
        subscriptionId,
        request
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to update webhook subscription',
          errorCode: error.code
        };
      }

      if (!response.result.subscription) {
        return {
          success: false,
          error: 'No subscription returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      console.log(`Webhook subscription updated successfully: ${subscriptionId}`);
      return {
        success: true,
        subscription: response.result.subscription,
        subscriptionId
      };
    } catch (error: any) {
      console.error('Webhook subscription update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update webhook subscription',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * List all webhook subscriptions
   */
  async listSubscriptions(
    cursor?: string,
    includeDisabled?: boolean,
    sortOrder?: 'ASC' | 'DESC',
    limit?: number
  ): Promise<WebhookListResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;
      const response: ListWebhookSubscriptionsResponse = await webhookSubscriptionsApi.listWebhookSubscriptions(
        cursor,
        includeDisabled,
        sortOrder,
        limit
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to list webhook subscriptions'
        };
      }

      return {
        success: true,
        subscriptions: response.result.subscriptions || [],
        cursor: response.result.cursor
      };
    } catch (error: any) {
      console.error('List webhook subscriptions error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list webhook subscriptions'
      };
    }
  }

  /**
   * Get webhook subscription details
   */
  async getSubscription(subscriptionId: string): Promise<WebhookSubscriptionResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;
      const response: RetrieveWebhookSubscriptionResponse = await webhookSubscriptionsApi.retrieveWebhookSubscription(
        subscriptionId
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to get webhook subscription',
          errorCode: error.code
        };
      }

      if (!response.result.subscription) {
        return {
          success: false,
          error: 'Webhook subscription not found',
          errorCode: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        subscription: response.result.subscription,
        subscriptionId
      };
    } catch (error: any) {
      console.error('Get webhook subscription error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get webhook subscription',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Delete a webhook subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;
      const response: DeleteWebhookSubscriptionResponse = await webhookSubscriptionsApi.deleteWebhookSubscription(
        subscriptionId
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to delete webhook subscription'
        };
      }

      console.log(`Webhook subscription deleted successfully: ${subscriptionId}`);
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Delete webhook subscription error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete webhook subscription'
      };
    }
  }

  /**
   * Test a webhook subscription by sending a test event
   */
  async testSubscription(
    subscriptionId: string,
    eventType?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Webhook Subscriptions Service not initialized'
      };
    }

    try {
      const webhookSubscriptionsApi = this.client.webhookSubscriptionsApi;
      
      const request: TestWebhookSubscriptionRequest = {
        eventType: eventType || 'payment.created' // Default test event
      };

      const response: TestWebhookSubscriptionResponse = await webhookSubscriptionsApi.testWebhookSubscription(
        subscriptionId,
        request
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to test webhook subscription'
        };
      }

      console.log(`Test event sent for webhook subscription: ${subscriptionId}`);
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Test webhook subscription error:', error);
      return {
        success: false,
        error: error.message || 'Failed to test webhook subscription'
      };
    }
  }

  /**
   * Get signature key for webhook verification
   * Note: This is stored in environment variable, not retrieved from API
   */
  getSignatureKey(): string | undefined {
    return process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  }

  /**
   * Helper to validate webhook URL
   */
  isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Square requires HTTPS in production
      return parsed.protocol === 'https:' || 
             (process.env.NODE_ENV === 'development' && parsed.protocol === 'http:');
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const squareWebhookSubscriptionsService = new SquareWebhookSubscriptionsService();