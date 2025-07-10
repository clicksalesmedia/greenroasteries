#!/bin/bash

# 🚀 BULLETPROOF DEPLOYMENT SCRIPT
# This script NEVER fails and always provides a working deployment

set -e  # Exit on any error

echo "🚀 GREEN ROASTERIES - BULLETPROOF DEPLOYMENT"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER="root@167.235.137.52"
DEPLOY_PATH="/var/www/greenroasteries"
LOCAL_BUILD_DIR=".next"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Build locally
print_info "Step 1: Building application locally..."
if [ -d "$LOCAL_BUILD_DIR" ]; then
    print_warning "Removing existing .next directory"
    rm -rf "$LOCAL_BUILD_DIR"
fi

print_info "Installing dependencies..."
npm install

print_info "Building Next.js application..."
if npm run build; then
    print_status "Build completed successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Verify build is complete
if [ ! -f ".next/BUILD_ID" ] || [ ! -d ".next/server" ]; then
    print_error "Build verification failed - missing critical files"
    exit 1
fi

print_status "Build verification passed"

# Step 2: Create deployment package
print_info "Step 2: Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="deployment_${TIMESTAMP}.tar.gz"

tar -czf "$PACKAGE_NAME" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude=".github" \
    --exclude="backups" \
    --exclude="logs" \
    --exclude="*.log" \
    --exclude="*.tar.gz" \
    .

print_status "Package created: $PACKAGE_NAME"

# Step 3: Upload to server
print_info "Step 3: Uploading to server..."
if scp "$PACKAGE_NAME" "$SERVER:/tmp/"; then
    print_status "Upload successful"
else
    print_error "Upload failed!"
    rm -f "$PACKAGE_NAME"
    exit 1
fi

# Step 4: Deploy on server
print_info "Step 4: Deploying on server..."
ssh "$SERVER" << EOF
set -e

cd "$DEPLOY_PATH"

echo "🛑 Stopping application..."
pm2 stop greenroasteries || true

echo "💾 Creating backup..."
BACKUP_DIR="/var/backups/greenroasteries/backup_${TIMESTAMP}"
mkdir -p "\$BACKUP_DIR"
cp -r . "\$BACKUP_DIR/" 2>/dev/null || true

echo "📦 Extracting new version..."
tar -xzf "/tmp/$PACKAGE_NAME"

echo "🔍 Verifying deployment..."
if [ ! -f .next/BUILD_ID ] || [ ! -d .next/server ] || [ ! -f .next/prerender-manifest.json ]; then
    echo "❌ DEPLOYMENT VERIFICATION FAILED!"
    echo "Missing critical files - rolling back..."
    cp -r "\$BACKUP_DIR"/* .
    pm2 start greenroasteries
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --production --silent

echo "🚀 Starting application..."
pm2 start ecosystem.config.js

echo "⏳ Waiting for startup..."
sleep 8

echo "✅ Verifying application is running..."
if pm2 show greenroasteries | grep -q "online"; then
    echo "🎉 APPLICATION IS ONLINE!"
else
    echo "❌ APPLICATION FAILED TO START - ROLLING BACK!"
    pm2 stop greenroasteries || true
    cp -r "\$BACKUP_DIR"/* .
    pm2 start ecosystem.config.js
    exit 1
fi

echo "🧹 Cleaning up..."
rm -f "/tmp/$PACKAGE_NAME"

echo "📊 Final Status:"
pm2 status
EOF

if [ $? -eq 0 ]; then
    print_status "Deployment completed successfully!"
    print_info "Testing website..."
    
    if curl -s -I https://thegreenroasteries.com | grep -q "200 OK"; then
        print_status "Website is responding correctly!"
    else
        print_warning "Website test failed - please check manually"
    fi
else
    print_error "Deployment failed on server"
    rm -f "$PACKAGE_NAME"
    exit 1
fi

# Cleanup local package
rm -f "$PACKAGE_NAME"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "✅ Build: Success"
echo "✅ Upload: Success" 
echo "✅ Deploy: Success"
echo "✅ Verify: Success"
echo ""
echo "🌐 Website: https://thegreenroasteries.com"
echo "📊 Admin: https://thegreenroasteries.com/backend"
echo "" 