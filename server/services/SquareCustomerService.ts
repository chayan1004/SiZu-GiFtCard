import { SquareClient, SquareEnvironment } from "square";
import type { 
  Customer, 
  Card, 
  CreateCustomerRequest,
  CreateCardRequest,
  ListCardsResponse,
  CreateCustomerResponse,
  CreateCardResponse,
  DeleteCardResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse
} from "square";

export class SquareCustomerService {
  private client: SquareClient;
  private customersApi: any;
  private cardsApi: any;
  
  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn("Square access token not provided. Customer features will be limited.");
    }

    this.client = new SquareClient({
      accessToken: accessToken || 'sandbox-token',
      environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
    });

    this.customersApi = this.client.customersApi;
    this.cardsApi = this.client.cardsApi;
  }

  /**
   * Create a new Square customer
   */
  async createCustomer(email?: string, firstName?: string, lastName?: string): Promise<Customer> {
    try {
      const createCustomerRequest: CreateCustomerRequest = {
        givenName: firstName,
        familyName: lastName,
        emailAddress: email,
        referenceId: `SIZU-${Date.now()}`, // Internal reference
      };

      const response: CreateCustomerResponse = await this.customersApi.createCustomer(createCustomerRequest);
      
      if (!response.result.customer) {
        throw new Error("Failed to create customer");
      }

      return response.result.customer;
    } catch (error) {
      console.error("Error creating Square customer:", error);
      if (error instanceof Error && 'errors' in error) {
        const apiError = error as any;
        throw new Error(`Square API error: ${apiError.errors?.[0]?.detail || apiError.message}`);
      }
      throw error;
    }
  }

  /**
   * Update existing Square customer
   */
  async updateCustomer(customerId: string, email?: string, firstName?: string, lastName?: string): Promise<Customer> {
    try {
      const updateCustomerRequest: UpdateCustomerRequest = {
        givenName: firstName,
        familyName: lastName,
        emailAddress: email,
      };

      const response: UpdateCustomerResponse = await this.customersApi.updateCustomer(
        customerId,
        updateCustomerRequest
      );
      
      if (!response.result.customer) {
        throw new Error("Failed to update customer");
      }

      return response.result.customer;
    } catch (error) {
      console.error("Error updating Square customer:", error);
      if (error instanceof Error && 'errors' in error) {
        const apiError = error as any;
        throw new Error(`Square API error: ${apiError.errors?.[0]?.detail || apiError.message}`);
      }
      throw error;
    }
  }

  /**
   * Add a card to a customer using payment token (nonce)
   */
  async addCardToCustomer(customerId: string, sourceId: string, verificationToken?: string): Promise<Card> {
    try {
      const createCardRequest: CreateCardRequest = {
        sourceId, // This is the payment nonce from Square Web Payments SDK
        verificationToken, // Optional 3DS verification token
        card: {
          customerId,
        },
      };

      const response: CreateCardResponse = await this.cardsApi.createCard(createCardRequest);
      
      if (!response.result.card) {
        throw new Error("Failed to add card");
      }

      return response.result.card;
    } catch (error: any) {
      console.error("Error adding card to customer:", error);
      if (error instanceof Error && 'errors' in error) {
        const errorDetail = error.errors?.[0]?.detail || error.message;
        
        // Handle specific Square error codes
        if (error.errors?.[0]?.code === 'INVALID_CARD_DATA') {
          throw new Error("Invalid card information provided");
        } else if (error.errors?.[0]?.code === 'VERIFICATION_REQUIRED') {
          throw new Error("Card verification required");
        } else if (error.errors?.[0]?.code === 'CARD_DECLINED') {
          throw new Error("Card was declined");
        }
        
        throw new Error(`Square API error: ${errorDetail}`);
      }
      throw error;
    }
  }

  /**
   * List all cards for a customer
   */
  async listCustomerCards(customerId: string): Promise<Card[]> {
    try {
      const response: ListCardsResponse = await this.cardsApi.listCards(
        undefined, // cursor
        customerId,
        true, // include disabled cards
        undefined, // reference_id
        'DESC' // sort order
      );
      
      return response.result.cards || [];
    } catch (error) {
      console.error("Error listing customer cards:", error);
      if (error instanceof Error && 'errors' in error) {
        const apiError = error as any;
        throw new Error(`Square API error: ${apiError.errors?.[0]?.detail || apiError.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      const response: DeleteCardResponse = await this.cardsApi.disableCard(cardId);
      
      if (!response.result.card) {
        throw new Error("Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      if (error instanceof Error && 'errors' in error) {
        const apiError = error as any;
        throw new Error(`Square API error: ${apiError.errors?.[0]?.detail || apiError.message}`);
      }
      throw error;
    }
  }

  /**
   * Get a specific card
   */
  async getCard(cardId: string): Promise<Card | null> {
    try {
      const response = await this.cardsApi.retrieveCard(cardId);
      return response.result.card || null;
    } catch (error: any) {
      console.error("Error retrieving card:", error);
      if (error instanceof Error && 'statusCode' in error && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Parse card details for storage (only non-sensitive data)
   */
  parseCardForStorage(card: Card): {
    squareCardId: string;
    cardBrand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    cardholderName?: string;
  } {
    if (!card.id || !card.cardBrand || !card.last4 || !card.expMonth || !card.expYear) {
      throw new Error("Incomplete card data from Square");
    }

    return {
      squareCardId: card.id,
      cardBrand: card.cardBrand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cardholderName: card.cardholderName,
    };
  }

  /**
   * Verify if a card is still valid
   */
  isCardValid(card: Card): boolean {
    if (!card.enabled) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (!card.expYear || !card.expMonth) return false;
    
    // Check if card is expired
    if (card.expYear < currentYear) return false;
    if (card.expYear === currentYear && card.expMonth < currentMonth) return false;
    
    return true;
  }

  /**
   * Format card display (for UI)
   */
  formatCardDisplay(card: Card): string {
    const brand = card.cardBrand || 'Card';
    const last4 = card.last4 || '****';
    return `${brand} •••• ${last4}`;
  }

  /**
   * Check if Square integration is available
   */
  isAvailable(): boolean {
    return !!process.env.SQUARE_ACCESS_TOKEN;
  }
}