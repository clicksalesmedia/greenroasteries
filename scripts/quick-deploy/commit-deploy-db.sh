#!/bin/bash

# Quick Commit, Deploy & Database Update Script
# This script commits your changes, deploys them, and safely updates the database if needed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="root"
SERVER_HOST="167.235.137.52"
SERVER_PATH="/var/www/greenroasteries"

# Get the commit message from command line argument
COMMIT_MESSAGE="$1"

# Function to show usage
show_usage() {
    echo "Usage: $0 \"commit message\""
    echo
    echo "Examples:"
    echo "  $0 \"Add user table migration\""
    echo "  $0 \"Update product schema\""
    echo "  $0 \"Fix database constraints\""
    echo
    echo "This script will:"
    echo "  1. Add all changes to git"
    echo "  2. Commit with your message"
    echo "  3. Push to origin main"
    echo "  4. Deploy to server"
    echo "  5. Check for new database migrations"
    echo "  6. Run migrations safely if needed"
    echo
    echo "Note: Database will only be updated if there are new migrations"
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
echo -e "${BLUE}   Quick Commit, Deploy & DB Update    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Step 1: Check git status
echo -e "${BLUE}Checking git status...${NC}"
if ! git status --porcelain | grep -q .; then
    echo -e "${YELLOW}No changes to commit${NC}"
    echo -e "${BLUE}Proceeding with deployment and DB check...${NC}"
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

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
echo

# Step 6: Check for database migrations
echo -e "${BLUE}Checking for database migrations...${NC}"

# Check if there are new migration files
if ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate status" 2>/dev/null | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓ Database is up to date - no migrations needed${NC}"
else
    echo -e "${YELLOW}Database migrations detected${NC}"
    
    # Show migration status
    echo -e "${BLUE}Migration status:${NC}"
    ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate status" 2>/dev/null || echo "Could not get migration status"
    echo
    
    # Ask for confirmation before running migrations
    echo -e "${YELLOW}Do you want to run database migrations? (y/N):${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Running database migrations...${NC}"
        
        # Run migrations
        if ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate deploy"; then
            echo -e "${GREEN}✓ Database migrations completed${NC}"
            
            # Generate Prisma client
            echo -e "${BLUE}Generating Prisma client...${NC}"
            if ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma generate"; then
                echo -e "${GREEN}✓ Prisma client generated${NC}"
                
                # Restart application to use new schema
                echo -e "${BLUE}Restarting application...${NC}"
                if ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 restart all"; then
                    echo -e "${GREEN}✓ Application restarted${NC}"
                else
                    echo -e "${RED}✗ Failed to restart application${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}✗ Failed to generate Prisma client${NC}"
                exit 1
            fi
        else
            echo -e "${RED}✗ Database migration failed${NC}"
            echo -e "${YELLOW}The application is still running with the previous database schema${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping database migrations${NC}"
        echo -e "${YELLOW}Note: If you have schema changes, you may need to run migrations later${NC}"
    fi
fi

# Step 7: Verify deployment
echo -e "${BLUE}Verifying deployment...${NC}"
if ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 status | grep -q 'online'"; then
    echo -e "${GREEN}✓ Application is running${NC}"
else
    echo -e "${RED}✗ Application is not running properly${NC}"
    exit 1
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Commit, Deploy & DB Update Complete! ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Commit: $COMMIT_MESSAGE${NC}"
echo -e "${GREEN}Deployed successfully to server${NC}"
echo -e "${GREEN}Database checked and updated if needed${NC}"
echo
echo -e "${BLUE}Quick commands:${NC}"
echo -e "${BLUE}  Check application: ssh $SERVER_USER@$SERVER_HOST 'pm2 status'${NC}"
echo -e "${BLUE}  View logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs'${NC}"
echo -e "${BLUE}  Migration status: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && npx prisma migrate status'${NC}" 