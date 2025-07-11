/**
 * Payment Webhook Test Suite
 * Tests Square payment.created and payment.updated webhook processing
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/webhooks/square';
const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'test-key';

// Payment webhook payloads from Square
const paymentWebhooks = [
  {
    name: 'Payment Created',
    payload: {
      "merchant_id": "6SSW7HV8K2ST5",
      "type": "payment.created",
      "event_id": "13b867cf-db3d-4b1c-90b6-2f32a9d78124",
      "created_at": "2020-02-06T21:27:30.792Z",
      "data": {
        "type": "payment",
        "id": "KkAkhdMsgzn59SM8A89WgKwekxLZY",
        "object": {
          "payment": {
            "id": "hYy9pRFVxpDsO1FB05SunFWUe9JZY",
            "created_at": "2020-11-22T21:16:51.086Z",
            "updated_at": "2020-11-22T21:16:51.198Z",
            "amount_money": {
              "amount": 100,
              "currency": "USD"
            },
            "status": "APPROVED",
            "delay_duration": "PT168H",
            "source_type": "CARD",
            "card_details": {
              "status": "AUTHORIZED",
              "card": {
                "card_brand": "MASTERCARD",
                "last_4": "9029",
                "exp_month": 11,
                "exp_year": 2022,
                "fingerprint": "sq-1-Tvruf3vPQxlvI6n0IcKYfBukrcv6IqWr8UyBdViWXU2yzGn5VMJvrsHMKpINMhPmVg",
                "card_type": "CREDIT",
                "prepaid_type": "NOT_PREPAID",
                "bin": "540988"
              },
              "entry_method": "KEYED",
              "cvv_status": "CVV_ACCEPTED",
              "avs_status": "AVS_ACCEPTED",
              "statement_description": "SQ *DEFAULT TEST ACCOUNT",
              "card_payment_timeline": {
                "authorized_at": "2020-11-22T21:16:51.198Z"
              }
            },
            "location_id": "S8GWD5R9QB376",
            "order_id": "03O3USaPaAaFnI6kkwB1JxGgBsUZY",
            "risk_evaluation": {
              "created_at": "2020-11-22T21:16:51.198Z",
              "risk_level": "NORMAL"
            },
            "total_money": {
              "amount": 100,
              "currency": "USD"
            },
            "approved_money": {
              "amount": 100,
              "currency": "USD"
            },
            "capabilities": [
              "EDIT_TIP_AMOUNT",
              "EDIT_TIP_AMOUNT_UP",
              "EDIT_TIP_AMOUNT_DOWN"
            ],
            "receipt_number": "hYy9",
            "delay_action": "CANCEL",
            "delayed_until": "2020-11-29T21:16:51.086Z",
            "version_token": "FfQhQJf9r3VSQIgyWBk1oqhIwiznLwVwJbVVA0bdyEv6o"
          }
        }
      }
    }
  },
  {
    name: 'Payment Updated (Completed)',
    payload: {
      "merchant_id": "6SSW7HV8K2ST5",
      "type": "payment.updated",
      "event_id": "6a8f5f28-54a1-4eb0-a98a-3111513fd4fc",
      "created_at": "2020-02-06T21:27:34.308Z",
      "data": {
        "type": "payment",
        "id": "hYy9pRFVxpDsO1FB05SunFWUe9JZY",
        "object": {
          "payment": {
            "id": "hYy9pRFVxpDsO1FB05SunFWUe9JZY",
            "created_at": "2020-11-22T21:16:51.086Z",
            "updated_at": "2020-11-22T21:19:00.831Z",
            "amount_money": {
              "amount": 100,
              "currency": "USD"
            },
            "status": "COMPLETED",
            "delay_duration": "PT168H",
            "source_type": "CARD",
            "card_details": {
              "status": "CAPTURED",
              "card": {
                "card_brand": "MASTERCARD",
                "last_4": "9029",
                "exp_month": 11,
                "exp_year": 2022,
                "fingerprint": "sq-1-Tvruf3vPQxlvI6n0IcKYfBukrcv6IqWr8UyBdViWXU2yzGn5VMJvrsHMKpINMhPmVg",
                "card_type": "CREDIT",
                "prepaid_type": "NOT_PREPAID",
                "bin": "540988"
              },
              "entry_method": "KEYED",
              "cvv_status": "CVV_ACCEPTED",
              "avs_status": "AVS_ACCEPTED",
              "statement_description": "SQ *DEFAULT TEST ACCOUNT",
              "card_payment_timeline": {
                "authorized_at": "2020-11-22T21:16:51.198Z",
                "captured_at": "2020-11-22T21:19:00.832Z"
              }
            },
            "location_id": "S8GWD5R9QB376",
            "order_id": "03O3USaPaAaFnI6kkwB1JxGgBsUZY",
            "risk_evaluation": {
              "created_at": "2020-11-22T21:16:51.198Z",
              "risk_level": "NORMAL"
            },
            "total_money": {
              "amount": 100,
              "currency": "USD"
            },
            "approved_money": {
              "amount": 100,
              "currency": "USD"
            },
            "receipt_number": "hYy9",
            "receipt_url": "https://squareup.com/receipt/preview/hYy9pRFVxpDsO1FB05SunFWUe9JZY",
            "delay_action": "CANCEL",
            "delayed_until": "2020-11-29T21:16:51.086Z",
            "version_token": "bhC3b8qKJvNDdxqKzXaeDsAjS1oMFuAKxGgT32HbE6S6o"
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

async function testPaymentWebhooks() {
  console.log('🔔 Testing Square Payment Webhook Processing...\n');
  
  // Test each payment webhook
  for (const webhook of paymentWebhooks) {
    console.log(`\n📬 Testing: ${webhook.name}`);
    console.log(`Event Type: ${webhook.payload.type}`);
    console.log(`Payment ID: ${webhook.payload.data.object.payment.id}`);
    console.log(`Order ID: ${webhook.payload.data.object.payment.order_id}`);
    console.log(`Amount: $${webhook.payload.data.object.payment.amount_money.amount / 100} ${webhook.payload.data.object.payment.amount_money.currency}`);
    console.log(`Status: ${webhook.payload.data.object.payment.status}`);
    
    if (webhook.payload.data.object.payment.card_details) {
      const card = webhook.payload.data.object.payment.card_details.card;
      console.log(`Card: ${card.card_brand} ****${card.last_4}`);
      console.log(`Card Status: ${webhook.payload.data.object.payment.card_details.status}`);
    }
    
    if (webhook.payload.data.object.payment.receipt_url) {
      console.log(`Receipt URL: ${webhook.payload.data.object.payment.receipt_url}`);
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
  
  console.log('\n\n🎯 Payment Webhook Processing Summary:');
  console.log('\n📊 Payment Flow:');
  console.log('1. payment.created → Payment authorized (APPROVED status)');
  console.log('   - Card validated and authorized');
  console.log('   - Risk evaluation performed');
  console.log('   - Order ID linked for tracking');
  console.log('\n2. payment.updated → Payment captured (COMPLETED status)');
  console.log('   - Funds captured from card');
  console.log('   - Receipt URL generated');
  console.log('   - Transaction finalized');
  
  console.log('\n🔄 Integration with Gift Cards:');
  console.log('- Payment webhooks trigger gift card activation');
  console.log('- Order ID links payment to specific gift card');
  console.log('- Card details stored for receipts and tracking');
  console.log('- Risk evaluation monitored for fraud prevention');
  
  console.log('\n✨ Next Steps:');
  console.log('1. Monitor payment webhooks in production');
  console.log('2. Set up alerts for failed payments');
  console.log('3. Track payment metrics in dashboard');
  console.log('4. Configure receipt email delivery');
}

// Run the tests
testPaymentWebhooks().catch(console.error);