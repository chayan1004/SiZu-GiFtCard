# Order History Database Migration

## Schema Changes

### 1. Gift Cards Table
Added the following field:
- `deliveryStatus` (varchar) - Tracks delivery status: 'pending', 'sent', 'delivered', 'failed'
- Added indexes:
  - `idx_gift_cards_issued_by` - Optimizes queries by user
  - `idx_gift_cards_created_at` - Optimizes sorting by date

### 2. Gift Card Transactions Table
Added the following fields:
- `paymentMethodLast4` (varchar, length: 4) - Stores last 4 digits of payment method
- `paymentMethodType` (varchar) - Stores card type: 'VISA', 'MASTERCARD', 'AMEX', etc.

### 3. New Types
- `OrderHistoryItem` - Represents a single order in the history
- `OrderHistoryResponse` - API response with pagination

## Migration Command
Run the following command to apply the schema changes:
```bash
npm run db:push
```

Note: You may need to answer prompts about column renaming during migration.

## Why These Changes?
- **deliveryStatus**: Allows tracking whether gift cards were successfully delivered
- **paymentMethodLast4/Type**: Provides payment method info for order history without storing sensitive data
- **Indexes**: Improves query performance for user-specific order lookups