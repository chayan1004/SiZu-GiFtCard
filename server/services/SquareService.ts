import { 
  SquareClient, 
  SquareEnvironment,
  GiftCard,
  GiftCardActivity,
  CreateGiftCardRequest,
  CreateGiftCardResponse,
  CreateGiftCardActivityRequest,
  CreateGiftCardActivityResponse,
  RetrieveGiftCardResponse,
  ListGiftCardActivitiesResponse
} from "square";
import { nanoid } from 'nanoid';

export interface GiftCardCreationResult {
  success: boolean;
  giftCard?: GiftCard;
  giftCardId?: string;
  gan?: string;
  error?: string;
  errorCode?: string;
}

export interface GiftCardActivationResult {
  success: boolean;
  activity?: GiftCardActivity;
  balanceAmount?: number;
  error?: string;
  errorCode?: string;
}

export interface GiftCardActivityResult {
  success: boolean;
  activity?: GiftCardActivity;
  balanceAmount?: number;
  error?: string;
  errorCode?: string;
}

export class SquareService {
  private client: SquareClient;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;

    if (!accessToken) {
      console.warn("Square access token not provided. Gift card features will be limited.");
      return;
    }

    this.locationId = process.env.SQUARE_LOCATION_ID || '';
    if (!this.locationId) {
      console.warn("Square location ID not provided. Gift card features will be limited.");
      return;
    }

    try {
      this.client = new SquareClient({
        accessToken,
        environment,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Square client:", error);
    }
  }

  /**
   * Create a gift card (without activation - requires separate activation call)
   */
  async createGiftCard(externalId: string): Promise<GiftCardCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const giftCardsApi = this.client.giftCardsApi;
      const idempotencyKey = `gift-card-${externalId}-${Date.now()}`;

      const request: CreateGiftCardRequest = {
        idempotencyKey,
        locationId: this.locationId,
        giftCard: {
          type: 'DIGITAL' as const
        }
      };

      console.log('Creating Square gift card...');
      const response: CreateGiftCardResponse = await giftCardsApi.createGiftCard(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Square API error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create gift card',
          errorCode: error.code || 'GIFT_CARD_CREATION_FAILED'
        };
      }

      if (!response.result.giftCard) {
        return {
          success: false,
          error: 'No gift card returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const giftCard = response.result.giftCard;
      console.log(`Square gift card created: ${giftCard.id}, GAN: ${giftCard.gan}`);

      return {
        success: true,
        giftCard,
        giftCardId: giftCard.id,
        gan: giftCard.gan
      };
    } catch (error: any) {
      console.error('Gift card creation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create gift card',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Activate a gift card with an order (following Square's recommended flow)
   */
  async activateGiftCard(giftCardId: string, orderId: string, lineItemUid: string): Promise<GiftCardActivationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      const idempotencyKey = `activate-${giftCardId}-${Date.now()}`;

      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'ACTIVATE' as const,
          locationId: this.locationId,
          giftCardId,
          activateActivityDetails: {
            orderId,
            lineItemUid
          }
        }
      };

      console.log(`Activating gift card ${giftCardId} with order ${orderId}`);
      const response: CreateGiftCardActivityResponse = await giftCardActivitiesApi.createGiftCardActivity(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Square API error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to activate gift card',
          errorCode: error.code || 'ACTIVATION_FAILED'
        };
      }

      if (!response.result.giftCardActivity) {
        return {
          success: false,
          error: 'No activity returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const activity = response.result.giftCardActivity;
      const balanceAmount = activity.giftCardBalanceMoney?.amount;

      console.log(`Gift card activated successfully. Balance: ${balanceAmount ? Number(balanceAmount) / 100 : 0}`);

      return {
        success: true,
        activity,
        balanceAmount: balanceAmount ? Number(balanceAmount) / 100 : 0
      };
    } catch (error: any) {
      console.error('Gift card activation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to activate gift card',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Redeem (use) a gift card
   */
  async redeemGiftCard(giftCardId: string, amount: number): Promise<GiftCardActivityResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      const idempotencyKey = `redeem-${giftCardId}-${Date.now()}`;

      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'REDEEM' as const,
          locationId: this.locationId,
          giftCardId,
          redeemActivityDetails: {
            amountMoney: {
              amount: BigInt(Math.round(amount * 100)),
              currency: 'USD'
            }
          }
        }
      };

      console.log(`Redeeming ${amount} from gift card ${giftCardId}`);
      const response: CreateGiftCardActivityResponse = await giftCardActivitiesApi.createGiftCardActivity(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Square API error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to redeem gift card',
          errorCode: error.code || 'REDEMPTION_FAILED'
        };
      }

      if (!response.result.giftCardActivity) {
        return {
          success: false,
          error: 'No activity returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const activity = response.result.giftCardActivity;
      const balanceAmount = activity.giftCardBalanceMoney?.amount;

      console.log(`Gift card redeemed successfully. Remaining balance: ${balanceAmount ? Number(balanceAmount) / 100 : 0}`);

      return {
        success: true,
        activity,
        balanceAmount: balanceAmount ? Number(balanceAmount) / 100 : 0
      };
    } catch (error: any) {
      console.error('Gift card redemption error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to redeem gift card',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get gift card balance
   */
  async getGiftCardBalance(giftCardId: string): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Square API not initialized');
    }

    try {
      const giftCardsApi = this.client.giftCardsApi;
      const response: RetrieveGiftCardResponse = await giftCardsApi.retrieveGiftCard(giftCardId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        throw new Error(error.detail || 'Failed to retrieve gift card');
      }

      const balanceAmount = response.result.giftCard?.balanceMoney?.amount;
      return balanceAmount ? Number(balanceAmount) / 100 : 0;
    } catch (error: any) {
      console.error("Square API error:", error);
      if (error.statusCode && error.errors) {
        throw new Error(error.errors[0]?.detail || error.message);
      }
      throw error;
    }
  }

  /**
   * Load (add funds) to a gift card
   */
  async loadGiftCard(giftCardId: string, amount: number, orderId?: string, orderLineItemUid?: string): Promise<GiftCardActivityResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square API not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      const idempotencyKey = `load-${giftCardId}-${Date.now()}`;

      const request: CreateGiftCardActivityRequest = {
        idempotencyKey,
        giftCardActivity: {
          type: 'LOAD' as const,
          locationId: this.locationId,
          giftCardId,
          loadActivityDetails: {
            amountMoney: {
              amount: BigInt(Math.round(amount * 100)),
              currency: 'USD'
            },
            orderId,
            lineItemUid: orderLineItemUid
          }
        }
      };

      console.log(`Loading ${amount} to gift card ${giftCardId}`);
      const response: CreateGiftCardActivityResponse = await giftCardActivitiesApi.createGiftCardActivity(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Square API error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to load gift card',
          errorCode: error.code || 'LOAD_FAILED'
        };
      }

      if (!response.result.giftCardActivity) {
        return {
          success: false,
          error: 'No activity returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const activity = response.result.giftCardActivity;
      const balanceAmount = activity.giftCardBalanceMoney?.amount;

      console.log(`Gift card loaded successfully. New balance: ${balanceAmount ? Number(balanceAmount) / 100 : 0}`);

      return {
        success: true,
        activity,
        balanceAmount: balanceAmount ? Number(balanceAmount) / 100 : 0
      };
    } catch (error: any) {
      console.error('Gift card load error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to load gift card',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * List gift card activities
   */
  async getGiftCardActivities(giftCardId: string): Promise<GiftCardActivity[]> {
    if (!this.isInitialized) {
      throw new Error('Square API not initialized');
    }

    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      const response: ListGiftCardActivitiesResponse = await giftCardActivitiesApi.listGiftCardActivities({
        giftCardId,
        locationId: this.locationId,
      });

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        throw new Error(error.detail || 'Failed to list gift card activities');
      }

      return response.result.giftCardActivities || [];
    } catch (error: any) {
      console.error("Square API error:", error);
      if (error.statusCode && error.errors) {
        throw new Error(error.errors[0]?.detail || error.message);
      }
      throw error;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}