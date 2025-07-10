#!/bin/bash

# Check existing Tabby webhooks for Green Roasteries
# This script lists all registered webhooks

echo "Checking existing Tabby webhooks for Green Roasteries..."

# Check if required environment variables are set
if [ -z "$TABBY_SECRET_KEY" ]; then
    echo "Error: TABBY_SECRET_KEY environment variable is not set"
    echo "Please set it with: export TABBY_SECRET_KEY=your_secret_key"
    exit 1
fi

# Configuration
MERCHANT_CODE="GR"

echo "Merchant Code: $MERCHANT_CODE"
echo ""

# Get all webhooks
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X GET "https://api.tabby.ai/api/v1/webhooks" \
  -H "Authorization: Bearer $TABBY_SECRET_KEY" \
  -H "X-Merchant-Code: $MERCHANT_CODE")

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

echo "HTTP Status: $http_code"

if [ "$http_code" -eq 200 ]; then
    echo "✅ Webhooks retrieved successfully!"
    echo ""
    echo "Registered webhooks:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ Failed to retrieve webhooks"
    echo "Error details: $body"
    exit 1
fi

echo ""
echo "Expected webhook URL: https://thegreenroasteries.com/api/webhooks/tabby"
echo ""
echo "To test webhook endpoint:"
echo "curl https://thegreenroasteries.com/api/webhooks/tabby" 