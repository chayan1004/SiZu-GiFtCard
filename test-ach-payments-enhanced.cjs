/**
 * Enhanced ACH Payment Test Script
 * Tests the ACH payment integration with complete response validation
 * Aligned with official Square documentation
 */

const fetch = require('node-fetch');
const baseUrl = 'http://localhost:5000';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`${colors.cyan}→ ${options.method || 'GET'} ${endpoint}${colors.reset}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`${colors.red}✗ Error ${response.status}: ${data.error || data.message}${colors.reset}`);
    }
    
    return { response, data };
  } catch (error) {
    console.error(`${colors.red}✗ Request failed: ${error.message}${colors.reset}`);
    return { error };
  }
}

async function testACHPaymentFlow() {
  console.log(`${colors.bright}=== Testing Enhanced ACH Payment Flow ===${colors.reset}\n`);

  // 1. Check available payment methods
  console.log(`${colors.bright}1. Checking Available Payment Methods${colors.reset}`);
  const { data: methods } = await makeRequest('/api/payments/methods');
  
  const achMethod = methods?.methods?.find(m => m.type === 'ach');
  if (achMethod) {
    console.log(`${colors.green}✓ ACH payment method available${colors.reset}`);
    console.log(`  - Processing fee: ${achMethod.fee}`);
    console.log(`  - Processing time: ${achMethod.processingTime}`);
    console.log(`  - Supported: ${achMethod.supported ? 'Yes' : 'No'}\n`);
  } else {
    console.log(`${colors.red}✗ ACH payment method not found${colors.reset}\n`);
  }

  // 2. Test ACH payment creation with approved token
  console.log(`${colors.bright}2. Testing ACH Payment Creation (Approved)${colors.reset}`);
  const paymentData = {
    sourceId: 'bauth:ach-account-ok',
    amount: 50,
    giftCardId: 'test-gift-card-123',
    recipientEmail: 'recipient@example.com',
    recipientName: 'John Doe',
    message: 'Happy Birthday!',
    designType: 'birthday',
    buyerEmailAddress: 'buyer@example.com',
    paymentType: 'ACH'
  };

  const { response: paymentResponse, data: paymentResult } = await makeRequest('/api/payments/create', {
    method: 'POST',
    body: paymentData,
    headers: {
      // Add auth headers if needed
    }
  });

  if (paymentResponse?.ok && paymentResult?.success) {
    console.log(`${colors.green}✓ ACH payment created successfully${colors.reset}`);
    console.log(`  - Payment ID: ${paymentResult.paymentId}`);
    console.log(`  - Order ID: ${paymentResult.orderId}\n`);

    // 3. Check payment status to verify ACH details
    if (paymentResult.paymentId) {
      console.log(`${colors.bright}3. Checking Payment Status${colors.reset}`);
      const { data: statusData } = await makeRequest(`/api/payments/status/${paymentResult.paymentId}`, {
        headers: {
          // Add auth headers if needed
        }
      });

      if (statusData?.success && statusData?.payment) {
        const payment = statusData.payment;
        console.log(`${colors.green}✓ Payment status retrieved${colors.reset}`);
        console.log(`  - Status: ${payment.status}`);
        console.log(`  - Source Type: ${payment.sourceType}`);
        console.log(`  - Amount: $${payment.amount}`);
        
        if (payment.bankAccountDetails) {
          console.log(`${colors.green}✓ Bank account details present${colors.reset}`);
          console.log(`  - Bank Name: ${payment.bankAccountDetails.bankName || 'N/A'}`);
          console.log(`  - Transfer Type: ${payment.bankAccountDetails.transferType || 'N/A'}`);
          console.log(`  - Account Ownership: ${payment.bankAccountDetails.accountOwnershipType || 'N/A'}`);
          
          if (payment.bankAccountDetails.achDetails) {
            console.log(`  - Account Type: ${payment.bankAccountDetails.achDetails.accountType || 'N/A'}`);
            console.log(`  - Account Suffix: ${payment.bankAccountDetails.achDetails.accountNumberSuffix || 'N/A'}`);
            console.log(`  - Routing Number: ${payment.bankAccountDetails.achDetails.routingNumber || 'N/A'}`);
          }
        } else {
          console.log(`${colors.yellow}⚠ Bank account details not present in response${colors.reset}`);
        }
      }
    }
  } else {
    console.log(`${colors.red}✗ ACH payment creation failed${colors.reset}`);
    if (paymentResult?.error) {
      console.log(`  Error: ${paymentResult.error}`);
    }
  }
  
  console.log('\n');

  // 4. Test declined ACH payment
  console.log(`${colors.bright}4. Testing ACH Payment (Insufficient Funds)${colors.reset}`);
  const declinedPaymentData = {
    ...paymentData,
    sourceId: 'bauth:ach-account-insufficient-funds'
  };

  const { data: declinedResult } = await makeRequest('/api/payments/create', {
    method: 'POST',
    body: declinedPaymentData
  });

  if (!declinedResult?.success) {
    console.log(`${colors.green}✓ Declined payment handled correctly${colors.reset}`);
    console.log(`  - Error: ${declinedResult?.error || 'Payment declined'}\n`);
  }

  // 5. Test invalid ACH account
  console.log(`${colors.bright}5. Testing ACH Payment (Invalid Account)${colors.reset}`);
  const invalidPaymentData = {
    ...paymentData,
    sourceId: 'bauth:ach-account-invalid'
  };

  const { data: invalidResult } = await makeRequest('/api/payments/create', {
    method: 'POST',
    body: invalidPaymentData
  });

  if (!invalidResult?.success) {
    console.log(`${colors.green}✓ Invalid account handled correctly${colors.reset}`);
    console.log(`  - Error: ${invalidResult?.error || 'Invalid account'}\n`);
  }
}

async function testACHWebhookSimulation() {
  console.log(`${colors.bright}=== Testing ACH Webhook Simulation ===${colors.reset}\n`);

  // Simulate payment.updated webhook for ACH completion
  const webhookPayload = {
    type: 'payment.updated',
    event_id: `test-event-${Date.now()}`,
    created_at: new Date().toISOString(),
    data: {
      object: {
        payment: {
          id: 'test-ach-payment-123',
          status: 'COMPLETED',
          source_type: 'BANK_ACCOUNT',
          amount_money: {
            amount: 5000,
            currency: 'USD'
          },
          bank_account_details: {
            bank_name: 'Test Bank',
            transfer_type: 'ACH',
            account_ownership_type: 'INDIVIDUAL',
            ach_details: {
              account_type: 'CHECKING',
              account_number_suffix: '1234'
            }
          }
        }
      }
    }
  };

  console.log(`${colors.bright}Simulating payment.updated webhook for ACH completion${colors.reset}`);
  const { response, data } = await makeRequest('/api/webhooks/square', {
    method: 'POST',
    body: webhookPayload,
    headers: {
      'square-signature': 'test-signature' // Would be real signature in production
    }
  });

  if (response?.ok) {
    console.log(`${colors.green}✓ Webhook processed successfully${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Webhook processing failed${colors.reset}\n`);
  }
}

async function checkServerHealth() {
  const { response } = await makeRequest('/api/health');
  if (response?.ok) {
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.red}✗ Server is not responding. Please ensure the server is running on port 5000.${colors.reset}\n`);
    return false;
  }
}

// Run tests
(async () => {
  console.log(`${colors.bright}${colors.cyan}Enhanced ACH Payment Test Suite${colors.reset}\n`);
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await testACHPaymentFlow();
  await testACHWebhookSimulation();
  
  console.log(`${colors.bright}${colors.green}Test suite completed!${colors.reset}`);
  console.log(`\n${colors.yellow}Note: In production, ACH payments take 3-5 business days to complete.`);
  console.log(`In sandbox, they complete in approximately 1 minute.${colors.reset}`);
  console.log(`\n${colors.cyan}Important: ACH disputes cannot be contested. Sellers must:`);
  console.log(`- Honor 60-day return window for consumer accounts`);
  console.log(`- Honor 2-day return window for business accounts`);
  console.log(`- Resolve disputes directly with customers${colors.reset}\n`);
})();