/**
 * Enhanced Authentication Middleware
 * Comprehensive role-based access control with proper error handling
 */

import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

/**
 * Enhanced authentication check with token refresh
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'UNAUTHORIZED'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is still valid
    if (now <= user.expires_at) {
      return next();
    }

    // Try to refresh token if expired
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Authentication expired',
        message: 'Session has expired, please log in again',
        code: 'TOKEN_EXPIRED'
      });
    }

    try {
      const { getOidcConfig, client, updateUserSession } = await import('../replitAuth');
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Unable to refresh session, please log in again',
        code: 'REFRESH_FAILED'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication check failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Admin role requirement middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First ensure user is authenticated
    const authResult = await new Promise<boolean>((resolve) => {
      requireAuth(req, res, (err?: any) => {
        if (err || res.headersSent) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    if (!authResult || res.headersSent) {
      return; // Authentication middleware already sent response
    }

    // Check admin role
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'User ID not found in session',
        code: 'INVALID_SESSION'
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'This resource requires administrator privileges',
        code: 'INSUFFICIENT_PRIVILEGES',
        required_role: 'admin',
        current_role: user.role
      });
    }

    // Attach user info to request for downstream use
    req.user = { ...req.user, dbUser: user };
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Role verification failed',
      code: 'ROLE_CHECK_ERROR'
    });
  }
};

/**
 * Customer authentication (less strict than admin)
 * Allows both authenticated users and customers
 */
export const requireCustomerAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for Replit auth first
    if (req.isAuthenticated && req.isAuthenticated()) {
      const userId = req.user?.claims?.sub;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          req.user = { ...req.user, dbUser: user };
          return next();
        }
      }
    }

    // Check for customer session (email-based)
    if (req.session?.customerEmail) {
      req.user = { customerEmail: req.session.customerEmail, type: 'customer' };
      return next();
    }

    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in or provide valid credentials',
      code: 'CUSTOMER_AUTH_REQUIRED'
    });
  } catch (error) {
    console.error('Customer auth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Customer authentication failed',
      code: 'CUSTOMER_AUTH_ERROR'
    });
  }
};

/**
 * Flexible authentication that accepts any valid auth method
 */
export const requireAnyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try Replit auth first
    if (req.isAuthenticated && req.isAuthenticated()) {
      const userId = req.user?.claims?.sub;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          req.user = { ...req.user, dbUser: user };
          return next();
        }
      }
    }

    // Try customer session
    if (req.session?.customerEmail) {
      req.user = { customerEmail: req.session.customerEmail, type: 'customer' };
      return next();
    }

    // Try API key authentication (for external integrations)
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
      req.user = { type: 'api', apiKey: true };
      return next();
    }

    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Valid authentication credentials required',
      code: 'AUTH_REQUIRED',
      accepted_methods: ['replit_auth', 'customer_session', 'api_key']
    });
  } catch (error) {
    console.error('Any auth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication verification failed',
      code: 'AUTH_VERIFICATION_ERROR'
    });
  }
};

/**
 * Optional authentication (sets user if available, but doesn't require it)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to authenticate but don't fail if not authenticated
    if (req.isAuthenticated && req.isAuthenticated()) {
      const userId = req.user?.claims?.sub;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          req.user = { ...req.user, dbUser: user };
        }
      }
    } else if (req.session?.customerEmail) {
      req.user = { customerEmail: req.session.customerEmail, type: 'customer' };
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Don't fail on optional auth errors
    next();
  }
};

/**
 * Resource ownership validation
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user?.claims?.sub || req.user?.dbUser?.id;

      if (!userId || !resourceId) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'User ID or resource ID missing',
          code: 'MISSING_IDENTIFIERS'
        });
      }

      // Admin can access all resources
      if (req.user?.dbUser?.role === 'admin') {
        return next();
      }

      // Check if user owns the resource (this would need to be customized per resource type)
      // For now, this is a placeholder that checks if the resource ID matches the user ID
      // In practice, you'd query the database to verify ownership
      const hasAccess = await verifyResourceOwnership(userId, resourceId, req.route?.path);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Resource ownership verification failed',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

/**
 * Helper function to verify resource ownership
 * This should be expanded based on your specific resource types
 */
async function verifyResourceOwnership(userId: string, resourceId: string, routePath?: string): Promise<boolean> {
  try {
    // This is a simplified example - you'd implement actual ownership checks here
    // For gift cards, transactions, etc.
    
    if (routePath?.includes('giftcards')) {
      // Check if user owns the gift card
      const giftCard = await storage.getGiftCard(resourceId);
      return giftCard?.userId === userId;
    }

    if (routePath?.includes('transactions')) {
      // Check if user owns the transaction
      const transaction = await storage.getTransaction(resourceId);
      return transaction?.userId === userId;
    }

    if (routePath?.includes('orders')) {
      // Check if user owns the order
      const orders = await storage.getUserOrders(userId, 1, 1);
      return orders.orders.some(order => order.id === resourceId);
    }

    // Default to false for unknown resource types
    return false;
  } catch (error) {
    console.error('Resource ownership check failed:', error);
    return false;
  }
}

/**
 * Rate limit bypass for authenticated users (higher limits)
 */
export const setAuthenticatedLimits = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    // Set higher rate limits for authenticated users
    res.locals.rateLimitMultiplier = req.user.dbUser?.role === 'admin' ? 10 : 3;
  }
  next();
};

/**
 * Session validation middleware
 */
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session integrity
    if (req.session) {
      // Validate session data structure
      const sessionData = req.session as any;
      
      // Check for session tampering
      if (sessionData.userId && typeof sessionData.userId !== 'string') {
        console.warn('Session tampering detected: invalid userId type');
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        return res.status(401).json({ 
          error: 'Invalid session',
          message: 'Session data corrupted, please log in again',
          code: 'SESSION_CORRUPTED'
        });
      }

      // Check session age
      const sessionAge = Date.now() - (sessionData.createdAt || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (sessionAge > maxAge) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        return res.status(401).json({ 
          error: 'Session expired',
          message: 'Session has expired, please log in again',
          code: 'SESSION_EXPIRED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    next(); // Don't fail on session validation errors
  }
};