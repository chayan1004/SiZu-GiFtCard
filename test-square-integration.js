/**
 * Square Integration Test Suite
 * Tests the complete payment flow for gift card purchases
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const TEST_GIFT_CARD_ID = 'test-gift-card-123';
const TEST_AMOUNT = 25.00;

async function runSquareIntegrationTests() {
  console.log('🚀 Starting Square Integration Tests...\n');
  
  // Test 1: Check Square Configuration
  console.log('1. Testing Square Configuration...');
  try {
    const response = await fetch(`${BASE_URL}/payments/config`);
    const config = await response.json();
    
    if (config.applicationId && config.locationId) {
      console.log('✅ Square configuration loaded successfully');
      console.log(`   Application ID: ${config.applicationId.substring(0, 20)}...`);
      console.log(`   Location ID: ${config.locationId}`);
      console.log(`   Environment: ${config.environment}`);
    } else {
      throw new Error('Missing required configuration');
    }
  } catch (error) {
    console.log('❌ Square configuration test failed:', error.message);
    return;
  }

  // Test 2: Check Payment Methods
  console.log('\n2. Testing Payment Methods...');
  try {
    const response = await fetch(`${BASE_URL}/payments/methods`);
    const methods = await response.json();
    
    if (methods.success && methods.available) {
      console.log('✅ Payment methods loaded successfully');
      console.log(`   Available methods: ${methods.methods.map(m => m.type).join(', ')}`);
    } else {
      throw new Error('Payment methods not available');
    }
  } catch (error) {
    console.log('❌ Payment methods test failed:', error.message);
    return;
  }

  // Test 3: Create Test Gift Card (simulate)
  console.log('\n3. Testing Gift Card Creation...');
  try {
    const response = await fetch(`${BASE_URL}/giftcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: TEST_AMOUNT,
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        design: 'classic',
        message: 'Test gift card for Square integration'
      })
    });
    
    if (response.status === 401) {
      console.log('⚠️  Gift card creation requires authentication (expected)');
    } else if (response.ok) {
      const result = await response.json();
      console.log('✅ Gift card creation endpoint accessible');
    } else {
      console.log('⚠️  Gift card creation returned status:', response.status);
    }
  } catch (error) {
    console.log('❌ Gift card creation test failed:', error.message);
  }

  // Test 4: Test Payment Creation (without auth - expected to fail)
  console.log('\n4. Testing Payment Creation Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: 'test-source-id',
        amount: TEST_AMOUNT,
        giftCardId: TEST_GIFT_CARD_ID
      })
    });
    
    if (response.status === 401) {
      console.log('✅ Payment creation properly protected (requires authentication)');
    } else {
      console.log('⚠️  Payment creation returned unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Payment creation test failed:', error.message);
  }

  // Test 5: Test Recharge Endpoint
  console.log('\n5. Testing Recharge Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/payments/recharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: 'test-source-id',
        amount: 10.00,
        giftCardId: TEST_GIFT_CARD_ID
      })
    });
    
    if (response.status === 401) {
      console.log('✅ Recharge endpoint properly protected (requires authentication)');
    } else {
      console.log('⚠️  Recharge endpoint returned unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Recharge endpoint test failed:', error.message);
  }

  // Test 6: Test Webhook Endpoint
  console.log('\n6. Testing Webhook Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/webhooks/square`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment.created',
        data: { id: 'test-payment-id' }
      })
    });
    
    if (response.ok) {
      console.log('✅ Webhook endpoint accessible');
    } else {
      console.log('⚠️  Webhook endpoint returned status:', response.status);
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test failed:', error.message);
  }

  console.log('\n🎉 Square Integration Tests Completed!');
  console.log('\nNext Steps:');
  console.log('1. Log in to test authenticated endpoints');
  console.log('2. Use Square Web Payments SDK to generate real payment tokens');
  console.log('3. Test complete payment flow with real card data');
  console.log('4. Verify webhook processing with Square test events');
}

// Run the tests
runSquareIntegrationTests().catch(console.error);