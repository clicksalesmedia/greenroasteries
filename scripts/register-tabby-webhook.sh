#!/bin/bash

# Register Tabby Webhook for Green Roasteries
# This script registers the webhook URL with Tabby's API
# Run this ONCE per merchant code (GR)

echo "Registering Tabby webhook for Green Roasteries..."

# Check if required environment variables are set
if [ -z "$TABBY_SECRET_KEY" ]; then
    echo "Error: TABBY_SECRET_KEY environment variable is not set"
    echo "Please set it with: export TABBY_SECRET_KEY=your_secret_key"
    exit 1
fi

# Webhook configuration
WEBHOOK_URL="https://thegreenroasteries.com/api/webhooks/tabby"
MERCHANT_CODE="GR"
IS_TEST=true  # Set to false for production

echo "Webhook URL: $WEBHOOK_URL"
echo "Merchant Code: $MERCHANT_CODE"
echo "Test Mode: $IS_TEST"

# Register webhook with Tabby
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "https://api.tabby.ai/api/v1/webhooks" \
  -H "Authorization: Bearer $TABBY_SECRET_KEY" \
  -H "X-Merchant-Code: $MERCHANT_CODE" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'$WEBHOOK_URL'",
    "is_test": '$IS_TEST'
  }')

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" -eq 200 ]; then
    echo "✅ Webhook registered successfully!"
    echo "Webhook details: $body"
else
    echo "❌ Failed to register webhook"
    echo "Error details: $body"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Test a payment to verify the webhook is working"
echo "2. Check payment status moves from NEW → AUTHORIZED → CAPTURED"
echo "3. Monitor logs at: tail -f logs/watcher.log" 