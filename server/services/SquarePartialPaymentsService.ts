import { 
  SquareClient, 
  SquareEnvironment,
  CreatePaymentRequest,
  CreatePaymentResponse,
  Payment,
  Money
} from "square";
import { nanoid } from "nanoid";

export interface PartialPaymentResult {
  success: boolean;
  payment?: Payment;
  paymentId?: string;
  approvedAmount?: number;
  requestedAmount?: number;
  isPartial?: boolean;
  error?: string;
  errorCode?: string;
}

export interface MultiplePaymentSource {
  sourceId: string;
  amount?: number; // Optional - if not specified, will use remaining balance
  type: 'gift_card' | 'card' | 'wallet';
}

export class SquarePartialPaymentsService {
  private client: SquareClient;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.warn("Square access token not provided. Partial payment features will be limited.");
      return;
    }

    this.locationId = process.env.SQUARE_LOCATION_ID || '';

    const environment = process.env.SQUARE_ACCESS_TOKEN.startsWith('sandbox') 
      ? SquareEnvironment.Sandbox 
      : SquareEnvironment.Production;

    this.client = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment
    });

    this.isInitialized = true;
    console.log(`Square Partial Payments Service initialized`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a payment with partial authorization support
   * This is useful when using gift cards that might not cover the full amount
   */
  async createPartialPayment(
    sourceId: string,
    requestedAmount: number,
    options?: {
      customerId?: string;
      orderId?: string;
      referenceId?: string;
      note?: string;
      statementDescriptionIdentifier?: string;
      tipAmount?: number;
    }
  ): Promise<PartialPaymentResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Partial Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const paymentsApi = this.client.paymentsApi;
      const idempotencyKey = `partial-payment-${nanoid()}`;

      const request: CreatePaymentRequest = {
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(requestedAmount * 100)),
          currency: 'USD'
        },
        locationId: this.locationId,
        // Enable partial authorization - critical for gift card payments
        acceptPartialAuthorization: true,
        // Auto-capture the payment
        autocomplete: true,
        customerId: options?.customerId,
        orderId: options?.orderId,
        referenceId: options?.referenceId,
        note: options?.note,
        statementDescriptionIdentifier: options?.statementDescriptionIdentifier
      };

      // Add tip if specified
      if (options?.tipAmount && options.tipAmount > 0) {
        request.tipMoney = {
          amount: BigInt(Math.round(options.tipAmount * 100)),
          currency: 'USD'
        };
      }

      const response: CreatePaymentResponse = await paymentsApi.createPayment(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Partial payment error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create partial payment',
          errorCode: error.code || 'PAYMENT_FAILED',
          requestedAmount
        };
      }

      if (!response.result.payment) {
        return {
          success: false,
          error: 'No payment returned from Square',
          errorCode: 'INVALID_RESPONSE',
          requestedAmount
        };
      }

      const payment = response.result.payment;
      const approvedAmount = payment.approvedMoney 
        ? Number(payment.approvedMoney.amount) / 100 
        : payment.amountMoney 
        ? Number(payment.amountMoney.amount) / 100 
        : 0;

      const isPartial = approvedAmount < requestedAmount;

      console.log(`Payment created: ${payment.id}, Requested: $${requestedAmount}, Approved: $${approvedAmount}, Partial: ${isPartial}`);

      return {
        success: true,
        payment,
        paymentId: payment.id,
        requestedAmount,
        approvedAmount,
        isPartial
      };
    } catch (error: any) {
      console.error('Partial payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create partial payment',
        errorCode: 'UNKNOWN_ERROR',
        requestedAmount
      };
    }
  }

  /**
   * Process multiple payment sources for a single transaction
   * Useful for combining gift cards with credit cards
   */
  async processMultiplePaymentSources(
    sources: MultiplePaymentSource[],
    totalAmount: number,
    options?: {
      orderId?: string;
      customerId?: string;
      referenceId?: string;
    }
  ): Promise<{
    success: boolean;
    payments: PartialPaymentResult[];
    totalPaid: number;
    remainingBalance: number;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return {
        success: false,
        payments: [],
        totalPaid: 0,
        remainingBalance: totalAmount,
        error: 'Square Partial Payments Service not initialized'
      };
    }

    const payments: PartialPaymentResult[] = [];
    let remainingAmount = totalAmount;
    let totalPaid = 0;

    try {
      // Process each payment source
      for (const source of sources) {
        if (remainingAmount <= 0) {
          break; // All paid
        }

        // Determine amount to charge for this source
        const amountToCharge = source.amount 
          ? Math.min(source.amount, remainingAmount) 
          : remainingAmount;

        // Create payment with partial authorization
        const paymentResult = await this.createPartialPayment(
          source.sourceId,
          amountToCharge,
          {
            orderId: options?.orderId,
            customerId: options?.customerId,
            referenceId: options?.referenceId,
            note: `Payment ${payments.length + 1} of order ${options?.orderId || 'N/A'} - ${source.type}`
          }
        );

        payments.push(paymentResult);

        if (paymentResult.success && paymentResult.approvedAmount) {
          totalPaid += paymentResult.approvedAmount;
          remainingAmount -= paymentResult.approvedAmount;
        }

        // If payment failed or was insufficient, continue to next source
        if (!paymentResult.success || (paymentResult.isPartial && source.type === 'gift_card')) {
          console.log(`Gift card ${source.sourceId} had insufficient funds or failed. Moving to next payment source.`);
        }
      }

      return {
        success: remainingAmount <= 0,
        payments,
        totalPaid,
        remainingBalance: Math.max(0, remainingAmount)
      };
    } catch (error: any) {
      console.error('Multiple payment sources error:', error);
      return {
        success: false,
        payments,
        totalPaid,
        remainingBalance: remainingAmount,
        error: error.message || 'Failed to process multiple payment sources'
      };
    }
  }

  /**
   * Calculate how to split a payment across multiple gift cards
   */
  calculatePaymentSplit(
    giftCardBalances: { id: string; balance: number }[],
    totalAmount: number
  ): {
    splits: { id: string; amount: number }[];
    totalCovered: number;
    remainingAmount: number;
  } {
    const splits: { id: string; amount: number }[] = [];
    let remaining = totalAmount;

    // Sort gift cards by balance (highest first for efficiency)
    const sortedCards = [...giftCardBalances].sort((a, b) => b.balance - a.balance);

    for (const card of sortedCards) {
      if (remaining <= 0) break;

      const amountToUse = Math.min(card.balance, remaining);
      if (amountToUse > 0) {
        splits.push({
          id: card.id,
          amount: amountToUse
        });
        remaining -= amountToUse;
      }
    }

    return {
      splits,
      totalCovered: totalAmount - remaining,
      remainingAmount: Math.max(0, remaining)
    };
  }
}

// Export singleton instance
export const squarePartialPaymentsService = new SquarePartialPaymentsService();