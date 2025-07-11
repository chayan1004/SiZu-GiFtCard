import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { app } from '../../index';
import { storage } from '../../storage';

// Mock authentication middleware for testing
vi.mock('../../replitAuth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { claims: { sub: 'test-user-123' } };
    next();
  },
  setupAuth: vi.fn(),
}));

// Mock Square Customer Service
vi.mock('../../services/SquareCustomerService', () => ({
  SquareCustomerService: vi.fn().mockImplementation(() => ({
    isAvailable: () => true,
    createCustomer: vi.fn().mockResolvedValue({ id: 'square-customer-123' }),
    addCardToCustomer: vi.fn().mockResolvedValue({
      id: 'square-card-123',
      cardBrand: 'VISA',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      cardholderName: 'John Doe',
    }),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    parseCardForStorage: vi.fn().mockReturnValue({
      squareCardId: 'square-card-123',
      cardBrand: 'VISA',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      cardholderName: 'John Doe',
    }),
  })),
}));

describe('Saved Cards API Integration Tests', () => {
  let testApp: Express;
  let server: any;

  beforeAll(async () => {
    // Create test user
    await storage.upsertUser({
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    
    // Get the test app
    const { app, httpServer } = await import('../../index');
    testApp = app;
    server = httpServer;
  });

  afterAll(async () => {
    // Clean up test data
    const cards = await storage.getUserSavedCards('test-user-123');
    for (const card of cards) {
      await storage.deleteSavedCard(card.id, 'test-user-123');
    }
    
    if (server) {
      server.close();
    }
  });

  describe('GET /api/cards', () => {
    it('should return empty array when user has no cards', async () => {
      const response = await request(testApp)
        .get('/api/cards')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return user saved cards', async () => {
      // Add a test card
      await storage.addSavedCard({
        id: 'test-card-1',
        userId: 'test-user-123',
        squareCardId: 'square-test-1',
        cardBrand: 'VISA',
        last4: '1234',
        expMonth: 12,
        expYear: 2025,
        isDefault: true,
      });

      const response = await request(testApp)
        .get('/api/cards')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        cardBrand: 'VISA',
        last4: '1234',
        isDefault: true,
      });
    });
  });

  describe('POST /api/cards', () => {
    it('should add a new card successfully', async () => {
      const response = await request(testApp)
        .post('/api/cards')
        .send({
          sourceId: 'test-nonce-123',
          nickname: 'My Test Card',
          isDefault: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        cardBrand: 'VISA',
        last4: '4242',
        nickname: 'My Test Card',
        isDefault: true,
      });
    });

    it('should reject invalid request data', async () => {
      const response = await request(testApp)
        .post('/api/cards')
        .send({
          // Missing sourceId
          nickname: 'My Test Card',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid request data');
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete a card successfully', async () => {
      // Add a test card
      const card = await storage.addSavedCard({
        id: 'test-card-delete',
        userId: 'test-user-123',
        squareCardId: 'square-test-delete',
        cardBrand: 'MASTERCARD',
        last4: '5678',
        expMonth: 6,
        expYear: 2026,
        isDefault: false,
      });

      const response = await request(testApp)
        .delete(`/api/cards/${card.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Card deleted successfully');

      // Verify card is deleted
      const deletedCard = await storage.getSavedCardById(card.id, 'test-user-123');
      expect(deletedCard).toBeUndefined();
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(testApp)
        .delete('/api/cards/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Card not found');
    });
  });

  describe('PUT /api/cards/:id/default', () => {
    it('should set card as default', async () => {
      // Add two test cards
      const card1 = await storage.addSavedCard({
        id: 'test-card-default-1',
        userId: 'test-user-123',
        squareCardId: 'square-test-default-1',
        cardBrand: 'VISA',
        last4: '1111',
        expMonth: 3,
        expYear: 2027,
        isDefault: true,
      });

      const card2 = await storage.addSavedCard({
        id: 'test-card-default-2',
        userId: 'test-user-123',
        squareCardId: 'square-test-default-2',
        cardBrand: 'AMEX',
        last4: '2222',
        expMonth: 9,
        expYear: 2028,
        isDefault: false,
      });

      const response = await request(testApp)
        .put(`/api/cards/${card2.id}/default`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Default card updated successfully');

      // Verify card2 is now default
      const updatedCard2 = await storage.getSavedCardById(card2.id, 'test-user-123');
      expect(updatedCard2?.isDefault).toBe(true);

      // Verify card1 is no longer default
      const updatedCard1 = await storage.getSavedCardById(card1.id, 'test-user-123');
      expect(updatedCard1?.isDefault).toBe(false);
    });
  });
});