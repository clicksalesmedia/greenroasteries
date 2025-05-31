#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Running pre-deployment checks...${NC}"

ERRORS=0

# 1. Check for uncommitted changes
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}✗ You have uncommitted changes${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# 2. Check if environment variables are set
echo -e "${YELLOW}Checking environment variables...${NC}"
STRIPE_KEY_FOUND=false

# Check in .env.local first
if [ -f .env.local ] && grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local; then
    STRIPE_KEY_FOUND=true
fi

# Check in .env if not found in .env.local
if [ "$STRIPE_KEY_FOUND" = false ] && [ -f .env ] && grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env; then
    STRIPE_KEY_FOUND=true
fi

if [ "$STRIPE_KEY_FOUND" = true ]; then
    echo -e "${GREEN}✓ Stripe publishable key is set${NC}"
else
    echo -e "${RED}✗ Stripe publishable key is not set${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Check if we can build locally
echo -e "${YELLOW}Testing local build...${NC}"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Local build successful${NC}"
else
    echo -e "${RED}✗ Local build failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. Check TypeScript errors
echo -e "${YELLOW}Checking TypeScript...${NC}"
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript errors found (non-blocking)${NC}"
fi

# 5. Check if required scripts exist
echo -e "${YELLOW}Checking deployment scripts...${NC}"
if [ -f "scripts/deploy-production.sh" ] && [ -x "scripts/deploy-production.sh" ]; then
    echo -e "${GREEN}✓ Deployment script exists and is executable${NC}"
else
    echo -e "${RED}✗ Deployment script missing or not executable${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. Clean up local build artifacts
echo -e "${YELLOW}Cleaning up local build artifacts...${NC}"
rm -rf .next
echo -e "${GREEN}✓ Cleaned up build artifacts${NC}"

# Summary
echo -e "\n${BLUE}Pre-deployment check summary:${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    echo -e "${BLUE}Run: ${NC}${YELLOW}./scripts/deploy-production.sh${NC}${BLUE} to deploy${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s). Please fix before deploying.${NC}"
    exit 1
fi 