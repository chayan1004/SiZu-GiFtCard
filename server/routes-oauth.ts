import { Router } from 'express';
import { squareOAuthService } from './services/SquareOAuthService';
import { storage } from './storage';
import { 
  generalRateLimit, 
  validateInput,
  secureLogger 
} from './middleware/security';
import { requireAnyAuth } from './middleware/customerAuth';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const router = Router();

// Temporary store for OAuth states (in production, use Redis or database)
const oauthStates = new Map<string, { userId: string; expiresAt: Date }>();

// OAuth initiate schema
const oauthInitiateSchema = z.object({
  scopes: z.array(z.string()).optional(),
  redirectUrl: z.string().url().optional()
});

// OAuth callback schema
const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

// Token refresh schema
const tokenRefreshSchema = z.object({
  merchantId: z.string()
});

// Direct OAuth authorization redirect (for admin UI)
router.get('/square/authorize',
  requireAnyAuth,
  async (req, res) => {
    try {
      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can connect Square accounts
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can connect Square accounts'
        });
      }

      // Generate state for CSRF protection
      const state = squareOAuthService.generateState();
      const sessionId = nanoid();

      // Store state with expiration (5 minutes)
      oauthStates.set(state, {
        userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Get authorization URL
      const scopes = squareOAuthService.getRequiredScopes();
      const authUrl = squareOAuthService.getAuthorizationUrl(state, scopes, sessionId);

      // Redirect to Square OAuth
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('OAuth authorization error:', error);
      res.redirect('/oauth/error?error=authorization_failed');
    }
  }
);

// Initiate OAuth flow (API endpoint)
router.post('/connect',
  requireAnyAuth,
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const validatedData = oauthInitiateSchema.parse(req.body);
      const { scopes, redirectUrl } = validatedData;

      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can connect Square accounts
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can connect Square accounts'
        });
      }

      // Generate state for CSRF protection
      const state = squareOAuthService.generateState();
      const sessionId = nanoid();

      // Store state with expiration (5 minutes)
      oauthStates.set(state, {
        userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Get authorization URL
      const authScopes = scopes || squareOAuthService.getRequiredScopes();
      const authUrl = squareOAuthService.getAuthorizationUrl(state, authScopes, sessionId);

      res.json({
        success: true,
        authUrl,
        state,
        sessionId
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      console.error('OAuth initiate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to initiate OAuth flow'
      });
    }
  }
);

// OAuth callback handler
router.get('/callback',
  generalRateLimit,
  async (req, res) => {
    try {
      const validatedData = oauthCallbackSchema.parse(req.query);
      const { code, state, error, error_description } = validatedData;

      // Handle OAuth errors
      if (error) {
        console.error('OAuth callback error:', error, error_description);
        return res.redirect(`/oauth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`);
      }

      if (!squareOAuthService.isAvailable()) {
        return res.redirect('/oauth/error?error=service_unavailable');
      }

      // Validate state
      const stateData = oauthStates.get(state);
      if (!stateData || stateData.expiresAt < new Date()) {
        oauthStates.delete(state);
        return res.redirect('/oauth/error?error=invalid_state');
      }

      // Clean up state
      oauthStates.delete(state);

      // Exchange code for token
      const tokenResult = await squareOAuthService.exchangeCodeForToken(code);

      if (!tokenResult.success || !tokenResult.token) {
        return res.redirect(`/oauth/error?error=token_exchange_failed&details=${encodeURIComponent(tokenResult.error || '')}`);
      }

      const token = tokenResult.token;

      // Store merchant connection in database
      try {
        await storage.createMerchantConnection({
          userId: stateData.userId,
          merchantId: token.merchantId!,
          accessToken: token.accessToken!,
          refreshToken: token.refreshToken,
          scopes: token.scopes,
          expiresAt: token.expiresAt ? new Date(token.expiresAt) : undefined
        });
      } catch (dbError) {
        console.error('Failed to store merchant connection:', dbError);
        return res.redirect('/oauth/error?error=storage_failed');
      }

      // Redirect to success page
      res.redirect(`/oauth/success?merchant_id=${token.merchantId}`);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      res.redirect('/oauth/error?error=callback_failed');
    }
  }
);

// Refresh access token
router.post('/refresh',
  requireAnyAuth,
  generalRateLimit,
  validateInput,
  secureLogger,
  async (req, res) => {
    try {
      const validatedData = tokenRefreshSchema.parse(req.body);
      const { merchantId } = validatedData;

      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;

      // Get merchant connection
      const connection = await storage.getMerchantConnection(userId, merchantId);
      if (!connection || !connection.refreshToken) {
        return res.status(404).json({
          success: false,
          error: 'Merchant connection not found or refresh token missing'
        });
      }

      // Refresh token
      const tokenResult = await squareOAuthService.refreshToken(connection.refreshToken);

      if (!tokenResult.success || !tokenResult.token) {
        return res.status(400).json({
          success: false,
          error: tokenResult.error || 'Failed to refresh token',
          errorCode: tokenResult.errorCode
        });
      }

      const newToken = tokenResult.token;

      // Update stored tokens
      try {
        await storage.updateMerchantConnection(connection.id, {
          accessToken: newToken.accessToken!,
          refreshToken: newToken.refreshToken,
          scopes: newToken.scopes,
          expiresAt: newToken.expiresAt ? new Date(newToken.expiresAt) : undefined
        });
      } catch (dbError) {
        console.error('Failed to update merchant connection:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update token storage'
        });
      }

      res.json({
        success: true,
        expiresAt: newToken.expiresAt,
        scopes: newToken.scopes
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to refresh token'
      });
    }
  }
);

// Revoke access token
router.post('/revoke/:merchantId',
  requireAnyAuth,
  generalRateLimit,
  secureLogger,
  async (req, res) => {
    try {
      const { merchantId } = req.params;

      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can revoke connections
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can revoke Square connections'
        });
      }

      // Get merchant connection
      const connection = await storage.getMerchantConnection(userId, merchantId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Merchant connection not found'
        });
      }

      // Revoke token with Square
      const revokeResult = await squareOAuthService.revokeToken(
        connection.accessToken,
        merchantId
      );

      // Remove connection from database regardless of revoke result
      try {
        await storage.deleteMerchantConnection(connection.id);
      } catch (dbError) {
        console.error('Failed to delete merchant connection:', dbError);
      }

      if (!revokeResult.success) {
        return res.status(400).json({
          success: false,
          error: revokeResult.error || 'Failed to revoke token with Square'
        });
      }

      res.json({
        success: true,
        message: 'Square connection revoked successfully'
      });
    } catch (error: any) {
      console.error('Token revoke error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to revoke token'
      });
    }
  }
);

// Get token status
router.get('/status/:merchantId',
  requireAnyAuth,
  async (req, res) => {
    try {
      const { merchantId } = req.params;

      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;

      // Get merchant connection
      const connection = await storage.getMerchantConnection(userId, merchantId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Merchant connection not found'
        });
      }

      // Get token status
      const statusResult = await squareOAuthService.getTokenStatus(connection.accessToken);

      if (!statusResult.success) {
        return res.status(400).json({
          success: false,
          error: statusResult.error || 'Failed to get token status'
        });
      }

      res.json({
        success: true,
        status: statusResult.status,
        storedExpiresAt: connection.expiresAt,
        isExpired: connection.expiresAt ? new Date() > connection.expiresAt : false
      });
    } catch (error: any) {
      console.error('Token status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get token status'
      });
    }
  }
);

// List merchant connections
router.get('/connections',
  requireAnyAuth,
  async (req, res) => {
    try {
      // Get user information
      const user = req.user as any;
      const userId = user.id || user.claims?.sub;
      const userRole = user.role || user.claims?.role;

      // Only admins can list connections
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can view Square connections'
        });
      }

      // Get all connections for user
      const connections = await storage.getMerchantConnections(userId);

      // Format response without exposing tokens
      const formattedConnections = connections.map(conn => ({
        id: conn.id,
        merchantId: conn.merchantId,
        scopes: conn.scopes,
        expiresAt: conn.expiresAt,
        isExpired: conn.expiresAt ? new Date() > conn.expiresAt : false,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt
      }));

      res.json({
        success: true,
        connections: formattedConnections
      });
    } catch (error: any) {
      console.error('List connections error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list connections'
      });
    }
  }
);

// Get available scopes
router.get('/scopes',
  requireAnyAuth,
  async (req, res) => {
    try {
      if (!squareOAuthService.isAvailable()) {
        return res.status(503).json({
          success: false,
          error: 'OAuth service temporarily unavailable'
        });
      }

      res.json({
        success: true,
        availableScopes: squareOAuthService.getAvailableScopes(),
        requiredScopes: squareOAuthService.getRequiredScopes()
      });
    } catch (error: any) {
      console.error('Get scopes error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get scopes'
      });
    }
  }
);

// Clean up expired states periodically
setInterval(() => {
  const now = new Date();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 60 * 1000); // Every minute

export { router as oauthRouter };