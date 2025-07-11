import { 
  SquareClient, 
  SquareEnvironment,
  CreatePaymentRequest,
  CreatePaymentResponse,
  Payment,
  CompletePaymentRequest,
  CompletePaymentResponse,
  UpdatePaymentRequest,
  UpdatePaymentResponse,
  CancelPaymentByIdempotencyKeyRequest,
  CancelPaymentByIdempotencyKeyResponse,
  GetPaymentResponse,
  ListPaymentsResponse,
  CreateCustomerRequest,
  CreateCustomerResponse,
  Customer,
  CreateCardRequest,
  CreateCardResponse,
  Card,
  SearchCustomersRequest,
  SearchCustomersResponse
} from "square";
import { nanoid } from "nanoid";

export interface PaymentCreationResult {
  success: boolean;
  payment?: Payment;
  paymentId?: string;
  error?: string;
  errorCode?: string;
}

export interface CustomerCreationResult {
  success: boolean;
  customer?: Customer;
  customerId?: string;
  error?: string;
  errorCode?: string;
}

export interface CardTokenizationResult {
  success: boolean;
  card?: Card;
  cardId?: string;
  error?: string;
  errorCode?: string;
}

export class SquarePaymentsService {
  private client: SquareClient;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.warn("Square access token not provided. Payment features will be limited.");
      return;
    }

    // Use provided location ID or get from API
    this.locationId = process.env.SQUARE_LOCATION_ID || '';

    // Determine environment based on token
    const environment = process.env.SQUARE_ACCESS_TOKEN.startsWith('sandbox') 
      ? SquareEnvironment.Sandbox 
      : SquareEnvironment.Production;

    this.client = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment
    });

    // Initialize location
    this.initializeLocation();
  }

  private async initializeLocation() {
    try {
      // If location ID is provided, use it directly
      if (this.locationId) {
        this.isInitialized = true;
        console.log(`Square Payments Service initialized with location: ${this.locationId}`);
        return;
      }

      // Otherwise, try to get first available location
      try {
        const locationsApi = this.client.locationsApi;
        if (locationsApi && locationsApi.listLocations) {
          const response = await locationsApi.listLocations();
          
          if (response.result.locations && response.result.locations.length > 0) {
            this.locationId = response.result.locations[0].id!;
            this.isInitialized = true;
            console.log(`Square Payments Service initialized with location: ${this.locationId}`);
          } else {
            console.error("No Square locations found");
          }
        } else {
          console.warn("Square locationsApi not available. Payment service will be limited.");
        }
      } catch (apiError) {
        console.warn("Could not fetch locations from Square API. Payment service will be limited.", apiError);
      }
    } catch (error) {
      console.error("Failed to initialize Square Payments Service:", error);
    }
  }

  /**
   * Create a payment from a source (card nonce from Web Payments SDK)
   * Enhanced with support for partial payments, statement descriptions, delayed capture, and app fees
   */
  async createPayment(
    sourceId: string,
    amount: number,
    customerId?: string,
    orderId?: string,
    referenceId?: string,
    note?: string,
    verification?: boolean,
    options?: {
      // Delayed capture - set to false to authorize only
      autocomplete?: boolean;
      // Statement description that appears on buyer's statement
      statementDescriptionIdentifier?: string;
      // Application fee for marketplace scenarios
      appFeeAmount?: number;
      // Tip amount
      tipAmount?: number;
      // Accept partial authorization (useful with gift cards)
      acceptPartialAuthorization?: boolean;
      // 3D Secure/SCA verification token from verifyBuyer()
      verificationToken?: string;
      // Buyer email address for receipts
      buyerEmailAddress?: string;
    }
  ): Promise<PaymentCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const paymentsApi = this.client.paymentsApi;
      const idempotencyKey = `payment-${nanoid()}`;

      const request: CreatePaymentRequest = {
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency: 'USD'
        },
        locationId: this.locationId,
        customerId,
        orderId,
        referenceId,
        note,
        // Delayed capture support - default to true for backward compatibility
        autocomplete: options?.autocomplete !== undefined ? options.autocomplete : true,
        // Enable verification for card-on-file payments
        verifyBuyerIdentity: verification,
        // Accept partial authorization for gift card scenarios
        acceptPartialAuthorization: options?.acceptPartialAuthorization,
        // Statement description for buyer's bank statement
        statementDescriptionIdentifier: options?.statementDescriptionIdentifier,
        // 3D Secure/SCA verification token from Web Payments SDK verifyBuyer()
        verificationToken: options?.verificationToken,
        // Buyer email address for digital receipts
        buyerEmailAddress: options?.buyerEmailAddress
      };

      // Add application fee if specified
      if (options?.appFeeAmount && options.appFeeAmount > 0) {
        request.appFeeMoney = {
          amount: BigInt(Math.round(options.appFeeAmount * 100)),
          currency: 'USD'
        };
      }

      // Add tip amount if specified
      if (options?.tipAmount && options.tipAmount > 0) {
        request.tipMoney = {
          amount: BigInt(Math.round(options.tipAmount * 100)),
          currency: 'USD'
        };
      }

      const response: CreatePaymentResponse = await paymentsApi.createPayment(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Payment creation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create payment',
          errorCode: error.code || 'PAYMENT_FAILED'
        };
      }

      if (!response.result.payment) {
        return {
          success: false,
          error: 'No payment returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const payment = response.result.payment;
      console.log(`Payment created successfully: ${payment.id}`);
      
      // Log ACH payment details if applicable
      if (payment.sourceType === 'BANK_ACCOUNT' && payment.bankAccountDetails) {
        console.log('ACH Payment Details:', {
          paymentId: payment.id,
          status: payment.status,
          bankName: payment.bankAccountDetails.bankName,
          transferType: payment.bankAccountDetails.transferType,
          accountType: payment.bankAccountDetails.achDetails?.accountType,
          accountSuffix: payment.bankAccountDetails.achDetails?.accountNumberSuffix
        });
      }

      return {
        success: true,
        payment,
        paymentId: payment.id
      };
    } catch (error: any) {
      console.error('Payment creation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create payment',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Complete a payment (for delayed capture scenarios)
   */
  async completePayment(paymentId: string): Promise<PaymentCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const paymentsApi = this.client.paymentsApi;
      
      const request: CompletePaymentRequest = {};
      const response: CompletePaymentResponse = await paymentsApi.completePayment(paymentId, request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Payment completion error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to complete payment',
          errorCode: error.code || 'COMPLETION_FAILED'
        };
      }

      if (!response.result.payment) {
        return {
          success: false,
          error: 'No payment returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const payment = response.result.payment;
      console.log(`Payment completed successfully: ${payment.id}`);

      return {
        success: true,
        payment,
        paymentId: payment.id
      };
    } catch (error: any) {
      console.error('Payment completion error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to complete payment',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Cancel a payment by idempotency key
   */
  async cancelPayment(idempotencyKey: string): Promise<PaymentCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const paymentsApi = this.client.paymentsApi;
      
      const request: CancelPaymentByIdempotencyKeyRequest = {
        idempotencyKey
      };
      const response: CancelPaymentByIdempotencyKeyResponse = await paymentsApi.cancelPaymentByIdempotencyKey(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        // Ignore errors if payment was already canceled
        if (error.code !== 'PAYMENT_ALREADY_CANCELED') {
          console.error('Payment cancellation error:', error);
          return {
            success: false,
            error: error.detail || 'Failed to cancel payment',
            errorCode: error.code || 'CANCELLATION_FAILED'
          };
        }
      }

      console.log('Payment canceled successfully');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to cancel payment',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    if (!this.isInitialized) {
      throw new Error('Square Payments Service not initialized');
    }

    try {
      const paymentsApi = this.client.paymentsApi;
      const response: GetPaymentResponse = await paymentsApi.getPayment(paymentId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        throw new Error(error.detail || 'Failed to retrieve payment');
      }

      return response.result.payment || null;
    } catch (error: any) {
      console.error("Square API error:", error);
      if (error.statusCode && error.errors) {
        throw new Error(error.errors[0]?.detail || error.message);
      }
      throw error;
    }
  }

  /**
   * Create a customer for card-on-file
   */
  async createCustomer(
    email: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string
  ): Promise<CustomerCreationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const customersApi = this.client.customersApi;
      const idempotencyKey = `customer-${nanoid()}`;

      const request: CreateCustomerRequest = {
        idempotencyKey,
        emailAddress: email,
        givenName: firstName,
        familyName: lastName,
        phoneNumber
      };

      const response: CreateCustomerResponse = await customersApi.createCustomer(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Customer creation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to create customer',
          errorCode: error.code || 'CUSTOMER_CREATION_FAILED'
        };
      }

      if (!response.result.customer) {
        return {
          success: false,
          error: 'No customer returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const customer = response.result.customer;
      console.log(`Customer created successfully: ${customer.id}`);

      return {
        success: true,
        customer,
        customerId: customer.id
      };
    } catch (error: any) {
      console.error('Customer creation error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create customer',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Save a card on file for a customer
   */
  async saveCardOnFile(
    customerId: string,
    cardNonce: string
  ): Promise<CardTokenizationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Payments Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const cardsApi = this.client.cardsApi;
      const idempotencyKey = `card-${nanoid()}`;

      const request: CreateCardRequest = {
        idempotencyKey,
        sourceId: cardNonce,
        card: {
          customerId
        }
      };

      const response: CreateCardResponse = await cardsApi.createCard(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Card tokenization error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to save card',
          errorCode: error.code || 'CARD_TOKENIZATION_FAILED'
        };
      }

      if (!response.result.card) {
        return {
          success: false,
          error: 'No card returned from Square',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      const card = response.result.card;
      console.log(`Card saved successfully: ${card.id}`);

      return {
        success: true,
        card,
        cardId: card.id
      };
    } catch (error: any) {
      console.error('Card tokenization error:', error);
      
      if (error.statusCode && error.errors) {
        return {
          success: false,
          error: error.errors[0]?.detail || error.message,
          errorCode: error.errors[0]?.code || 'API_ERROR'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to save card',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Search for existing customer by email
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const customersApi = this.client.customersApi;
      
      const request: SearchCustomersRequest = {
        filter: {
          emailAddress: {
            exact: email
          }
        },
        limit: BigInt(1)
      };

      const response: SearchCustomersResponse = await customersApi.searchCustomers(request);

      if (response.result.errors && response.result.errors.length > 0) {
        console.error('Customer search error:', response.result.errors[0]);
        return null;
      }

      return response.result.customers?.[0] || null;
    } catch (error: any) {
      console.error('Customer search error:', error);
      return null;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const squarePaymentsService = new SquarePaymentsService();