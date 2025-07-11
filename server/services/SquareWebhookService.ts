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
    const payment = event.data.object;
    console.log(`Payment created: ${payment.id}, Amount: ${payment.amountMoney.amount}`);
    
    // Update transaction status in database
    if (payment.orderId) {
      await storage.updateTransactionStatus(payment.orderId, 'completed');
    }
  }

  private async handlePaymentUpdated(event: WebhookEvent) {
    const payment = event.data.object;
    console.log(`Payment updated: ${payment.id}, Status: ${payment.status}`);
    
    // Update transaction status based on payment status
    if (payment.orderId) {
      const status = payment.status === 'COMPLETED' ? 'completed' : 
                    payment.status === 'FAILED' ? 'failed' : 'pending';
      await storage.updateTransactionStatus(payment.orderId, status);
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
    
    // Create fraud alert for monitoring
    await storage.createFraudAlert({
      giftCardId: '',
      type: 'refund_created',
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
    
    // Create high-severity fraud alert
    await storage.createFraudAlert({
      giftCardId: '',
      type: 'dispute_created',
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
    const order = event.data.object;
    console.log(`Order created: ${order.id}, Total: ${order.totalMoney?.amount}`);
  }

  private async handleOrderUpdated(event: WebhookEvent) {
    const order = event.data.object;
    console.log(`Order updated: ${order.id}, State: ${order.state}`);
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