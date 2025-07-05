#!/bin/bash

# Setup Server Environment Variables
# This script creates the proper .env.local file on the server

SERVER_USER="root"
SERVER_HOST="144.126.218.13"
PROJECT_PATH="/var/www/greenroasteries"

echo "🔧 Setting up server environment variables..."

# Create the environment file with proper credentials
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
PROJECT_PATH="/var/www/greenroasteries"

echo "Creating .env with proper credentials..."

cat > "$PROJECT_PATH/.env" << 'ENVEOF'
# Database - MySQL on server
DATABASE_URL="mysql://greenroasteries:YourSecurePassword123!@localhost:3306/greenroasteries"

# JWT Secret
JWT_SECRET="8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k="

# Cloudinary Configuration (from local)
CLOUDINARY_CLOUD_NAME="dgcexgq5g"
CLOUDINARY_API_KEY="263832946349343"
CLOUDINARY_API_SECRET="Hsq4Z_l8Yij5Z52Qd9lhFQ-cpi0"

# Next.js
NEXTAUTH_URL="https://thegreenroasteries.com"
NEXTAUTH_SECRET="8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k="

# Stripe (Add your live keys here)
STRIPE_PUBLIC_KEY="pk_live_your_stripe_public_key"
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# Tabby Payment Integration
TABBY_PUBLIC_KEY="pk_test_your_tabby_public_key"
TABBY_SECRET_KEY="sk_test_your_tabby_secret_key"
TABBY_WEBHOOK_SECRET="your_tabby_webhook_secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application URLs
NEXT_PUBLIC_APP_URL="https://thegreenroasteries.com"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dgcexgq5g"

# Redis (if using)
REDIS_URL="redis://localhost:6379"

# Additional configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
ENVEOF

# Set proper permissions
chown www-data:www-data "$PROJECT_PATH/.env"
chmod 600 "$PROJECT_PATH/.env"

echo "✅ Environment variables configured successfully"
echo "⚠️  Remember to update Stripe and Tabby keys with your live credentials"

ENDSSH

echo "✅ Server environment setup completed" 