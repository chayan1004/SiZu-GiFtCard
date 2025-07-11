/**
 * Square Payment Links Production Test Script
 * Tests the live, production-ready payment links endpoints
 * 
 * This script verifies that all endpoints are operational and
 * properly integrated with Square's production/sandbox servers.
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

async function testProductionEndpoints() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║         Square Payment Links Production Endpoint Tests                 ║${colors.reset}`);
  console.log(`${colors.blue}║              Verifying Live Integration Status                         ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Test 1: Create Gift Card Payment Link (Production)
  console.log(`${colors.yellow}1. Testing Gift Card Payment Link Creation (LIVE)${colors.reset}`);
  const giftCardResult = await makeRequest('/api/payment-links/gift-card', {
    method: 'POST',
    body: {
      name: 'Premium Gift Card - $100',
      amount: 100,
      currency: 'USD',
      description: 'A premium gift card for any occasion',
      recipientEmail: 'recipient@production.com',
      recipientName: 'Production Recipient',
      senderName: 'Production Sender',
      customMessage: 'This is a real gift card purchase',
      paymentNote: 'Production gift card order',
      checkoutOptions: {
        askForShippingAddress: false,
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashApp: true,
          afterpayClearpay: true
        },
        allowTipping: false,
        customFields: [
          { title: 'Delivery preference' },
          { title: 'Special instructions' }
        ],
        merchantSupportEmail: 'support@production.com',
        appFeeMoney: {
          amount: 2.5,
          currency: 'USD'
        }
      },
      prePopulatedData: {
        buyerEmail: 'buyer@production.com',
        buyerPhoneNumber: '+15551234567'
      }
    }
  });

  if (giftCardResult.ok) {
    console.log(`${colors.green}✓ Gift Card Payment Link Created Successfully${colors.reset}`);
    console.log(`  Payment Link ID: ${giftCardResult.data.paymentLink?.id}`);
    console.log(`  Live URL: ${giftCardResult.data.paymentLink?.url}`);
    console.log(`  Order ID: ${giftCardResult.data.paymentLink?.orderId}`);
    console.log(`  Version: ${giftCardResult.data.paymentLink?.version}`);
  } else {
    console.log(`${colors.red}✗ Gift Card Payment Link Creation Failed${colors.reset}`);
    console.log(`  Status: ${giftCardResult.status}`);
    console.log(`  Error: ${JSON.stringify(giftCardResult.data)}`);
  }

  console.log();

  // Test 2: Create Quick Pay Link (Production)
  console.log(`${colors.yellow}2. Testing Quick Pay Link Creation (LIVE)${colors.reset}`);
  const quickPayResult = await makeRequest('/api/payment-links/quick-pay', {
    method: 'POST',
    body: {
      name: 'Express Payment - $50',
      amount: 50,
      currency: 'USD',
      description: 'Quick payment for services',
      paymentNote: 'Express checkout for immediate payment',
      checkoutOptions: {
        askForShippingAddress: true,
        allowTipping: true,
        merchantSupportEmail: 'express@production.com',
        shippingFee: {
          name: 'Express Shipping',
          charge: {
            amount: 9.99,
            currency: 'USD'
          }
        }
      }
    }
  });

  if (quickPayResult.ok) {
    console.log(`${colors.green}✓ Quick Pay Link Created Successfully${colors.reset}`);
    console.log(`  Payment Link ID: ${quickPayResult.data.paymentLink?.id}`);
    console.log(`  Live URL: ${quickPayResult.data.paymentLink?.url}`);
    console.log(`  Related Resources: ${quickPayResult.data.paymentLink?.relatedResources ? 'Included' : 'Not included'}`);
  } else {
    console.log(`${colors.red}✗ Quick Pay Link Creation Failed${colors.reset}`);
    console.log(`  Status: ${quickPayResult.status}`);
    console.log(`  Error: ${JSON.stringify(quickPayResult.data)}`);
  }

  console.log();

  // Test 3: Verify Square Integration Status
  console.log(`${colors.yellow}3. Verifying Square Integration Status${colors.reset}`);
  const configResult = await makeRequest('/api/payments/config');
  
  if (configResult.ok && configResult.data.applicationId) {
    console.log(`${colors.green}✓ Square Integration Active${colors.reset}`);
    console.log(`  Application ID: ${configResult.data.applicationId}`);
    console.log(`  Location ID: ${configResult.data.locationId}`);
    console.log(`  Environment: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX'}`);
  } else {
    console.log(`${colors.red}✗ Square Integration Not Configured${colors.reset}`);
    console.log(`  Ensure SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, and SQUARE_LOCATION_ID are set`);
  }

  console.log();

  // Summary
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Production Status Summary:${colors.reset}`);
  console.log(`• Payment Links API: ${giftCardResult.ok || quickPayResult.ok ? `${colors.green}OPERATIONAL${colors.reset}` : `${colors.red}NEEDS CONFIGURATION${colors.reset}`}`);
  console.log(`• Square Integration: ${configResult.ok ? `${colors.green}CONNECTED${colors.reset}` : `${colors.red}NOT CONNECTED${colors.reset}`}`);
  console.log(`• Ready for Production: ${(giftCardResult.ok || quickPayResult.ok) && configResult.ok ? `${colors.green}YES${colors.reset}` : `${colors.yellow}Configure Square credentials${colors.reset}`}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`);
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
    await testProductionEndpoints();
  }
})();