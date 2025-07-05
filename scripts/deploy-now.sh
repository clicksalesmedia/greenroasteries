#!/bin/bash

# Quick Deployment Script
# Runs the complete deployment with all features

echo "🚀 Starting Complete Deployment Process..."
echo "This will deploy your production .env file with all integrations:"
echo "- ✅ Stripe (Live Keys)"
echo "- ✅ Tabby Payment"
echo "- ✅ Cloudinary Images"
echo "- ✅ Brevo Email"
echo "- ✅ Google Shopping"
echo "- ✅ Database & Migrations"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Run the complete deployment
./scripts/deploy-complete.sh

echo "🎉 Deployment completed!"
echo "🌐 Visit: https://thegreenroasteries.com" 