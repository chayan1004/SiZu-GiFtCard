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
        case 'gift_card.activity.updated':
          await this.handleGiftCardActivityUpdated(event);
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

        // Online Checkout events
        case 'online_checkout.location_settings.updated':
          await this.handleOnlineCheckoutLocationSettingsUpdated(event);
          break;
        case 'online_checkout.merchant_settings.updated':
          await this.handleOnlineCheckoutMerchantSettingsUpdated(event);
          break;

        // Customer events
        case 'customer.created':
          await this.handleCustomerCreated(event);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(event);
          break;
        case 'customer.deleted':
          await this.handleCustomerDeleted(event);
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
    // Gift card data is nested inside data.object.gift_card
    const giftCard = event.data.object.gift_card;
    console.log(`Gift card created via webhook: ${giftCard.id}`);
    console.log(`  GAN: ${giftCard.gan}`);
    console.log(`  Type: ${giftCard.type}`);
    console.log(`  State: ${giftCard.state}`);
    console.log(`  Balance: $${giftCard.balance_money.amount / 100} ${giftCard.balance_money.currency}`);
  }

  private async handleGiftCardUpdated(event: WebhookEvent) {
    // Gift card data is nested inside data.object.gift_card
    const giftCard = event.data.object.gift_card;
    console.log(`Gift card updated: ${giftCard.id}, Balance: $${giftCard.balance_money.amount / 100}`);
    
    // Update gift card balance in database
    if (giftCard.gan) {
      const balance = giftCard.balance_money?.amount ? 
        (Number(giftCard.balance_money.amount) / 100).toString() : '0';
      
      const localCard = await storage.getGiftCardByCode(giftCard.gan);
      if (localCard) {
        await storage.updateGiftCardBalance(localCard.id, balance);
      }
    }
  }

  private async handleGiftCardActivityCreated(event: WebhookEvent) {
    // Gift card activity data is nested inside data.object.gift_card_activity
    const activity = event.data.object.gift_card_activity;
    console.log(`Gift card activity created: ${activity.type} for card ${activity.gift_card_gan}`);
    console.log(`  Activity ID: ${activity.id}`);
    console.log(`  New Balance: $${activity.gift_card_balance_money.amount / 100}`);
    
    if (activity.activate_activity_details) {
      console.log(`  Activation Amount: $${activity.activate_activity_details.amount_money.amount / 100}`);
      console.log(`  Order ID: ${activity.activate_activity_details.order_id}`);
    }
    
    // Log activity in database
    if (activity.gift_card_gan) {
      const localCard = await storage.getGiftCardByCode(activity.gift_card_gan);
      if (localCard) {
        const amount = activity.gift_card_balance_money?.amount ?
          (Number(activity.gift_card_balance_money.amount) / 100).toString() : '0';
        
        await storage.createTransaction({
          giftCardId: localCard.id,
          type: activity.type.toLowerCase(),
          amount: amount,
          balanceAfter: amount,
          notes: `Square activity: ${activity.type}, Activity ID: ${activity.id}`,
          squareTransactionId: activity.id
        });
      }
    }
  }

  private async handleGiftCardActivityUpdated(event: WebhookEvent) {
    // Gift card activity data is nested inside data.object.gift_card_activity
    const activity = event.data.object.gift_card_activity;
    console.log(`Gift card activity updated: ${activity.type} for card ${activity.gift_card_gan}`);
    console.log(`  Activity ID: ${activity.id}`);
    console.log(`  New Balance: $${activity.gift_card_balance_money.amount / 100}`);
    
    if (activity.import_activity_details) {
      console.log(`  Import Amount: $${activity.import_activity_details.amount_money.amount / 100}`);
    }
    
    // Update balance in database
    if (activity.gift_card_gan) {
      const localCard = await storage.getGiftCardByCode(activity.gift_card_gan);
      if (localCard) {
        const balance = activity.gift_card_balance_money?.amount ?
          (Number(activity.gift_card_balance_money.amount) / 100).toString() : '0';
        await storage.updateGiftCardBalance(localCard.id, balance);
      }
    }
  }

  private async handleGiftCardCustomerLinked(event: WebhookEvent) {
    const giftCard = event.data.object.gift_card;
    const linkedCustomerId = event.data.object.linked_customer_id;
    
    console.log(`Gift card linked to customer:`, event.data);
    console.log(`  Gift Card ID: ${giftCard.id}`);
    console.log(`  GAN: ${giftCard.gan}`);
    console.log(`  Linked Customer ID: ${linkedCustomerId}`);
    console.log(`  Customer IDs: ${giftCard.customer_ids?.join(', ')}`);
  }

  private async handleGiftCardCustomerUnlinked(event: WebhookEvent) {
    const giftCard = event.data.object.gift_card;
    const unlinkedCustomerId = event.data.object.unlinked_customer_id;
    
    console.log(`Gift card unlinked from customer:`, event.data);
    console.log(`  Gift Card ID: ${giftCard.id}`);
    console.log(`  GAN: ${giftCard.gan}`);
    console.log(`  Unlinked Customer ID: ${unlinkedCustomerId}`);
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

  // Online Checkout event handlers
  private async handleOnlineCheckoutLocationSettingsUpdated(event: WebhookEvent) {
    const settings = event.data.object.location_settings;
    console.log(`Online checkout location settings updated for location: ${settings.location_id}`);
    console.log(`  Branding:`);
    console.log(`    Button color: ${settings.branding.button_color}`);
    console.log(`    Button shape: ${settings.branding.button_shape}`);
    console.log(`    Header type: ${settings.branding.header_type}`);
    console.log(`  Coupons enabled: ${settings.coupons.enabled}`);
    console.log(`  Customer notes enabled: ${settings.customer_notes_enabled}`);
    
    if (settings.tipping) {
      console.log(`  Tipping:`);
      console.log(`    Default percent: ${settings.tipping.default_percent}%`);
      console.log(`    Smart tipping enabled: ${settings.tipping.smart_tipping_enabled}`);
      console.log(`    Percentages: ${settings.tipping.percentages.join('%, ')}%`);
      
      if (settings.tipping.smart_tips) {
        console.log(`    Smart tips:`);
        settings.tipping.smart_tips.forEach((tip: any) => {
          console.log(`      $${tip.amount / 100} ${tip.currency}`);
        });
      }
    }
    
    console.log(`  Updated at: ${settings.updated_at}`);
  }

  private async handleOnlineCheckoutMerchantSettingsUpdated(event: WebhookEvent) {
    const settings = event.data.object.merchant_settings;
    console.log(`Online checkout merchant settings updated`);
    console.log(`  Payment methods:`);
    
    if (settings.payment_methods.apple_pay) {
      console.log(`    Apple Pay enabled: ${settings.payment_methods.apple_pay.enabled}`);
    }
    
    if (settings.payment_methods.google_pay) {
      console.log(`    Google Pay enabled: ${settings.payment_methods.google_pay.enabled}`);
    }
    
    if (settings.payment_methods.cash_app) {
      console.log(`    Cash App enabled: ${settings.payment_methods.cash_app.enabled}`);
    }
    
    if (settings.payment_methods.afterpay_clearpay) {
      const afterpay = settings.payment_methods.afterpay_clearpay;
      console.log(`    Afterpay/Clearpay enabled: ${afterpay.enabled}`);
      
      if (afterpay.item_eligibility_range) {
        console.log(`      Item range: $${afterpay.item_eligibility_range.min.amount / 100} - $${afterpay.item_eligibility_range.max.amount / 100}`);
      }
      
      if (afterpay.order_eligibility_range) {
        console.log(`      Order range: $${afterpay.order_eligibility_range.min.amount / 100} - $${afterpay.order_eligibility_range.max.amount / 100}`);
      }
    }
    
    console.log(`  Updated at: ${settings.updated_at}`);
  }

  // Customer event handlers
  private async handleCustomerCreated(event: WebhookEvent) {
    const customer = event.data.object.customer;
    console.log(`Customer created: ${customer.id}`);
    console.log(`  Name: ${customer.given_name} ${customer.family_name}`);
    console.log(`  Email: ${customer.email_address}`);
    console.log(`  Phone: ${customer.phone_number}`);
    console.log(`  Creation Source: ${customer.creation_source}`);
    
    if (customer.address) {
      console.log(`  Address: ${customer.address.address_line_1}, ${customer.address.locality}, ${customer.address.administrative_district_level_1} ${customer.address.postal_code}`);
    }
    
    if (customer.birthday) {
      console.log(`  Birthday: ${customer.birthday}`);
    }
    
    if (customer.group_ids && customer.group_ids.length > 0) {
      console.log(`  Groups: ${customer.group_ids.join(', ')}`);
    }
    
    console.log(`  Created at: ${customer.created_at}`);
  }

  private async handleCustomerUpdated(event: WebhookEvent) {
    const customer = event.data.object.customer;
    console.log(`Customer updated: ${customer.id}`);
    console.log(`  Name: ${customer.given_name} ${customer.family_name}`);
    console.log(`  Email: ${customer.email_address}`);
    console.log(`  Phone: ${customer.phone_number}`);
    console.log(`  Version: ${customer.version}`);
    console.log(`  Updated at: ${customer.updated_at}`);
    
    // Log the customer in our database if they have an email
    if (customer.email_address) {
      const existingUser = await storage.getUserByEmail(customer.email_address);
      if (existingUser && !existingUser.squareCustomerId) {
        await storage.updateUserSquareCustomerId(existingUser.id, customer.id);
        console.log(`  Updated local user ${existingUser.id} with Square customer ID`);
      }
    }
  }

  private async handleCustomerDeleted(event: WebhookEvent) {
    const customerId = event.data.id;
    const customer = event.data.object.customer;
    const isDeleted = event.data.deleted;
    
    console.log(`Customer deleted: ${customerId}`);
    console.log(`  Deleted status: ${isDeleted}`);
    
    if (customer) {
      console.log(`  Last known details:`);
      console.log(`    Name: ${customer.given_name} ${customer.family_name}`);
      console.log(`    Email: ${customer.email_address}`);
      console.log(`    Version: ${customer.version}`);
    }
  }

  /**
   * Check if webhook service is properly configured
   */
  isConfigured(): boolean {
    return !!this.webhookSignatureKey;
  }
}