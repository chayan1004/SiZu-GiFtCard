/**
 * Security Tests
 * Tests security measures, rate limiting, and input validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Security Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize SQL injection attempts', async () => {
      app.post('/api/test', (req, res) => {
        const { input } = req.body;
        // Simulate basic SQL injection protection
        if (input.includes("'") || input.includes('"') || input.includes(';')) {
          return res.status(400).json({ message: 'Invalid input detected' });
        }
        res.json({ message: 'Valid input' });
      });

      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '" OR 1=1 --',
        '1; DELETE FROM giftcards;',
        "' UNION SELECT * FROM users --"
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/test')
          .send({ input })
          .expect(400);

        expect(response.body.message).toBe('Invalid input detected');
      }
    });

    it('should validate gift card amounts', async () => {
      app.post('/api/giftcards/validate', (req, res) => {
        const { amount } = req.body;
        
        // Validate amount is positive number
        if (typeof amount !== 'number' || amount <= 0) {
          return res.status(400).json({ message: 'Invalid amount' });
        }
        
        // Validate reasonable limits
        if (amount > 10000) {
          return res.status(400).json({ message: 'Amount too large' });
        }
        
        if (amount < 1) {
          return res.status(400).json({ message: 'Amount too small' });
        }

        res.json({ message: 'Valid amount' });
      });

      // Test invalid amounts
      const invalidAmounts = [-10, 0, 'abc', null, undefined, 10001];
      
      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post('/api/giftcards/validate')
          .send({ amount })
          .expect(400);

        expect(response.body.message).toMatch(/Invalid amount|Amount too/);
      }

      // Test valid amount
      const response = await request(app)
        .post('/api/giftcards/validate')
        .send({ amount: 50 })
        .expect(200);

      expect(response.body.message).toBe('Valid amount');
    });

    it('should sanitize XSS attempts', async () => {
      app.post('/api/test', (req, res) => {
        const { message } = req.body;
        
        // Basic XSS protection
        if (message.includes('<script>') || message.includes('javascript:')) {
          return res.status(400).json({ message: 'Invalid content detected' });
        }
        
        res.json({ message: 'Valid content' });
      });

      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">'
      ];

      for (const attempt of xssAttempts) {
        const response = await request(app)
          .post('/api/test')
          .send({ message: attempt })
          .expect(400);

        expect(response.body.message).toBe('Invalid content detected');
      }
    });

    it('should validate email formats', async () => {
      app.post('/api/validate-email', (req, res) => {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        
        res.json({ message: 'Valid email' });
      });

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com',
        'user@domain..com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/validate-email')
          .send({ email })
          .expect(400);

        expect(response.body.message).toBe('Invalid email format');
      }

      // Test valid email
      const response = await request(app)
        .post('/api/validate-email')
        .send({ email: 'user@domain.com' })
        .expect(200);

      expect(response.body.message).toBe('Valid email');
    });
  });

  describe('Rate Limiting', () => {
    it('should implement basic rate limiting', async () => {
      let requestCount = 0;
      
      app.use('/api/limited', (req, res, next) => {
        requestCount++;
        if (requestCount > 10) {
          return res.status(429).json({ message: 'Too many requests' });
        }
        next();
      });

      app.get('/api/limited', (req, res) => {
        res.json({ message: 'Success' });
      });

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/limited')
          .expect(200);
      }

      // Next request should be rate limited
      const response = await request(app)
        .get('/api/limited')
        .expect(429);

      expect(response.body.message).toBe('Too many requests');
    });

    it('should rate limit authentication attempts', async () => {
      let loginAttempts = 0;
      
      app.post('/api/auth/login', (req, res) => {
        loginAttempts++;
        
        if (loginAttempts > 5) {
          return res.status(429).json({ message: 'Too many login attempts' });
        }
        
        // Simulate failed login
        res.status(401).json({ message: 'Invalid credentials' });
      });

      // Make failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
          .expect(401);
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'wrong' })
        .expect(429);

      expect(response.body.message).toBe('Too many login attempts');
    });
  });

  describe('HTTPS and Security Headers', () => {
    it('should enforce HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'production' && !req.secure) {
          return res.status(400).json({ message: 'HTTPS required' });
        }
        next();
      });

      app.get('/api/test', (req, res) => {
        res.json({ message: 'Success' });
      });

      const response = await request(app)
        .get('/api/test')
        .expect(400);

      expect(response.body.message).toBe('HTTPS required');

      process.env.NODE_ENV = originalEnv;
    });

    it('should set security headers', async () => {
      app.use((req, res, next) => {
        res.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Content-Security-Policy': "default-src 'self'"
        });
        next();
      });

      app.get('/api/test', (req, res) => {
        res.json({ message: 'Success' });
      });

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
      expect(response.headers['content-security-policy']).toBe("default-src 'self'");
    });
  });

  describe('Session and Token Security', () => {
    it('should validate session tokens', async () => {
      app.use('/api/protected', (req, res, next) => {
        const token = req.headers.authorization;
        
        if (!token) {
          return res.status(401).json({ message: 'No token provided' });
        }
        
        if (token !== 'Bearer valid-token') {
          return res.status(401).json({ message: 'Invalid token' });
        }
        
        next();
      });

      app.get('/api/protected', (req, res) => {
        res.json({ message: 'Protected resource' });
      });

      // Test without token
      await request(app)
        .get('/api/protected')
        .expect(401);

      // Test with invalid token
      await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test with valid token
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Protected resource');
    });

    it('should prevent CSRF attacks', async () => {
      app.use('/api/csrf-protected', (req, res, next) => {
        const csrfToken = req.headers['x-csrf-token'];
        const origin = req.headers.origin;
        
        if (!csrfToken) {
          return res.status(403).json({ message: 'CSRF token required' });
        }
        
        if (origin !== 'https://trusted-domain.com') {
          return res.status(403).json({ message: 'Invalid origin' });
        }
        
        next();
      });

      app.post('/api/csrf-protected', (req, res) => {
        res.json({ message: 'CSRF protected action' });
      });

      // Test without CSRF token
      await request(app)
        .post('/api/csrf-protected')
        .expect(403);

      // Test with wrong origin
      await request(app)
        .post('/api/csrf-protected')
        .set('X-CSRF-Token', 'valid-token')
        .set('Origin', 'https://malicious-domain.com')
        .expect(403);

      // Test with valid token and origin
      const response = await request(app)
        .post('/api/csrf-protected')
        .set('X-CSRF-Token', 'valid-token')
        .set('Origin', 'https://trusted-domain.com')
        .expect(200);

      expect(response.body.message).toBe('CSRF protected action');
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in responses', async () => {
      app.get('/api/user', (req, res) => {
        const user = {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'hashed-password', // Should not be exposed
          apiKey: 'secret-api-key' // Should not be exposed
        };

        // Remove sensitive fields
        const { password, apiKey, ...publicUser } = user;
        res.json(publicUser);
      });

      const response = await request(app)
        .get('/api/user')
        .expect(200);

      expect(response.body).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(response.body.password).toBeUndefined();
      expect(response.body.apiKey).toBeUndefined();
    });

    it('should mask sensitive data in logs', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      app.post('/api/sensitive', (req, res) => {
        const { cardNumber, cvv, ...safeData } = req.body;
        
        // Log only non-sensitive data
        console.log('Request data:', {
          ...safeData,
          cardNumber: cardNumber ? '****' + cardNumber.slice(-4) : undefined,
          cvv: cvv ? '***' : undefined
        });

        res.json({ message: 'Data processed' });
      });

      await request(app)
        .post('/api/sensitive')
        .send({
          cardNumber: '1234567890123456',
          cvv: '123',
          email: 'user@example.com'
        })
        .expect(200);

      expect(logSpy).toHaveBeenCalledWith('Request data:', {
        email: 'user@example.com',
        cardNumber: '****3456',
        cvv: '***'
      });

      logSpy.mockRestore();
    });
  });
});