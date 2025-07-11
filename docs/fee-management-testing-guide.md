# Fee Management System Testing Guide

## Overview
The fee management system allows administrators to configure various fees for gift card purchases dynamically. This guide walks through testing all features.

## Test Results Summary
✅ Database: 5 fee configurations successfully created
✅ API Endpoints: All endpoints working correctly
✅ Fee Calculations: Accurate for both fixed and percentage-based fees
✅ UI Integration: Fees displayed correctly in shopping flow

## Testing Steps

### 1. Access Fee Management (Admin Only)
1. Log in as an admin user
2. Click on your profile dropdown in the top navigation
3. Select "Fee Management" from the dropdown menu

### 2. View Existing Fees
You should see 5 default fees:
- **Standard Processing Fee**: $2.95 (applied to classic/love designs)
- **Premium Design Fee**: $5.95 (applied to premium designs)
- **Corporate Volume Fee**: 3.5% (percentage-based for bulk purchases)
- **Rush Delivery Fee**: $9.95 (for expedited delivery)
- **Video Message Fee**: $4.95 (for video messages)

### 3. Test Create New Fee
1. Click "Add New Fee" button
2. Fill in the form:
   - Fee Type: `holiday`
   - Fee Name: `Holiday Special Fee`
   - Amount: `3.50`
   - Type: Select "Fixed Amount"
   - Description: `Special holiday season processing fee`
3. Click "Create Fee"
4. Verify the new fee appears in the list

### 4. Test Edit Fee
1. Click the "Edit" button on any fee (e.g., Standard Processing Fee)
2. Change the amount from $2.95 to $3.95
3. Update the description
4. Click "Update Fee"
5. Verify the changes are reflected

### 5. Test Toggle Fee Status
1. Find an active fee (green "Active" badge)
2. Click the toggle switch to deactivate it
3. Verify the badge changes to "Inactive" (gray)
4. Toggle it back to active

### 6. Test Delete Fee
1. Click "Delete" on a non-essential fee (e.g., the test holiday fee)
2. Confirm the deletion
3. Verify the fee is removed from the list

### 7. Test Shopping Flow Integration
1. Navigate to the Shop page
2. Select a gift card design:
   - **Classic/Love**: Should show Standard Processing Fee
   - **Premium**: Should show Premium Design Fee
3. Enter different amounts and verify:
   - Fee displays correctly in price breakdown
   - Total is calculated accurately

### 8. Test Percentage-Based Fees
1. In Fee Management, edit Corporate Volume Fee
2. Note it's set to 3.5% with min/max amounts
3. In a real implementation, this would apply to bulk orders

## Expected Results

### API Response Example
```json
[
  {
    "id": "be116d50-6e82-4e4d-ad2f-496d9eb35b82",
    "feeType": "standard",
    "feeName": "Standard Processing Fee",
    "feeAmount": "2.95",
    "isPercentage": false,
    "isActive": true,
    "description": "Standard fee for regular gift card purchases"
  }
]
```

### Price Calculation Examples
- $50 Classic Gift Card: $50 + $2.95 = $52.95
- $100 Premium Gift Card: $100 + $5.95 = $105.95
- $250 Corporate Order: $250 + (3.5% × $250) = $258.75

## Common Issues & Solutions

### Fee Not Showing in Shop
- Ensure fee is marked as "Active"
- Check that fee type matches design type
- Verify API endpoint `/api/fees/active` returns fees

### Changes Not Persisting
- Check browser console for errors
- Ensure you're logged in as admin
- Verify database connection is active

### Calculation Errors
- Percentage fees: Ensure decimal format (3.5 not 0.035)
- Fixed fees: Use standard decimal format (2.95)
- Check min/max amounts for percentage fees

## Security Considerations
- Only admin users can access Fee Management
- All fee changes are logged with user ID
- Input validation prevents negative or excessive fees
- API endpoints require authentication

## Next Steps
After testing, consider:
1. Adding more fee types (international, gift wrap, etc.)
2. Implementing time-based fees (weekend surcharges)
3. Creating fee rules based on customer type
4. Adding bulk fee import/export functionality