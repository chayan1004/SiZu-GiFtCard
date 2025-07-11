import { SquareClient, SquareEnvironment } from 'square';
import { nanoid } from 'nanoid';

export interface CreatePaymentLinkOptions {
  name: string;
  amount: number;
  currency?: string;
  description?: string;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  customMessage?: string;
  checkoutOptions?: {
    askForShippingAddress?: boolean;
    acceptedPaymentMethods?: {
      applePay?: boolean;
      googlePay?: boolean;
      cashApp?: boolean;
      afterpayClearpay?: boolean;
    };
    allowTipping?: boolean;
    customFields?: Array<{
      title: string;
    }>;
    redirectUrl?: string;
    merchantSupportEmail?: string;
  };
  prePopulatedData?: {
    buyerEmail?: string;
    buyerPhoneNumber?: string;
    buyerAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      locality?: string;
      administrativeDistrictLevel1?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface PaymentLink {
  id: string;
  url: string;
  orderId: string;
  createdAt: string;
  checkoutOptions?: any;
  prePopulatedData?: any;
}

export class SquarePaymentLinksService {
  private client: SquareClient;
  private locationId: string;

  constructor() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      throw new Error('Square configuration is missing');
    }

    this.client = new SquareClient({
      accessToken,
      environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox
    });
    this.locationId = locationId;

    console.log(`Square Payment Links Service initialized with location: ${this.locationId}`);
  }

  /**
   * Create a payment link for a gift card purchase
   */
  async createGiftCardPaymentLink(options: CreatePaymentLinkOptions): Promise<PaymentLink> {
    try {
      // Create line item for the gift card
      const lineItem = {
        name: options.name || 'Gift Card',
        quantity: '1',
        basePriceMoney: {
          amount: BigInt(Math.round(options.amount * 100)), // Convert to cents
          currency: options.currency || 'USD'
        },
        note: this.buildGiftCardNote(options)
      };

      // Build checkout options
      const checkoutOptions: any = {
        acceptedPaymentMethods: {
          applePay: options.checkoutOptions?.acceptedPaymentMethods?.applePay ?? true,
          googlePay: options.checkoutOptions?.acceptedPaymentMethods?.googlePay ?? true,
          cashAppPay: options.checkoutOptions?.acceptedPaymentMethods?.cashApp ?? true,
          afterpayClearpay: options.checkoutOptions?.acceptedPaymentMethods?.afterpayClearpay ?? false
        },
        askForShippingAddress: options.checkoutOptions?.askForShippingAddress ?? false,
        allowTipping: options.checkoutOptions?.allowTipping ?? false
      };

      if (options.checkoutOptions?.redirectUrl) {
        checkoutOptions.redirectUrl = options.checkoutOptions.redirectUrl;
      }

      if (options.checkoutOptions?.merchantSupportEmail) {
        checkoutOptions.merchantSupportEmail = options.checkoutOptions.merchantSupportEmail;
      }

      // Build the request
      const request: any = {
        idempotencyKey: nanoid(),
        order: {
          locationId: this.locationId,
          lineItems: [lineItem],
          customAttributes: [
            { key: 'gift_card_purchase', value: 'true' },
            { key: 'recipient_email', value: options.recipientEmail || '' },
            { key: 'recipient_name', value: options.recipientName || '' },
            { key: 'sender_name', value: options.senderName || '' }
          ]
        },
        checkoutOptions
      };

      // Add description if provided
      if (options.description) {
        request.description = options.description;
      }

      // Add pre-populated data if provided
      if (options.prePopulatedData) {
        request.prePopulatedData = {};
        
        if (options.prePopulatedData.buyerEmail) {
          request.prePopulatedData.buyerEmail = options.prePopulatedData.buyerEmail;
        }
        
        if (options.prePopulatedData.buyerPhoneNumber) {
          request.prePopulatedData.buyerPhoneNumber = options.prePopulatedData.buyerPhoneNumber;
        }
        
        if (options.prePopulatedData.buyerAddress) {
          request.prePopulatedData.buyerAddress = options.prePopulatedData.buyerAddress;
        }
      }

      const response = await this.client.checkoutApi.createPaymentLink(request);

      if (response.result.paymentLink) {
        return {
          id: response.result.paymentLink.id!,
          url: response.result.paymentLink.url!,
          orderId: response.result.paymentLink.orderId!,
          createdAt: response.result.paymentLink.createdAt!,
          checkoutOptions: response.result.paymentLink.checkoutOptions,
          prePopulatedData: response.result.paymentLink.prePopulatedData
        };
      }

      throw new Error('Failed to create payment link');
    } catch (error: any) {
      if (error.result?.errors) {
        console.error('Square API Error:', error.result.errors);
        throw new Error(`Square API Error: ${error.result.errors[0]?.detail || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Create a quick pay payment link (without order)
   */
  async createQuickPayLink(options: {
    name: string;
    amount: number;
    currency?: string;
    description?: string;
    checkoutOptions?: CreatePaymentLinkOptions['checkoutOptions'];
    prePopulatedData?: CreatePaymentLinkOptions['prePopulatedData'];
  }): Promise<PaymentLink> {
    try {
      const request: any = {
        idempotencyKey: nanoid(),
        quickPay: {
          name: options.name,
          priceMoney: {
            amount: BigInt(Math.round(options.amount * 100)),
            currency: options.currency || 'USD'
          },
          locationId: this.locationId
        }
      };

      // Add checkout options if provided
      if (options.checkoutOptions) {
        request.checkoutOptions = this.buildCheckoutOptions(options.checkoutOptions);
      }

      // Add pre-populated data if provided
      if (options.prePopulatedData) {
        request.prePopulatedData = options.prePopulatedData;
      }

      if (options.description) {
        request.description = options.description;
      }

      const response = await this.client.checkoutApi.createPaymentLink(request);

      if (response.result.paymentLink) {
        return {
          id: response.result.paymentLink.id!,
          url: response.result.paymentLink.url!,
          orderId: response.result.paymentLink.orderId || '',
          createdAt: response.result.paymentLink.createdAt!,
          checkoutOptions: response.result.paymentLink.checkoutOptions,
          prePopulatedData: response.result.paymentLink.prePopulatedData
        };
      }

      throw new Error('Failed to create quick pay link');
    } catch (error: any) {
      if (error.result?.errors) {
        console.error('Square API Error:', error.result.errors);
        throw new Error(`Square API Error: ${error.result.errors[0]?.detail || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Get payment link details
   */
  async getPaymentLink(paymentLinkId: string): Promise<PaymentLink> {
    try {
      const response = await this.client.checkoutApi.retrievePaymentLink(paymentLinkId);

      if (response.result.paymentLink) {
        return {
          id: response.result.paymentLink.id!,
          url: response.result.paymentLink.url!,
          orderId: response.result.paymentLink.orderId!,
          createdAt: response.result.paymentLink.createdAt!,
          checkoutOptions: response.result.paymentLink.checkoutOptions,
          prePopulatedData: response.result.paymentLink.prePopulatedData
        };
      }

      throw new Error('Payment link not found');
    } catch (error: any) {
      if (error.result?.errors) {
        console.error('Square API Error:', error.result.errors);
        throw new Error(`Square API Error: ${error.result.errors[0]?.detail || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Update payment link
   */
  async updatePaymentLink(paymentLinkId: string, updates: {
    checkoutOptions?: CreatePaymentLinkOptions['checkoutOptions'];
    prePopulatedData?: CreatePaymentLinkOptions['prePopulatedData'];
  }): Promise<PaymentLink> {
    try {
      const request: any = {
        paymentLink: {}
      };

      if (updates.checkoutOptions) {
        request.paymentLink.checkoutOptions = this.buildCheckoutOptions(updates.checkoutOptions);
      }

      if (updates.prePopulatedData) {
        request.paymentLink.prePopulatedData = updates.prePopulatedData;
      }

      const response = await this.client.checkoutApi.updatePaymentLink(paymentLinkId, request);

      if (response.result.paymentLink) {
        return {
          id: response.result.paymentLink.id!,
          url: response.result.paymentLink.url!,
          orderId: response.result.paymentLink.orderId!,
          createdAt: response.result.paymentLink.createdAt!,
          checkoutOptions: response.result.paymentLink.checkoutOptions,
          prePopulatedData: response.result.paymentLink.prePopulatedData
        };
      }

      throw new Error('Failed to update payment link');
    } catch (error: any) {
      if (error.result?.errors) {
        console.error('Square API Error:', error.result.errors);
        throw new Error(`Square API Error: ${error.result.errors[0]?.detail || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Delete payment link
   */
  async deletePaymentLink(paymentLinkId: string): Promise<void> {
    try {
      await this.client.checkoutApi.deletePaymentLink(paymentLinkId);
    } catch (error: any) {
      if (error.result?.errors) {
        console.error('Square API Error:', error.result.errors);
        throw new Error(`Square API Error: ${error.result.errors[0]?.detail || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Build gift card note with details
   */
  private buildGiftCardNote(options: CreatePaymentLinkOptions): string {
    const parts = [];
    
    if (options.recipientName) {
      parts.push(`For: ${options.recipientName}`);
    }
    
    if (options.senderName) {
      parts.push(`From: ${options.senderName}`);
    }
    
    if (options.customMessage) {
      parts.push(`Message: ${options.customMessage}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Build checkout options object
   */
  private buildCheckoutOptions(options: CreatePaymentLinkOptions['checkoutOptions']): any {
    const checkoutOptions: any = {};

    if (options?.acceptedPaymentMethods) {
      checkoutOptions.acceptedPaymentMethods = {
        applePay: options.acceptedPaymentMethods.applePay ?? true,
        googlePay: options.acceptedPaymentMethods.googlePay ?? true,
        cashAppPay: options.acceptedPaymentMethods.cashApp ?? true,
        afterpayClearpay: options.acceptedPaymentMethods.afterpayClearpay ?? false
      };
    }

    if (options?.askForShippingAddress !== undefined) {
      checkoutOptions.askForShippingAddress = options.askForShippingAddress;
    }

    if (options?.allowTipping !== undefined) {
      checkoutOptions.allowTipping = options.allowTipping;
    }

    if (options?.customFields) {
      checkoutOptions.customFields = options.customFields;
    }

    if (options?.redirectUrl) {
      checkoutOptions.redirectUrl = options.redirectUrl;
    }

    if (options?.merchantSupportEmail) {
      checkoutOptions.merchantSupportEmail = options.merchantSupportEmail;
    }

    return checkoutOptions;
  }
}

// Export singleton instance
export const squarePaymentLinksService = new SquarePaymentLinksService();