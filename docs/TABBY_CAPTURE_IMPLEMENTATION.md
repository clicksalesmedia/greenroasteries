# Tabby Payment Capture Implementation

## Overview

This document describes the implementation of Tabby payment capture functionality according to the official Tabby API specification. The capture feature allows you to capture authorized payments either fully or partially.

## API Specification Compliance

### Endpoint
```
POST /api/payments/{id}/captures
```

### Key Features
- ✅ Send capture requests for AUTHORIZED payments only
- ✅ Full capture automatically closes the payment
- ✅ Partial capture keeps payment AUTHORIZED until fully captured
- ✅ Idempotency support with `reference_id`
- ✅ Complete item tracking with capture quantities
- ✅ Proper error handling and validation

## Implementation Files

### 1. Main Capture Endpoint
**File:** `app/api/payments/[id]/captures/route.ts`

This is the primary API endpoint that handles capture requests:
- Validates payment exists and is AUTHORIZED
- Processes capture data according to Tabby specification
- Updates local payment records
- Returns complete payment object

### 2. Tabby Service
**File:** `app/lib/tabby.ts`

The `capturePayment` method handles the actual API call to Tabby:
- Builds compliant capture payload
- Makes authenticated request to Tabby API
- Handles error responses appropriately

### 3. Test Script
**File:** `scripts/test-tabby-capture.js`

A comprehensive test script to validate the capture functionality.

## Usage Examples

### 1. Full Capture
```bash
curl -X POST https://thegreenroasteries.com/api/payments/payment_123456789/captures \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "reference_id": "capture_001",
    "tax_amount": "5.00",
    "shipping_amount": "0.00",
    "discount_amount": "0.00",
    "items": [
      {
        "title": "Premium Coffee",
        "description": "Ethiopian Arabica Beans",
        "quantity": 1,
        "unit_price": "100.00",
        "reference_id": "COFFEE-001",
        "category": "Coffee",
        "is_refundable": true
      }
    ]
  }'
```

### 2. Partial Capture
```bash
curl -X POST https://thegreenroasteries.com/api/payments/payment_123456789/captures \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "50.00",
    "reference_id": "partial_capture_001",
    "tax_amount": "2.50",
    "shipping_amount": "0.00",
    "discount_amount": "0.00"
  }'
```

### 3. Using Test Script
```bash
# Full capture test
node scripts/test-tabby-capture.js payment_123456789 100.00

# Partial capture test  
node scripts/test-tabby-capture.js payment_123456789 50.00 partial
```

## Request Body Schema

According to Tabby API specification:

```typescript
{
  amount: string;              // Required: "100.00" format
  reference_id?: string;       // Idempotency key (auto-generated if not provided)
  tax_amount?: string;         // Default: "0.00"
  shipping_amount?: string;    // Default: "0.00"
  discount_amount?: string;    // Default: "0.00"
  created_at?: string;         // ISO 8601 format (auto-generated if not provided)
  items?: Array<{              // Item details for tracking
    title: string;
    description: string;
    quantity: number;
    unit_price: string;
    discount_amount?: string;
    reference_id: string;
    image_url?: string;
    product_url?: string;
    gender?: string;
    category: string;
    color?: string;
    product_material?: string;
    size_type?: string;
    size?: string;
    brand?: string;
    is_refundable?: boolean;
    barcode?: string;
    ppn?: string;
    seller?: string;
  }>;
}
```

## Response Schema

The API returns the complete payment object as per Tabby specification:

```typescript
{
  id: string;                  // Payment UUID
  created_at: string;          // ISO 8601 timestamp
  expires_at: string;          // ISO 8601 timestamp
  status: string;              // "AUTHORIZED", "CLOSED", etc.
  is_test: boolean;            // Test mode indicator
  amount: string;              // Total payment amount
  currency: string;            // "AED", "SAR", "KWD"
  description: string;         // Payment description
  buyer: object;               // Customer information
  shipping_address: object;    // Shipping details
  order: object;               // Order information
  buyer_history: object;       // Customer history
  order_history: array;        // Purchase history
  captures: array;             // List of captures
  refunds: array;              // List of refunds
  meta: object;                // Metadata
  attachment: object;          // Additional data
}
```

## Error Handling

### Common Error Scenarios

1. **Payment Not Found (404)**
   ```json
   {
     "error": "Payment not found"
   }
   ```

2. **Invalid Payment Status (400)**
   ```json
   {
     "error": "Payment status is 'CLOSED'. Only AUTHORIZED payments can be captured."
   }
   ```

3. **Invalid Amount Format (400)**
   ```json
   {
     "error": "Amount must be in correct decimal format (e.g., '100.00')"
   }
   ```

4. **Tabby API Error (500)**
   ```json
   {
     "error": "Failed to capture payment: Insufficient funds",
     "details": "Capture amount exceeds available balance"
   }
   ```

## Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │  Capture API     │    │   Tabby API     │
│                 │    │  Endpoint        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ POST /captures        │                       │
         ├──────────────────────►│                       │
         │                       │ GET /payments/{id}    │
         │                       ├──────────────────────►│
         │                       │ ◄──────────────────────┤
         │                       │ Verify AUTHORIZED     │
         │                       │                       │
         │                       │ POST /captures        │
         │                       ├──────────────────────►│
         │                       │ ◄──────────────────────┤
         │                       │ Update Local DB       │
         │ ◄──────────────────────┤                       │
         │ Complete Payment      │                       │
         │ Object Returned       │                       │
```

## Testing

### Prerequisites
- Authorized payment in Tabby system
- Valid payment ID (UUID format)
- Tabby API credentials configured

### Test Commands
```bash
# Test with real payment ID
node scripts/test-tabby-capture.js <your_payment_id> 100.00

# Test partial capture
node scripts/test-tabby-capture.js <your_payment_id> 50.00 partial
```

### Expected Results
- ✅ Payment verified as AUTHORIZED
- ✅ Capture request sent to Tabby
- ✅ Local payment record updated
- ✅ Complete payment object returned

## Security Considerations

1. **Authentication**: All requests to Tabby API use Bearer token authentication
2. **Idempotency**: `reference_id` prevents duplicate captures
3. **Validation**: Payment status verified before capture attempt
4. **Error Handling**: Sensitive error details are logged, not exposed to client

## Monitoring and Logging

The implementation includes comprehensive logging:
- 🔵 Capture request initiation
- ✅ Successful captures with details
- ❌ Failed captures with error context
- ⚠️ Non-critical warnings (e.g., DB update failures)

## Environment Variables

Required configuration:
```bash
TABBY_SECRET_KEY=your_tabby_secret_key
TABBY_BASE_URL=https://api.tabby.ai  # or staging URL
```

## Integration Points

### 1. Webhook Integration
The capture functionality integrates with the existing webhook handler (`app/api/webhooks/tabby/route.ts`) for automatic captures when `TABBY_AUTO_CAPTURE=true`.

### 2. Admin Interface
Backend admin can manually trigger captures through the payments management interface.

### 3. Order Management
Captured payments update order status and trigger fulfillment processes.

## Troubleshooting

### Issue: "Payment not found"
- Verify payment ID is correct UUID format
- Check if payment exists in Tabby system
- Ensure using correct environment (test vs production)

### Issue: "Only AUTHORIZED payments can be captured"
- Payment may already be captured (status: CLOSED)
- Payment may have expired
- Payment may have been rejected

### Issue: "Amount format error"
- Ensure amount uses exactly 2 decimal places for AED/SAR
- Use 3 decimal places for KWD
- Example: "100.00" not "100" or "100.0"

## Next Steps

1. Monitor capture success rates in production
2. Implement capture retry logic for failed attempts
3. Add capture analytics and reporting
4. Extend partial capture tracking in admin interface

---

*This implementation fully complies with Tabby API v2 specification for payment captures. For the latest API documentation, refer to [Tabby Developer Documentation](https://api-docs.tabby.ai/).* 