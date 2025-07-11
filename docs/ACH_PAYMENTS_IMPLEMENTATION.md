# ACH Bank Transfer Payments Implementation
## Square-Plaid Partnership Integration

### Overview
This document describes the implementation of ACH (Automated Clearing House) bank transfer payments in our gift card platform using Square's partnership with Plaid. This integration allows customers to pay directly from their bank accounts with lower fees than credit cards.

### Key Benefits
- **Lower Processing Fees**: 1% with $1 minimum (vs 2.6% + 10¢ for cards)
- **No Plaid Account Needed**: Square manages the entire Plaid integration
- **Secure Bank Authentication**: Plaid handles bank login and verification
- **High Transaction Limits**: Up to $50,000 per transaction

### Technical Implementation

#### Frontend Changes (PaymentForm.tsx)

1. **ACH Payment Method Initialization**
```typescript
// Initialize ACH payment method
const ach = await payments.ach({
  redirectURI: window.location.href,
  transactionId: `ach-${giftCardId}-${Date.now()}`,
});
```

2. **Event Listener for Tokenization**
```typescript
ach.addEventListener('ontokenization', (event) => {
  const { tokenResult, error } = event.detail;
  if (error) {
    // Handle error
  } else if (tokenResult?.status === 'OK') {
    // Process payment with token
    setAchToken(tokenResult.token);
  }
});
```

3. **Connect Bank Account Button**
- Validates form before initiating ACH flow
- Triggers Plaid Link modal for bank selection
- Shows processing state during bank connection

#### Backend Changes (routes-payments.ts)

1. **Payment Processing**
- Accepts ACH tokens (prefixed with 'bauth:')
- Logs ACH payment type for tracking
- Sets autocomplete to true (required for ACH)

2. **Payment Methods Endpoint**
- Added ACH as available payment method
- Includes processing time and fee information

### ACH Payment Flow

1. **Customer Initiates Payment**
   - Selects ACH payment method
   - Fills in required information
   - Clicks "Connect Bank Account"

2. **Bank Authentication (Plaid)**
   - Plaid Link modal opens
   - Customer selects their bank
   - Logs in with bank credentials
   - Selects account for payment

3. **Token Generation**
   - Plaid verifies account
   - Square generates payment token
   - Token sent to backend

4. **Payment Processing**
   - Backend creates order
   - Processes ACH payment with status "PENDING"
   - Payment updates to "COMPLETED" after settlement (1 minute in sandbox, 3-5 days in production)

### ACH Payment Response Structure

When an ACH payment is created, Square returns detailed bank account information:

```json
{
  "payment": {
    "id": "VMnh7EfZj6XR7ykHLWCXAkYDnxEZY",
    "created_at": "2020-10-19T00:28:36.827Z",
    "amount_money": {
      "amount": 10000,
      "currency": "USD"
    },
    "status": "PENDING",
    "source_type": "BANK_ACCOUNT",
    "bank_account_details": {
      "bank_name": "Citizens Bank",
      "transfer_type": "ACH",
      "account_ownership_type": "INDIVIDUAL",
      "fingerprint": "sq-1-FlS9Z5LyPjofrv9KWv1...Pud8YioqOqAw",
      "country": "US",
      "ach_details": {
        "routing_number": "0111111111",
        "account_number_suffix": "000",
        "account_type": "CHECKING"
      }
    }
  }
}
```

Key fields:
- `source_type`: Always "BANK_ACCOUNT" for ACH payments
- `transfer_type`: Always "ACH" for ACH transfers
- `status`: Starts as "PENDING", updates to "COMPLETED" when settled
- `bank_account_details`: Contains bank name, account type, and masked routing info

5. **Settlement (3-5 days)**
   - Payment clears through ACH network
   - Status updates to COMPLETED
   - Gift card activated
   - Webhook notification sent (payment.updated)

### ACH Disputes

ACH disputes differ significantly from credit card disputes:

#### Key Differences
- **Return Windows**: 
  - Consumer accounts: 60 days from original transaction
  - Business accounts: 2 days from original transaction
- **Contestability**: Unlike credit card disputes, sellers CANNOT contest ACH reversals
- **Resolution**: Sellers must handle disputes directly with customers
- **Automatic Honor**: Square and its ODFI honor all customer return requests within the window

#### When Disputes Occur
1. Customer requests return through their bank
2. Square receives return request from customer's bank
3. Funds automatically removed from seller's Square account
4. Seller must resolve directly with customer

#### Best Practices
- Clear authorization language during checkout
- Save transaction records and customer consent
- Prompt customer service for ACH payment issues
- Consider higher risk for business accounts (2-day window)

### Testing

#### Sandbox Test Tokens
```javascript
// Approved payment
'bauth:ach-account-ok'

// Declined - insufficient funds
'bauth:ach-account-insufficient-funds'

// Invalid account
'bauth:ach-account-invalid'
```

#### Test Script
Run the ACH payment test script:
```bash
node test-ach-payments.js
```

### Production Considerations

#### Compliance Requirements
- **Authorization**: Must capture buyer authorization through UI
- **Effective Date**: New requirements as of January 29, 2025
- **Returns**: 60-day window for consumer accounts, 2-day for business

#### Error Handling
- Bank connection failures
- Insufficient funds
- Invalid account numbers
- Network timeouts

#### User Experience
- Clear messaging about 3-5 day processing
- Email notifications when payment completes
- Status tracking in order history

### Monitoring

#### Key Metrics
- ACH adoption rate
- Average transaction amount
- Failure rates by reason
- Settlement times

#### Webhook Events
- `payment.created` - Initial ACH payment
- `payment.updated` - Status changes (PENDING → COMPLETED)

### Security

#### Data Protection
- No bank credentials stored
- Tokenized account information only
- PCI-compliant infrastructure

#### Fraud Prevention
- Velocity checks on ACH usage
- Account verification through Plaid
- Risk scoring by Square

### Limitations

- **US Only**: ACH only available for US merchants
- **USD Only**: Only supports US dollars
- **Processing Time**: 3-5 business days (not instant)
- **Single Payment**: One ACH payment per order

### Future Enhancements

1. **Saved Bank Accounts**: Allow customers to save verified accounts
2. **Recurring Payments**: Subscription-based gift cards
3. **Instant Verification**: Micro-deposit verification option
4. **International Support**: When Square expands ACH globally

### Resources

- [Square ACH Documentation](https://developer.squareup.com/docs/payments-api/take-payments/ach-payments)
- [Square Web Payments SDK - ACH](https://developer.squareup.com/docs/web-payments/add-ach)
- [Plaid + Square Partnership](https://plaid.com/blog/square-and-plaid-partner-to-give-us-merchants-a-better-ach-experience/)

### Troubleshooting

#### Common Issues

1. **"Payment method not initialized"**
   - Ensure Square SDK is loaded
   - Check application ID and location ID

2. **"Bank connection failed"**
   - Verify redirectURI matches current page
   - Check for popup blockers

3. **"Payment declined"**
   - Verify sufficient funds
   - Check daily/transaction limits

4. **"Token expired"**
   - ACH tokens are single-use
   - Generate new token for retry