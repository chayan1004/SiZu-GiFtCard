import { 
  SquareClient, 
  SquareEnvironment,
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderLineItem,
  Money
} from "square";
import { nanoid } from 'nanoid';

export interface GiftCardOrderRequest {
  amount: number;
  currency?: string;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  design?: string;
  referenceId?: string;
}

export interface OrderResult {
  success: boolean;
  order?: Order;
  orderId?: string;
  lineItemUid?: string;
  error?: string;
  errorCode?: string;
}

export class SquareOrdersService {
  private client: SquareClient;
  private ordersApi: any;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;

    if (!accessToken) {
      console.warn("Square access token not provided. Orders API will be unavailable.");
      return;
    }

    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    if (!this.locationId) {
      console.warn("Square location ID not provided. Orders API will be unavailable.");
      return;
    }

    try {
      this.client = new SquareClient({
        accessToken,
        environment,
      });

      this.ordersApi = this.client.ordersApi;
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Square Orders API:", error);
    }
  }

  /**
   * Create a gift card order following Square's recommended flow
   */
  async createGiftCardOrder(request: GiftCardOrderRequest): Promise<OrderResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Orders API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const idempotencyKey = `order-${request.referenceId || nanoid(10)}-${Date.now()}`;
      
      // Build order metadata
      const metadata: Record<string, string> = {
        type: 'GIFT_CARD',
        design: request.design || 'classic'
      };
      
      if (request.recipientEmail) metadata.recipient_email = request.recipientEmail;
      if (request.recipientName) metadata.recipient_name = request.recipientName;
      if (request.senderName) metadata.sender_name = request.senderName;
      if (request.message) metadata.message = request.message;

      // Create line item for gift card
      const lineItem: OrderLineItem = {
        name: 'Digital Gift Card',
        quantity: '1',
        itemType: 'GIFT_CARD',
        basePriceMoney: {
          amount: BigInt(Math.round(request.amount * 100)),
          currency: request.currency || 'USD'
        },
        note: `Gift Card - ${request.design || 'Classic'} Design`,
        metadata
      };

      const orderRequest: CreateOrderRequest = {
        order: {
          locationId: this.locationId,
          referenceId: request.referenceId || `gc-order-${nanoid(10)}`,
          lineItems: [lineItem],
          metadata: {
            ...metadata,
            created_at: new Date().toISOString()
          }
        },
        idempotencyKey
      };

      console.log('Creating Square order for gift card...');
      const response: CreateOrderResponse = await this.ordersApi.createOrder(orderRequest);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Square API error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create order',
          errorCode: error.code || 'ORDER_CREATION_FAILED'
        };
      }

      if (!response.result.order) {
        return {
          success: false,
          error: 'No order returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const order = response.result.order;
      const lineItemUid = order.lineItems?.[0]?.uid;

      if (!lineItemUid) {
        return {
          success: false,
          error: 'No line item UID in order',
          errorCode: 'INVALID_ORDER_STRUCTURE'
        };
      }

      console.log(`Square order created successfully: ${order.id}`);
      
      return {
        success: true,
        order,
        orderId: order.id,
        lineItemUid
      };
    } catch (error: any) {
      console.error('Order creation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create order',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Retrieve order details
   */
  async retrieveOrder(orderId: string): Promise<OrderResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Orders API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const response = await this.ordersApi.retrieveOrder(orderId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to retrieve order',
          errorCode: error.code || 'ORDER_RETRIEVAL_FAILED'
        };
      }

      return {
        success: true,
        order: response.result.order,
        orderId: response.result.order?.id
      };
    } catch (error: any) {
      console.error('Order retrieval error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to retrieve order',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Update order with fulfillment details
   */
  async updateOrderFulfillment(orderId: string, giftCardId: string, giftCardGAN: string): Promise<OrderResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Orders API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      // First retrieve the current order
      const retrieveResult = await this.retrieveOrder(orderId);
      if (!retrieveResult.success || !retrieveResult.order) {
        return retrieveResult;
      }

      const order = retrieveResult.order;
      const updatedMetadata = {
        ...order.metadata,
        gift_card_id: giftCardId,
        gift_card_gan: giftCardGAN,
        fulfilled_at: new Date().toISOString()
      };

      const updateRequest = {
        order: {
          locationId: this.locationId,
          version: order.version,
          metadata: updatedMetadata,
          state: 'COMPLETED' as const
        },
        idempotencyKey: `update-${orderId}-${Date.now()}`
      };

      const response = await this.ordersApi.updateOrder(orderId, updateRequest);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to update order',
          errorCode: error.code || 'ORDER_UPDATE_FAILED'
        };
      }

      return {
        success: true,
        order: response.result.order,
        orderId: response.result.order?.id
      };
    } catch (error: any) {
      console.error('Order update error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to update order',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}