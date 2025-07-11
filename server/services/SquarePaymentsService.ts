
import { SquareClient, SquareEnvironment } from "square";
import type { 
  Payment, 
  CreatePaymentRequest,
  CreateOrderRequest,
  Order,
  Money,
  OrderLineItem,
  CreatePaymentResponse,
  CreateOrderResponse
} from "square";
import { nanoid } from 'nanoid';

export interface PaymentMethod {
  type: 'card' | 'ach' | 'google_pay' | 'apple_pay' | 'cash_app_pay';
  sourceId: string;
  verificationToken?: string;
  deviceFingerprint?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  orderId?: string;
  referenceId?: string;
  note?: string;
  customerId?: string;
  buyerEmailAddress?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  cardDetails?: any;
  status: 'approved' | 'pending' | 'failed' | 'canceled';
  errorMessage?: string;
  errorCode?: string;
}

export class SquarePaymentsService {
  private client: SquareClient;
  private paymentsApi: any;
  private ordersApi: any;
  private locationId: string;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;

    if (!accessToken) {
      throw new Error("Square access token is required for payment processing");
    }

    this.client = new SquareClient({
      accessToken,
      environment,
    });

    this.paymentsApi = this.client.paymentsApi;
    this.ordersApi = this.client.ordersApi;
    this.locationId = process.env.SQUARE_LOCATION_ID || '';

    if (!this.locationId) {
      throw new Error("Square location ID is required");
    }
  }

  /**
   * Process a payment for gift card purchase or reload
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Create order first (recommended for gift cards)
      const order = await this.createOrder(request);
      
      // Process payment
      const payment = await this.createPayment(request, order.id);
      
      return {
        success: true,
        paymentId: payment.id,
        orderId: order.id,
        receiptNumber: payment.receiptNumber || payment.id,
        receiptUrl: payment.receiptUrl,
        cardDetails: this.extractCardDetails(payment),
        status: this.mapPaymentStatus(payment.status),
      };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return {
        success: false,
        status: 'failed',
        errorMessage: this.extractErrorMessage(error),
        errorCode: this.extractErrorCode(error),
      };
    }
  }

  /**
   * Create an order for gift card purchase
   */
  private async createOrder(request: PaymentRequest): Promise<Order> {
    const orderRequest: CreateOrderRequest = {
      order: {
        locationId: this.locationId,
        referenceId: request.referenceId || `gift-card-${nanoid(10)}`,
        lineItems: [
          {
            name: 'SiZu Gift Card',
            quantity: '1',
            note: request.note || 'Digital Gift Card',
            basePriceMoney: {
              amount: BigInt(Math.round(request.amount * 100)),
              currency: request.currency || 'USD',
            },
            variationType: 'ITEM_VARIATION',
          } as OrderLineItem
        ],
        netAmounts: {
          totalMoney: {
            amount: BigInt(Math.round(request.amount * 100)),
            currency: request.currency || 'USD',
          },
          taxMoney: {
            amount: BigInt(0),
            currency: request.currency || 'USD',
          },
          discountMoney: {
            amount: BigInt(0),
            currency: request.currency || 'USD',
          },
          tipMoney: {
            amount: BigInt(0),
            currency: request.currency || 'USD',
          },
          serviceChargeMoney: {
            amount: BigInt(0),
            currency: request.currency || 'USD',
          },
        },
      },
      idempotencyKey: `order-${request.referenceId || nanoid(10)}-${Date.now()}`,
    };

    const response: CreateOrderResponse = await this.ordersApi.createOrder(orderRequest);
    
    if (response.result.errors) {
      throw new Error(`Order creation failed: ${response.result.errors.map(e => e.detail).join(', ')}`);
    }

    if (!response.result.order) {
      throw new Error("Order creation failed: No order returned");
    }

    return response.result.order;
  }

  /**
   * Create payment for the order
   */
  private async createPayment(request: PaymentRequest, orderId: string): Promise<Payment> {
    const paymentRequest: CreatePaymentRequest = {
      sourceId: request.paymentMethod.sourceId,
      idempotencyKey: `payment-${orderId}-${Date.now()}`,
      amountMoney: {
        amount: BigInt(Math.round(request.amount * 100)),
        currency: request.currency || 'USD',
      },
      orderId,
      autocomplete: true,
      locationId: this.locationId,
      referenceId: request.referenceId,
      note: request.note,
      customerId: request.customerId,
      buyerEmailAddress: request.buyerEmailAddress,
    };

    // Add verification token for card payments
    if (request.paymentMethod.verificationToken) {
      paymentRequest.verificationToken = request.paymentMethod.verificationToken;
    }

    // Add billing/shipping addresses if provided
    if (request.billingAddress) {
      paymentRequest.billingAddress = request.billingAddress;
    }
    if (request.shippingAddress) {
      paymentRequest.shippingAddress = request.shippingAddress;
    }

    const response: CreatePaymentResponse = await this.paymentsApi.createPayment(paymentRequest);
    
    if (response.result.errors) {
      throw new Error(`Payment failed: ${response.result.errors.map(e => e.detail).join(', ')}`);
    }

    if (!response.result.payment) {
      throw new Error("Payment failed: No payment returned");
    }

    return response.result.payment;
  }

  /**
   * Process ACH payment
   */
  async processACHPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // ACH payments require special handling
      const paymentRequest: CreatePaymentRequest = {
        sourceId: request.paymentMethod.sourceId,
        idempotencyKey: `ach-payment-${nanoid(10)}-${Date.now()}`,
        amountMoney: {
          amount: BigInt(Math.round(request.amount * 100)),
          currency: request.currency || 'USD',
        },
        autocomplete: false, // ACH payments are async
        locationId: this.locationId,
        referenceId: request.referenceId,
        note: request.note,
        customerId: request.customerId,
        buyerEmailAddress: request.buyerEmailAddress,
      };

      const response: CreatePaymentResponse = await this.paymentsApi.createPayment(paymentRequest);
      
      if (response.result.errors) {
        throw new Error(`ACH Payment failed: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      const payment = response.result.payment!;
      
      return {
        success: true,
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber || payment.id,
        status: 'pending', // ACH payments are initially pending
      };
    } catch (error: any) {
      console.error("ACH payment processing error:", error);
      return {
        success: false,
        status: 'failed',
        errorMessage: this.extractErrorMessage(error),
        errorCode: this.extractErrorCode(error),
      };
    }
  }

  /**
   * Process digital wallet payments (Google Pay, Apple Pay)
   */
  async processDigitalWalletPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Digital wallet payments use the same flow as card payments
      // but with specific source types
      return await this.processPayment(request);
    } catch (error: any) {
      console.error("Digital wallet payment error:", error);
      return {
        success: false,
        status: 'failed',
        errorMessage: this.extractErrorMessage(error),
        errorCode: this.extractErrorCode(error),
      };
    }
  }

  /**
   * Process Cash App Pay payment
   */
  async processCashAppPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Cash App Pay requires specific handling
      const paymentRequest: CreatePaymentRequest = {
        sourceId: request.paymentMethod.sourceId,
        idempotencyKey: `cashapp-payment-${nanoid(10)}-${Date.now()}`,
        amountMoney: {
          amount: BigInt(Math.round(request.amount * 100)),
          currency: request.currency || 'USD',
        },
        autocomplete: true,
        locationId: this.locationId,
        referenceId: request.referenceId,
        note: request.note,
        customerId: request.customerId,
        buyerEmailAddress: request.buyerEmailAddress,
        cashDetails: {
          buyerSuppliedMoney: {
            amount: BigInt(Math.round(request.amount * 100)),
            currency: request.currency || 'USD',
          },
        },
      };

      const response: CreatePaymentResponse = await this.paymentsApi.createPayment(paymentRequest);
      
      if (response.result.errors) {
        throw new Error(`Cash App Pay failed: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      const payment = response.result.payment!;
      
      return {
        success: true,
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber || payment.id,
        status: this.mapPaymentStatus(payment.status),
      };
    } catch (error: any) {
      console.error("Cash App Pay processing error:", error);
      return {
        success: false,
        status: 'failed',
        errorMessage: this.extractErrorMessage(error),
        errorCode: this.extractErrorCode(error),
      };
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const response = await this.paymentsApi.getPayment(paymentId);
      return response.result.payment || null;
    } catch (error) {
      console.error("Error retrieving payment:", error);
      return null;
    }
  }

  /**
   * Cancel a payment (if possible)
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await this.paymentsApi.cancelPayment(paymentId, {
        idempotencyKey: `cancel-${paymentId}-${Date.now()}`,
      });
      return !response.result.errors;
    } catch (error) {
      console.error("Error canceling payment:", error);
      return false;
    }
  }

  /**
   * Complete a payment (for async payments like ACH)
   */
  async completePayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await this.paymentsApi.completePayment(paymentId, {
        idempotencyKey: `complete-${paymentId}-${Date.now()}`,
      });
      
      if (response.result.errors) {
        throw new Error(`Payment completion failed: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      const payment = response.result.payment!;
      
      return {
        success: true,
        paymentId: payment.id,
        status: this.mapPaymentStatus(payment.status),
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        errorMessage: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Extract card details for receipt (non-sensitive info only)
   */
  private extractCardDetails(payment: Payment): any {
    if (!payment.cardDetails) return null;
    
    return {
      brand: payment.cardDetails.card?.cardBrand,
      last4: payment.cardDetails.card?.last4,
      expMonth: payment.cardDetails.card?.expMonth,
      expYear: payment.cardDetails.card?.expYear,
      entryMethod: payment.cardDetails.entryMethod,
      fingerprint: payment.cardDetails.card?.fingerprint,
    };
  }

  /**
   * Map Square payment status to our status
   */
  private mapPaymentStatus(status?: string): 'approved' | 'pending' | 'failed' | 'canceled' {
    switch (status) {
      case 'COMPLETED':
        return 'approved';
      case 'APPROVED':
        return 'approved';
      case 'PENDING':
        return 'pending';
      case 'CANCELED':
        return 'canceled';
      case 'FAILED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Extract error message from Square API error
   */
  private extractErrorMessage(error: any): string {
    if (error.errors && error.errors.length > 0) {
      return error.errors[0].detail || error.errors[0].code || 'Payment processing failed';
    }
    return error.message || 'Payment processing failed';
  }

  /**
   * Extract error code from Square API error
   */
  private extractErrorCode(error: any): string {
    if (error.errors && error.errors.length > 0) {
      return error.errors[0].code || 'UNKNOWN_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Validate payment method type
   */
  isValidPaymentMethod(type: string): boolean {
    const validTypes = ['card', 'ach', 'google_pay', 'apple_pay', 'cash_app_pay'];
    return validTypes.includes(type);
  }

  /**
   * Check if Square integration is available
   */
  isAvailable(): boolean {
    return !!process.env.SQUARE_ACCESS_TOKEN && !!this.locationId;
  }
}
