#!/bin/bash

echo "Testing Tabby Webhook Endpoint..."
echo "================================="

# Test Payment Authorized webhook
curl -X POST https://thegreenroasteries.com/api/webhooks/tabby \
  -H "Content-Type: application/json" \
  -H "x-tabby-signature: test-signature" \
  -d '{
    "event": "payment.authorized",
    "payment": {
      "id": "test-payment-123",
      "status": "authorized",
      "amount": "125.00",
      "currency": "AED",
      "reference_id": "TEST_ORDER_123",
      "order": {
        "reference_id": "TEST_ORDER_123",
        "items": [
          {
            "title": "Test Coffee",
            "quantity": 1,
            "unit_price": "125.00"
          }
        ]
      },
      "buyer": {
        "email": "test@example.com",
        "name": "Test Customer",
        "phone": "+971501234567"
      }
    }
  }' \
  -w "\n\nResponse Code: %{http_code}\n" \
  -s

echo ""
echo "Expected response: {\"success\": true, \"message\": \"Webhook received and queued for processing\"}" 