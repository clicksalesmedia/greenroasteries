#!/bin/bash

# Pull all data from server to localhost
# This script downloads code, files, and media from the production server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH="/var/www/greenroasteries"

echo -e "${BLUE}🚀 PULLING SERVER DATA TO LOCALHOST${NC}"
echo ""

# Step 1: Pull latest code from Git
echo -e "${YELLOW}📡 Step 1: Pulling latest code from Git repository...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Git pull successful${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi
echo ""

# Step 2: Sync application files
echo -e "${YELLOW}📁 Step 2: Syncing application files from server...${NC}"
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.next' \
    $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/ ./ || {
    echo -e "${RED}❌ Failed to sync application files${NC}"
    exit 1
}
echo -e "${GREEN}✅ Application files synced${NC}"
echo ""

# Step 3: Sync media files
echo -e "${YELLOW}🖼️  Step 3: Syncing media files...${NC}"

# Create upload directories if they don't exist
mkdir -p public/uploads
mkdir -p public/products
mkdir -p public/categories
mkdir -p public/sliders

# Sync uploads
echo -e "${CYAN}  📥 Syncing uploads...${NC}"
rsync -avz $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/uploads/ public/uploads/ || {
    echo -e "${YELLOW}⚠️  Uploads sync had issues (might be expected)${NC}"
}

# Sync products
echo -e "${CYAN}  📥 Syncing product images...${NC}"
rsync -avz $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/products/ public/products/ || {
    echo -e "${YELLOW}⚠️  Products sync had issues (might be expected)${NC}"
}

# Sync categories
echo -e "${CYAN}  📥 Syncing category images...${NC}"
rsync -avz $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/categories/ public/categories/ || {
    echo -e "${YELLOW}⚠️  Categories sync had issues (might be expected)${NC}"
}

# Sync sliders
echo -e "${CYAN}  📥 Syncing slider images...${NC}"
rsync -avz $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/sliders/ public/sliders/ || {
    echo -e "${YELLOW}⚠️  Sliders sync had issues (might be expected)${NC}"
}

echo -e "${GREEN}✅ Media files synced${NC}"
echo ""

# Step 4: Install dependencies
echo -e "${YELLOW}📦 Step 4: Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 5: Generate Prisma client
echo -e "${YELLOW}🔧 Step 5: Generating Prisma client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo ""

# Step 6: Show summary
echo -e "${GREEN}🎉 SERVER DATA PULL COMPLETED!${NC}"
echo ""
echo -e "${BLUE}📊 Summary of what was pulled:${NC}"

# Count files
upload_count=$(find public/uploads -type f 2>/dev/null | wc -l | xargs)
product_count=$(find public/products -type f 2>/dev/null | wc -l | xargs)
category_count=$(find public/categories -type f 2>/dev/null | wc -l | xargs)
slider_count=$(find public/sliders -type f 2>/dev/null | wc -l | xargs)

echo -e "   • Upload files: $upload_count"
echo -e "   • Product images: $product_count"
echo -e "   • Category images: $category_count"
echo -e "   • Slider images: $slider_count"
echo -e "   • Git repository: Updated to latest"
echo -e "   • Dependencies: Installed"
echo -e "   • Prisma client: Generated"
echo ""
echo -e "${CYAN}🔜 Next: Run database import to complete the sync${NC}" 