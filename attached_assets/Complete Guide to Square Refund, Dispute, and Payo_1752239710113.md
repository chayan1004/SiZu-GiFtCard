<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Complete Guide to Square Refund, Dispute, and Payout Systems with Automated Features

## Overview

This comprehensive guide covers Square's advanced refund processing, dispute management, and payout settlement systems, including automated evidence collection, real-time settlement reporting, and automatic payment confirmation features.

## 1. Refund System Architecture

### Core API Endpoints

**Refund Management:**

- `POST /v2/refunds` - Create new refund
- `GET /v2/refunds/{refund_id}` - Retrieve refund details
- `GET /v2/refunds` - List all refunds


### Comprehensive Refund Features

**Refund Types:**

- **Full Refunds**: Complete refund of original payment amount
- **Partial Refunds**: Refund any amount up to original payment
- **Multiple Refunds**: Multiple partial refunds until full amount is reached
- **Multi-Tender Support**: Automatic handling of refunds to multiple payment methods

**Supported Refund Sources:**

- Square Point of Sale (POS)
- Square Terminal
- Square Invoice
- Payments API
- Orders API
- Third-party applications via API


### Automated Refund Processing

**Real-Time Processing:**

```javascript
// Automatic refund processing
const refundRequest = {
  idempotencyKey: generateIdempotencyKey(),
  amountMoney: {
    amount: 1000, // $10.00
    currency: 'USD'
  },
  paymentId: paymentId,
  reason: 'Customer requested refund',
  locationId: LOCATION_ID
};

const refundResponse = await refundsApi.refundPayment(refundRequest);
```

**Automatic Reconciliation:**

- Refunds automatically reconcile with accounting systems
- Real-time balance updates
- Automatic fee calculations and adjustments


### Refund Webhook Events

**Real-Time Notifications:**

- `refund.created` - Sent when refund is initiated
- `refund.updated` - Sent when refund status changes (PENDING → COMPLETED)

**Processing Timelines:**

- **Standard Processing**: 5-10 business days to customer bank account
- **Reversal Processing**: Immediate if refund processed soon after payment
- **Cash Payments**: Cannot be refunded via Payments API (use Transactions API)


## 2. Dispute Management System

### Comprehensive Dispute API Endpoints

**Dispute Operations:**

- `GET /v2/disputes` - List all disputes
- `GET /v2/disputes/{dispute_id}` - Retrieve dispute details
- `POST /v2/disputes/{dispute_id}/accept` - Accept dispute
- `POST /v2/disputes/{dispute_id}/evidence` - Submit evidence
- `POST /v2/disputes/{dispute_id}/evidence-files` - Upload evidence files
- `GET /v2/disputes/{dispute_id}/evidence` - List evidence
- `DELETE /v2/disputes/{dispute_id}/evidence/{evidence_id}` - Delete evidence


### Automatic Evidence Collection System

**Auto-Collected Evidence:**
Square automatically gathers and compiles the following evidence:

- **Transaction Details**: Complete payment information and metadata
- **Customer Information**: Automatically gathered customer data
- **Payment Records**: Full payment history and related transactions
- **Order Details**: Complete order information and line items


### Streamlined Evidence Submission Process

**Three-Step Evidence Collection:**

1. **Describe Transaction**: Detailed description of what happened
2. **Upload Evidence**: Service-specific evidence upload
3. **Additional Details**: Any other relevant dispute information

**Smart Evidence Recommendations:**

- Square suggests relevant evidence based on dispute reason
- Automated categorization of evidence by type
- AI-powered evidence compilation for maximum impact


### Evidence File Management

**Supported File Formats:**

- HEIC, HEIF, JPEG, PDF, PNG, TIFF
- Maximum file size: 5MB per file
- Maximum pages: 15 pages per document

**Evidence Types:**

- Signed receipts and authorization forms
- Delivery confirmations and shipping tracking
- Customer communications and correspondence
- Terms of service and refund policies
- Proof of service completion
- Invoice and billing documentation


### Automated Dispute Processing

**Real-Time Notifications:**

```javascript
// Dispute webhook handler
app.post('/webhooks/disputes', (req, res) => {
    const event = req.body;
    
    switch (event.type) {
        case 'dispute.created':
            handleNewDispute(event.data);
            break;
        case 'dispute.updated':
            handleDisputeStatusChange(event.data);
            break;
        case 'dispute.evidence.created':
            handleEvidenceSubmission(event.data);
            break;
    }
    
    res.status(200).send('OK');
});
```

**Automated Features:**

- **Deadline Tracking**: Automatic deadline reminders and notifications
- **Evidence Compilation**: Smart gathering of relevant transaction data
- **Submission Automation**: Streamlined evidence submission process
- **Status Monitoring**: Real-time dispute status tracking


### Dispute Processing Timeline

**Response Requirements:**

- **Response Deadline**: Typically 7-10 days to respond
- **Bank Decision**: Up to 90 days for final resolution
- **Automatic Acceptance**: Disputes auto-accepted if no response by deadline


## 3. Payout Settlement System

### Payout API Endpoints

**Payout Operations:**

- `GET /v2/payouts` - List all payouts
- `GET /v2/payouts/{payout_id}` - Retrieve payout details
- `GET /v2/payouts/{payout_id}/payout-entries` - List payout entries


### Comprehensive Payout Types

**Payout Categories:**

- **Batch Payout**: Transfer of seller's entire Square balance (most common)
- **Simple Payout**: Transfer of any amount less than entire balance
- **Instant Deposit**: Immediate transfer for 1.75% fee
- **Scheduled Deposit**: Automated instant deposit at specific times


### Settlement Schedules

**Standard Schedule:**

- **US Timing**: 5PM PST cutoff for next business day transfer
- **International Timing**: 12AM local time cutoff
- **Frequency**: Monday-Thursday transfers, Friday-Sunday batched for Monday

**Custom Schedule Options:**

- **Daily Transfers**: Automated daily transfers at custom times
- **Weekly Transfers**: Weekly batch transfers on chosen days
- **Manual Transfers**: On-demand transfer initiation

**Instant Transfers:**

- **Availability**: 24/7 including weekends and holidays
- **Fee**: 1.75% of transfer amount
- **Maximum**: \$10,000 per transfer
- **Unlimited Daily**: No limit on number of transfers per day


### Real-Time Settlement Reporting

**Live Payout Tracking:**

```javascript
// Real-time payout monitoring
const payoutStatus = await payoutsApi.getPayout(payoutId);

console.log(`Payout Status: ${payoutStatus.status}`);
console.log(`Amount: ${payoutStatus.amountMoney.amount}`);
console.log(`Destination: ${payoutStatus.destination.type}`);
console.log(`Created: ${payoutStatus.createdAt}`);
```

**Detailed Reporting Features:**

- **Payout Status**: Real-time payout status tracking
- **Entry Details**: Detailed breakdown of each payout entry
- **Reconciliation Data**: Complete reconciliation information
- **Fee Breakdown**: Detailed fee analysis per transaction


### Automated Settlement Features

**Automatic Processing:**

- **Scheduled Transfers**: Transfers without manual intervention
- **Real-Time Tracking**: Live payout status updates
- **Reconciliation Automation**: Automatic matching of payouts to transactions
- **Reporting Automation**: Automated payout reporting and analytics

**Payout Webhook Events:**

- `payout.created` - New payout initiated
- `payout.updated` - Payout status changes
- `payout.paid` - Payout successfully deposited
- `payout.failed` - Payout failed to deposit


## 4. Payment Confirmation Automation System

### Comprehensive Webhook Events

**Payment Events:**

- `payment.created` - Payment initiated
- `payment.updated` - Payment status changes
- `payment.completed` - Automatic confirmation when payment completes

**Gift Card Events:**

- `gift_card.created` - New gift card created
- `gift_card.updated` - Gift card status changes
- `gift_card.activity.created` - New activity on gift card
- `gift_card.customer_linked` - Customer linked to gift card
- `gift_card.customer_unlinked` - Customer unlinked from gift card


### Real-Time Confirmation System

**Automatic Confirmation Features:**

- **Real-Time Updates**: Webhook notifications within 60 seconds of event
- **Automatic Reconciliation**: Payments automatically reconcile with orders
- **Multi-Event Tracking**: Comprehensive event tracking across all payment types


### Complete Webhook Event System

**Implementation Example:**

```javascript
// Comprehensive webhook handler
app.post('/webhooks/square', (req, res) => {
    const signature = req.headers['x-square-signature'];
    const body = req.body;
    
    // Verify webhook signature
    if (!verifySquareSignature(signature, body)) {
        return res.status(401).send('Unauthorized');
    }
    
    const event = JSON.parse(body);
    
    switch (event.type) {
        // Payment events
        case 'payment.created':
            handlePaymentCreated(event.data);
            break;
        case 'payment.updated':
            handlePaymentUpdated(event.data);
            break;
            
        // Refund events
        case 'refund.created':
            handleRefundCreated(event.data);
            break;
        case 'refund.updated':
            handleRefundUpdated(event.data);
            break;
            
        // Dispute events
        case 'dispute.created':
            handleDisputeCreated(event.data);
            break;
        case 'dispute.updated':
            handleDisputeUpdated(event.data);
            break;
            
        // Payout events
        case 'payout.created':
            handlePayoutCreated(event.data);
            break;
        case 'payout.updated':
            handlePayoutUpdated(event.data);
            break;
            
        // Gift card events
        case 'gift_card.created':
            handleGiftCardCreated(event.data);
            break;
        case 'gift_card.activity.created':
            handleGiftCardActivity(event.data);
            break;
    }
    
    res.status(200).send('OK');
});
```


## 5. Complete Automation System

### Automatic Evidence Collection

**Smart Evidence Compilation:**

- **Transaction Data**: Automatically collected payment details
- **Customer Information**: Auto-gathered customer data
- **Order Metadata**: Complete order information
- **Payment History**: Full payment transaction history
- **AI-Powered Compilation**: Intelligent evidence compilation for disputes


### Automatic Settlement Processing

**Real-Time Processing:**

- **Immediate Processing**: Real-time settlement processing
- **Automatic Reconciliation**: Automated matching of transactions to payouts
- **Multi-Account Support**: Automatic handling of multiple business accounts
- **Failure Handling**: Automatic retry and failure notification


### Automatic Notification System

**Comprehensive Notifications:**

- **Webhook Delivery**: Real-time webhook delivery for all events
- **Email Notifications**: Automatic email alerts for critical events
- **Dashboard Updates**: Real-time dashboard status updates
- **Mobile Notifications**: Push notifications via Square app


## 6. Implementation Requirements

### OAuth Permissions

**Required Permissions:**

```javascript
const requiredPermissions = [
    'PAYMENTS_READ',
    'PAYMENTS_WRITE',
    'REFUNDS_READ',
    'REFUNDS_WRITE',
    'DISPUTES_READ',
    'DISPUTES_WRITE',
    'PAYOUTS_READ',
    'GIFTCARDS_READ',
    'GIFTCARDS_WRITE'
];
```


### Webhook Setup Requirements

**Technical Requirements:**

- **Notification URL**: HTTPS endpoint for receiving webhooks
- **Signature Verification**: Webhook signature validation required
- **Response Requirements**: Must respond with 2xx status code
- **Retry Mechanism**: Square retries failed webhook deliveries


### Security Implementation

**Security Requirements:**

- **HTTPS Only**: All webhook endpoints must use HTTPS
- **Signature Validation**: HMAC-SHA256 signature verification
- **Idempotency Keys**: Required for all write operations
- **Access Token Security**: Secure storage of access tokens


## 7. Production Deployment

### Complete System Integration

**End-to-End Implementation:**

```javascript
// Complete system integration
class SquareAutomationSystem {
    constructor(config) {
        this.client = new Square.Client(config);
        this.paymentsApi = this.client.paymentsApi;
        this.refundsApi = this.client.refundsApi;
        this.disputesApi = this.client.disputesApi;
        this.payoutsApi = this.client.payoutsApi;
        this.giftCardsApi = this.client.giftCardsApi;
    }
    
    // Automatic refund processing
    async processRefund(paymentId, amount, reason) {
        const refund = await this.refundsApi.refundPayment({
            idempotencyKey: generateIdempotencyKey(),
            amountMoney: { amount, currency: 'USD' },
            paymentId,
            reason
        });
        
        // Automatic notification
        await this.notifyRefundProcessed(refund);
        return refund;
    }
    
    // Automatic dispute evidence submission
    async submitDisputeEvidence(disputeId, evidenceData) {
        const evidence = await this.disputesApi.submitEvidence(disputeId, {
            evidence: evidenceData
        });
        
        // Automatic tracking
        await this.trackDisputeProgress(disputeId);
        return evidence;
    }
    
    // Real-time payout monitoring
    async monitorPayouts() {
        const payouts = await this.payoutsApi.listPayouts();
        
        for (const payout of payouts.payouts) {
            if (payout.status === 'SENT') {
                await this.trackPayoutStatus(payout.id);
            }
        }
    }
}
```

This comprehensive system provides complete automation for Square's refund, dispute, and payout operations, with real-time monitoring, automatic evidence collection, and streamlined settlement processes. The implementation ensures fast, secure, and reliable processing of all financial transactions with minimal manual intervention.

