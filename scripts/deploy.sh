#!/bin/bash

# Simple deployment script for Green Roasteries
# Sync code changes to server and restart services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
SERVER_USER="root"
SERVER_HOST="167.235.137.52"
SERVER_PATH="/var/www/greenroasteries"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}        Deploying to Server            ${NC}"
echo -e "${BLUE}========================================${NC}"

# Test server connection
echo -e "${BLUE}🔍 Testing server connection...${NC}"
if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'Connection successful'"; then
    echo -e "${RED}✗ Cannot connect to server${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server connection successful${NC}"

# Sync files to server (exclude sensitive and unnecessary files)
echo -e "${BLUE}📁 Syncing files to server...${NC}"
rsync -avz --delete \
    --exclude='.git/' \
    --exclude='.next/' \
    --exclude='node_modules/' \
    --exclude='.env.local' \
    --exclude='logs/' \
    --exclude='backups/' \
    --exclude='public/uploads/' \
    ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Files synced successfully${NC}"
else
    echo -e "${RED}✗ File sync failed${NC}"
    exit 1
fi

# Install dependencies and build on server
echo -e "${BLUE}📦 Installing dependencies and building...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npm install && npm run build"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Restart PM2 processes
echo -e "${BLUE}🔄 Restarting PM2 processes...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "pm2 restart all"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PM2 processes restarted${NC}"
else
    echo -e "${YELLOW}⚠ PM2 restart may have issues, but deployment continued${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}🌐 Website: https://greenroasteries.com${NC}"
echo -e "${BLUE}🔧 Admin: https://greenroasteries.com/backend${NC}"
echo "" 