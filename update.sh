#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH="/var/www/greenroasteries"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check for database changes
check_database_changes() {
    echo -e "${YELLOW}Checking for database changes...${NC}"
    
    # Create schema dumps for comparison
    echo -e "${YELLOW}Creating local schema dump...${NC}"
    pg_dump -h localhost -U postgres -d greenroasteries --schema-only > local_schema.sql
    
    # Get remote schema
    echo -e "${YELLOW}Creating remote schema dump...${NC}"
    ssh $SERVER_USER@$SERVER_IP "sudo -u postgres pg_dump -d greenroasteries --schema-only" > remote_schema.sql
    
    # Compare schemas
    DIFF=$(diff local_schema.sql remote_schema.sql)
    
    if [ -n "$DIFF" ]; then
        echo -e "${YELLOW}Database schema changes detected:${NC}"
        echo "$DIFF"
        
        read -p "Do you want to apply these schema changes to the server? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # We don't actually apply the schema changes automatically
            # That will be handled by Prisma in the server setup
            echo "Schema changes will be applied during deployment"
        fi
    else
        echo -e "${GREEN}No database schema changes detected.${NC}"
    fi
}

# Function to ensure uploads directory exists and has proper permissions
setup_uploads_directory() {
    echo -e "${YELLOW}Ensuring uploads directory exists and has proper permissions...${NC}"
    
    # Create local uploads directory if it doesn't exist
    mkdir -p public/uploads
    
    # Create uploads directory on server and set proper permissions
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH/public/uploads && chown -R www-data:www-data $DEPLOY_PATH/public/uploads && chmod -R 775 $DEPLOY_PATH/public/uploads"
    
    echo "Uploads directory checked and permissions set"
    
    # Sync uploads directory to server
    echo -e "${YELLOW}Syncing uploads directory to server...${NC}"
    rsync -avz --progress public/uploads/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/uploads/
    
    echo "Upload directory setup complete"
}

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

echo -e "${GREEN}Starting update process...${NC}"

# Push changes to GitHub
echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
git push origin main

# Check for database changes
check_database_changes

# Update code on server
echo -e "${YELLOW}Updating code...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && git stash && git fetch origin && git reset --hard origin/main"

# Detect if code has changed
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && if [[ -n \$(git diff HEAD@{1} HEAD --name-only) ]]; then echo 'Code changes detected. Rebuilding...'; npm ci && npm run build && pm2 restart greenroasteries; echo 'Application updated and restarted'; else echo 'No code changes detected.'; fi"

# Update database if needed
echo -e "${YELLOW}Updating database...${NC}"

# Create a backup of the database
echo -e "${YELLOW}Creating server database backup...${NC}"
ssh $SERVER_USER@$SERVER_IP "sudo -u postgres pg_dump -d greenroasteries > $DEPLOY_PATH/db_backup_\$(date +%Y%m%d_%H%M%S).sql"

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && npx prisma migrate deploy"

echo -e "${GREEN}Database updated successfully${NC}"

# Setup uploads directory
setup_uploads_directory

echo -e "${GREEN}Update completed successfully!${NC}"
echo "Please verify your changes at https://thegreenroasteries.com" 