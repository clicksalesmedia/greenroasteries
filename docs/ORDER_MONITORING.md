# Order Monitoring & Webhook Health Guide

## ✅ Verifying New Orders Work Correctly

### What We Fixed
- **Complete Order Information**: Payment intents now include all product details (items, quantities, prices, variations)
- **Webhook Handler Improved**: Creates orders with actual products customers purchased
- **Better Monitoring**: All webhook events logged with timestamps
- **Recovery Tools**: Easy identification and fixing of missing orders

## 🔍 How to Check Logs

### 1. Server Logs (SSH Access)
```bash
# Connect to server
ssh root@167.235.137.52

# Check recent webhook logs
pm2 logs greenroasteries --lines 50 | grep "Stripe Webhook"

# Check all recent logs
pm2 logs greenroasteries --lines 100

# Check error logs only
pm2 logs greenroasteries --lines 50 --err-only

# Watch live logs
pm2 logs greenroasteries --lines 0
```

### 2. Backend Admin Panel
- Navigate to **Backend > Logs** (newly added section)
- View real-time webhook events
- Check payment processing status
- Monitor order creation

### 3. Direct API Checks
```bash
# Test webhook endpoint
curl https://thegreenroasteries.com/api/webhooks/stripe-test

# Check for incomplete payments
curl https://thegreenroasteries.com/api/payments/check-incomplete

# Check specific payment
curl "https://thegreenroasteries.com/api/payments/recover-missing?paymentIntentId=pi_xxx"
```

## 📊 What to Look For in Logs

### ✅ Successful Webhook Processing
```
[Stripe Webhook] Received webhook at 2025-06-06T12:39:26.508Z
[Stripe Webhook] Received event: payment_intent.succeeded - ID: evt_xxx
[Stripe Webhook] Payment succeeded - ID: pi_xxx, Amount: 204.95 aed, Customer: customer@email.com
[Stripe Webhook] No order found for payment pi_xxx, creating from webhook...
[Stripe Webhook] Parsed 2 items from metadata
✅ Created order abc123 from webhook for customer@email.com
[Stripe Webhook] Order details - Items: 2, Subtotal: 180.95, Tax: 10.25, Shipping: 0, Total: 204.95
```

### ⚠️ Warning Signs
```
[Stripe Webhook] Missing customer data in payment intent pi_xxx
[Stripe Webhook] Product xyz not found, skipping
[Stripe Webhook] No valid items found, creating fallback order
[Stripe Webhook] Error parsing order items: SyntaxError
```

### 🚨 Error Indicators
```
[Stripe Webhook] Signature verification failed
Error handling payment_intent.succeeded: DatabaseError
No products available to create webhook order
```

## 🛠️ Troubleshooting Steps

### If Orders Are Missing:
1. **Check Webhook Logs**:
   ```bash
   pm2 logs greenroasteries --lines 200 | grep "payment_intent.succeeded"
   ```

2. **Check Stripe Dashboard**:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Check recent webhook attempts
   - Look for failed deliveries

3. **Recover Missing Orders**:
   ```bash
   # Check incomplete payments
   curl https://thegreenroasteries.com/api/payments/check-incomplete

   # Recover specific payment
   curl -X POST https://thegreenroasteries.com/api/payments/recover-missing \
     -H "Content-Type: application/json" \
     -d '{"paymentIntentId":"pi_xxx"}'
   ```

### If Webhooks Are Failing:
1. **Check Server Status**:
   ```bash
   pm2 status
   pm2 restart greenroasteries
   ```

2. **Test Connectivity**:
   ```bash
   curl https://thegreenroasteries.com/api/webhooks/stripe-test
   ```

3. **Check Environment Variables**:
   ```bash
   grep STRIPE_WEBHOOK_SECRET /var/www/greenroasteries/.env
   ```

## 📈 Monitoring Best Practices

### Daily Checks:
- [ ] Review webhook logs for any errors
- [ ] Check order count vs payment count in Stripe
- [ ] Verify incomplete payments list

### Weekly Checks:
- [ ] Run `node scripts/check-missing-orders.js`
- [ ] Review Stripe webhook delivery logs
- [ ] Check server uptime and performance

### Monthly Checks:
- [ ] Audit order data integrity
- [ ] Review error patterns
- [ ] Update monitoring scripts if needed

## 🚀 Quick Commands Reference

```bash
# Server connection
ssh root@167.235.137.52

# Check webhook health
curl https://thegreenroasteries.com/api/webhooks/stripe-test

# View recent logs
pm2 logs greenroasteries --lines 50

# Check incomplete payments
curl https://thegreenroasteries.com/api/payments/check-incomplete

# Recover missing order
curl -X POST https://thegreenroasteries.com/api/payments/recover-missing \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId":"pi_xxx"}'

# Monitor live logs
pm2 logs greenroasteries --lines 0

# Restart application
pm2 restart greenroasteries

# Check application status
pm2 status
```

## 📞 Emergency Response

### If Multiple Orders Are Missing:
1. Check server status immediately
2. Review webhook logs for patterns
3. Contact Stripe support if needed
4. Use recovery tools for each missing payment

### If Webhooks Stop Working:
1. Restart the application: `pm2 restart greenroasteries`
2. Check webhook endpoint: Test with curl
3. Verify webhook secret in environment variables
4. Check Stripe webhook configuration

## 📋 Regular Maintenance

### Keep These Updated:
- Monitor disk space on server
- Update Node.js and dependencies regularly
- Review and rotate log files
- Backup database regularly
- Test recovery procedures monthly

---

**Remember**: The 400 error from webhook tests is EXPECTED - it means security is working correctly! 