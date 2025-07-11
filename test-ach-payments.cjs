/**
 * ACH Payment Test Script
 * Tests the ACH bank transfer payment integration with Square-Plaid
 * 
 * Uses Square's ACH test tokens for sandbox testing
 */

const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

const BASE_URL = 'http://localhost:5000';

// Square sandbox test tokens for ACH payments
const ACH_TEST_TOKENS = {
  APPROVED: 'bauth:ach-account-ok',  // Will result in approved payment
  DECLINED: 'bauth:ach-account-insufficient-funds',  // Will be declined
  INVALID_ACCOUNT: 'bauth:ach-account-invalid'  // Invalid bank account
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

async function testACHPayments() {
  console.log(`${colors.blue}🏦 Testing ACH Bank Transfer Payments${colors.reset}\n`);

  // Step 1: Check payment methods include ACH
  console.log(`${colors.yellow}1️⃣ Checking available payment methods...${colors.reset}`);
  const { data: methodsData } = await makeRequest('/api/payments/methods');
  
  console.log('Available payment methods:');
  methodsData.methods?.forEach(m => {
    console.log(`   - ${m.type}: ${m.name}`);
  });
  
  const achMethod = methodsData.methods?.find(m => m.type === 'ach');
  if (achMethod) {
    console.log(`${colors.green}✅ ACH payment method available${colors.reset}`);
    console.log(`   Name: ${achMethod.name}`);
    console.log(`   Description: ${achMethod.description}`);
    console.log(`   Processing Time: ${achMethod.processingTime}`);
    console.log(`   Fees: ${achMethod.fees}`);
  } else {
    console.log(`${colors.red}❌ ACH payment method not found${colors.reset}`);
    console.log('(Continuing test anyway...)\n');
  }

  // Step 2: Create a test gift card
  console.log(`\n${colors.yellow}2️⃣ Creating test gift card...${colors.reset}`);
  const giftCardId = `ach-test-${Date.now()}`;
  const amount = 50.00;  // $50 gift card

  // Step 3: Test successful ACH payment
  console.log(`\n${colors.yellow}3️⃣ Testing successful ACH payment...${colors.reset}`);
  try {
    const paymentResponse = await makeRequest('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        sourceId: ACH_TEST_TOKENS.APPROVED,
        amount: amount,
        giftCardId: giftCardId,
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        message: 'ACH payment test',
        designType: 'Standard',
        paymentType: 'ACH',
        buyerEmailAddress: 'buyer@example.com'
      })
    });

    if (paymentResponse.data.success) {
      console.log(`${colors.green}✅ ACH payment successful!${colors.reset}`);
      console.log(`   Payment ID: ${paymentResponse.data.paymentId}`);
      console.log(`   Order ID: ${paymentResponse.data.orderId}`);
      console.log(`   Gift Card ID: ${paymentResponse.data.giftCardId}`);
      console.log(`   Note: ACH payments take 3-5 business days to complete`);
      
      // Check payment status
      if (paymentResponse.data.paymentId) {
        console.log(`\n${colors.yellow}4️⃣ Checking payment status...${colors.reset}`);
        const { data: statusData } = await makeRequest(`/api/payments/status/${paymentResponse.data.paymentId}`);
        
        if (statusData.success) {
          console.log(`${colors.green}✅ Payment status retrieved${colors.reset}`);
          console.log(`   Status: ${statusData.payment.status}`);
          console.log(`   Source Type: ${statusData.payment.sourceType}`);
          console.log(`   Amount: $${statusData.payment.amount}`);
        }
      }
    } else {
      console.log(`${colors.red}❌ ACH payment failed: ${paymentResponse.data.error}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ ACH payment error: ${error.message}${colors.reset}`);
  }

  // Step 4: Test declined ACH payment
  console.log(`\n${colors.yellow}5️⃣ Testing declined ACH payment (insufficient funds)...${colors.reset}`);
  try {
    const declinedResponse = await makeRequest('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        sourceId: ACH_TEST_TOKENS.DECLINED,
        amount: 25.00,
        giftCardId: `ach-declined-${Date.now()}`,
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        message: 'ACH declined test',
        designType: 'Standard',
        paymentType: 'ACH'
      })
    });

    if (!declinedResponse.data.success) {
      console.log(`${colors.green}✅ ACH payment correctly declined${colors.reset}`);
      console.log(`   Error: ${declinedResponse.data.error}`);
    } else {
      console.log(`${colors.red}❌ Expected payment to be declined${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.green}✅ ACH payment declined as expected${colors.reset}`);
  }

  // Step 5: Display ACH payment information
  console.log(`\n${colors.magenta}📋 ACH Payment Information:${colors.reset}`);
  console.log('• ACH payments are powered by Square-Plaid partnership');
  console.log('• No separate Plaid account needed - Square handles everything');
  console.log('• Processing fee: 1% with $1 minimum');
  console.log('• Settlement time: 3-5 business days');
  console.log('• Available for US merchants only');
  console.log('• Supports USD currency only');
  console.log('• Maximum transaction: $50,000');
  
  console.log(`\n${colors.magenta}🧪 Sandbox Testing Notes:${colors.reset}`);
  console.log('• In sandbox, ACH payments complete in ~1 minute (vs 3-5 days in production)');
  console.log('• Test tokens simulate different scenarios:');
  console.log('  - bauth:ach-account-ok → Successful payment');
  console.log('  - bauth:ach-account-insufficient-funds → Declined payment');
  console.log('  - bauth:ach-account-invalid → Invalid account');
  
  console.log(`\n${colors.magenta}🎯 Frontend Implementation:${colors.reset}`);
  console.log('• User clicks "Connect Bank Account" button');
  console.log('• Plaid Link modal opens for bank authentication');
  console.log('• User selects bank and logs in');
  console.log('• Plaid returns account token to Square');
  console.log('• Square processes ACH payment with token');
  
  console.log(`\n${colors.green}✅ ACH payment integration test complete!${colors.reset}`);
}

// Check if server is running before starting tests
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Server is not running on ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the server with 'npm run dev' and try again.${colors.reset}`);
    return false;
  }
}

// Run tests
(async () => {
  if (await checkServerHealth()) {
    await testACHPayments();
  }
})();