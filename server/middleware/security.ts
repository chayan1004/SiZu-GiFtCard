/**
 * Security Middleware
 * Implements security measures including rate limiting, validation, and headers
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const giftCardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 gift card operations per minute
  message: {
    error: 'Too many gift card requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
  
  // Check for common injection patterns
  const dangerousPatterns = [
    /('|\\')|(;|\\;)|\||\*/,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(body)) {
    return res.status(400).json({ 
      error: 'Invalid input detected',
      message: 'Request contains potentially dangerous content'
    });
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
  const { email, recipientEmail } = req.body;
  const targetEmail = email || recipientEmail;

  if (targetEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
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
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow Replit domains
    const allowedOrigins = [
      'https://replit.com',
      'https://replit.dev',
      ...(process.env.REPLIT_DOMAINS?.split(',') || [])
    ];

    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
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