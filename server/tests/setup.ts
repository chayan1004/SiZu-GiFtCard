/**
 * Test Setup Configuration
 * Initializes test environment with mocked services
 */

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Square service to avoid hitting live API
vi.mock('@server/services/SquareService', () => ({
  SquareService: vi.fn().mockImplementation(() => ({
    createGiftCard: vi.fn().mockResolvedValue({
      id: 'mock-square-id',
      state: 'ACTIVE',
      balance: { amount: 5000, currency: 'USD' }
    }),
    redeemGiftCard: vi.fn().mockResolvedValue({
      id: 'mock-square-id',
      state: 'ACTIVE',
      balance: { amount: 2500, currency: 'USD' }
    }),
    getGiftCardBalance: vi.fn().mockResolvedValue(5000),
    refundToGiftCard: vi.fn().mockResolvedValue({
      id: 'mock-refund-id',
      state: 'COMPLETED'
    }),
    getGiftCardActivities: vi.fn().mockResolvedValue([])
  }))
}));

// Mock Email service
vi.mock('@server/services/EmailService', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendGiftCardEmail: vi.fn().mockResolvedValue(true),
    sendRedemptionEmail: vi.fn().mockResolvedValue(true),
    sendFraudAlertEmail: vi.fn().mockResolvedValue(true)
  }))
}));

// Mock PDF service
vi.mock('@server/services/PDFService', () => ({
  PDFService: vi.fn().mockImplementation(() => ({
    generateReceiptPDF: vi.fn().mockResolvedValue('/path/to/mock-receipt.pdf'),
    generateGiftCardPDF: vi.fn().mockResolvedValue('/path/to/mock-giftcard.pdf')
  }))
}));

// Mock QR service
vi.mock('@server/services/QRService', () => ({
  QRService: vi.fn().mockImplementation(() => ({
    generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
    generateQRCodeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr')),
    generateQRCodeSVG: vi.fn().mockResolvedValue('<svg>mock-qr</svg>'),
    parseQRCodeData: vi.fn().mockReturnValue({ type: 'redeem', data: { code: 'TEST123' } }),
    generateRedemptionQRData: vi.fn().mockReturnValue('mock-redemption-data'),
    generateReceiptQRData: vi.fn().mockReturnValue('mock-receipt-data'),
    generateBalanceCheckQRData: vi.fn().mockReturnValue('mock-balance-data'),
    generateGiftCardQRData: vi.fn().mockReturnValue('mock-giftcard-data')
  }))
}));

beforeAll(() => {
  console.log('🧪 Setting up test environment...');
});

afterAll(() => {
  console.log('🏁 Cleaning up test environment...');
});

beforeEach(() => {
  vi.clearAllMocks();
});