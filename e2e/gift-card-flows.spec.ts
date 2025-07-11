/**
 * E2E Tests for Gift Card Flows
 * Tests complete user journeys for gift card operations
 */

import { test, expect } from '@playwright/test';

test.describe('Gift Card Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete gift card purchase flow', async ({ page }) => {
    // Navigate to shop page
    await page.click('text=Shop');
    await page.waitForURL('**/shop');

    // Fill out gift card form
    await page.fill('[name="initialAmount"]', '50');
    await page.selectOption('[name="design"]', 'classic');
    await page.fill('[name="recipientName"]', 'John Doe');
    await page.fill('[name="recipientEmail"]', 'john@example.com');
    await page.fill('[name="senderName"]', 'Jane Smith');
    await page.fill('[name="customMessage"]', 'Happy Birthday!');

    // Preview gift card
    await page.click('text=Preview');
    
    // Verify preview shows correct information
    await expect(page.locator('[data-testid="gift-card-preview"]')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Happy Birthday!')).toBeVisible();

    // Submit form (this would normally process payment)
    await page.click('text=Create Gift Card');
    
    // Wait for success message or redirect
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    await expect(page.locator('text=Gift card created successfully')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.click('text=Shop');
    await page.waitForURL('**/shop');

    // Try to submit empty form
    await page.click('text=Create Gift Card');
    
    // Should show validation errors
    await expect(page.locator('text=Amount is required')).toBeVisible();
    await expect(page.locator('text=Recipient name is required')).toBeVisible();

    // Test invalid amount
    await page.fill('[name="initialAmount"]', '-10');
    await page.click('text=Create Gift Card');
    await expect(page.locator('text=Amount must be positive')).toBeVisible();

    // Test invalid email
    await page.fill('[name="recipientEmail"]', 'invalid-email');
    await page.click('text=Create Gift Card');
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should show design options', async ({ page }) => {
    await page.click('text=Shop');
    await page.waitForURL('**/shop');

    // Check design options are available
    await expect(page.locator('[name="design"]')).toBeVisible();
    
    // Select different designs and verify preview updates
    await page.selectOption('[name="design"]', 'modern');
    await page.fill('[name="initialAmount"]', '25');
    await page.click('text=Preview');
    
    await expect(page.locator('[data-testid="gift-card-preview"]')).toHaveClass(/modern/);
  });
});

test.describe('Gift Card Redemption Flow', () => {
  test('should redeem gift card successfully', async ({ page }) => {
    await page.goto('/redeem');

    // Fill in gift card code
    await page.fill('[name="code"]', 'GCTEST123456');
    await page.fill('[name="amount"]', '25');

    // Submit redemption
    await page.click('text=Redeem');

    // Wait for success message
    await page.waitForSelector('[data-testid="redemption-success"]', { timeout: 10000 });
    await expect(page.locator('text=Gift card redeemed successfully')).toBeVisible();
    await expect(page.locator('text=New balance:')).toBeVisible();
  });

  test('should handle invalid gift card code', async ({ page }) => {
    await page.goto('/redeem');

    await page.fill('[name="code"]', 'INVALID-CODE');
    await page.fill('[name="amount"]', '25');
    await page.click('text=Redeem');

    await expect(page.locator('text=Gift card not found')).toBeVisible();
  });

  test('should handle insufficient balance', async ({ page }) => {
    await page.goto('/redeem');

    await page.fill('[name="code"]', 'GCTEST123456');
    await page.fill('[name="amount"]', '1000'); // Amount higher than balance
    await page.click('text=Redeem');

    await expect(page.locator('text=Insufficient balance')).toBeVisible();
  });

  test('should validate redemption amount', async ({ page }) => {
    await page.goto('/redeem');

    // Test negative amount
    await page.fill('[name="code"]', 'GCTEST123456');
    await page.fill('[name="amount"]', '-10');
    await page.click('text=Redeem');

    await expect(page.locator('text=Amount must be positive')).toBeVisible();

    // Test zero amount
    await page.fill('[name="amount"]', '0');
    await page.click('text=Redeem');

    await expect(page.locator('text=Amount must be greater than zero')).toBeVisible();
  });
});

test.describe('Balance Check Flow', () => {
  test('should check gift card balance', async ({ page }) => {
    await page.goto('/balance');

    await page.fill('[name="code"]', 'GCTEST123456');
    await page.click('text=Check Balance');

    await page.waitForSelector('[data-testid="balance-result"]', { timeout: 10000 });
    await expect(page.locator('text=Current Balance:')).toBeVisible();
    await expect(page.locator('[data-testid="balance-amount"]')).toBeVisible();
  });

  test('should handle QR code scanning', async ({ page }) => {
    await page.goto('/balance');

    // Click QR scanner button
    await page.click('[data-testid="qr-scanner-button"]');
    
    // Check if QR scanner modal opens
    await expect(page.locator('[data-testid="qr-scanner-modal"]')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-qr-scanner"]');
    await expect(page.locator('[data-testid="qr-scanner-modal"]')).not.toBeVisible();
  });
});

test.describe('Navigation and UI', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation links
    await page.click('text=Shop');
    await page.waitForURL('**/shop');
    await expect(page.locator('h1')).toContainText('Purchase Gift Card');

    await page.click('text=Redeem');
    await page.waitForURL('**/redeem');
    await expect(page.locator('h1')).toContainText('Redeem Gift Card');

    await page.click('text=Balance');
    await page.waitForURL('**/balance');
    await expect(page.locator('h1')).toContainText('Check Balance');

    // Test logo/home link
    await page.click('[data-testid="logo"]');
    await page.waitForURL('/');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile menu functionality
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test mobile navigation
    await page.click('text=Shop');
    await page.waitForURL('**/shop');
    
    // Form should be usable on mobile
    await expect(page.locator('[name="initialAmount"]')).toBeVisible();
    await expect(page.locator('[name="design"]')).toBeVisible();
  });

  test('should handle authentication flows', async ({ page }) => {
    await page.goto('/');

    // Test login flow
    await page.click('text=Login');
    // This would redirect to authentication provider
    await page.waitForURL('**/api/login');

    // Test logout (if authenticated)
    // This test assumes user is already authenticated
    await page.goto('/');
    if (await page.locator('text=Logout').isVisible()) {
      await page.click('text=Logout');
      await page.waitForURL('**/api/logout');
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());

    await page.goto('/balance');
    await page.fill('[name="code"]', 'GCTEST123456');
    await page.click('text=Check Balance');

    // Should show error message
    await expect(page.locator('text=Network error')).toBeVisible();
  });

  test('should handle server errors', async ({ page }) => {
    // Mock server error response
    await page.route('**/api/giftcards/balance', route => 
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' })
      })
    );

    await page.goto('/balance');
    await page.fill('[name="code"]', 'GCTEST123456');
    await page.click('text=Check Balance');

    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should handle invalid responses', async ({ page }) => {
    // Mock invalid JSON response
    await page.route('**/api/giftcards/balance', route => 
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json'
      })
    );

    await page.goto('/balance');
    await page.fill('[name="code"]', 'GCTEST123456');
    await page.click('text=Check Balance');

    await expect(page.locator('text=Unable to process request')).toBeVisible();
  });
});