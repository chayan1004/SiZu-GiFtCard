import { 
  SquareClient, 
  SquareEnvironment,
  RefundPaymentRequest,
  RefundPaymentResponse,
  Refund,
  GetPaymentRefundResponse,
  ListPaymentRefundsResponse,
  Money
} from "square";
import { nanoid } from "nanoid";

export interface RefundCreationResult {
  success: boolean;
  refund?: Refund;
  refundId?: string;
  error?: string;
  errorCode?: string;
}

export interface RefundListResult {
  success: boolean;
  refunds?: Refund[];
  cursor?: string;
  error?: string;
}

export class SquareRefundsService {
  private client: SquareClient;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.warn("Square access token not provided. Refund features will be limited.");
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
    console.log(`Square Refunds Service initialized`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Refund a payment (full or partial)
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
    teamMemberId?: string
  ): Promise<RefundCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Refunds Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const refundsApi = this.client.refundsApi;
      const idempotencyKey = `refund-${nanoid()}`;

      const request: RefundPaymentRequest = {
        idempotencyKey,
        paymentId,
        reason
      };

      // Add amount for partial refund
      if (amount !== undefined) {
        request.amountMoney = {
          amount: BigInt(Math.round(amount * 100)),
          currency: 'USD'
        };
      }

      // Add team member for tracking
      if (teamMemberId) {
        request.teamMemberId = teamMemberId;
      }

      const response: RefundPaymentResponse = await refundsApi.refundPayment(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Refund creation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create refund',
          errorCode: error.code || 'REFUND_FAILED'
        };
      }

      if (!response.result.refund) {
        return {
          success: false,
          error: 'No refund returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const refund = response.result.refund;
      console.log(`Refund created successfully: ${refund.id}`);

      return {
        success: true,
        refund,
        refundId: refund.id
      };
    } catch (error: any) {
      console.error('Refund creation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create refund',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<RefundCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Refunds Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const refundsApi = this.client.refundsApi;
      const response: GetPaymentRefundResponse = await refundsApi.getPaymentRefund(refundId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to get refund',
          errorCode: error.code || 'NOT_FOUND'
        };
      }

      if (!response.result.refund) {
        return {
          success: false,
          error: 'Refund not found',
          errorCode: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        refund: response.result.refund,
        refundId: response.result.refund.id
      };
    } catch (error: any) {
      console.error('Get refund error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get refund',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * List refunds for a location
   */
  async listRefunds(
    beginTime?: string,
    endTime?: string,
    sortOrder?: 'ASC' | 'DESC',
    cursor?: string,
    limit?: number
  ): Promise<RefundListResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Refunds Service not initialized'
      };
    }

    try {
      const refundsApi = this.client.refundsApi;
      const response: ListPaymentRefundsResponse = await refundsApi.listPaymentRefunds(
        beginTime,
        endTime,
        sortOrder,
        cursor,
        this.locationId,
        'COMPLETED',
        undefined,
        limit
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to list refunds'
        };
      }

      return {
        success: true,
        refunds: response.result.refunds || [],
        cursor: response.result.cursor
      };
    } catch (error: any) {
      console.error('List refunds error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list refunds'
      };
    }
  }

  /**
   * Calculate refund fee for app fee refunds
   * When refunding a payment with app fees, the app fee is also refunded proportionally
   */
  calculateAppFeeRefund(
    originalAppFee: number,
    originalPaymentAmount: number,
    refundAmount: number
  ): number {
    // Calculate proportional app fee refund
    const refundPercentage = refundAmount / originalPaymentAmount;
    return Math.round(originalAppFee * refundPercentage * 100) / 100;
  }

  /**
   * Create an unlinked refund (refund without a payment)
   * Useful for cash refunds or refunds to different payment methods
   */
  async createUnlinkedRefund(
    amount: number,
    reason: string,
    locationId?: string
  ): Promise<RefundCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Refunds Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const refundsApi = this.client.refundsApi;
      const idempotencyKey = `unlinked-refund-${nanoid()}`;

      // For unlinked refunds, we don't specify a paymentId
      const request: RefundPaymentRequest = {
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency: 'USD'
        },
        reason,
        locationId: locationId || this.locationId
      };

      const response: RefundPaymentResponse = await refundsApi.refundPayment(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Unlinked refund creation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create unlinked refund',
          errorCode: error.code || 'REFUND_FAILED'
        };
      }

      if (!response.result.refund) {
        return {
          success: false,
          error: 'No refund returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const refund = response.result.refund;
      console.log(`Unlinked refund created successfully: ${refund.id}`);

      return {
        success: true,
        refund,
        refundId: refund.id
      };
    } catch (error: any) {
      console.error('Unlinked refund creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create unlinked refund',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }
}

// Export singleton instance
export const squareRefundsService = new SquareRefundsService();