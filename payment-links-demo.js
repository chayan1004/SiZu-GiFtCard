/**
 * Square Payment Links API Demonstration
 * Shows the available endpoints and their expected payloads
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   Square Payment Links API Demo                       ║
╚═══════════════════════════════════════════════════════════════════════╝

The Square Payment Links API has been successfully implemented with the 
following endpoints:

┌─────────────────────────────────────────────────────────────────────┐
│ 1. Create Gift Card Payment Link                                    │
├─────────────────────────────────────────────────────────────────────┤
│ POST /api/payment-links/gift-card                                  │
│                                                                     │
│ Request Body:                                                       │
│ {                                                                   │
│   "name": "Premium Gift Card - $50",                               │
│   "amount": 50,                                                     │
│   "currency": "USD",                                                │
│   "description": "A perfect gift for any occasion",                │
│   "recipientEmail": "recipient@example.com",                       │
│   "recipientName": "Jane Doe",                                     │
│   "senderName": "John Smith",                                      │
│   "customMessage": "Happy Birthday! Enjoy your gift card!",        │
│   "paymentNote": "Gift card purchase for birthday present",         │
│   "checkoutOptions": {                                              │
│     "askForShippingAddress": false,                                │
│     "acceptedPaymentMethods": {                                     │
│       "applePay": true,                                             │
│       "googlePay": true,                                            │
│       "cashApp": true,                                              │
│       "afterpayClearpay": false                                     │
│     },                                                              │
│     "allowTipping": false,                                          │
│     "customFields": [                                               │
│       { "title": "Special delivery instructions" },                 │
│       { "title": "Gift wrap preference" }                          │
│     ],                                                              │
│     "redirectUrl": "https://example.com/thank-you",                │
│     "merchantSupportEmail": "support@example.com",                 │
│     "appFeeMoney": {                                                │
│       "amount": 1.5,                                                │
│       "currency": "USD"                                             │
│     },                                                              │
│     "shippingFee": {                                                │
│       "name": "Express Delivery",                                   │
│       "charge": {                                                   │
│         "amount": 4.99,                                             │
│         "currency": "USD"                                           │
│       }                                                             │
│     }                                                               │
│   },                                                                │
│   "prePopulatedData": {                                             │
│     "buyerEmail": "buyer@example.com",                             │
│     "buyerPhoneNumber": "+15551234567",                            │
│     "buyerAddress": {                                              │
│       "addressLine1": "123 Main St",                               │
│       "addressLine2": "Apt 4B",                                    │
│       "locality": "San Francisco",                                 │
│       "administrativeDistrictLevel1": "CA",                        │
│       "postalCode": "94105",                                       │
│       "country": "US"                                              │
│     }                                                               │
│   }                                                                 │
│ }                                                                   │
│                                                                     │
│ Response:                                                           │
│ {                                                                   │
│   "success": true,                                                  │
│   "paymentLink": {                                                  │
│     "id": "FV5LCO32HYNIRWLS",                                      │
│     "version": 1,                                                   │
│     "url": "https://checkout.square.site/pay/...",                 │
│     "orderId": "sCE4bdUkTU2OwIi0FsiYtMkmyWfZY",                   │
│     "createdAt": "2025-01-11T14:00:00Z",                           │
│     "paymentNote": "Gift card purchase for birthday present",       │
│     "checkoutOptions": {                                            │
│       "allowTipping": false,                                        │
│       "askForShippingAddress": false,                               │
│       "customFields": [                                             │
│         { "title": "Special delivery instructions",                 │
│           "uid": "QPEENYORWCHZOUL4GO3EVNKL" },                    │
│         { "title": "Gift wrap preference",                         │
│           "uid": "MWVZ74M34AT4NA4HK7LTB25L" }                     │
│       ],                                                            │
│       "merchantSupportEmail": "support@example.com",               │
│       "appFeeMoney": { "amount": 150, "currency": "USD" },        │
│       "shippingFee": {                                              │
│         "name": "Express Delivery",                                 │
│         "charge": { "amount": 499, "currency": "USD" }             │
│       }                                                             │
│     },                                                              │
│     "relatedResources": {                                           │
│       "orders": [{                                                  │
│         "id": "C0DMgui6YFmgyURVSRtxr4EShheZY",                    │
│         "locationId": "LD50VRHA8P636",                             │
│         "state": "DRAFT",                                           │
│         "version": 1,                                               │
│         "totalMoney": { "amount": 5000, "currency": "USD" }        │
│       }]                                                            │
│     }                                                               │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 2. Create Quick Pay Link                                           │
├─────────────────────────────────────────────────────────────────────┤
│ POST /api/payment-links/quick-pay                                  │
│                                                                     │
│ Request Body:                                                       │
│ {                                                                   │
│   "name": "Quick Payment - $25",                                   │
│   "amount": 25,                                                     │
│   "currency": "USD",                                                │
│   "description": "Quick payment for services",                     │
│   "paymentNote": "This is a payment note.",                        │
│   "checkoutOptions": {                                              │
│     "askForShippingAddress": true,                                 │
│     "acceptedPaymentMethods": {                                     │
│       "applePay": true,                                             │
│       "googlePay": true,                                            │
│       "cashApp": false,                                             │
│       "afterpayClearpay": false                                     │
│     },                                                              │
│     "allowTipping": true,                                           │
│     "merchantSupportEmail": "help@example.com",                    │
│     "appFeeMoney": {                                                │
│       "amount": 1.0,                                                │
│       "currency": "USD"                                             │
│     },                                                              │
│     "shippingFee": {                                                │
│       "name": "Standard Shipping",                                  │
│       "charge": {                                                   │
│         "amount": 4.99,                                             │
│         "currency": "USD"                                           │
│       }                                                             │
│     }                                                               │
│   },                                                                │
│   "prePopulatedData": {                                             │
│     "buyerEmail": "buyer_email@support.com"                        │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 3. Get Payment Link Details                                        │
├─────────────────────────────────────────────────────────────────────┤
│ GET /api/payment-links/{paymentLinkId}                             │
│                                                                     │
│ Response:                                                           │
│ {                                                                   │
│   "success": true,                                                  │
│   "paymentLink": {                                                  │
│     "id": "FV5LCO32HYNIRWLS",                                      │
│     "url": "https://checkout.square.site/pay/...",                 │
│     "orderId": "sCE4bdUkTb85...",                                  │
│     "createdAt": "2025-01-11T14:00:00Z",                           │
│     "checkoutOptions": {...},                                       │
│     "prePopulatedData": {...}                                       │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 4. Update Payment Link                                             │
├─────────────────────────────────────────────────────────────────────┤
│ PATCH /api/payment-links/{paymentLinkId}                           │
│                                                                     │
│ Request Body:                                                       │
│ {                                                                   │
│   "checkoutOptions": {                                              │
│     "allowTipping": true,                                           │
│     "redirectUrl": "https://example.com/updated-thank-you"         │
│   },                                                                │
│   "prePopulatedData": {                                             │
│     "buyerEmail": "updated@example.com"                            │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 5. Delete Payment Link                                             │
├─────────────────────────────────────────────────────────────────────┤
│ DELETE /api/payment-links/{paymentLinkId}                          │
│                                                                     │
│ Response:                                                           │
│ {                                                                   │
│   "success": true,                                                  │
│   "message": "Payment link deleted successfully"                   │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘

KEY FEATURES:
✓ Create shareable payment links for gift card purchases
✓ Configure accepted payment methods (Apple Pay, Google Pay, etc.)
✓ Pre-populate customer information for faster checkout
✓ Customize checkout experience with tipping, shipping options
✓ Track gift card metadata (recipient, sender, custom message)
✓ Update and manage payment links after creation
✓ Full integration with Square Checkout API

AUTHENTICATION:
All endpoints require authentication via either:
- Replit Auth (for admin users)
- Customer Auth (for registered customers)

The payment links integrate seamlessly with the existing Square 
payment processing, webhook handling, and gift card management systems.
`);