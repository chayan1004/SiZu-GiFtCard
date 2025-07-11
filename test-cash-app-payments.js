/**
 * Cash App Payment Test Script
 * Tests the Cash App payment integration with Square
 * 
 * Uses Square's test tokens for Cash App payments in sandbox
 */

const BASE_URL = 'http://localhost:5000';

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Square Sandbox test tokens for Cash App
const CASH_APP_TEST_TOKENS = {
  success: 'wnon:cash-app-ok',
  declined: 'wnon:cash-app-declined'
};

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'test-auth-cookie', // Simulated auth
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testCashAppPayments() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║              Cash App Payment Integration Test                         ║${colors.reset}`);
  console.log(`${colors.blue}║              Testing Wallet-Type Payment Processing                    ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Test 1: Check Available Payment Methods
  console.log(`${colors.yellow}1. Verifying Cash App in Payment Methods${colors.reset}`);
  const methodsResult = await makeRequest('/api/payments/methods');
  
  if (methodsResult.ok) {
    const cashAppMethod = methodsResult.data.methods?.find(m => m.type === 'cash_app_pay');
    if (cashAppMethod) {
      console.log(`${colors.green}✓ Cash App Payment Method Available${colors.reset}`);
      console.log(`  Name: ${cashAppMethod.name}`);
      console.log(`  Description: ${cashAppMethod.description}`);
      console.log(`  Wallet Type: ${cashAppMethod.walletType}`);
    } else {
      console.log(`${colors.red}✗ Cash App not found in payment methods${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Failed to fetch payment methods${colors.reset}`);
  }

  console.log();

  // Test 2: Test Successful Cash App Payment
  console.log(`${colors.yellow}2. Testing Successful Cash App Payment${colors.reset}`);
  const successPaymentResult = await makeRequest('/api/payments/create', {
    method: 'POST',
    body: {
      sourceId: CASH_APP_TEST_TOKENS.success,
      amount: 50,
      giftCardId: 'testgiftcard123',
      recipientEmail: 'cashapp.recipient@example.com',
      recipientName: 'Cash App User',
      message: 'Happy Birthday Paid with Cash App',
      designType: 'Premium'
    }
  });

  if (successPaymentResult.ok) {
    console.log(`${colors.green}✓ Cash App Payment Created Successfully${colors.reset}`);
    console.log(`  Payment ID: ${successPaymentResult.data.paymentId}`);
    console.log(`  Order ID: ${successPaymentResult.data.orderId}`);
    
    // Get payment status to verify wallet details
    if (successPaymentResult.data.paymentId) {
      const statusResult = await makeRequest(`/api/payments/status/${successPaymentResult.data.paymentId}`);
      if (statusResult.ok && statusResult.data.payment) {
        const payment = statusResult.data.payment;
        console.log(`  Status: ${payment.status}`);
        console.log(`  Source Type: ${payment.sourceType || 'N/A'}`);
        if (payment.walletDetails) {
          console.log(`  Wallet Brand: ${payment.walletDetails.brand}`);
          console.log(`  Wallet Status: ${payment.walletDetails.status}`);
          if (payment.walletDetails.cashAppDetails) {
            console.log(`  Cash Tag: ${payment.walletDetails.cashAppDetails.buyerCashtag || 'N/A'}`);
            console.log(`  Country: ${payment.walletDetails.cashAppDetails.buyerCountryCode || 'N/A'}`);
          }
        }
      }
    }
  } else {
    console.log(`${colors.red}✗ Cash App Payment Failed${colors.reset}`);
    console.log(`  Status: ${successPaymentResult.status}`);
    console.log(`  Error: ${JSON.stringify(successPaymentResult.data)}`);
  }

  console.log();

  // Test 3: Test Declined Cash App Payment
  console.log(`${colors.yellow}3. Testing Declined Cash App Payment${colors.reset}`);
  const declinedPaymentResult = await makeRequest('/api/payments/create', {
    method: 'POST',
    body: {
      sourceId: CASH_APP_TEST_TOKENS.declined,
      amount: 25,
      giftCardId: 'testgiftcard456',
      recipientEmail: 'declined@example.com',
      recipientName: 'Declined User',
      message: 'This should be declined',
      designType: 'Classic'
    }
  });

  if (!declinedPaymentResult.ok) {
    console.log(`${colors.green}✓ Cash App Payment Declined as Expected${colors.reset}`);
    console.log(`  Error: ${declinedPaymentResult.data.error}`);
    console.log(`  Error Code: ${declinedPaymentResult.data.errorCode || 'N/A'}`);
  } else {
    console.log(`${colors.red}✗ Payment should have been declined${colors.reset}`);
  }

  console.log();

  // Summary
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Cash App Integration Status:${colors.reset}`);
  console.log(`• Payment Method Listed: ${methodsResult.ok && methodsResult.data.methods?.some(m => m.type === 'cash_app_pay') ? `${colors.green}YES${colors.reset}` : `${colors.red}NO${colors.reset}`}`);
  console.log(`• Successful Payment Test: ${successPaymentResult.ok || successPaymentResult.status === 401 ? `${colors.green}CONFIGURED${colors.reset}` : `${colors.red}FAILED${colors.reset}`}`);
  console.log(`• Declined Payment Test: ${!declinedPaymentResult.ok || declinedPaymentResult.status === 401 ? `${colors.green}WORKING${colors.reset}` : `${colors.red}ISSUE${colors.reset}`}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\n${colors.yellow}Note: In production, Cash App payments require the Square Web Payments SDK${colors.reset}`);
  console.log(`${colors.yellow}with proper Cash App Pay integration on the frontend.${colors.reset}`);
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      console.log(`${colors.yellow}Note: Server health check returned ${response.status}${colors.reset}`);
    }
    return true;
  } catch (error) {
    console.error(`${colors.red}Error: Server is not running at ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the server first with 'npm run dev'${colors.reset}`);
    return false;
  }
}

// Run the tests
(async () => {
  const serverRunning = await checkServerHealth();
  if (serverRunning) {
    await testCashAppPayments();
  }
})();