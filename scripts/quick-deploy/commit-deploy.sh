#!/bin/bash

# Quick Commit & Deploy Script
# This script commits your changes and deploys them to the server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the commit message from command line argument
COMMIT_MESSAGE="$1"

# Function to show usage
show_usage() {
    echo "Usage: $0 \"commit message\""
    echo
    echo "Examples:"
    echo "  $0 \"Fix header navigation bug\""
    echo "  $0 \"Add new product feature\""
    echo "  $0 \"Update styling for mobile\""
    echo
    echo "This script will:"
    echo "  1. Add all changes to git"
    echo "  2. Commit with your message"
    echo "  3. Push to origin main"
    echo "  4. Deploy to server"
}

# Check if commit message is provided
if [ -z "$COMMIT_MESSAGE" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo
    show_usage
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: Please run this script from the Green Roasteries project root${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Quick Commit & Deploy             ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Step 1: Check git status
echo -e "${BLUE}Checking git status...${NC}"
if ! git status --porcelain | grep -q .; then
    echo -e "${YELLOW}No changes to commit${NC}"
    echo -e "${BLUE}Proceeding with deployment only...${NC}"
    echo
else
    echo -e "${GREEN}Changes detected:${NC}"
    git status --short
    echo

    # Step 2: Add all changes
    echo -e "${BLUE}Adding all changes...${NC}"
    git add .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes added${NC}"
    else
        echo -e "${RED}✗ Failed to add changes${NC}"
        exit 1
    fi
    echo

    # Step 3: Commit changes
    echo -e "${BLUE}Committing changes...${NC}"
    git commit -m "$COMMIT_MESSAGE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes committed${NC}"
    else
        echo -e "${RED}✗ Failed to commit changes${NC}"
        exit 1
    fi
    echo

    # Step 4: Push to origin
    echo -e "${BLUE}Pushing to origin main...${NC}"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes pushed to repository${NC}"
    else
        echo -e "${RED}✗ Failed to push changes${NC}"
        exit 1
    fi
    echo
fi

# Step 5: Deploy to server
echo -e "${BLUE}Deploying to server...${NC}"
./scripts/deploy.sh --code-only

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}     Commit & Deploy Completed!       ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Commit: $COMMIT_MESSAGE${NC}"
    echo -e "${GREEN}Deployed successfully to server${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi 