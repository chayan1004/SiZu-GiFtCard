import { 
  SquareClient, 
  SquareEnvironment,
  ObtainTokenRequest,
  ObtainTokenResponse,
  RetrieveTokenStatusResponse,
  RevokeTokenRequest,
  RevokeTokenResponse,
  OAuth2Token
} from "square";
import { nanoid } from "nanoid";
import crypto from 'crypto';

export interface OAuthResult {
  success: boolean;
  token?: OAuth2Token;
  error?: string;
  errorCode?: string;
}

export interface TokenStatusResult {
  success: boolean;
  status?: any;
  error?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export class SquareOAuthService {
  private client: SquareClient;
  private config: OAuthConfig;
  private isInitialized: boolean = false;

  constructor() {
    // Use provided sandbox credentials for testing
    const clientId = process.env.SQUARE_OAUTH_CLIENT_ID || 'sandbox-sq0idb-l5OPb4gxToPCbEbXnfzXng';
    const clientSecret = process.env.SQUARE_OAUTH_CLIENT_SECRET || 'sandbox-sq0csb-ROiGcg6ivcsgjHb6ym4JDiN0rpYKlZU7rygi5_UwWLs';
    const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI || 'https://sizugiftcard.com/api/oauth/square/callback';

    if (!clientId || !clientSecret) {
      console.warn("Square OAuth credentials not provided. OAuth features will be limited.");
      return;
    }

    this.config = {
      clientId,
      clientSecret,
      redirectUri,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
    };

    const environment = this.config.environment === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;

    this.client = new SquareClient({
      environment: environment
    });

    this.isInitialized = true;
    console.log(`Square OAuth Service initialized for ${this.config.environment}`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(
    state: string,
    scopes: string[] = [],
    sessionId?: string
  ): string {
    if (!this.isInitialized) {
      throw new Error('Square OAuth Service not initialized');
    }

    const baseUrl = this.config.environment === 'production'
      ? 'https://connect.squareup.com/oauth2/authorize'
      : 'https://connect.squareupsandbox.com/oauth2/authorize';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: state
    });

    // Add scopes if provided
    if (scopes.length > 0) {
      params.append('scope', scopes.join(' '));
    }

    // Add session ID for better tracking
    if (sessionId) {
      params.append('session', sessionId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier?: string
  ): Promise<OAuthResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square OAuth Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const oAuthApi = this.client.oAuthApi;

      const request: ObtainTokenRequest = {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        grantType: 'authorization_code',
        code,
        redirectUri: this.config.redirectUri
      };

      // Add PKCE code verifier if provided
      if (codeVerifier) {
        request.codeVerifier = codeVerifier;
      }

      const response: ObtainTokenResponse = await oAuthApi.obtainToken(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Token exchange error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to exchange code for token',
          errorCode: error.code || 'TOKEN_EXCHANGE_FAILED'
        };
      }

      if (!response.result.accessToken) {
        return {
          success: false,
          error: 'No access token returned',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      console.log('Successfully exchanged code for access token');
      return {
        success: true,
        token: {
          accessToken: response.result.accessToken,
          refreshToken: response.result.refreshToken,
          expiresAt: response.result.expiresAt,
          merchantId: response.result.merchantId,
          scopes: response.result.scopes
        }
      };
    } catch (error: any) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error.message || 'Failed to exchange code for token',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square OAuth Service not initialized',
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    try {
      const oAuthApi = this.client.oAuthApi;

      const request: ObtainTokenRequest = {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        grantType: 'refresh_token',
        refreshToken
      };

      const response: ObtainTokenResponse = await oAuthApi.obtainToken(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Token refresh error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to refresh token',
          errorCode: error.code || 'TOKEN_REFRESH_FAILED'
        };
      }

      if (!response.result.accessToken) {
        return {
          success: false,
          error: 'No access token returned',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      console.log('Successfully refreshed access token');
      return {
        success: true,
        token: {
          accessToken: response.result.accessToken,
          refreshToken: response.result.refreshToken,
          expiresAt: response.result.expiresAt,
          merchantId: response.result.merchantId,
          scopes: response.result.scopes
        }
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh token',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(
    token: string,
    merchantId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square OAuth Service not initialized'
      };
    }

    try {
      const oAuthApi = this.client.oAuthApi;

      const request: RevokeTokenRequest = {
        clientId: this.config.clientId,
        accessToken: token,
        merchantId
      };

      const response: RevokeTokenResponse = await oAuthApi.revokeToken(request);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        console.error('Token revocation error:', error);
        return {
          success: false,
          error: error.detail || 'Failed to revoke token'
        };
      }

      console.log('Successfully revoked access token');
      return {
        success: response.result.success || false
      };
    } catch (error: any) {
      console.error('Token revocation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke token'
      };
    }
  }

  /**
   * Check token status (introspection)
   */
  async getTokenStatus(accessToken: string): Promise<TokenStatusResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square OAuth Service not initialized'
      };
    }

    try {
      // Create authenticated client with the token to check
      const authenticatedClient = new SquareClient({
        accessToken,
        environment: this.config.environment === 'production' 
          ? SquareEnvironment.Production 
          : SquareEnvironment.Sandbox
      });

      const oAuthApi = authenticatedClient.oAuthApi;
      const response: RetrieveTokenStatusResponse = await oAuthApi.retrieveTokenStatus();

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to get token status'
        };
      }

      return {
        success: true,
        status: {
          scopes: response.result.scopes,
          expiresAt: response.result.expiresAt,
          merchantId: response.result.merchantId
        }
      };
    } catch (error: any) {
      console.error('Token status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token status'
      };
    }
  }

  /**
   * Generate PKCE code challenge and verifier
   */
  generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
    // Generate code verifier (43-128 characters)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge (SHA256 of verifier)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate secure state parameter
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate state parameter to prevent CSRF attacks
   */
  validateState(providedState: string, expectedState: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(providedState),
      Buffer.from(expectedState)
    );
  }

  /**
   * Get available OAuth scopes
   */
  getAvailableScopes(): string[] {
    return [
      // Payment scopes
      'PAYMENTS_WRITE',
      'PAYMENTS_READ',
      'PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS',
      'PAYMENTS_WRITE_IN_PERSON',
      
      // Customer scopes
      'CUSTOMERS_WRITE',
      'CUSTOMERS_READ',
      
      // Order scopes
      'ORDERS_WRITE',
      'ORDERS_READ',
      
      // Item scopes
      'ITEMS_WRITE',
      'ITEMS_READ',
      
      // Merchant scopes
      'MERCHANT_PROFILE_READ',
      'MERCHANT_PROFILE_WRITE',
      
      // Employee scopes
      'EMPLOYEES_READ',
      'EMPLOYEES_WRITE',
      
      // Bank account scopes
      'BANK_ACCOUNTS_READ',
      
      // Settlement scopes
      'SETTLEMENTS_READ',
      
      // Loyalty scopes
      'LOYALTY_READ',
      'LOYALTY_WRITE',
      
      // Gift card scopes
      'GIFTCARDS_READ',
      'GIFTCARDS_WRITE',
      
      // Online store scopes
      'ONLINE_STORE_SITE_READ',
      'ONLINE_STORE_SNIPPETS_WRITE',
      'ONLINE_STORE_SNIPPETS_READ',
      
      // Invoice scopes
      'INVOICES_READ',
      'INVOICES_WRITE',
      
      // Inventory scopes
      'INVENTORY_READ',
      'INVENTORY_WRITE',
      
      // Dispute scopes
      'DISPUTES_READ',
      'DISPUTES_WRITE',
      
      // Device scopes
      'DEVICE_CREDENTIAL_MANAGEMENT',
      
      // Cash drawer scopes
      'CASH_DRAWER_READ'
    ];
  }

  /**
   * Get required scopes for gift card platform
   */
  getRequiredScopes(): string[] {
    return [
      'PAYMENTS_WRITE',
      'PAYMENTS_READ',
      'CUSTOMERS_WRITE',
      'CUSTOMERS_READ',
      'ORDERS_WRITE',
      'ORDERS_READ',
      'GIFTCARDS_READ',
      'GIFTCARDS_WRITE',
      'MERCHANT_PROFILE_READ',
      'DISPUTES_READ',
      'DISPUTES_WRITE'
    ];
  }
}

// Export singleton instance
export const squareOAuthService = new SquareOAuthService();