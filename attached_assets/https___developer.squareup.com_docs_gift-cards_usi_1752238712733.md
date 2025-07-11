<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# https://developer.squareup.com/docs/gift-cards/using-gift-cards-api

https://developer.squareup.com/docs/gift-cards/sell-gift-cards
https://developer.squareup.com/docs/gift-cards/sell-gift-cards\#1-process-the-order-for-the-gift-card-amount
https://developer.squareup.com/docs/gift-cards/reload-gift-cards
https://developer.squareup.com/docs/gift-cards/reload-gift-cards\#1-process-the-order-for-the-gift-card-amount
https://developer.squareup.com/docs/gift-cards/reload-gift-cards\#load-orders-api-integration
https://developer.squareup.com/docs/gift-cards/redeem-gift-cards
https://developer.squareup.com/docs/gift-cards/retrieve-gift-cards-and-activities
https://developer.squareup.com/docs/gift-cards/manage-gift-cards-on-file
https://developer.squareup.com/docs/gift-cards/walkthrough-1
https://developer.squareup.com/docs/gift-cards/walkthrough-1-with-orders-api
https://developer.squareup.com/docs/gift-cards/walkthrough-1-without-orders-api
https://developer.squareup.com/docs/gift-cards/walkthrough-2
https://developer.squareup.com/docs/gift-cards/webhooks
https://developer.squareup.com/docs/gift-cards/walkthrough-2-orders-and-payments-integration
https://developer.squareup.com/docs/gift-cards/walkthrough-2-custom-processing-system
https://developer.squareup.com/docs/payments-api/take-payments
https://developer.squareup.com/docs/payments-api/take-payments/cash-app-payments
https://developer.squareup.com/docs/payments-api/take-payments/ach-payments
https://developer.squareup.com/docs/payments-api/webhooks
Can you Analyze End to end, ALl and Every signle Docs And the Docs Referrancs urls and Undaerstand the Giftcard Full a to Z Implementations Using api and also Payment Processing Using Custom Branded Checkout page including Card,ACH by Plaid, Google Pay,Apple pay,Cashapp Pay Payment methods To pay options adding

Based on my comprehensive research and analysis of the Square API documentation, I'll now provide you with a detailed end-to-end guide for implementing Square's Gift Cards API and Payment Processing system.

# Complete Guide to Square Gift Cards API and Payment Processing Implementation

## Overview

This comprehensive guide covers the complete implementation of Square's Gift Cards API from A to Z, including integration with various payment methods (Card, ACH by Plaid, Google Pay, Apple Pay, Cash App Pay) through a custom branded checkout page[^1][^2][^3].

## 1. Foundation and Setup

### API Requirements and Prerequisites

**OAuth Permissions Required:**

- `GIFTCARDS_READ` - for read operations
- `GIFTCARDS_WRITE` - for write operations
- `CUSTOMERS_READ` - to link gift cards to customers
- `PAYMENTS_WRITE` - to process payments and charge gift cards
- `ORDERS_WRITE` - for Orders API integration[^1]


### Authentication Setup

**Required Credentials:**

- Application ID
- Access Token (Sandbox for testing, Production for live)
- Location ID[^4][^5]

**Environment Configuration:**

```javascript
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
```


## 2. Gift Card Creation and Management

### 2.1 Creating Gift Cards

**Digital Gift Card Creation:**

```javascript
// Create digital gift card with auto-generated GAN
const createGiftCardRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCard: {
    type: 'DIGITAL'
  },
  locationId: SQUARE_LOCATION_ID
};

const response = await giftCardsApi.createGiftCard(createGiftCardRequest);
```

**Physical Gift Card Registration:**

```javascript
// Register physical gift card
const createGiftCardRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCard: {
    type: 'PHYSICAL',
    gan: '7783200000000000' // 16-digit GAN from physical card
  },
  locationId: SQUARE_LOCATION_ID
};
```

**Custom GAN Gift Card:**

```javascript
// Create with custom GAN
const createGiftCardRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCard: {
    type: 'DIGITAL',
    gan: 'CUSTOM12345678',
    ganSource: 'OTHER'
  },
  locationId: SQUARE_LOCATION_ID
};
```


### 2.2 Gift Card Activation

**Orders API Integration Approach:**

```javascript
// Step 1: Create order for gift card
const createOrderRequest = {
  order: {
    locationId: SQUARE_LOCATION_ID,
    lineItems: [{
      quantity: '1',
      itemType: 'GIFT_CARD',
      basePriceMoney: {
        amount: 2500, // $25.00
        currency: 'USD'
      },
      name: 'Gift Card'
    }]
  },
  idempotencyKey: generateIdempotencyKey()
};

const orderResponse = await ordersApi.createOrder(createOrderRequest);

// Step 2: Process payment for order
const createPaymentRequest = {
  sourceId: paymentToken,
  amountMoney: {
    amount: 2500,
    currency: 'USD'
  },
  orderId: orderResponse.order.id,
  idempotencyKey: generateIdempotencyKey(),
  locationId: SQUARE_LOCATION_ID
};

// Step 3: Activate gift card
const activateRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCardActivity: {
    giftCardId: giftCardId,
    type: 'ACTIVATE',
    locationId: SQUARE_LOCATION_ID,
    activateActivityDetails: {
      orderId: orderResponse.order.id,
      lineItemUid: orderResponse.order.lineItems[^0].uid
    }
  }
};

const activationResponse = await giftCardActivitiesApi.createGiftCardActivity(activateRequest);
```

**Custom Processing System Approach:**

```javascript
// Activate without Orders API
const activateRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCardActivity: {
    giftCardId: giftCardId,
    type: 'ACTIVATE',
    locationId: SQUARE_LOCATION_ID,
    activateActivityDetails: {
      amountMoney: {
        amount: 2500,
        currency: 'USD'
      },
      buyerPaymentInstrumentIds: ['payment_instrument_id'],
      referenceId: 'custom_order_123'
    }
  }
};
```


## 3. Gift Card Operations

### 3.1 Reloading Gift Cards

**Load Additional Funds:**

```javascript
const loadRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCardActivity: {
    giftCardId: giftCardId,
    type: 'LOAD',
    locationId: SQUARE_LOCATION_ID,
    loadActivityDetails: {
      amountMoney: {
        amount: 1000, // $10.00
        currency: 'USD'
      },
      buyerPaymentInstrumentIds: ['payment_instrument_id'],
      referenceId: 'reload_transaction_456'
    }
  }
};

const loadResponse = await giftCardActivitiesApi.createGiftCardActivity(loadRequest);
```


### 3.2 Redeeming Gift Cards

**Payments API Integration (Automatic):**

```javascript
// Payment using gift card ID
const redeemPaymentRequest = {
  sourceId: giftCardId, // Use gift card ID directly
  amountMoney: {
    amount: 500, // $5.00
    currency: 'USD'
  },
  orderId: orderId,
  idempotencyKey: generateIdempotencyKey(),
  locationId: SQUARE_LOCATION_ID
};

// Payment using payment token from Web Payments SDK
const redeemPaymentRequest = {
  sourceId: paymentToken, // Token from SDK
  amountMoney: {
    amount: 500,
    currency: 'USD'
  },
  orderId: orderId,
  idempotencyKey: generateIdempotencyKey(),
  locationId: SQUARE_LOCATION_ID
};
```

**Manual Redemption (Custom Processing):**

```javascript
const redeemRequest = {
  idempotencyKey: generateIdempotencyKey(),
  giftCardActivity: {
    giftCardId: giftCardId,
    type: 'REDEEM',
    locationId: SQUARE_LOCATION_ID,
    redeemActivityDetails: {
      amountMoney: {
        amount: 500,
        currency: 'USD'
      },
      referenceId: 'purchase_789'
    }
  }
};
```


### 3.3 Gift Card Retrieval and Management

**Retrieve Gift Card Information:**

```javascript
// By ID
const giftCard = await giftCardsApi.retrieveGiftCard(giftCardId);

// By GAN
const giftCardByGAN = await giftCardsApi.retrieveGiftCardFromGAN({
  gan: '7783200000000000'
});

// By payment token
const giftCardByNonce = await giftCardsApi.retrieveGiftCardFromNonce({
  nonce: paymentToken
});

// List all gift cards
const giftCardsList = await giftCardsApi.listGiftCards({
  type: 'DIGITAL',
  state: 'ACTIVE',
  customerId: customerId
});
```

**Activity Tracking:**

```javascript
// List gift card activities
const activitiesList = await giftCardActivitiesApi.listGiftCardActivities({
  giftCardId: giftCardId,
  type: 'REDEEM',
  beginTime: '2024-01-01T00:00:00Z',
  endTime: '2024-12-31T23:59:59Z'
});
```


## 4. Customer Management and Cards on File

### 4.1 Linking Customers to Gift Cards

```javascript
// Link customer to gift card
const linkResponse = await giftCardsApi.linkCustomerToGiftCard(giftCardId, {
  customerId: customerId
});

// Unlink customer from gift card
const unlinkResponse = await giftCardsApi.unlinkCustomerFromGiftCard(giftCardId, {
  customerId: customerId
});

// List customer's gift cards
const customerGiftCards = await giftCardsApi.listGiftCards({
  customerId: customerId,
  state: 'ACTIVE'
});
```


### 4.2 Gift Card Limitations

- Maximum 50 gift cards per customer profile
- Maximum 10 customer profiles per gift card
- Physical gift cards automatically unlinked when balance reaches zero[^6]


## 5. Custom Branded Checkout Implementation

### 5.1 Web Payments SDK Setup

**HTML Structure:**

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
    <link rel="stylesheet" href="checkout.css">
</head>
<body>
    <div id="payment-form">
        <div id="card-container"></div>
        <div id="google-pay-container"></div>
        <div id="apple-pay-container"></div>
        <div id="ach-container"></div>
        <div id="cash-app-container"></div>
        <div id="gift-card-container"></div>
        <button id="pay-button">Pay Now</button>
    </div>
    <script src="checkout.js"></script>
</body>
</html>
```

**JavaScript Implementation:**

```javascript
const payments = Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);

// Initialize payment methods
async function initializePaymentMethods() {
    // Credit/Debit Card
    const card = await payments.card();
    await card.attach('#card-container');
    
    // Google Pay
    const paymentRequest = payments.paymentRequest({
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
            amount: '10.00',
            label: 'Total'
        }
    });
    
    const googlePay = await payments.googlePay(paymentRequest);
    await googlePay.attach('#google-pay-container');
    
    // Apple Pay
    const applePay = await payments.applePay(paymentRequest);
    await applePay.attach('#apple-pay-container');
    
    // ACH
    const ach = await payments.ach();
    await ach.attach('#ach-container');
    
    // Cash App
    const cashApp = await payments.cashApp(paymentRequest);
    await cashApp.attach('#cash-app-container');
    
    // Gift Card
    const giftCard = await payments.giftCard();
    await giftCard.attach('#gift-card-container');
}

// Payment processing
async function processPayment(paymentMethod) {
    try {
        const tokenResult = await paymentMethod.tokenize();
        if (tokenResult.status === 'OK') {
            const paymentToken = tokenResult.token;
            
            // Send to backend for processing
            const response = await fetch('/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: paymentToken,
                    amount: 1000, // $10.00
                    currency: 'USD'
                })
            });
            
            const result = await response.json();
            handlePaymentResult(result);
        }
    } catch (error) {
        console.error('Payment failed:', error);
    }
}
```


### 5.2 Custom Styling

**CSS Customization:**

```css
/* Custom payment form styling */
.payment-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Card input styling */
#card-container {
    margin-bottom: 20px;
}

.sq-input {
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.sq-input--focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.sq-input--error {
    border-color: #ea4335;
    background-color: #ffeaea;
}

/* Payment method buttons */
.payment-method-button {
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.google-pay-button {
    background-color: #4285f4;
    color: white;
}

.apple-pay-button {
    background-color: #000;
    color: white;
}

.cash-app-button {
    background-color: #00d632;
    color: white;
}
```


## 6. Backend Payment Processing

### 6.1 Node.js Server Implementation

```javascript
const express = require('express');
const { Client, Environment } = require('squareup');
const app = express();

// Initialize Square client
const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Sandbox // or Environment.Production
});

const paymentsApi = client.paymentsApi;
const ordersApi = client.ordersApi;
const giftCardsApi = client.giftCardsApi;
const giftCardActivitiesApi = client.giftCardActivitiesApi;

// Process payment endpoint
app.post('/process-payment', async (req, res) => {
    try {
        const { sourceId, amount, currency, orderId } = req.body;
        
        const createPaymentRequest = {
            sourceId: sourceId,
            amountMoney: {
                amount: amount,
                currency: currency
            },
            orderId: orderId,
            idempotencyKey: generateIdempotencyKey(),
            locationId: process.env.SQUARE_LOCATION_ID
        };
        
        const response = await paymentsApi.createPayment(createPaymentRequest);
        
        if (response.result.payment) {
            res.json({
                success: true,
                payment: response.result.payment
            });
        } else {
            res.status(400).json({
                success: false,
                errors: response.result.errors
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Gift card purchase endpoint
app.post('/purchase-gift-card', async (req, res) => {
    try {
        const { amount, currency, paymentToken, recipientEmail } = req.body;
        
        // Step 1: Create order
        const order = await createGiftCardOrder(amount, currency);
        
        // Step 2: Process payment
        const payment = await processGiftCardPayment(paymentToken, order.id, amount, currency);
        
        // Step 3: Create gift card
        const giftCard = await createDigitalGiftCard();
        
        // Step 4: Activate gift card
        const activation = await activateGiftCard(giftCard.id, order.id, order.lineItems[^0].uid);
        
        // Step 5: Deliver gift card (your responsibility)
        await deliverGiftCard(giftCard.gan, recipientEmail, amount);
        
        res.json({
            success: true,
            giftCard: giftCard,
            activation: activation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function generateIdempotencyKey() {
    return require('crypto').randomUUID();
}
```


### 6.2 Payment Method Specific Processing

**ACH Payments:**

```javascript
// ACH payments are asynchronous and require special handling
const achPaymentRequest = {
    sourceId: achToken,
    amountMoney: {
        amount: amount,
        currency: 'USD'
    },
    autocomplete: true, // Required for ACH
    locationId: SQUARE_LOCATION_ID,
    idempotencyKey: generateIdempotencyKey()
};

// Payment will be PENDING initially
const achResponse = await paymentsApi.createPayment(achPaymentRequest);
```

**Digital Wallet Payments:**

```javascript
// Google Pay/Apple Pay/Cash App payments
const digitalWalletPaymentRequest = {
    sourceId: digitalWalletToken,
    amountMoney: {
        amount: amount,
        currency: 'USD'
    },
    locationId: SQUARE_LOCATION_ID,
    idempotencyKey: generateIdempotencyKey()
};

const digitalWalletResponse = await paymentsApi.createPayment(digitalWalletPaymentRequest);
```


## 7. Webhook Implementation

### 7.1 Gift Card Webhooks

**Supported Webhook Events:**

- `gift_card.created`
- `gift_card.updated`
- `gift_card.customer_linked`
- `gift_card.customer_unlinked`
- `gift_card.activity.created`
- `gift_card.activity.updated`[^7]

**Webhook Handler:**

```javascript
app.post('/webhooks/gift-cards', (req, res) => {
    const signature = req.headers['x-square-signature'];
    const body = req.body;
    
    // Verify webhook signature
    if (!verifyWebhookSignature(signature, body)) {
        return res.status(401).send('Unauthorized');
    }
    
    const event = JSON.parse(body);
    
    switch (event.type) {
        case 'gift_card.created':
            handleGiftCardCreated(event.data);
            break;
        case 'gift_card.updated':
            handleGiftCardUpdated(event.data);
            break;
        case 'gift_card.activity.created':
            handleGiftCardActivityCreated(event.data);
            break;
        default:
            console.log('Unhandled event type:', event.type);
    }
    
    res.status(200).send('OK');
});
```


## 8. Testing and Sandbox Environment

### 8.1 Sandbox Configuration

**Test Values:**

- Gift Card GAN: `7783 3200 0000 0000`
- Card payment token: `cnon:card-nonce-ok`
- Gift card payment token: `cnon:gift-card-nonce-ok`
- ACH payment token: Generated via Web Payments SDK[^8]


### 8.2 Testing Scenarios

**Complete Gift Card Flow Test:**

```javascript
// Test complete gift card lifecycle
async function testGiftCardFlow() {
    try {
        // 1. Create gift card
        const giftCard = await createDigitalGiftCard();
        console.log('Gift card created:', giftCard.id);
        
        // 2. Activate with $25
        const activation = await activateGiftCard(giftCard.id, 2500);
        console.log('Gift card activated:', activation.giftCardBalance);
        
        // 3. Redeem $10
        const redemption = await redeemGiftCard(giftCard.id, 1000);
        console.log('Gift card redeemed:', redemption.giftCardBalance);
        
        // 4. Reload $15
        const reload = await reloadGiftCard(giftCard.id, 1500);
        console.log('Gift card reloaded:', reload.giftCardBalance);
        
        // 5. Check final balance
        const finalCard = await giftCardsApi.retrieveGiftCard(giftCard.id);
        console.log('Final balance:', finalCard.giftCard.balanceMoney);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}
```


## 9. Security and Compliance

### 9.1 Security Best Practices

**Token Security:**

- Store access tokens securely in environment variables
- Use HTTPS for all API communications
- Implement proper error handling
- Validate all input data[^1]

**Custom GAN Security:**

- Use unpredictable patterns
- Avoid sequential numbers
- Implement proper validation
- Consider using Square-generated GANs[^1]


### 9.2 PCI Compliance

The Web Payments SDK handles PCI compliance automatically by:

- Tokenizing sensitive payment data
- Using secure iframes for card input
- Never exposing card details to your application[^9]


## 10. Production Deployment

### 10.1 Environment Configuration

**Production Checklist:**

- Switch to production environment
- Update access tokens
- Configure production webhooks
- Test all payment methods
- Implement proper logging
- Set up monitoring and alerts

**Environment Variables:**

```javascript
// Production configuration
const config = {
    environment: process.env.NODE_ENV === 'production' ? 
        Environment.Production : Environment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: process.env.SQUARE_LOCATION_ID,
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
};
```

This comprehensive guide provides a complete implementation framework for Square's Gift Cards API integrated with multi-payment method processing. The system supports both Orders API integration and custom processing approaches, with full webhook support and proper security measures.

<div style="text-align: center">⁂</div>

[^1]: https://developer.squareup.com/docs/gift-cards/using-gift-cards-api

[^2]: https://developer.squareup.com/docs/gift-cards/sell-gift-cards

[^3]: https://developer.squareup.com/docs/online-payment-options

[^4]: https://documentation.astera.com/api-flow/api-consumption/authorize/authorizing-the-square-api

[^5]: https://github.com/square/web-payments-quickstart

[^6]: https://developer.squareup.com/docs/gift-cards/walkthrough-2

[^7]: https://developer.squareup.com/docs/gift-cards/manage-gift-cards-on-file

[^8]: https://developer.squareup.com/docs/gift-cards/retrieve-gift-cards-and-activities

[^9]: https://developer.squareup.com/docs/web-payments/overview

[^10]: https://developer.squareup.com/docs/gift-cards/reload-gift-cards

[^11]: https://developer.squareup.com/docs/gift-cards/redeem-gift-cards

[^12]: https://developer.squareup.com/docs/gift-cards/walkthrough-1

[^13]: https://developer.squareup.com/docs/gift-cards/webhooks

[^14]: https://developer.squareup.com/docs/payments-api/take-payments/ach-payments

[^15]: https://developer.squareup.com/docs/payments-api/take-payments/cash-app-payments

[^16]: https://developer.squareup.com/docs/payments-api/take-payments

[^17]: https://developer.squareup.com/docs/payments-api/webhooks

[^18]: https://developer.squareup.com/docs/gift-cards/walkthrough-2-custom-processing-system

[^19]: https://developer.squareup.com/docs/gift-cards/walkthrough-1-with-orders-api

[^20]: https://developer.squareup.com/docs/gift-cards/walkthrough-1-without-orders-api

[^21]: https://developer.squareup.com/docs/gift-cards/walkthrough-2-orders-and-payments-integration

[^22]: https://stackoverflow.com/questions/57517376/how-to-send-custom-amount-square-payment-api-from-web

[^23]: https://developer.squareup.com/docs/in-app-payments-sdk/add-digital-wallets/google-pay

[^24]: http://react-square-payments.weareseeed.com/docs/props

[^25]: https://developer.squareup.com/reference/sdks/web/payments/digital-wallets/apple-pay

[^26]: https://www.rsjoomla.com/support/documentation/rsform-pro/plugins-and-modules/plugin-square-create-custom-order-forms.html

[^27]: https://woocommerce.com/document/woocommerce-square/woocommerce-square-checkout-experience/

[^28]: https://mobikul.com/square-payment-integration-through-sdk/

[^29]: https://wpmanageninja.com/docs/fluent-form/payment-settings/how-to-integrate-square-with-wp-fluent-forms/

[^30]: https://v3.gatsbyjs.com/docs/processing-payments-with-square/

[^31]: http://react-square-payments.weareseeed.com/docs/apple-pay/usage

[^32]: https://developer.squareup.com/docs/in-app-payments-sdk/cookbook/customize-payment-form

[^33]: https://www.youtube.com/watch?v=v-8w8IujsJs

[^34]: https://www.foxnetsoft.com/squarewebpayments

[^35]: https://github.com/square/in-app-payments-react-native-plugin/issues/58

[^36]: https://www.npmjs.com/package/react-square-web-payments-sdk

[^37]: https://github.com/square/mobile-payments-sdk-android

[^38]: https://docs.zeroqode.com/plugins/square-card-form-(web-payments-sdk)

[^39]: http://react-square-payments.weareseeed.com/docs

[^40]: https://developer.squareup.com/docs/web-payments/apple-pay

[^41]: https://squarestyle.co/tutorials/edit-checkout-page-on-squarespace

[^42]: https://developers.google.com/pay/api/web/guides/tutorial

[^43]: https://developer.squareup.com/forums/t/how-can-i-customize-the-checkout-experience-to-match-my-websites-branding/11009

[^44]: https://www.youtube.com/watch?v=2tUbxgkjjCo

[^45]: https://www.youtube.com/watch?v=SymdOPCGvq4

[^46]: https://support.squarespace.com/hc/en-us/articles/360002111987-Customizing-your-checkout-experience

[^47]: https://daily.dev/blog/gift-card-integration-guide-for-developers

[^48]: https://squareup.com/help/us/en/article/6859-checkout-options-with-square-online-store

[^49]: https://developer.apple.com/apple-pay/implementation/

[^50]: https://stackoverflow.com/questions/48714829/is-it-possible-to-customize-the-square-checkout-page-at-all

[^51]: https://www.youtube.com/watch?v=zmFP4sUBYCQ

[^52]: https://help.octopuspro.com/square-api-integration/

[^53]: https://square.github.io/web-payments-showcase/

[^54]: https://vidico.com/case-studies/square-checkout-brand-video/

[^55]: https://developer.squareup.com/blog/design-your-custom-payment-form-with-sqpaymentform/

[^56]: https://help.openconnectors.ext.hana.ondemand.com/home/square-api-provider-setup

[^57]: https://developer.squareup.com/docs/web-payments/quickstart/add-sdk-to-web-client

[^58]: https://wpforms.com/docs/customizing-the-style-of-payment-fields/

[^59]: https://www.youtube.com/watch?v=GKTrSNgVKyk

[^60]: https://developer.squareup.com/docs/web-payments/customize-styles

[^61]: https://docs.joincpr.com/en/article/16-accessing-square-api-keys

[^62]: https://docs.celigo.com/hc/en-us/articles/360038937771-Set-up-a-connection-to-Square

[^63]: https://gist.github.com/JohnMAustin78/40f2984af92268a1c4fe41c78ca69188

[^64]: https://developer.squareup.com/docs/oauth-api/create-urls-for-square-authorization

[^65]: https://stackoverflow.com/questions/53826317/square-payment-form-css-issue

[^66]: https://www.youtube.com/watch?v=1eT2HeaZwjM

[^67]: https://build.airdev.co/wiki/how-to-implement-square-payments-bubble-application

[^68]: https://help.trustpayments.com/hc/en-us/articles/27217586864273-Customise-the-appearance-of-Payment-Pages

