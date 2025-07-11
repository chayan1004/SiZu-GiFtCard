import { SquareClient, SquareEnvironment } from "square";

export class SquareService {
  private client: SquareClient;
  private locationId: string;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
    
    if (!accessToken) {
      console.warn("Square access token not provided. Gift card features will be limited.");
    }

    this.client = new SquareClient({
      accessToken,
      environment,
    });

    this.locationId = process.env.SQUARE_LOCATION_ID || '';
  }

  async createGiftCard(amount: number, externalId: string): Promise<any> {
    try {
      const giftCardsApi = this.client.giftCardsApi;
      
      const requestBody = {
        idempotencyKey: `gift-card-${externalId}-${Date.now()}`,
        locationId: this.locationId,
        giftCard: {
          type: 'DIGITAL',
          giftCardActivityDetails: {
            activateActivityDetails: {
              amountMoney: {
                amount: BigInt(Math.round(amount * 100)), // Convert to cents
                currency: 'USD',
              },
            },
          },
        },
      };

      const response = await giftCardsApi.createGiftCard(requestBody);
      
      if (response.result.errors) {
        throw new Error(`Square API error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCard;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Square API error:", error.errors);
        throw new Error(`Square API error: ${error.errors?.map(e => e.detail).join(', ')}`);
      }
      throw error;
    }
  }

  async redeemGiftCard(giftCardId: string, amount: number): Promise<any> {
    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      
      const requestBody = {
        idempotencyKey: `redeem-${giftCardId}-${Date.now()}`,
        giftCardActivity: {
          type: 'REDEEM',
          locationId: this.locationId,
          giftCardId,
          redeemActivityDetails: {
            amountMoney: {
              amount: BigInt(Math.round(amount * 100)), // Convert to cents
              currency: 'USD',
            },
          },
        },
      };

      const response = await giftCardActivitiesApi.createGiftCardActivity(requestBody);
      
      if (response.result.errors) {
        throw new Error(`Square API error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivity;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Square API error:", error.errors);
        throw new Error(`Square API error: ${error.errors?.map(e => e.detail).join(', ')}`);
      }
      throw error;
    }
  }

  async getGiftCardBalance(giftCardId: string): Promise<number> {
    try {
      const giftCardsApi = this.client.giftCardsApi;
      
      const response = await giftCardsApi.retrieveGiftCard(giftCardId);
      
      if (response.result.errors) {
        throw new Error(`Square API error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      const balanceAmount = response.result.giftCard?.balanceMoney?.amount;
      return balanceAmount ? Number(balanceAmount) / 100 : 0; // Convert from cents
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Square API error:", error.errors);
        throw new Error(`Square API error: ${error.errors?.map(e => e.detail).join(', ')}`);
      }
      throw error;
    }
  }

  async refundToGiftCard(giftCardId: string, amount: number, reason?: string): Promise<any> {
    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      
      const requestBody = {
        idempotencyKey: `refund-${giftCardId}-${Date.now()}`,
        giftCardActivity: {
          type: 'LOAD',
          locationId: this.locationId,
          giftCardId,
          loadActivityDetails: {
            amountMoney: {
              amount: BigInt(Math.round(amount * 100)), // Convert to cents
              currency: 'USD',
            },
          },
        },
      };

      const response = await giftCardActivitiesApi.createGiftCardActivity(requestBody);
      
      if (response.result.errors) {
        throw new Error(`Square API error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivity;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Square API error:", error.errors);
        throw new Error(`Square API error: ${error.errors?.map(e => e.detail).join(', ')}`);
      }
      throw error;
    }
  }

  async getGiftCardActivities(giftCardId: string): Promise<any[]> {
    try {
      const giftCardActivitiesApi = this.client.giftCardActivitiesApi;
      
      const response = await giftCardActivitiesApi.listGiftCardActivities({
        giftCardId,
        limit: 100,
      });
      
      if (response.result.errors) {
        throw new Error(`Square API error: ${response.result.errors.map(e => e.detail).join(', ')}`);
      }

      return response.result.giftCardActivities || [];
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Square API error:", error.errors);
        throw new Error(`Square API error: ${error.errors?.map(e => e.detail).join(', ')}`);
      }
      throw error;
    }
  }
}
