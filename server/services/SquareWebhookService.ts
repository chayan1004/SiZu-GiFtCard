import crypto from 'crypto';
import { storage } from '../storage';

export interface WebhookEvent {
  id: string;
  type: string;
  createdAt: string;
  data: {
    id: string;
    object: any;
  };
}

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

export class SquareWebhookService {
  private webhookSignatureKey: string;

  constructor() {
    this.webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    if (!this.webhookSignatureKey) {
      console.warn('Square webhook signature key not configured. Webhook verification will fail.');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    requestBody: string,
    signatureHeader: string | undefined
  ): WebhookVerificationResult {
    if (!this.webhookSignatureKey) {
      return {
        isValid: false,
        error: 'Webhook signature key not configured'
      };
    }

    if (!signatureHeader) {
      return {
        isValid: false,
        error: 'No signature header provided'
      };
    }

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSignatureKey);
      hmac.update(requestBody);
      const expectedSignature = hmac.digest('base64');

      const isValid = signatureHeader === expectedSignature;
      
      if (!isValid) {
        console.error('Webhook signature verification failed');
      }

      return { isValid };
    } catch (error: any) {
      console.error('Webhook signature verification error:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        // Payment events
        case 'payment.created':
          await this.handlePaymentCreated(event);
          break;
        case 'payment.updated':
          await this.handlePaymentUpdated(event);
          break;

        // Gift card events
        case 'gift_card.created':
          await this.handleGiftCardCreated(event);
          break;
        case 'gift_card.updated':
          await this.handleGiftCardUpdated(event);
          break;
        case 'gift_card.activity.created':
          await this.handleGiftCardActivityCreated(event);
          break;
        case 'gift_card.customer_linked':
          await this.handleGiftCardCustomerLinked(event);
          break;
        case 'gift_card.customer_unlinked':
          await this.handleGiftCardCustomerUnlinked(event);
          break;

        // Refund events
        case 'refund.created':
          await this.handleRefundCreated(event);
          break;
        case 'refund.updated':
          await this.handleRefundUpdated(event);
          break;

        // Dispute events
        case 'dispute.created':
          await this.handleDisputeCreated(event);
          break;
        case 'dispute.updated':
          await this.handleDisputeUpdated(event);
          break;
        case 'dispute.evidence.created':
          await this.handleDisputeEvidenceCreated(event);
          break;

        // Order events
        case 'order.created':
          await this.handleOrderCreated(event);
          break;
        case 'order.updated':
          await this.handleOrderUpdated(event);
          break;
        case 'order.fulfillment.updated':
          await this.handleOrderFulfillmentUpdated(event);
          break;

        // OAuth events
        case 'oauth.authorization.revoked':
          await this.handleOAuthRevoked(event);
          break;

        // Payout events
        case 'payout.created':
          await this.handlePayoutCreated(event);
          break;
        case 'payout.updated':
          await this.handlePayoutUpdated(event);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  // Payment event handlers
  private async handlePaymentCreated(event: WebhookEvent) {
    // Payment data is nested inside data.object.payment
    const payment = event.data.object.payment;
    console.log(`Payment created: ${payment.id}`);
    console.log(`  Amount: $${payment.amount_money.amount / 100} ${payment.amount_money.currency}`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Order ID: ${payment.order_id}`);
    console.log(`  Location ID: ${payment.location_id}`);
    
    if (payment.card_details) {
      console.log(`  Card: ${payment.card_details.card.card_brand} ****${payment.card_details.card.last_4}`);
      console.log(`  Card Status: ${payment.card_details.status}`);
    }
    
    if (payment.risk_evaluation) {
      console.log(`  Risk Level: ${payment.risk_evaluation.risk_level}`);
    }
    
    // Update transaction status in database
    if (payment.order_id) {
      await storage.updateTransactionStatus(payment.order_id, 'completed');
    }
  }

  private async handlePaymentUpdated(event: WebhookEvent) {
    // Payment data is nested inside data.object.payment
    const payment = event.data.object.payment;
    console.log(`Payment updated: ${payment.id}, Status: ${payment.status}`);
    
    if (payment.receipt_url) {
      console.log(`  Receipt URL: ${payment.receipt_url}`);
    }
    
    // Update transaction status based on payment status
    if (payment.order_id) {
      const status = payment.status === 'COMPLETED' ? 'completed' : 
                    payment.status === 'FAILED' ? 'failed' : 'pending';
      await storage.updateTransactionStatus(payment.order_id, status);
    }
  }

  // Gift card event handlers
  private async handleGiftCardCreated(event: WebhookEvent) {
    const giftCard = event.data.object;
    console.log(`Gift card created via webhook: ${giftCard.id}, GAN: ${giftCard.gan}`);
  }

  private async handleGiftCardUpdated(event: WebhookEvent) {
    const giftCard = event.data.object;
    console.log(`Gift card updated: ${giftCard.id}, Balance: ${giftCard.balanceMoney?.amount}`);
    
    // Update gift card balance in database
    if (giftCard.gan) {
      const balance = giftCard.balanceMoney?.amount ? 
        (Number(giftCard.balanceMoney.amount) / 100).toString() : '0';
      
      const localCard = await storage.getGiftCardByCode(giftCard.gan);
      if (localCard) {
        await storage.updateGiftCardBalance(localCard.id, balance);
      }
    }
  }

  private async handleGiftCardActivityCreated(event: WebhookEvent) {
    const activity = event.data.object;
    console.log(`Gift card activity created: ${activity.type} for card ${activity.giftCardId}`);
    
    // Log activity in database
    const giftCard = await storage.getGiftCardById(activity.giftCardId);
    if (giftCard) {
      const amount = activity.giftCardBalanceMoney?.amount ?
        (Number(activity.giftCardBalanceMoney.amount) / 100).toString() : '0';
      
      await storage.createTransaction({
        giftCardId: giftCard.id,
        type: activity.type.toLowerCase(),
        amount: amount,
        balanceAfter: amount,
        description: `Square activity: ${activity.type}`,
        squareActivityId: activity.id
      });
    }
  }

  private async handleGiftCardCustomerLinked(event: WebhookEvent) {
    console.log(`Gift card linked to customer:`, event.data);
  }

  private async handleGiftCardCustomerUnlinked(event: WebhookEvent) {
    console.log(`Gift card unlinked from customer:`, event.data);
  }

  // Refund event handlers
  private async handleRefundCreated(event: WebhookEvent) {
    const refund = event.data.object;
    console.log(`Refund created: ${refund.id}, Amount: ${refund.amountMoney.amount}`);
    
    // Create fraud alert for monitoring (without giftCardId for general refunds)
    await storage.createFraudAlert({
      alertType: 'refund_created',
      description: `Refund created for ${refund.amountMoney.amount / 100} ${refund.amountMoney.currency}`,
      severity: 'low',
      metadata: { refundId: refund.id, paymentId: refund.paymentId }
    });
  }

  private async handleRefundUpdated(event: WebhookEvent) {
    const refund = event.data.object;
    console.log(`Refund updated: ${refund.id}, Status: ${refund.status}`);
  }

  // Dispute event handlers
  private async handleDisputeCreated(event: WebhookEvent) {
    const dispute = event.data.object;
    console.log(`Dispute created: ${dispute.id}, Amount: ${dispute.amountMoney.amount}`);
    
    // Create high-severity fraud alert (without giftCardId for general disputes)
    await storage.createFraudAlert({
      alertType: 'dispute_created',
      description: `Dispute created for ${dispute.amountMoney.amount / 100} ${dispute.amountMoney.currency}. Reason: ${dispute.reason}`,
      severity: 'high',
      metadata: { disputeId: dispute.id, paymentId: dispute.disputedPayment?.paymentId }
    });
  }

  private async handleDisputeUpdated(event: WebhookEvent) {
    const dispute = event.data.object;
    console.log(`Dispute updated: ${dispute.id}, State: ${dispute.state}`);
  }

  private async handleDisputeEvidenceCreated(event: WebhookEvent) {
    console.log(`Dispute evidence created:`, event.data);
  }

  // Order event handlers
  private async handleOrderCreated(event: WebhookEvent) {
    const { order_created } = event.data.object;
    console.log(`Order created: ${order_created.order_id}`);
    console.log(`  Location ID: ${order_created.location_id}`);
    console.log(`  State: ${order_created.state}`);
    console.log(`  Created at: ${order_created.created_at}`);
    console.log(`  Version: ${order_created.version}`);
    
    // Store order creation event for tracking
    await storage.createPaymentRecord({
      orderId: order_created.order_id,
      locationId: order_created.location_id,
      state: order_created.state,
      type: 'order_created',
      createdAt: order_created.created_at,
      metadata: event
    });
  }

  private async handleOrderUpdated(event: WebhookEvent) {
    const { order_updated } = event.data.object;
    console.log(`Order updated: ${order_updated.order_id}`);
    console.log(`  State: ${order_updated.state}`);
    console.log(`  Updated at: ${order_updated.updated_at}`);
    console.log(`  Version: ${order_updated.version}`);
    
    // Update order status
    if (order_updated.state === 'COMPLETED') {
      await storage.updateTransactionStatus(order_updated.order_id, 'completed');
    } else if (order_updated.state === 'CANCELED') {
      await storage.updateTransactionStatus(order_updated.order_id, 'failed');
    }
  }

  private async handleOrderFulfillmentUpdated(event: WebhookEvent) {
    const { order_fulfillment_updated } = event.data.object;
    console.log(`Order fulfillment updated: ${order_fulfillment_updated.order_id}`);
    console.log(`  Location ID: ${order_fulfillment_updated.location_id}`);
    console.log(`  State: ${order_fulfillment_updated.state}`);
    
    // Process fulfillment updates
    if (order_fulfillment_updated.fulfillment_update) {
      for (const update of order_fulfillment_updated.fulfillment_update) {
        console.log(`  Fulfillment ${update.fulfillment_uid}:`);
        console.log(`    Old state: ${update.old_state}`);
        console.log(`    New state: ${update.new_state}`);
        
        // Handle fulfillment state changes
        if (update.new_state === 'COMPLETED') {
          // Mark gift card as delivered
          console.log(`    Fulfillment completed for order ${order_fulfillment_updated.order_id}`);
        } else if (update.new_state === 'FAILED') {
          // Handle failed fulfillment (without giftCardId for general order alerts)
          await storage.createFraudAlert({
            alertType: 'fulfillment_failed',
            description: `Order fulfillment failed for order ${order_fulfillment_updated.order_id}`,
            severity: 'medium',
            metadata: { 
              orderId: order_fulfillment_updated.order_id,
              fulfillmentUid: update.fulfillment_uid
            }
          });
        }
      }
    }
  }

  private async handleOAuthRevoked(event: WebhookEvent) {
    const { revocation } = event.data.object;
    console.error('⚠️  OAuth authorization revoked!');
    console.log(`  Revoked at: ${revocation.revoked_at}`);
    console.log(`  Revoker type: ${revocation.revoker_type}`);
    console.log(`  Merchant ID: ${event.merchant_id}`);
    
    // Create critical alert for OAuth revocation (without giftCardId for system alerts)
    await storage.createFraudAlert({
      alertType: 'oauth_revoked',
      description: `Square OAuth authorization revoked by ${revocation.revoker_type}. Payment processing may be affected.`,
      severity: 'critical',
      metadata: {
        merchantId: event.merchant_id,
        revokedAt: revocation.revoked_at,
        revokerType: revocation.revoker_type,
        eventId: event.event_id
      }
    });
    
    // Log critical event for immediate attention
    console.error('CRITICAL: Square OAuth authorization has been revoked. Payment processing will fail until re-authorized.');
  }

  // Payout event handlers
  private async handlePayoutCreated(event: WebhookEvent) {
    const payout = event.data.object;
    console.log(`Payout created: ${payout.id}, Amount: ${payout.amountMoney.amount}`);
  }

  private async handlePayoutUpdated(event: WebhookEvent) {
    const payout = event.data.object;
    console.log(`Payout updated: ${payout.id}, Status: ${payout.status}`);
  }

  /**
   * Check if webhook service is properly configured
   */
  isConfigured(): boolean {
    return !!this.webhookSignatureKey;
  }
}