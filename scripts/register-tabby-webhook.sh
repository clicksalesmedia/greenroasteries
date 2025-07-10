#!/bin/bash

# Tabby Webhook Registration Script
# Addresses QA feedback about webhook registration being required

echo "🔔 Tabby Webhook Registration"
echo "============================"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with the required Tabby configuration:"
    echo ""
    echo "TABBY_SECRET_KEY=your_tabby_secret_key"
    echo "TABBY_MERCHANT_CODE=your_merchant_code"
    echo "NEXT_PUBLIC_SITE_URL=https://thegreenroasteries.com"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

# Run the registration script
echo "🚀 Starting webhook registration..."
node scripts/register-tabby-webhook.js

echo ""
echo "📋 Registration complete!"
echo "Check the output above for next steps." 