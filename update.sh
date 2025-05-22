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
    echo -e "${YELLOW}Setting up and fixing uploads directory...${NC}"
    
    # Create local uploads directory if it doesn't exist
    mkdir -p public/uploads
    
    # Execute a series of commands on the server to properly set up the uploads directory
    ssh $SERVER_USER@$SERVER_IP << EOF
    echo "Starting uploads directory setup on server..."
    
    # Create uploads directory with parent directories if they don't exist
    mkdir -p $DEPLOY_PATH/public/uploads
    echo "Created uploads directory structure"
    
    # Set very permissive temporary permissions for setup
    chmod -R 777 $DEPLOY_PATH/public/uploads
    echo "Set temporary permissions for setup"
    
    # Ensure nginx user owns the directory
    chown -R www-data:www-data $DEPLOY_PATH/public/uploads
    echo "Set www-data as owner of uploads directory"
    
    # Fix SELinux contexts if applicable
    if command -v restorecon >/dev/null 2>&1; then
        restorecon -Rv $DEPLOY_PATH/public/uploads
        echo "Fixed SELinux contexts"
    fi
    
    # Verify directory structure and permissions
    echo "Current directory structure:"
    ls -la $DEPLOY_PATH/public/
    
    echo "Current uploads directory permissions:"
    ls -la $DEPLOY_PATH/public/uploads/
    
    # Double-check that www-data has access
    echo "Making sure nginx user (www-data) has proper access..."
    usermod -a -G www-data root
    
    # Create a test file to verify permissions
    touch $DEPLOY_PATH/public/uploads/test_permission.txt
    chown www-data:www-data $DEPLOY_PATH/public/uploads/test_permission.txt
    chmod 664 $DEPLOY_PATH/public/uploads/test_permission.txt
    echo "Created test permission file"
    
    # Restart nginx to ensure it picks up any permission changes
    systemctl restart nginx
    echo "Restarted nginx"
    
    echo "Uploads directory setup completed on server"
EOF
    
    # Sync uploads directory to server with detailed output
    echo -e "${YELLOW}Syncing uploads directory to server...${NC}"
    
    # Use rsync with archive mode to preserve permissions, verbose output, and compression
    rsync -avz --progress --perms --chmod=ugo+rwX public/uploads/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/uploads/
    
    # Set final permissions after sync
    ssh $SERVER_USER@$SERVER_IP << EOF
    echo "Setting final permissions after sync..."
    
    # Ensure the www-data user owns everything in uploads
    chown -R www-data:www-data $DEPLOY_PATH/public/uploads
    
    # Set directory permissions to 775 (owner+group can write, others can read/execute)
    find $DEPLOY_PATH/public/uploads -type d -exec chmod 775 {} \;
    
    # Set file permissions to 664 (owner+group can write, others can read)
    find $DEPLOY_PATH/public/uploads -type f -exec chmod 664 {} \;
    
    # Clean up test file
    rm -f $DEPLOY_PATH/public/uploads/test_permission.txt
    
    # Final verification
    echo "Final uploads directory content and permissions:"
    ls -la $DEPLOY_PATH/public/uploads/
    
    # Extra check that nginx user can access these files
    echo "Verifying nginx configuration and testing access..."
    nginx -t
    curl -s -I http://localhost/uploads/ | head -1
EOF
    
    echo -e "${GREEN}Upload directory setup and sync complete${NC}"
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

# Setup uploads directory first to ensure it exists with proper permissions
setup_uploads_directory

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

# Final permissions check for uploads directory
echo -e "${YELLOW}Performing final permissions check...${NC}"
ssh $SERVER_USER@$SERVER_IP "chmod -R 775 $DEPLOY_PATH/public/uploads && chown -R www-data:www-data $DEPLOY_PATH/public/uploads"

echo -e "${GREEN}Database updated successfully${NC}"

echo -e "${GREEN}Update completed successfully!${NC}"
echo "Please verify your changes at https://thegreenroasteries.com" 