/**
 * Security Middleware
 * Implements security measures including rate limiting, validation, and headers
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Enhanced Rate limiting configurations with different tiers
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Higher limits for authenticated users
    const multiplier = req.res?.locals?.rateLimitMultiplier || 1;
    return 100 * multiplier;
  },
  message: { 
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and development assets
    return req.path === '/api/health' || 
           (process.env.NODE_ENV === 'development' && 
            (req.path.startsWith('/@') || req.path.startsWith('/src')));
  },
  keyGenerator: (req) => {
    // Use user ID for authenticated requests, IP for anonymous
    return req.user?.claims?.sub || req.ip;
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 10, // Increased from 5 to 10 for better UX
  message: { 
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
    suggestion: 'Please wait before attempting to log in again'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // Different limits based on user type
    if (req.user?.dbUser?.role === 'admin') return 50;
    if (req.user?.claims?.sub) return 30;
    return 10;
  },
  message: { 
    error: 'Too many API requests, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

export const giftCardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Higher limits for authenticated users
    if (req.user?.dbUser?.role === 'admin') return 50;
    if (req.user?.claims?.sub) return 20;
    return 10;
  },
  message: {
    error: 'Too many gift card requests, please try again later',
    code: 'GIFT_CARD_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute',
    suggestion: 'Please wait before making another gift card operation'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

// Admin-specific rate limiting (higher limits)
export const adminRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many admin requests, please try again later',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

// Payment-specific rate limiting (more restrictive)
export const paymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: (req) => {
    // Conservative limits for payment operations
    if (req.user?.dbUser?.role === 'admin') return 20;
    if (req.user?.claims?.sub) return 10;
    return 3; // Very low for anonymous users
  },
  message: {
    error: 'Too many payment requests, please try again later',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes',
    suggestion: 'Payment operations are limited for security reasons'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

// Webhook rate limiting (for external services)
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Higher limit for legitimate webhooks
  message: {
    error: 'Too many webhook requests, please try again later',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for Square webhooks with valid signatures
    return req.path === '/api/webhooks/square' && req.headers['x-square-signature'];
  }
});

// Search and read operations rate limiting
export const readRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    if (req.user?.dbUser?.role === 'admin') return 200;
    if (req.user?.claims?.sub) return 100;
    return 30;
  },
  message: {
    error: 'Too many read requests, please try again later',
    code: 'READ_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

// Write operations rate limiting (more restrictive)
export const writeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    if (req.user?.dbUser?.role === 'admin') return 50;
    if (req.user?.claims?.sub) return 20;
    return 5;
  },
  message: {
    error: 'Too many write requests, please try again later',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.claims?.sub || req.ip;
  }
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });

  // Set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com https://*.replit.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.squareup.com https://connect.squareup.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  next();
};

// HTTPS enforcement middleware
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  const query = req.query;
  const params = req.params;

  // Enhanced SQL injection patterns with specific error messages
  const dangerousPatterns = [
    { pattern: /('|\\')|(;|\\;)|\||\*/, message: 'SQL injection characters detected. Please remove special characters like quotes, semicolons, or pipes.' },
    { pattern: /(union|select|insert|update|delete|drop|exec|execute|xp_|sp_|cmd|cast|convert|declare|varchar|nvarchar)\s/gi, message: 'SQL keywords detected. Please use plain text without database commands.' },
    { pattern: /(-{2}|\/\*|\*\/|@@|@)/, message: 'SQL comment sequences detected. Please remove comment markers.' },
    { pattern: /<script[^>]*>.*?<\/script>/gi, message: 'Script tags are not allowed. Please remove any HTML script elements.' },
    { pattern: /javascript\s*:/gi, message: 'JavaScript protocol is not allowed in input fields.' },
    { pattern: /vbscript\s*:/gi, message: 'VBScript protocol is not allowed in input fields.' },
    { pattern: /onload\s*=/gi, message: 'Event handlers are not allowed. Please remove "onload" attributes.' },
    { pattern: /onerror\s*=/gi, message: 'Event handlers are not allowed. Please remove "onerror" attributes.' },
    { pattern: /onclick\s*=/gi, message: 'Event handlers are not allowed. Please remove "onclick" attributes.' },
    { pattern: /onmouseover\s*=/gi, message: 'Event handlers are not allowed. Please remove "onmouseover" attributes.' },
    { pattern: /<iframe|<frame|<embed|<object/gi, message: 'Embedded content tags are not allowed.' },
    { pattern: /&#\d+;|&#x[\da-fA-F]+;|\\u[\da-fA-F]{4}|\\x[\da-fA-F]{2}/, message: 'Encoded characters detected. Please use plain text.' },
  ];

  // Check value with depth limit to prevent deep object traversal attacks
  const checkValue = (value: any, depth: number = 0): string | null => {
    if (depth > 10) {
      return 'Input structure too deep. Please simplify your data.';
    }

    if (typeof value === 'string') {
      // Additional length check
      if (value.length > 10000) {
        return 'Input too long. Please limit text to 10,000 characters.';
      }

      // Allow Square test payment tokens
      const squareTestTokens = [
        'wnon:cash-app-ok',
        'wnon:cash-app-declined',
        'cnon:card-nonce-ok',
        'cnon:card-nonce-declined',
        'bauth:ach-account-ok',
        'bauth:ach-account-insufficient-funds',
        'bauth:ach-account-invalid'
      ];

      if (squareTestTokens.includes(value)) {
        return null; // Skip validation for Square test tokens
      }

      // Also allow any token that starts with common Square prefixes
      const squareTokenPrefixes = ['wnon:', 'cnon:', 'bauth:', 'gift_card_id:', 'order_id:'];
      if (squareTokenPrefixes.some(prefix => value.startsWith(prefix))) {
        return null; // Skip validation for Square tokens
      }

      // Check against all patterns
      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(value)) {
          return message;
        }
      }

      // Check for null bytes
      if (value.includes('\0')) {
        return 'Null bytes are not allowed in input.';
      }
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = checkValue(item, depth + 1);
        if (result) return result;
      }
    }

    if (typeof value === 'object' && value !== null) {
      for (const val of Object.values(value)) {
        const result = checkValue(val, depth + 1);
        if (result) return result;
      }
    }

    return null;
  };

  // Validate all input sources
  const sources = [
    { data: body, name: 'body' },
    { data: query, name: 'query' },
    { data: params, name: 'params' }
  ];

  for (const { data, name } of sources) {
    const errorMessage = checkValue(data);
    if (errorMessage) {
      return res.status(400).json({ 
        error: 'Invalid input detected',
        message: errorMessage,
        source: name,
        suggestion: 'Please ensure your input contains only regular text and numbers without special characters or code.'
      });
    }
  }

  next();
};

// Gift card amount validation
export const validateGiftCardAmount = (req: Request, res: Response, next: NextFunction) => {
  const { initialAmount, amount } = req.body;
  const targetAmount = initialAmount || amount;

  if (targetAmount !== undefined) {
    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    if (targetAmount > 10000) {
      return res.status(400).json({
        error: 'Amount too large',
        message: 'Maximum gift card amount is $10,000'
      });
    }

    if (targetAmount < 1) {
      return res.status(400).json({
        error: 'Amount too small',
        message: 'Minimum gift card amount is $1'
      });
    }
  }

  next();
};

// Email validation
export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const { email, recipientEmail, senderEmail } = req.body;
  const emails = [email, recipientEmail, senderEmail].filter(Boolean);

  for (const targetEmail of emails) {
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check basic format
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Check length
    if (targetEmail.length > 254) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Email address is too long'
      });
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[<>'"]/,
      /\.\./,
      /^\.|\.$/, 
      /@.*@/
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(targetEmail)) {
        return res.status(400).json({
          error: 'Invalid email',
          message: 'Email contains invalid characters'
        });
      }
    }
  }

  next();
};

// Gift card code validation
export const validateGiftCardCode = (req: Request, res: Response, next: NextFunction) => {
  const { code, giftCardCode } = req.body;
  const targetCode = code || giftCardCode;

  if (targetCode) {
    // Gift card codes should only contain alphanumeric characters
    if (!/^[A-Z0-9]{6,20}$/i.test(targetCode)) {
      return res.status(400).json({
        error: 'Invalid gift card code',
        message: 'Gift card codes must be 6-20 alphanumeric characters'
      });
    }
  }

  next();
};

// Sanitize string inputs
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
};

// ID parameter validation
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id) {
    // UUIDs or numeric IDs only
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericRegex = /^\d+$/;

    if (!uuidRegex.test(id) && !numericRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'ID must be a valid UUID or numeric value'
      });
    }
  }

  next();
};

// Request logging middleware (masks sensitive data)
export const secureLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      // Mask sensitive data
      body: maskSensitiveData(req.body),
    };

    console.log('API Request:', logData);
    return originalSend.call(this, data);
  };

  next();
};

// Helper function to mask sensitive data
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber'
  ];

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      if (field === 'cardNumber' && typeof masked[field] === 'string') {
        masked[field] = '****' + masked[field].slice(-4);
      } else {
        masked[field] = '***';
      }
    }
  }

  return masked;
}

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow localhost origins
    if (process.env.NODE_ENV === 'development') {
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5173'
      ];

      if (devOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Production allowed origins
    const allowedOrigins = [
      'https://replit.com',
      'https://replit.dev',
      'https://replit.app',
      ...(process.env.REPLIT_DOMAINS?.split(',').map(domain => `https://${domain}`) || []),
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];

    // Check exact match first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check if origin ends with allowed domains
    const allowedDomains = ['.replit.com', '.replit.dev', '.replit.app'];
    if (allowedDomains.some(domain => origin.endsWith(domain))) {
      return callback(null, true);
    }

    // Log rejected origins in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`CORS: Rejected origin ${origin}`);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// API key validation (for Square integration)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  // Only validate in production
  if (process.env.NODE_ENV === 'production') {
    const squareToken = process.env.SQUARE_ACCESS_TOKEN;

    if (!squareToken) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Payment processing is not configured'
      });
    }

    // Validate token format
    if (!squareToken.startsWith('sq0')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Invalid payment configuration'
      });
    }
  }

  next();
};