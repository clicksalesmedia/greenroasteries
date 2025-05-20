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
    if ! diff local_schema.sql remote_schema.sql > schema_diff.txt; then
        echo -e "${YELLOW}Database schema changes detected:${NC}"
        cat schema_diff.txt
        read -p "Do you want to apply these schema changes to the server? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    else
        echo -e "${GREEN}No schema changes detected${NC}"
    fi
    return 1
}

# Function to update database
update_database() {
    echo -e "${YELLOW}Updating database...${NC}"
    
    # Create a backup of the server database first
    echo -e "${YELLOW}Creating server database backup...${NC}"
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        mkdir -p /var/www/greenroasteries/backups
        sudo -u postgres pg_dump greenroasteries > /var/www/greenroasteries/backups/pre_update_$(date +%Y%m%d_%H%M%S).sql
ENDSSH
    
    # Run Prisma migrations on the server
    echo -e "${YELLOW}Running database migrations...${NC}"
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        cd /var/www/greenroasteries
        npx prisma migrate deploy
ENDSSH
    
    echo -e "${GREEN}Database updated successfully${NC}"
}

# Function to update code
update_code() {
    echo -e "${YELLOW}Updating code...${NC}"
    
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        cd /var/www/greenroasteries
        
        # Store the current git hash
        OLD_HASH=$(git rev-parse HEAD)
        
        # Stash any local changes
        echo "Stashing local changes..."
        git stash
        
        # Pull latest changes
        git pull origin main
        
        # Get new git hash
        NEW_HASH=$(git rev-parse HEAD)
        
        # Check if there are actual changes
        if [ "$OLD_HASH" != "$NEW_HASH" ]; then
            echo "Code changes detected. Rebuilding..."
            
            # Install any new dependencies
            npm install
            
            # Rebuild the application
            npm run build
            
            # Restart the application
            pm2 restart greenroasteries
            
            # Restart Nginx
            systemctl restart nginx
            
            echo "Application updated and restarted"
        else
            echo "No code changes detected"
        fi
ENDSSH
}

# Function to check git status
check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        echo -e "${RED}You have uncommitted changes. Please commit or stash them first.${NC}"
        exit 1
    fi
}

# Function to push to GitHub
push_to_github() {
    echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
    git push origin main
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to push to GitHub${NC}"
        exit 1
    fi
}

# Main update process
main() {
    echo -e "${GREEN}Starting update process...${NC}"
    
    # Check git status
    check_git_status
    
    # Push to GitHub if there are new commits
    if [ $(git rev-list HEAD@{u}..HEAD | wc -l) -gt 0 ]; then
        push_to_github
    fi
    
    # Check for database changes
    DB_CHANGES=false
    if check_database_changes; then
        DB_CHANGES=true
    fi
    
    # Update code
    update_code
    
    # Update database if changes were detected and approved
    if [ "$DB_CHANGES" = true ]; then
        update_database
    fi
    
    # Clean up temporary files
    rm -f local_schema.sql remote_schema.sql schema_diff.txt
    
    echo -e "${GREEN}Update completed successfully!${NC}"
    echo -e "${YELLOW}Please verify your changes at https://thegreenroasteries.com${NC}"
}

# Run the update
main 