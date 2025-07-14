#!/bin/bash

echo "Testing FIXED Tabby Webhook Endpoint..."
echo "======================================="
echo ""

# Test with simulated Tabby IP (since we can't spoof headers easily in curl)
echo "🔍 Testing webhook endpoint response..."
curl -X GET https://thegreenroasteries.com/api/webhooks/tabby \
  -H "x-forwarded-for: 34.166.36.90" \
  -w "\nResponse Code: %{http_code}\n" \
  -s

echo ""
echo "🔍 Testing webhook with payment.authorized event..."

# Test Payment Authorized webhook with Tabby IP
curl -X POST https://thegreenroasteries.com/api/webhooks/tabby \
  -H "Content-Type: application/json" \
  -H "x-tabby-signature: test-signature" \
  -H "x-forwarded-for: 34.166.36.90" \
  -d '{
    "event": "payment.authorized",
    "payment": {
      "id": "b166f2b0-373d-4c98-a801-ee062523f664",
      "status": "authorized",
      "amount": "125.00",
      "currency": "AED",
      "reference_id": "TEST_ORDER_123",
      "order": {
        "reference_id": "TEST_ORDER_123",
        "tax_amount": "6.25",
        "shipping_amount": "10.00", 
        "discount_amount": "0.00",
        "items": [
          {
            "title": "Test Coffee",
            "description": "Premium coffee blend",
            "quantity": 1,
            "unit_price": "125.00",
            "reference_id": "test-item-123",
            "category": "Coffee"
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
echo "🔍 Testing webhook with non-Tabby IP (should be rejected)..."

# Test with non-Tabby IP (should be rejected)
curl -X POST https://thegreenroasteries.com/api/webhooks/tabby \
  -H "Content-Type: application/json" \
  -H "x-tabby-signature: test-signature" \
  -H "x-forwarded-for: 192.168.1.1" \
  -d '{
    "event": "payment.authorized",
    "payment": {
      "id": "test-payment-blocked",
      "status": "authorized"
    }
  }' \
  -w "\n\nResponse Code: %{http_code}\n" \
  -s

echo ""
echo "✅ Expected behavior:"
echo "- GET request: 200 with status ok message"  
echo "- POST with Tabby IP: 200 with success true message"
echo "- POST with non-Tabby IP: 403 with unauthorized message"
echo ""
echo "🔧 Next steps:"
echo "1. Run the manual capture script: node scripts/capture-tabby-payment.js"
echo "2. Set TABBY_WEBHOOK_SECRET in environment variables"
echo "3. Ask Tabby team to test again with these fixes" 