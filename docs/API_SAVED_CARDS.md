# Saved Cards API Documentation

## Overview

The Saved Cards API allows authenticated users to manage their payment cards securely. All card data is tokenized through Square's PCI-compliant infrastructure, ensuring that no sensitive card information is stored in our database.

## Authentication

All endpoints require authentication. Users must be logged in via Replit Auth to access these endpoints.

## Base URL

```
https://your-domain.replit.app/api
```

## Endpoints

### 1. List Saved Cards

Retrieve all saved payment cards for the authenticated user.

**Endpoint:** `GET /api/cards`

**Headers:**
- Cookie: `connect.sid={session_id}` (automatically set after login)

**Response:**
```json
[
  {
    "id": "card_abc123",
    "cardBrand": "VISA",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025,
    "cardholderName": "John Doe",
    "nickname": "Personal Card",
    "isDefault": true,
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T10:00:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Successfully retrieved cards
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error

---

### 2. Add a New Card

Add a new payment card to the user's account. This endpoint requires a payment token (nonce) from Square's Web Payments SDK.

**Endpoint:** `POST /api/cards`

**Headers:**
- Cookie: `connect.sid={session_id}`
- Content-Type: `application/json`

**Request Body:**
```json
{
  "sourceId": "cnon:card-nonce-from-square-js",
  "nickname": "Work Card",
  "isDefault": false,
  "verificationToken": "optional-3ds-verification-token"
}
```

**Parameters:**
- `sourceId` (required): Payment token from Square Web Payments SDK
- `nickname` (optional): Friendly name for the card
- `isDefault` (optional): Set as default payment method
- `verificationToken` (optional): 3D Secure verification token if required

**Response:**
```json
{
  "id": "card_xyz789",
  "cardBrand": "MASTERCARD",
  "last4": "5555",
  "expMonth": 6,
  "expYear": 2026,
  "cardholderName": "Jane Doe",
  "nickname": "Work Card",
  "isDefault": false,
  "createdAt": "2025-01-10T11:00:00Z",
  "updatedAt": "2025-01-10T11:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Card successfully added
- `400 Bad Request` - Invalid request data or card declined
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Square integration unavailable

**Error Examples:**
```json
{
  "message": "Card was declined"
}
```
```json
{
  "message": "Card verification required"
}
```
```json
{
  "message": "Invalid card information"
}
```

---

### 3. Delete a Saved Card

Remove a saved payment card from the user's account.

**Endpoint:** `DELETE /api/cards/{cardId}`

**Headers:**
- Cookie: `connect.sid={session_id}`

**URL Parameters:**
- `cardId`: The ID of the card to delete

**Response:**
```json
{
  "message": "Card deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Card successfully deleted
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Card not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 4. Set Default Card

Set a saved card as the default payment method. This will unset any previously default card.

**Endpoint:** `PUT /api/cards/{cardId}/default`

**Headers:**
- Cookie: `connect.sid={session_id}`

**URL Parameters:**
- `cardId`: The ID of the card to set as default

**Response:**
```json
{
  "message": "Default card updated successfully"
}
```

**Status Codes:**
- `200 OK` - Default card successfully updated
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Card not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- Card addition endpoint (`POST /api/cards`): Limited to 5 requests per 15 minutes per user
- Other endpoints: Standard rate limits apply (100 requests per 15 minutes)

---

## Security Considerations

1. **PCI Compliance**: All card data is tokenized through Square. We never store raw card numbers, CVV, or other sensitive data.

2. **Ownership Validation**: All operations validate that the card belongs to the authenticated user.

3. **HTTPS Only**: All API calls must be made over HTTPS in production.

4. **Session Security**: Sessions are stored in PostgreSQL with secure cookies.

---

## Square Integration

### Frontend Integration Required

To use the saved cards feature, you must integrate Square's Web Payments SDK on the frontend:

```javascript
// Example: Initialize Square Web Payments SDK
const payments = Square.payments(applicationId, locationId);

// Create card payment method
const card = await payments.card();
await card.attach('#card-container');

// Tokenize card for secure transmission
const result = await card.tokenize();
if (result.status === 'OK') {
  // Send result.token as sourceId to POST /api/cards
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId: result.token,
      nickname: 'My Card',
      isDefault: true
    })
  });
}
```

### Required Environment Variables

```env
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # or production
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Human-readable error message"
}
```

For validation errors with Zod:
```json
{
  "message": "Invalid request data",
  "errors": [
    {
      "path": ["sourceId"],
      "message": "Required"
    }
  ]
}
```

---

## Example Usage

### Add a Card (JavaScript)
```javascript
// After getting token from Square Web Payments SDK
const response = await fetch('/api/cards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    sourceId: squareToken,
    nickname: 'Personal Visa',
    isDefault: true
  })
});

const savedCard = await response.json();
```

### List Cards (JavaScript)
```javascript
const response = await fetch('/api/cards', {
  credentials: 'include'
});
const cards = await response.json();
```

### Delete a Card (JavaScript)
```javascript
const response = await fetch(`/api/cards/${cardId}`, {
  method: 'DELETE',
  credentials: 'include'
});
```

### Set Default Card (JavaScript)
```javascript
const response = await fetch(`/api/cards/${cardId}/default`, {
  method: 'PUT',
  credentials: 'include'
});
```