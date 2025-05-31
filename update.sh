#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH="/var/www/greenroasteries"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Starting Green Roasteries deployment...${NC}"

# 1. Run pre-deployment checks
echo -e "${BLUE}Running pre-deployment checks...${NC}"
./scripts/pre-deploy-check.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}Pre-deployment checks failed. Aborting.${NC}"
    exit 1
fi

# 2. Push changes to GitHub
echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
git push origin main

# 3. Run the optimized deployment script
echo -e "${BLUE}Running production deployment...${NC}"
./scripts/deploy-production.sh

echo -e "${GREEN}Deployment process completed!${NC}" 