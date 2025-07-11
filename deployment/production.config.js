/**
 * Production Deployment Configuration
 * Secure configuration for production deployment
 */

const productionConfig = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    trustProxy: true,
    
    // Security settings
    security: {
      httpsOnly: true,
      secureHeaders: true,
      rateLimiting: true,
      corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://replit.com'],
    },
    
    // Session configuration
    session: {
      secret: process.env.SESSION_SECRET,
      secure: true,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
    },
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
    },
  },

  // Square API configuration
  square: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    locationId: process.env.SQUARE_LOCATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT || 'production',
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  },

  // Email configuration
  email: {
    smtp: {
      host: process.env.MAILGUN_SMTP_HOST,
      port: process.env.MAILGUN_SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS,
      },
    },
    from: process.env.FROM_EMAIL || 'noreply@sizu.com',
  },

  // File storage configuration
  storage: {
    receipts: {
      path: process.env.RECEIPTS_PATH || './receipts',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    pdfs: {
      path: process.env.PDFS_PATH || './pdfs',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    },
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableRequestLogging: true,
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFile: process.env.LOG_FILE || './logs/app.log',
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000,
  },

  // Rate limiting
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
    },
    giftCards: {
      windowMs: 60 * 1000, // 1 minute
      max: 10,
    },
  },

  // Monitoring and health checks
  monitoring: {
    enabled: true,
    healthCheckPath: '/health',
    metricsPath: '/metrics',
    enableUptime: true,
  },

  // Feature flags
  features: {
    squareIntegration: process.env.ENABLE_SQUARE === 'true',
    emailNotifications: process.env.ENABLE_EMAIL === 'true',
    fraudDetection: process.env.ENABLE_FRAUD_DETECTION === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
  },

  // Validation
  validation: {
    strictMode: true,
    maxGiftCardAmount: 10000,
    minGiftCardAmount: 1,
    maxCustomMessageLength: 500,
    allowedDesigns: ['classic', 'modern', 'premium', 'festive', 'elegant'],
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'REPLIT_DOMAINS',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Validate Square configuration if enabled
if (productionConfig.features.squareIntegration) {
  const requiredSquareVars = [
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_LOCATION_ID',
  ];

  const missingSquareVars = requiredSquareVars.filter(varName => !process.env[varName]);
  
  if (missingSquareVars.length > 0) {
    console.warn('Square integration enabled but missing variables:', missingSquareVars);
    productionConfig.features.squareIntegration = false;
  }
}

// Validate email configuration if enabled
if (productionConfig.features.emailNotifications) {
  const requiredEmailVars = [
    'MAILGUN_SMTP_HOST',
    'MAILGUN_SMTP_USER',
    'MAILGUN_SMTP_PASS',
  ];

  const missingEmailVars = requiredEmailVars.filter(varName => !process.env[varName]);
  
  if (missingEmailVars.length > 0) {
    console.warn('Email notifications enabled but missing variables:', missingEmailVars);
    productionConfig.features.emailNotifications = false;
  }
}

export default productionConfig;