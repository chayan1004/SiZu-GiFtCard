/**
 * Gift Card Webhook Test Suite
 * Tests Square gift card webhook event processing
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/webhooks/square';
const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-key';

// Gift card webhook payloads from Square
const giftCardWebhooks = [
  {
    name: 'Gift Card Created',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.created",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T01:41:35.157Z",
      "data": {
        "type": "gift_card",
        "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
        "object": {
          "gift_card": {
            "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "type": "DIGITAL",
            "gan_source": "SQUARE",
            "state": "NOT_ACTIVE",
            "balance_money": {
              "amount": 0,
              "currency": "USD"
            },
            "gan": "7783320007480908",
            "created_at": "2020-12-17T01:41:35.157Z"
          }
        }
      }
    }
  },
  {
    name: 'Gift Card Customer Linked',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.customer_linked",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T03:41:35.157Z",
      "data": {
        "type": "gift_card",
        "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
        "object": {
          "gift_card": {
            "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "type": "DIGITAL",
            "gan_source": "SQUARE",
            "state": "ACTIVE",
            "balance_money": {
              "amount": 1500,
              "currency": "USD"
            },
            "gan": "7783320007480908",
            "customer_ids": [
              "QPTXM8PQNX3Q726ZYHPMNP46XC"
            ],
            "created_at": "2020-12-17T01:41:35.157Z"
          },
          "linked_customer_id": "QPTXM8PQNX3Q726ZYHPMNP46XC"
        }
      }
    }
  },
  {
    name: 'Gift Card Customer Unlinked',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.customer_unlinked",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T03:41:35.157Z",
      "data": {
        "type": "gift_card",
        "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
        "object": {
          "gift_card": {
            "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "type": "DIGITAL",
            "gan_source": "SQUARE",
            "state": "ACTIVE",
            "balance_money": {
              "amount": 1500,
              "currency": "USD"
            },
            "gan": "7783320007480908",
            "created_at": "2020-12-17T01:41:35.157Z"
          },
          "unlinked_customer_id": "QPTXM8PQNX3Q726ZYHPMNP46XC"
        }
      }
    }
  },
  {
    name: 'Gift Card Updated',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.updated",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T02:41:35.157Z",
      "data": {
        "type": "gift_card",
        "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
        "object": {
          "gift_card": {
            "id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "type": "DIGITAL",
            "gan_source": "SQUARE",
            "state": "ACTIVE",
            "balance_money": {
              "amount": 3000,
              "currency": "USD"
            },
            "gan": "7783320007480908",
            "created_at": "2020-12-17T01:41:35.157Z"
          }
        }
      }
    }
  },
  {
    name: 'Gift Card Activity Created (Activation)',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.activity.created",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T03:41:35.157Z",
      "data": {
        "type": "gift_card_activity",
        "id": "gcact_c8f8cbf1f24b448d8ecf39ed03f97864",
        "object": {
          "gift_card_activity": {
            "id": "gcact_c8f8cbf1f24b448d8ecf39ed03f97864",
            "gift_card_id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "gift_card_gan": "7783320007480908",
            "type": "ACTIVATE",
            "gift_card_balance_money": {
              "amount": 1000,
              "currency": "USD"
            },
            "location_id": "81FN9BNFZTKS4",
            "activate_activity_details": {
              "amount_money": {
                "amount": 1000,
                "currency": "USD"
              },
              "order_id": "jJNGHm4gLI6XkFbwtiSLqK72KkAZY",
              "line_item_uid": "eIWl7X0nMuO9Ewbh0ChIx"
            },
            "created_at": "2020-12-17T01:41:35.157Z"
          }
        }
      }
    }
  },
  {
    name: 'Gift Card Activity Updated (Import)',
    payload: {
      "merchant_id": "C337NFWQT2A6W",
      "type": "gift_card.activity.updated",
      "event_id": "875f2038-6015-492e-9f29-d040b3809e49",
      "created_at": "2020-12-17T03:41:35.157Z",
      "data": {
        "type": "gift_card_activity",
        "id": "gcact_c8f8cbf1f24b448d8ecf39ed03f97864",
        "object": {
          "gift_card_activity": {
            "id": "gcact_c8f8cbf1f24b448d8ecf39ed03f97864",
            "gift_card_id": "gftc:00113070ba5745f0b2377c1b9570cb03",
            "gift_card_gan": "7783320007480908",
            "type": "IMPORT",
            "gift_card_balance_money": {
              "amount": 1500,
              "currency": "USD"
            },
            "location_id": "81FN9BNFZTKS4",
            "import_activity_details": {
              "amount_money": {
                "amount": 1500,
                "currency": "USD"
              }
            },
            "created_at": "2020-12-17T01:41:35.157Z"
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

async function testGiftCardWebhooks() {
  console.log('🎁 Testing Square Gift Card Webhook Processing...\n');
  
  // Test each gift card webhook
  for (const webhook of giftCardWebhooks) {
    console.log(`\n📬 Testing: ${webhook.name}`);
    console.log(`Event Type: ${webhook.payload.type}`);
    
    if (webhook.payload.data.object.gift_card) {
      const giftCard = webhook.payload.data.object.gift_card;
      console.log(`Gift Card ID: ${giftCard.id}`);
      console.log(`GAN: ${giftCard.gan}`);
      console.log(`State: ${giftCard.state}`);
      console.log(`Balance: $${giftCard.balance_money.amount / 100} ${giftCard.balance_money.currency}`);
      
      if (webhook.payload.data.object.linked_customer_id) {
        console.log(`Linked Customer: ${webhook.payload.data.object.linked_customer_id}`);
      }
      if (webhook.payload.data.object.unlinked_customer_id) {
        console.log(`Unlinked Customer: ${webhook.payload.data.object.unlinked_customer_id}`);
      }
    }
    
    if (webhook.payload.data.object.gift_card_activity) {
      const activity = webhook.payload.data.object.gift_card_activity;
      console.log(`Activity Type: ${activity.type}`);
      console.log(`Gift Card GAN: ${activity.gift_card_gan}`);
      console.log(`New Balance: $${activity.gift_card_balance_money.amount / 100} ${activity.gift_card_balance_money.currency}`);
      
      if (activity.activate_activity_details) {
        console.log(`Activation Amount: $${activity.activate_activity_details.amount_money.amount / 100}`);
        console.log(`Order ID: ${activity.activate_activity_details.order_id}`);
      }
    }
    
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
  
  console.log('\n\n🎯 Gift Card Webhook Processing Summary:');
  console.log('\n📊 Gift Card Lifecycle:');
  console.log('1. gift_card.created → New gift card created (NOT_ACTIVE state)');
  console.log('2. gift_card.activity.created → Gift card activated with initial balance');
  console.log('3. gift_card.customer_linked → Gift card linked to customer account');
  console.log('4. gift_card.updated → Balance changes from purchases/redemptions');
  console.log('5. gift_card.customer_unlinked → Gift card unlinked from customer');
  
  console.log('\n🔄 Integration Points:');
  console.log('- GAN (Gift Account Number) syncing with local database');
  console.log('- Balance updates trigger local gift card record updates');
  console.log('- Customer linking enables tracking and user-specific features');
  console.log('- Activity tracking provides complete audit trail');
  
  console.log('\n✨ Next Steps:');
  console.log('1. Monitor gift card webhooks in production');
  console.log('2. Sync Square gift cards with local database');
  console.log('3. Track balance changes in real-time');
  console.log('4. Enable customer-specific gift card features');
}

// Run the tests
testGiftCardWebhooks().catch(console.error);