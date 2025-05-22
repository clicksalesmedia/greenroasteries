#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH_BASE="/var/www/greenroasteries"
UPLOADS_DIR_RELATIVE="public/uploads"
DEPLOY_UPLOADS_PATH="$DEPLOY_PATH_BASE/$UPLOADS_DIR_RELATIVE"

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
            echo "Schema changes will be applied during deployment by Prisma Migrate."
        fi
    else
        echo -e "${GREEN}No database schema changes detected.${NC}"
    fi
    rm -f local_schema.sql remote_schema.sql # Clean up temp files
}

# Function to ensure uploads directory exists and has proper permissions on the SERVER
setup_server_uploads_directory() {
    echo -e "${YELLOW}Setting up and fixing server uploads directory: $DEPLOY_UPLOADS_PATH ${NC}"
    
    ssh $SERVER_USER@$SERVER_IP << EOF
    echo "Starting uploads directory setup on server..."
    
    # Define all known subdirectories that the application might use
    # This should mirror what the API might create dynamically or expect
    declare -a SUBDIRS=(
        "categories"
        "products"
        "products/gallery"
        "products/variations"
        "sliders"
        "content"
        # Add any other first-level or nested subdirectories here
    )
    
    # Create the main uploads directory
    mkdir -p "$DEPLOY_UPLOADS_PATH"
    echo "Created/verified main uploads directory: $DEPLOY_UPLOADS_PATH"
    
    # Create all specified subdirectories
    for SUBDIR in "${SUBDIRS[@]}"; do
        mkdir -p "$DEPLOY_UPLOADS_PATH/$SUBDIR"
        echo "Created/verified subdirectory: $DEPLOY_UPLOADS_PATH/$SUBDIR"
    done
    
    # Set ownership to www-data for the entire uploads structure
    # This is crucial for Nginx and the Next.js process (if also running as www-data or in its group)
    chown -R www-data:www-data "$DEPLOY_UPLOADS_PATH"
    echo "Set www-data:www-data ownership for $DEPLOY_UPLOADS_PATH and its contents."
    
    # Set directory permissions to 775 (rwxrwxr-x)
    # Owner (www-data) and group (www-data) can read, write, execute.
    # Others can read and execute (needed for Nginx to traverse and serve files).
    find "$DEPLOY_UPLOADS_PATH" -type d -exec chmod 775 {} \;
    echo "Set directory permissions to 775 for $DEPLOY_UPLOADS_PATH and its subdirectories."
    
    # Set file permissions to 664 (rw-rw-r--)
    # Owner (www-data) and group (www-data) can read and write.
    # Others can only read.
    find "$DEPLOY_UPLOADS_PATH" -type f -exec chmod 664 {} \;
    echo "Set file permissions to 664 for files within $DEPLOY_UPLOADS_PATH."
    
    # Fix SELinux contexts if applicable and restorecon is available
    if command -v restorecon >/dev/null 2>&1; then
        echo "Attempting to restore SELinux contexts for $DEPLOY_UPLOADS_PATH..."
        restorecon -Rv "$DEPLOY_UPLOADS_PATH"
        echo "SELinux contexts restored."
    else
        echo "restorecon command not found, skipping SELinux context restoration."
    fi
    
    echo "Verifying directory structure and permissions post-setup:"
    ls -la "$DEPLOY_PATH_BASE/public/"
    echo "---"
    ls -la "$DEPLOY_UPLOADS_PATH/"
    # Deeper verification for nested product directories
    if [ -d "$DEPLOY_UPLOADS_PATH/products" ]; then
        echo "--- products --- "
        ls -la "$DEPLOY_UPLOADS_PATH/products/"
        if [ -d "$DEPLOY_UPLOADS_PATH/products/variations" ]; then
            echo "--- products/variations --- "
            ls -la "$DEPLOY_UPLOADS_PATH/products/variations/"
        fi
    fi
    
    echo "Uploads directory setup completed on server."
EOF
    echo -e "${GREEN}Server uploads directory setup and permission fixing complete.${NC}"
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
echo -e "${YELLOW}Updating code on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && git stash && git fetch origin && git reset --hard origin/main"

# Setup uploads directory on the server (crucial step BEFORE rsync if any, and before app restart)
# This ensures the directories exist with correct base permissions.
setup_server_uploads_directory

# Note: We are NO LONGER rsyncing the local public/uploads directory.
# The uploads directory is now primarily managed on the server side by the API
# and this setup_server_uploads_directory function during deployment.
# If you have specific placeholder files or initial assets that MUST be in uploads,
# consider adding them to a different source directory and rsyncing that, or 
# handle them via a separate seeding mechanism if they are truly static assets.

# Make the permissions fix script executable
echo -e "${YELLOW}Making permission fix script executable...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && chmod +x scripts/fix-upload-permissions.sh"

# Rebuild and restart application on server
echo -e "${YELLOW}Rebuilding and restarting application on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && npm ci && npm run build && pm2 restart greenroasteries"

# Update database schema using Prisma Migrate
echo -e "${YELLOW}Updating database schema...${NC}"
# Create a backup of the database first
echo -e "${YELLOW}Creating server database backup...${NC}"
ssh $SERVER_USER@$SERVER_IP "sudo -u postgres pg_dump -d greenroasteries > $DEPLOY_PATH_BASE/db_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Running database migrations...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && npx prisma migrate deploy"

echo -e "${GREEN}Database updated successfully.${NC}"

# Final Nginx restart to pick up any changes
# (Permissions for uploads are handled by the script, Nginx config changes are rare here but good practice)
echo -e "${YELLOW}Restarting Nginx...${NC}"
ssh $SERVER_USER@$SERVER_IP "systemctl restart nginx"

echo -e "${GREEN}Update completed successfully!${NC}"
echo "Please verify your changes at https://thegreenroasteries.com" 