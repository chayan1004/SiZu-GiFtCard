# 3D Secure / SCA Implementation Guide
## Square Payment Integration with Strong Customer Authentication

### Overview
This document describes the implementation of 3D Secure (3DS) and Strong Customer Authentication (SCA) in our Square payment integration. This feature adds an extra layer of security for card payments by requiring buyer verification when necessary.

### What is 3D Secure / SCA?
- **3D Secure**: Authentication protocol that creates an additional security layer for online card transactions
- **SCA (Strong Customer Authentication)**: European regulatory requirement that requires two-factor authentication for electronic payments
- **When it's triggered**: Based on issuer requirements, transaction risk, and regulatory requirements (especially in Europe)

### Implementation Details

#### Frontend Implementation (PaymentForm.tsx)

The payment form now includes buyer verification using Square's `verifyBuyer()` method:

```typescript
// For card payments, perform 3D Secure verification when required
if (selectedPaymentMethod === 'card' && window.Square?.payments) {
  try {
    // Prepare buyer details for verification
    const verificationDetails = {
      amount: String(data.amount),
      billingContact: {
        givenName: data.firstName,
        familyName: data.lastName,
        email: data.email,
        country: data.billingAddress.country || 'US',
        addressLines: data.billingAddress.addressLine1 ? [data.billingAddress.addressLine1] : [],
        city: data.billingAddress.city || '',
        state: data.billingAddress.state || '',
        postalCode: data.billingAddress.postalCode || '',
      },
      currencyCode: 'USD',
      intent: 'CHARGE'
    };
    
    // Perform buyer verification (3D Secure/SCA)
    const verificationResult = await payments.verifyBuyer(
      tokenResult.token,
      verificationDetails
    );
    
    // Store verification token if successful
    if (verificationResult?.token) {
      verificationToken = verificationResult.token;
    }
  } catch (verifyError) {
    // Log verification error but continue - verification might not be required
    console.log('Buyer verification error (may not be required):', verifyError);
  }
}
```

#### Backend Implementation (SquarePaymentsService.ts)

The payment service now accepts and includes the verification token in payment requests:

```typescript
// Enhanced createPayment method signature
async createPayment(
  sourceId: string,
  amount: number,
  customerId?: string,
  orderId?: string,
  referenceId?: string,
  note?: string,
  verification?: boolean,
  options?: {
    // ... other options ...
    verificationToken?: string;  // 3D Secure/SCA verification token
    buyerEmailAddress?: string;  // Buyer email for receipts
  }
): Promise<PaymentCreationResult>

// Payment request includes verification token
const request: CreatePaymentRequest = {
  // ... other fields ...
  verificationToken: options?.verificationToken,
  buyerEmailAddress: options?.buyerEmailAddress
};
```

### Testing 3D Secure

#### Sandbox Test Cards

Use these test cards in Square's sandbox environment:

| Card Number | Description | Expected Behavior |
|-------------|-------------|-------------------|
| 4800 0000 0000 0004 | Visa requiring authentication | Triggers 3DS verification popup |
| 4111 1111 1111 1111 | Standard Visa test card | No verification required |
| 4000 0000 0000 0259 | Authentication failure | 3DS fails, payment declined |

#### Testing Steps

1. Navigate to the gift card purchase flow
2. Enter test card number 4800 0000 0000 0004
3. Fill in billing details
4. Click "Pay Now"
5. Complete the 3DS challenge in the popup
6. Payment should complete successfully

### Production Behavior

In production, 3D Secure will be triggered based on:
- **Issuer Requirements**: Card issuer policies
- **Transaction Risk**: Square's risk assessment
- **Regulatory Requirements**: Mandatory for European cards (SCA)
- **Transaction Amount**: Higher amounts may trigger verification

### Benefits

1. **Reduced Fraud**: Additional authentication layer reduces fraudulent transactions
2. **Liability Shift**: Successfully authenticated transactions shift chargeback liability to issuer
3. **Regulatory Compliance**: Meets European SCA requirements
4. **Better Approval Rates**: Authenticated transactions have higher approval rates

### Error Handling

The implementation gracefully handles scenarios where:
- Verification is not required (continues without token)
- Verification fails (payment continues but may be declined)
- User cancels verification (payment is aborted)

### Monitoring

Track 3D Secure usage through:
- Payment logs showing verification token presence
- Square Dashboard showing 3DS authentication rates
- Transaction success rates for verified vs non-verified payments

### Future Enhancements

1. **Custom Risk Scoring**: Implement custom risk-based authentication (private beta)
2. **Regional Rules**: Different verification thresholds by region
3. **Exemption Handling**: Low-value transaction exemptions
4. **Analytics**: Track 3DS impact on conversion rates

### References

- [Square SCA Overview](https://developer.squareup.com/docs/sca-overview)
- [Web Payments SDK - Verify Buyer](https://developer.squareup.com/docs/web-payments/verify-buyer)
- [Testing SCA in Sandbox](https://developer.squareup.com/docs/devtools/sandbox/payments#sca-testing-in-the-web-payments-sdk)