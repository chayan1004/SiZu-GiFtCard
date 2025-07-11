/**
 * Online Checkout Webhook Test Suite
 * Tests Square online checkout settings webhook event processing
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/webhooks/square';
const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-key';

// Online Checkout webhook payloads from Square
const onlineCheckoutWebhooks = [
  {
    name: 'Online Checkout Location Settings Updated',
    payload: {
      "merchant_id": "MLX0WMXAER48M",
      "type": "online_checkout.location_settings.updated",
      "event_id": "eda83745-f27e-3812-a368-b61665e466f5",
      "created_at": "2023-11-09T18:05:02.078121868Z",
      "data": {
        "type": "location_settings",
        "id": "LJSYDQDQMDFNQ",
        "object": {
          "location_settings": {
            "branding": {
              "button_color": "#006aff",
              "button_shape": "SQUARED",
              "header_type": "FULL_WIDTH_LOGO"
            },
            "coupons": {
              "enabled": true
            },
            "customer_notes_enabled": true,
            "location_id": "LJSYDQDQMDFNQ",
            "tipping": {
              "default_percent": 15,
              "default_smart_tip": {
                "amount": 100,
                "currency": "USD"
              },
              "percentages": [
                15,
                20,
                25
              ],
              "smart_tipping_enabled": true,
              "smart_tips": [
                {
                  "amount": 100,
                  "currency": "USD"
                },
                {
                  "amount": 200,
                  "currency": "USD"
                },
                {
                  "amount": 300,
                  "currency": "USD"
                }
              ]
            },
            "updated_at": "2023-11-09 18:05:02 +0000 UTC"
          }
        }
      }
    }
  },
  {
    name: 'Online Checkout Merchant Settings Updated',
    payload: {
      "merchant_id": "MLX0WMXAER48M",
      "type": "online_checkout.merchant_settings.updated",
      "event_id": "8bfc6b46-b274-376f-b5e7-0575827f6f29",
      "created_at": "2023-11-09T18:04:58.856036784Z",
      "data": {
        "type": "merchant_settings",
        "id": "MLX0WMXAER48M",
        "object": {
          "merchant_settings": {
            "payment_methods": {
              "afterpay_clearpay": {
                "enabled": true,
                "item_eligibility_range": {
                  "max": {
                    "amount": 200000,
                    "currency": "USD"
                  },
                  "min": {
                    "amount": 200,
                    "currency": "USD"
                  }
                },
                "order_eligibility_range": {
                  "max": {
                    "amount": 200000,
                    "currency": "USD"
                  },
                  "min": {
                    "amount": 100,
                    "currency": "USD"
                  }
                }
              },
              "apple_pay": {
                "enabled": false
              },
              "cash_app": {
                "enabled": true
              },
              "google_pay": {
                "enabled": true
              }
            },
            "updated_at": "2023-11-09 18:04:58 +0000 UTC"
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

async function testOnlineCheckoutWebhooks() {
  console.log('🛒 Testing Square Online Checkout Webhook Processing...\n');
  
  // Test each online checkout webhook
  for (const webhook of onlineCheckoutWebhooks) {
    console.log(`\n📬 Testing: ${webhook.name}`);
    console.log(`Event Type: ${webhook.payload.type}`);
    console.log(`Merchant ID: ${webhook.payload.merchant_id}`);
    
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
  
  console.log('\n\n🎯 Online Checkout Webhook Processing Summary:');
  console.log('\n📊 Location Settings Features:');
  console.log('- Branding: Button colors, shapes, and header types');
  console.log('- Coupons: Enable/disable coupon functionality');
  console.log('- Customer Notes: Allow customers to add order notes');
  console.log('- Tipping: Configure default tips and smart tipping');
  
  console.log('\n💳 Payment Method Settings:');
  console.log('- Apple Pay: Enable/disable Apple Pay');
  console.log('- Google Pay: Enable/disable Google Pay');
  console.log('- Cash App: Enable/disable Cash App Pay');
  console.log('- Afterpay/Clearpay: Buy now, pay later with eligibility ranges');
  
  console.log('\n✨ Integration Benefits:');
  console.log('1. Real-time configuration updates');
  console.log('2. Dynamic payment method availability');
  console.log('3. Customizable checkout experience');
  console.log('4. Automatic UI updates based on settings');
}

// Run the tests
testOnlineCheckoutWebhooks().catch(console.error);