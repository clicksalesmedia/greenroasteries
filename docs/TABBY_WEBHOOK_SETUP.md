# Tabby Payment Verification Setup Guide

## Problem
Payments are stuck in "NEW" status on Tabby Merchant Dashboard because the **webhook → retrieve → capture** verification flow is not set up.

## Solution Overview

Per Tabby documentation, when a customer completes payment:

1. **Customer completes payment** → Tabby processes it
2. **Tabby sends webhook** with `status: "authorized"` (lowercase)
3. **Your system receives webhook** → triggers verification
4. **Your system calls** `GET /api/v2/payments/{id}` to retrieve payment
5. **Your system verifies** response has `status: "AUTHORIZED"` (uppercase)
6. **If verified** → your system captures via `POST /api/v2/payments/{id}/captures`
7. **Payment moves to CAPTURED** → order confirmed

## Setup Steps

### 1. Register Webhook (One-time setup)

```bash
# Set your Tabby secret key
export TABBY_SECRET_KEY=your_tabby_secret_key_here

# Register the webhook
./scripts/register-tabby-webhook.sh
```

Expected webhook URL: `https://thegreenroasteries.com/api/webhooks/tabby`

### 2. Verify Webhook Registration

```bash
# Check existing webhooks
./scripts/check-tabby-webhooks.sh
```

### 3. Environment Variables

Add to `.env.local`:
```bash
TABBY_SECRET_KEY=your_tabby_secret_key
TABBY_WEBHOOK_SECRET=your_webhook_secret_here
TABBY_AUTO_CAPTURE=true
```

### 4. Test Webhook Endpoint

```bash
curl https://thegreenroasteries.com/api/webhooks/tabby
```

Expected response:
```json
{
  "status": "ok",
  "message": "Tabby webhook endpoint is active",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Verification Flow Implemented

### When `payment.authorized` webhook received:

```
🔔 TABBY WEBHOOK: payment.authorized received for payment ID: xxx
📋 Webhook payload status (lowercase): authorized

🔍 VERIFICATION STEP 1: Making GET request to Tabby API...
📞 API Call: GET /api/v2/payments/xxx

📄 Retrieved payment details: { id, status, amount, currency... }

🔍 VERIFICATION STEP 2: Checking if status is "AUTHORIZED" (uppercase)...
📊 Status comparison: Expected="AUTHORIZED", Received="AUTHORIZED"

✅ PAYMENT VERIFICATION SUCCESSFUL!
✅ Status is "AUTHORIZED" as expected
✅ Payment is valid and authorized by Tabby

🔍 CAPTURE STEP: Auto-capture enabled, proceeding to capture...
📞 API Call: POST /api/v2/payments/xxx/captures

✅ PAYMENT CAPTURED SUCCESSFULLY!
🎉 Payment status will move from NEW → AUTHORIZED → CAPTURED
🔔 Expecting payment.captured webhook next...
```

### If verification fails:

```
❌ PAYMENT VERIFICATION FAILED!
🚨 Expected status: "AUTHORIZED" (uppercase)
🚨 Received status: "REJECTED" 
🚨 INVESTIGATION REQUIRED as per Tabby documentation
```

## API Endpoints Used

- **Retrieve Payment**: `GET /api/v2/payments/{id}`
- **Capture Payment**: `POST /api/v2/payments/{id}/captures`
- **Webhook Endpoint**: `POST /api/webhooks/tabby`

## Testing the Integration

1. **Make a test payment** with Tabby
2. **Monitor logs** for webhook processing:
   ```bash
   tail -f logs/watcher.log
   ```
3. **Check Tabby Dashboard** - payment should move from NEW → CAPTURED
4. **Verify order** is confirmed in your system

## Expected Payment Status Flow

```
Customer Payment → Tabby Processing → NEW
                                      ↓
Webhook: payment.authorized → AUTHORIZED (after verification)
                                      ↓
Auto-capture triggered → CAPTURED → Order Confirmed
```

## Troubleshooting

### Webhook not received
- Check webhook registration: `./scripts/check-tabby-webhooks.sh`
- Verify URL is accessible: `curl https://thegreenroasteries.com/api/webhooks/tabby`
- Check firewall/security settings

### Payment stuck in NEW
- Check webhook logs for processing errors
- Verify `TABBY_AUTO_CAPTURE=true` in environment
- Test API credentials with manual verification

### Status verification fails
- Check API response format in logs
- Verify secret key has correct permissions
- Contact Tabby support if status not "AUTHORIZED"

## Manual Payment Verification (for testing)

```bash
# Get payment details
curl -H "Authorization: Bearer $TABBY_SECRET_KEY" \
     https://api.tabby.ai/api/v2/payments/PAYMENT_ID

# Manually capture payment
curl -X POST \
     -H "Authorization: Bearer $TABBY_SECRET_KEY" \
     -H "Content-Type: application/json" \
     https://api.tabby.ai/api/v2/payments/PAYMENT_ID/captures
```

## Documentation References

- [Tabby Payment Statuses](https://docs.tabby.ai/pay-in-4-custom-integration/payment-statuses)
- [Tabby Payment Processing](https://docs.tabby.ai/pay-in-4-custom-integration/payment-processing)  
- [Tabby Webhooks](https://docs.tabby.ai/pay-in-4-custom-integration/webhooks)
- [API Documentation](https://api-docs.tabby.ai) 