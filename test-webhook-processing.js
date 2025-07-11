/**
 * Webhook Processing Test Suite
 * Tests Square webhook event processing with real payload examples
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/webhooks/square';
const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-key';

// Test webhook payloads from Square documentation
const testWebhooks = [
  {
    name: 'Order Created',
    payload: {
      "merchant_id": "5S9MXCS9Y99KK",
      "type": "order.created",
      "event_id": "116038d3-2948-439f-8679-fc86dbf80f69",
      "created_at": "2020-04-16T23:14:26.129Z",
      "data": {
        "type": "order_created",
        "id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
        "object": {
          "order_created": {
            "created_at": "2020-04-16T23:14:26.129Z",
            "location_id": "FPYCBCHYMXFK1",
            "order_id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
            "state": "OPEN",
            "version": 1
          }
        }
      }
    }
  },
  {
    name: 'Order Fulfillment Updated',
    payload: {
      "merchant_id": "5S9MXCS9Y99KK",
      "type": "order.fulfillment.updated",
      "event_id": "b3adf364-4937-436e-a833-49c72b4baee8",
      "created_at": "2020-04-16T23:16:30.789Z",
      "data": {
        "type": "order_fulfillment_updated",
        "id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
        "object": {
          "order_fulfillment_updated": {
            "created_at": "2020-04-16T23:14:26.129Z",
            "fulfillment_update": [
              {
                "fulfillment_uid": "VWJ1N9leLqjSDLvF2hvYjD",
                "new_state": "RESERVED",
                "old_state": "PROPOSED"
              }
            ],
            "location_id": "FPYCBCHYMXFK1",
            "order_id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
            "state": "OPEN",
            "updated_at": "2020-04-16T23:16:30.789Z",
            "version": 6
          }
        }
      }
    }
  },
  {
    name: 'OAuth Authorization Revoked',
    payload: {
      "merchant_id": "J9Z30SF99NPFJ",
      "type": "oauth.authorization.revoked",
      "event_id": "e1d6ae37-5aa9-45a5-b525-b12caf819fdb",
      "created_at": "2020-08-14T15:51:04.246373287Z",
      "data": {
        "type": "revocation",
        "id": "415641cf-eba2-4dfa-88cc-c4be1301fdc6",
        "object": {
          "revocation": {
            "revoked_at": "2020-08-14T15:51:00.246373287Z",
            "revoker_type": "MERCHANT"
          }
        }
      }
    }
  },
  {
    name: 'Order Updated',
    payload: {
      "merchant_id": "5S9MXCS9Y99KK",
      "type": "order.updated",
      "event_id": "4b8e5c91-9f17-4cf1-900a-4a0629f81add",
      "created_at": "2020-04-16T23:14:26.359Z",
      "data": {
        "type": "order_updated",
        "id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
        "object": {
          "order_updated": {
            "created_at": "2020-04-16T23:14:26.129Z",
            "location_id": "FPYCBCHYMXFK1",
            "order_id": "eA3vssLHKJrv9H0IdJCM3gNqfdcZY",
            "state": "OPEN",
            "updated_at": "2020-04-16T23:14:26.359Z",
            "version": 2
          }
        }
      }
    }
  }
];

// Generate webhook signature
function generateWebhookSignature(payload, key) {
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(payloadString);
  return hmac.digest('base64');
}

async function testWebhookProcessing() {
  console.log('🚀 Testing Square Webhook Processing...\n');
  
  // Test each webhook payload
  for (const webhook of testWebhooks) {
    console.log(`Testing: ${webhook.name}`);
    console.log(`Event Type: ${webhook.payload.type}`);
    console.log(`Event ID: ${webhook.payload.event_id}`);
    
    try {
      // Generate signature for the payload
      const signature = generateWebhookSignature(webhook.payload, WEBHOOK_SIGNATURE_KEY);
      
      // Send webhook request
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-square-signature': signature
        },
        body: JSON.stringify(webhook.payload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${webhook.name} processed successfully`);
        console.log(`   Response:`, result);
      } else {
        console.log(`⚠️  ${webhook.name} returned status ${response.status}`);
        console.log(`   Error:`, result);
      }
    } catch (error) {
      console.log(`❌ ${webhook.name} test failed:`, error.message);
    }
    
    console.log('---\n');
  }
  
  // Test webhook health endpoint
  console.log('Testing Webhook Health Check...');
  try {
    const healthResponse = await fetch('http://localhost:5000/api/webhooks/square/health');
    const health = await healthResponse.json();
    console.log('✅ Webhook health check:', health);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  console.log('\n🎉 Webhook Processing Tests Complete!');
  console.log('\nImplemented Webhook Handlers:');
  console.log('✓ order.created - Tracks new orders in the system');
  console.log('✓ order.updated - Updates order status (completed/canceled)');
  console.log('✓ order.fulfillment.updated - Monitors gift card delivery status');
  console.log('✓ oauth.authorization.revoked - Creates critical alerts for revoked access');
  
  console.log('\nNext Steps:');
  console.log('1. Configure webhook endpoint in Square Dashboard');
  console.log('2. Set up proper webhook signature key');
  console.log('3. Monitor fraud alerts for critical events');
  console.log('4. Test with live Square webhook events');
}

// Run the tests
testWebhookProcessing().catch(console.error);