/**
 * Square Payment Links Test Suite
 * Tests the complete payment links creation and management flow
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'test-auth-token';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cookie': `connect.sid=${TEST_TOKEN}`
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();
    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    console.error(`${colors.red}Request failed:${colors.reset}`, error.message);
    return {
      status: 500,
      data: { error: error.message },
      ok: false
    };
  }
}

// Test gift card payment link creation
async function testGiftCardPaymentLink() {
  console.log(`\n${colors.bright}${colors.cyan}Testing Gift Card Payment Link Creation...${colors.reset}`);
  
  const giftCardData = {
    name: "Premium Gift Card - $50",
    amount: 50,
    currency: "USD",
    description: "A perfect gift for any occasion",
    recipientEmail: "recipient@example.com",
    recipientName: "Jane Doe",
    senderName: "John Smith",
    customMessage: "Happy Birthday! Enjoy your gift card!",
    checkoutOptions: {
      askForShippingAddress: false,
      acceptedPaymentMethods: {
        applePay: true,
        googlePay: true,
        cashApp: true,
        afterpayClearpay: false
      },
      allowTipping: false,
      redirectUrl: "https://example.com/thank-you",
      merchantSupportEmail: "support@example.com"
    },
    prePopulatedData: {
      buyerEmail: "buyer@example.com",
      buyerPhoneNumber: "+15551234567",
      buyerAddress: {
        addressLine1: "123 Main St",
        addressLine2: "Apt 4B",
        locality: "San Francisco",
        administrativeDistrictLevel1: "CA",
        postalCode: "94105",
        country: "US"
      }
    }
  };

  const response = await makeRequest('/payment-links/gift-card', {
    method: 'POST',
    body: JSON.stringify(giftCardData)
  });

  if (response.ok) {
    console.log(`${colors.green}✓ Gift card payment link created successfully${colors.reset}`);
    console.log(`  ${colors.bright}Payment Link ID:${colors.reset}`, response.data.paymentLink.id);
    console.log(`  ${colors.bright}URL:${colors.reset}`, response.data.paymentLink.url);
    console.log(`  ${colors.bright}Order ID:${colors.reset}`, response.data.paymentLink.orderId);
    return response.data.paymentLink;
  } else {
    console.log(`${colors.red}✗ Failed to create gift card payment link${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset}`, response.data.error || response.data);
    return null;
  }
}

// Test quick pay link creation
async function testQuickPayLink() {
  console.log(`\n${colors.bright}${colors.cyan}Testing Quick Pay Link Creation...${colors.reset}`);
  
  const quickPayData = {
    name: "Quick Payment - $25",
    amount: 25,
    currency: "USD",
    description: "Quick payment for services",
    checkoutOptions: {
      askForShippingAddress: false,
      acceptedPaymentMethods: {
        applePay: true,
        googlePay: true,
        cashApp: false,
        afterpayClearpay: false
      },
      allowTipping: true,
      merchantSupportEmail: "help@example.com"
    },
    prePopulatedData: {
      buyerEmail: "customer@example.com"
    }
  };

  const response = await makeRequest('/payment-links/quick-pay', {
    method: 'POST',
    body: JSON.stringify(quickPayData)
  });

  if (response.ok) {
    console.log(`${colors.green}✓ Quick pay link created successfully${colors.reset}`);
    console.log(`  ${colors.bright}Payment Link ID:${colors.reset}`, response.data.paymentLink.id);
    console.log(`  ${colors.bright}URL:${colors.reset}`, response.data.paymentLink.url);
    return response.data.paymentLink;
  } else {
    console.log(`${colors.red}✗ Failed to create quick pay link${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset}`, response.data.error || response.data);
    return null;
  }
}

// Test payment link retrieval
async function testGetPaymentLink(paymentLinkId) {
  console.log(`\n${colors.bright}${colors.cyan}Testing Payment Link Retrieval...${colors.reset}`);
  
  const response = await makeRequest(`/payment-links/${paymentLinkId}`, {
    method: 'GET'
  });

  if (response.ok) {
    console.log(`${colors.green}✓ Payment link retrieved successfully${colors.reset}`);
    console.log(`  ${colors.bright}Details:${colors.reset}`);
    console.log(`    ID: ${response.data.paymentLink.id}`);
    console.log(`    URL: ${response.data.paymentLink.url}`);
    console.log(`    Created: ${response.data.paymentLink.createdAt}`);
    return response.data.paymentLink;
  } else {
    console.log(`${colors.red}✗ Failed to retrieve payment link${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset}`, response.data.error || response.data);
    return null;
  }
}

// Test payment link update
async function testUpdatePaymentLink(paymentLinkId) {
  console.log(`\n${colors.bright}${colors.cyan}Testing Payment Link Update...${colors.reset}`);
  
  const updateData = {
    checkoutOptions: {
      allowTipping: true,
      redirectUrl: "https://example.com/updated-thank-you"
    },
    prePopulatedData: {
      buyerEmail: "updated@example.com"
    }
  };

  const response = await makeRequest(`/payment-links/${paymentLinkId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });

  if (response.ok) {
    console.log(`${colors.green}✓ Payment link updated successfully${colors.reset}`);
    return response.data.paymentLink;
  } else {
    console.log(`${colors.red}✗ Failed to update payment link${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset}`, response.data.error || response.data);
    return null;
  }
}

// Test payment link deletion
async function testDeletePaymentLink(paymentLinkId) {
  console.log(`\n${colors.bright}${colors.cyan}Testing Payment Link Deletion...${colors.reset}`);
  
  const response = await makeRequest(`/payment-links/${paymentLinkId}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    console.log(`${colors.green}✓ Payment link deleted successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to delete payment link${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset}`, response.data.error || response.data);
    return false;
  }
}

// Main test runner
async function runPaymentLinksTests() {
  console.log(`${colors.bright}${colors.magenta}=== Square Payment Links Test Suite ===${colors.reset}`);
  console.log(`${colors.yellow}Testing all payment link operations...${colors.reset}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Create gift card payment link
  totalTests++;
  const giftCardLink = await testGiftCardPaymentLink();
  if (giftCardLink) passedTests++;

  // Test 2: Create quick pay link
  totalTests++;
  const quickPayLink = await testQuickPayLink();
  if (quickPayLink) passedTests++;

  // Test 3: Get payment link details
  if (giftCardLink) {
    totalTests++;
    const retrievedLink = await testGetPaymentLink(giftCardLink.id);
    if (retrievedLink) passedTests++;

    // Test 4: Update payment link
    totalTests++;
    const updatedLink = await testUpdatePaymentLink(giftCardLink.id);
    if (updatedLink) passedTests++;

    // Test 5: Delete payment link
    totalTests++;
    const deleted = await testDeletePaymentLink(giftCardLink.id);
    if (deleted) passedTests++;
  }

  // Summary
  console.log(`\n${colors.bright}${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);

  if (passedTests === totalTests) {
    console.log(`\n${colors.bright}${colors.green}✓ All payment link tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ Some tests failed. Please review the errors above.${colors.reset}`);
  }

  // Additional notes
  console.log(`\n${colors.yellow}Note: This test requires:${colors.reset}`);
  console.log(`  - Valid Square API credentials in environment variables`);
  console.log(`  - Authentication with the server`);
  console.log(`  - Server running on localhost:5000`);
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✓ Server is healthy${colors.reset}`);
      console.log(`  ${colors.bright}Square Service:${colors.reset}`, data.services.square ? 'Available' : 'Not Available');
      console.log(`  ${colors.bright}Payments Service:${colors.reset}`, data.services.payments ? 'Available' : 'Not Available');
      return true;
    } else {
      console.log(`${colors.red}✗ Server health check failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot connect to server at ${API_BASE_URL}${colors.reset}`);
    console.log(`  Make sure the server is running with: npm run dev`);
    return false;
  }
}

// Main execution
(async () => {
  console.log(`${colors.bright}${colors.blue}Square Payment Links Integration Test${colors.reset}\n`);

  // Check server health first
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  // Run the tests
  await runPaymentLinksTests();
})();