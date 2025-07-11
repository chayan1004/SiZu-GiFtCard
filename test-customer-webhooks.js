/**
 * Customer Webhook Test Suite
 * Tests Square customer webhook event processing
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/webhooks/square';
const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-key';

// Customer webhook payloads from Square
const customerWebhooks = [
  {
    name: 'Customer Created',
    payload: {
      "merchant_id": "G7MMEBVW021Q4",
      "type": "customer.created",
      "event_id": "e12b5591-e0b6-4967-810a-307c7efcb1a7",
      "created_at": "2022-11-09T21:23:25Z",
      "data": {
        "type": "customer",
        "id": "QPTXM8PQNX3Q726ZYHPMNP46XC",
        "object": {
          "customer": {
            "address": {
              "address_line_1": "1018 40th Street",
              "administrative_district_level_1": "CA",
              "locality": "Oakland",
              "postal_code": "94608"
            },
            "birthday": "1962-03-04",
            "created_at": "2022-11-09T21:23:25.519Z",
            "creation_source": "DIRECTORY",
            "email_address": "jenkins+smorly@squareup.com",
            "family_name": "Smorly",
            "given_name": "Jenkins",
            "group_ids": [
              "JGJCW9S0G68NE.APPOINTMENTS"
            ],
            "id": "QPTXM8PQNX3Q726ZYHPMNP46XC",
            "phone_number": "+12126668929",
            "preferences": {
              "email_unsubscribed": false
            },
            "updated_at": "2022-11-09T21:23:25Z",
            "version": 0
          }
        }
      }
    }
  },
  {
    name: 'Customer Updated',
    payload: {
      "merchant_id": "G7MMEBVW021Q4",
      "type": "customer.updated",
      "event_id": "b4ce4698-00de-4b5d-a771-4941b3913b34",
      "created_at": "2022-11-09T21:38:29Z",
      "data": {
        "type": "customer",
        "id": "A0AP25A6SCVTH8JES9BX01GXM4",
        "object": {
          "customer": {
            "created_at": "2022-07-09T18:23:01.795Z",
            "creation_source": "THIRD_PARTY",
            "email_address": "jenkins+smorly@squareup.com",
            "family_name": "Smorly",
            "given_name": "Jenkins",
            "id": "A0AP25A6SCVTH8JES9BX01GXM4",
            "phone_number": "+13477947111",
            "preferences": {
              "email_unsubscribed": false
            },
            "updated_at": "2022-11-09T21:38:30Z",
            "version": 1
          }
        }
      }
    }
  },
  {
    name: 'Customer Deleted',
    payload: {
      "merchant_id": "G7MMEBVW021Q4",
      "type": "customer.deleted",
      "event_id": "8e84fec8-f04b-46f0-b66d-dbb8b59590fa",
      "created_at": "2022-11-09T21:26:50Z",
      "data": {
        "type": "customer",
        "id": "QPTXM8PQNX3Q726ZYHPMNP46XC",
        "deleted": true,
        "object": {
          "customer": {
            "address": {
              "address_line_1": "1018 1st Street",
              "administrative_district_level_1": "NY",
              "locality": "Brooklyn",
              "postal_code": "11215"
            },
            "birthday": "1962-03-04",
            "creation_source": "IMPORT",
            "email_address": "jenkins+smorly@squareup.com",
            "family_name": "Smiley",
            "given_name": "Jenkins",
            "id": "QPTXM8PQNX3Q726ZYHPMNP46XC",
            "phone_number": "+12126668929",
            "preferences": {
              "email_unsubscribed": false
            },
            "version": 3
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

async function testCustomerWebhooks() {
  console.log('👥 Testing Square Customer Webhook Processing...\n');
  
  // Test each customer webhook
  for (const webhook of customerWebhooks) {
    console.log(`\n📬 Testing: ${webhook.name}`);
    console.log(`Event Type: ${webhook.payload.type}`);
    console.log(`Customer ID: ${webhook.payload.data.id}`);
    
    try {
      // Generate signature
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
      } else {
        console.log(`⚠️  ${webhook.name} returned status ${response.status}`);
        console.log(`   Error:`, result);
      }
    } catch (error) {
      console.log(`❌ ${webhook.name} test failed:`, error.message);
    }
  }
  
  console.log('\n\n🎯 Customer Webhook Processing Summary:');
  console.log('\n📊 Customer Lifecycle Management:');
  console.log('- Customer Created: Track new customers with full profile data');
  console.log('- Customer Updated: Monitor profile changes and sync with local database');
  console.log('- Customer Deleted: Handle customer removal and data retention');
  
  console.log('\n🔗 Integration Features:');
  console.log('- Automatic Square Customer ID linking to local users');
  console.log('- Full customer profile tracking (name, email, phone, address)');
  console.log('- Birthday and group membership tracking');
  console.log('- Email subscription preferences');
  
  console.log('\n✨ Business Benefits:');
  console.log('1. Real-time customer data synchronization');
  console.log('2. Unified customer profiles across Square and local database');
  console.log('3. Enhanced customer relationship management');
  console.log('4. Automated customer lifecycle tracking');
}

// Run the tests
testCustomerWebhooks().catch(console.error);