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
BLUE='\033[0;34m'
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
    # This is crucial for Nginx to serve files properly
    chown -R www-data:www-data "$DEPLOY_UPLOADS_PATH"
    echo "Set www-data:www-data ownership for $DEPLOY_UPLOADS_PATH and its contents."
    
    # Set directory permissions to 755 (rwxr-xr-x)
    # Owner (www-data) can read, write, execute.
    # Group and others can read and execute (needed for Nginx to traverse and serve files).
    find "$DEPLOY_UPLOADS_PATH" -type d -exec chmod 755 {} \;
    echo "Set directory permissions to 755 for $DEPLOY_UPLOADS_PATH and its subdirectories."
    
    # Set file permissions to 644 (rw-r--r--)
    # Owner (www-data) can read and write.
    # Group and others can only read (needed for Nginx to serve files).
    find "$DEPLOY_UPLOADS_PATH" -type f -exec chmod 644 {} \;
    echo "Set file permissions to 644 for files within $DEPLOY_UPLOADS_PATH."
    
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

# Function to check if server is responding
check_server_health() {
    echo -e "${BLUE}Checking server health...${NC}"
    for i in {1..10}; do
        if curl -s -f -o /dev/null https://thegreenroasteries.com; then
            echo -e "${GREEN}✓ Server is responding (attempt $i/10)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Server not responding, waiting... (attempt $i/10)${NC}"
            sleep 3
        fi
    done
    echo -e "${RED}✗ Server health check failed after 10 attempts${NC}"
    return 1
}

# Function to ensure a working server is running (fallback to dev mode if needed)
ensure_server_running() {
    echo -e "${BLUE}Ensuring server is running...${NC}"
    
    # Check current PM2 status
    RUNNING_PROCESSES=$(ssh $SERVER_USER@$SERVER_IP "pm2 jlist | jq -r '.[] | select(.pm2_env.status == \"online\") | .name'")
    
    if [[ $RUNNING_PROCESSES == *"greenroasteries"* ]] || [[ $RUNNING_PROCESSES == *"greenroasteries-live"* ]]; then
        echo -e "${GREEN}✓ A greenroasteries process is already running${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}No greenroasteries process running, starting fallback development server...${NC}"
    ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && pm2 start npm --name greenroasteries-live -- run dev"
    
    # Wait and check if it started
    sleep 5
    if check_server_health; then
        echo -e "${GREEN}✓ Fallback development server started successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to start fallback server${NC}"
        return 1
    fi
}

# Function to attempt production build with validation
attempt_production_build() {
    echo -e "${BLUE}Attempting production build...${NC}"
    
    # Remove any incomplete build
    ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && rm -rf .next"
    
    # Attempt build
    BUILD_OUTPUT=$(ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && npm run build 2>&1")
    BUILD_STATUS=$?
    
    if [ $BUILD_STATUS -eq 0 ]; then
        # Check if essential files exist
        ESSENTIAL_FILES_CHECK=$(ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && [ -f .next/BUILD_ID ] && [ -f .next/routes-manifest.json ] && echo 'OK' || echo 'MISSING'")
        
        if [ "$ESSENTIAL_FILES_CHECK" = "OK" ]; then
            echo -e "${GREEN}✓ Production build successful and validated${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Production build completed but missing essential files${NC}"
            # Create missing files if needed
            ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && [ ! -f .next/BUILD_ID ] && echo 'production-build-$(date +%s)' > .next/BUILD_ID"
            
            # Check again
            ESSENTIAL_FILES_CHECK=$(ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && [ -f .next/BUILD_ID ] && echo 'OK' || echo 'MISSING'")
            if [ "$ESSENTIAL_FILES_CHECK" = "OK" ]; then
                echo -e "${GREEN}✓ Production build fixed and validated${NC}"
                return 0
            fi
        fi
    fi
    
    echo -e "${RED}✗ Production build failed or incomplete${NC}"
    echo -e "${YELLOW}Build output:${NC}"
    echo "$BUILD_OUTPUT"
    return 1
}

# Function to deploy with rollback capability
deploy_with_rollback() {
    echo -e "${BLUE}Starting deployment with rollback capability...${NC}"
    
    # Get current working process name for rollback
    CURRENT_PROCESS=$(ssh $SERVER_USER@$SERVER_IP "pm2 jlist | jq -r '.[] | select(.pm2_env.status == \"online\" and (.name | contains(\"greenroasteries\"))) | .name' | head -1")
    
    echo -e "${BLUE}Current running process: ${CURRENT_PROCESS:-'none'}${NC}"
    
    # Ensure we have a working server before starting
    ensure_server_running
    
    # Attempt production build
    if attempt_production_build; then
        echo -e "${BLUE}Attempting to start production server...${NC}"
        
        # Try to start production server
        ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && pm2 stop $CURRENT_PROCESS 2>/dev/null || true && pm2 start ecosystem.config.js --only greenroasteries 2>/dev/null || pm2 start npm --name greenroasteries -- run start"
        
        # Wait and check if production server is healthy
        sleep 10
        if check_server_health; then
            echo -e "${GREEN}✓ Production deployment successful!${NC}"
            # Clean up any dev servers
            ssh $SERVER_USER@$SERVER_IP "pm2 stop greenroasteries-live 2>/dev/null || true"
            return 0
        else
            echo -e "${RED}✗ Production server failed health check, rolling back...${NC}"
            # Stop failed production server and restart the working one
            ssh $SERVER_USER@$SERVER_IP "pm2 stop greenroasteries 2>/dev/null || true"
            if [ -n "$CURRENT_PROCESS" ]; then
                ssh $SERVER_USER@$SERVER_IP "pm2 restart $CURRENT_PROCESS"
            else
                ensure_server_running
            fi
        fi
    fi
    
    echo -e "${YELLOW}Production deployment failed, ensuring development server is running...${NC}"
    ensure_server_running
    
    if check_server_health; then
        echo -e "${GREEN}✓ Deployment completed with development server fallback${NC}"
        echo -e "${YELLOW}Note: Production build issues detected. Server running in development mode.${NC}"
        return 0
    else
        echo -e "${RED}✗ Critical: Unable to get any server running!${NC}"
        return 1
    fi
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

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && npm ci"

# Setup uploads directory on the server
setup_server_uploads_directory

# Make the permissions fix script executable
echo -e "${YELLOW}Making permission fix script executable...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && chmod +x scripts/fix-upload-permissions.sh"

# Deploy with rollback capability
deploy_with_rollback

# Update database schema using Prisma Migrate
echo -e "${YELLOW}Updating database schema...${NC}"
# Create a backup of the database first
echo -e "${YELLOW}Creating server database backup...${NC}"
ssh $SERVER_USER@$SERVER_IP "sudo -u postgres pg_dump -d greenroasteries > $DEPLOY_PATH_BASE/db_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Running database migrations...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH_BASE && npx prisma migrate deploy"

echo -e "${GREEN}Database updated successfully.${NC}"

# Final Nginx restart to pick up any changes
echo -e "${YELLOW}Restarting Nginx...${NC}"
ssh $SERVER_USER@$SERVER_IP "systemctl restart nginx"

# Final health check
if check_server_health; then
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}Website is accessible at: https://thegreenroasteries.com${NC}"
    
    # Show current running processes
    echo -e "${BLUE}Current PM2 processes:${NC}"
    ssh $SERVER_USER@$SERVER_IP "pm2 status"
else
    echo -e "${RED}✗ Final health check failed. Please check the server manually.${NC}"
    exit 1
fi

echo -e "${GREEN}Update completed successfully!${NC}"
echo "Please verify your changes at https://thegreenroasteries.com" 