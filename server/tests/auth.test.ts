/**
 * Authentication Tests
 * Tests auth middleware and user management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '@server/storage';

// Mock storage
vi.mock('@server/storage', () => ({
  storage: {
    getUser: vi.fn(),
    upsertUser: vi.fn()
  }
}));

const mockStorage = vi.mocked(storage);

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { claims: { sub: 'test-user-id' } };
  req.isAuthenticated = () => true;
  next();
};

describe('Authentication Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
  });

  describe('GET /api/auth/user', () => {
    it('should return user data for authenticated user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };

      mockStorage.getUser.mockResolvedValue(mockUser);

      app.get('/api/auth/user', mockAuth, async (req: any, res) => {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          res.json(user);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch user' });
        }
      });

      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(mockStorage.getUser).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle user not found', async () => {
      mockStorage.getUser.mockResolvedValue(undefined);

      app.get('/api/auth/user', mockAuth, async (req: any, res) => {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          res.json(user);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch user' });
        }
      });

      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body).toBeUndefined();
    });

    it('should handle storage errors', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('Database error'));

      app.get('/api/auth/user', mockAuth, async (req: any, res) => {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          res.json(user);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch user' });
        }
      });

      const response = await request(app)
        .get('/api/auth/user')
        .expect(500);

      expect(response.body).toEqual({ message: 'Failed to fetch user' });
    });
  });

  describe('Admin middleware', () => {
    const requireAdmin = async (req: any, res: any, next: any) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      } catch (error) {
        res.status(500).json({ message: 'Authorization check failed' });
      }
    };

    it('should allow admin users', async () => {
      const mockAdminUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'admin'
      };

      mockStorage.getUser.mockResolvedValue(mockAdminUser);

      app.get('/api/admin/test', mockAuth, requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/api/admin/test')
        .expect(200);

      expect(response.body).toEqual({ message: 'Admin access granted' });
    });

    it('should deny non-admin users', async () => {
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
        role: 'user'
      };

      mockStorage.getUser.mockResolvedValue(mockRegularUser);

      app.get('/api/admin/test', mockAuth, requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/api/admin/test')
        .expect(403);

      expect(response.body).toEqual({ message: 'Admin access required' });
    });

    it('should deny users not found in database', async () => {
      mockStorage.getUser.mockResolvedValue(undefined);

      app.get('/api/admin/test', mockAuth, requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/api/admin/test')
        .expect(403);

      expect(response.body).toEqual({ message: 'Admin access required' });
    });
  });
});