# Payment Recovery System

## Overview
This document explains how to handle missing orders from Stripe payments and prevent future occurrences.

## Common Issues

### 1. Succeeded Payment Without Order
**Symptoms**: Payment shows as "Succeeded" in Stripe but no order exists in the database.

**Causes**:
- Webhook delivery failure (network issues, server downtime)
- Webhook secret misconfiguration
- Application errors during webhook processing

**Solution**: Use the recovery endpoint to manually create the order.

### 2. Incomplete Payments
**Symptoms**: Payment shows as "Incomplete" or "Requires Payment Method" in Stripe.

**Causes**:
- Customer abandoned checkout
- Card declined or authentication failed
- Browser closed during 3D Secure authentication

**Solution**: These don't need recovery - customers need to complete payment.

## Recovery Endpoints

### 1. Check Payment Status
```bash
GET /api/payments/recover-missing?paymentIntentId=pi_xxx
```

This endpoint checks:
- Stripe payment status
- Whether an order exists in the database
- Payment metadata (customer info, shipping details)

### 2. Recover Missing Order
```bash
POST /api/payments/recover-missing
{
  "paymentIntentId": "pi_xxx"
}
```

This endpoint:
- Verifies the payment succeeded in Stripe
- Creates the order if it doesn't exist
- Returns the created order details

### 3. Check All Incomplete Payments
```bash
GET /api/payments/check-incomplete
```

This endpoint:
- Lists all incomplete payments from the last 7 days
- Shows which ones are missing orders
- Provides a summary by status

## Prevention Measures

### 1. Webhook Monitoring
- All webhook events are now logged with timestamps
- Failed signature verifications are logged with details
- Payment intent IDs are logged for succeeded events

### 2. Regular Checks
Run the monitoring script periodically:
```bash
node scripts/check-missing-orders.js
```

### 3. Stripe Dashboard
Regularly check:
- Webhook logs in Stripe Dashboard > Developers > Webhooks
- Failed webhook attempts
- Payment events without corresponding webhooks

### 4. Server Monitoring
Ensure:
- Server uptime monitoring is in place
- PM2 logs are regularly reviewed
- Webhook endpoint is always accessible

## Manual Recovery Process

1. **Find the payment** in Stripe Dashboard
2. **Copy the Payment Intent ID** (starts with `pi_`)
3. **Check if order exists**:
   ```bash
   curl https://thegreenroasteries.com/api/payments/recover-missing?paymentIntentId=pi_xxx
   ```
4. **If no order exists and payment succeeded**, recover it:
   ```bash
   curl -X POST https://thegreenroasteries.com/api/payments/recover-missing \
     -H "Content-Type: application/json" \
     -d '{"paymentIntentId":"pi_xxx"}'
   ```

## Webhook Best Practices

1. **Always respond quickly** (within 20 seconds) to webhooks
2. **Use idempotent processing** - handle duplicate events gracefully
3. **Log all webhook events** for debugging
4. **Monitor webhook failures** in Stripe Dashboard
5. **Set up webhook endpoint monitoring** to ensure it's always accessible

## Emergency Contacts

For urgent payment issues:
- Check PM2 logs: `pm2 logs greenroasteries`
- Check webhook logs in Stripe Dashboard
- Use recovery endpoints to fix missing orders 