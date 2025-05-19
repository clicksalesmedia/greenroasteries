#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_PASS="ECLFC9qAgTVeHKFCWPT3H7"
REPO_URL="https://github.com/clicksalesmedia/greenroasteries.git"
DEPLOY_PATH="/var/www/greenroasteries"
LOCAL_DB="greenroasteries"
REMOTE_DB="greenroasteries"
DB_USER="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment process...${NC}"

# Function to check for errors
check_errors() {
    echo -e "${YELLOW}Checking for code errors...${NC}"
    
    # Run ESLint
    if ! npm run lint; then
        echo -e "${RED}ESLint found errors. Attempting to fix...${NC}"
        npm run lint -- --fix
    fi
    
    echo -e "${GREEN}Code check completed successfully${NC}"
}

# Function to backup local database
backup_local_db() {
    echo -e "${YELLOW}Backing up local database...${NC}"
    mkdir -p backups
    pg_dump -h localhost -U $DB_USER $LOCAL_DB > backups/local_backup_$(date +%Y%m%d_%H%M%S).sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Local database backup completed${NC}"
    else
        echo -e "${RED}Local database backup failed${NC}"
        exit 1
    fi
}

# Function to deploy to server
deploy_to_server() {
    echo -e "${YELLOW}Deploying to server...${NC}"
    
    # SSH into server and execute commands
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
        # Install Node.js and npm if not installed
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        fi

        # Install PostgreSQL if not installed
        if ! command -v psql &> /dev/null; then
            apt-get update
            apt-get install -y postgresql postgresql-contrib
            systemctl start postgresql
            systemctl enable postgresql
        fi

        # Create deployment directory if it doesn't exist
        mkdir -p $DEPLOY_PATH
        cd $DEPLOY_PATH

        # Pull latest changes or clone if not exists
        if [ -d ".git" ]; then
            git pull origin main
        else
            git clone $REPO_URL .
        fi

        # Install dependencies
        npm install

        # Build the application
        npm run build

        # Install and configure PM2 if not installed
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi

        # Start/Restart the application with PM2
        pm2 restart greenroasteries || pm2 start npm --name "greenroasteries" -- start

        # Configure Nginx
        if [ ! -f "/etc/nginx/sites-available/greenroasteries" ]; then
            cat > /etc/nginx/sites-available/greenroasteries << 'EOF'
server {
    listen 80;
    server_name 167.235.137.52;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
        fi

        # Restart Nginx
        nginx -t && systemctl restart nginx
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment completed successfully${NC}"
    else
        echo -e "${RED}Deployment failed${NC}"
        exit 1
    fi
}

# Function to restore database on server
restore_db_on_server() {
    echo -e "${YELLOW}Restoring database on server...${NC}"
    
    # Copy latest backup to server
    LATEST_BACKUP=$(ls -t backups/*.sql | head -1)
    scp $LATEST_BACKUP $SERVER_USER@$SERVER_IP:/tmp/backup.sql
    
    # Restore database on server
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        # Create database and user if they don't exist
        sudo -u postgres psql << EOF
        CREATE DATABASE greenroasteries;
        CREATE USER greenroasteries WITH PASSWORD 'greenroasteries';
        GRANT ALL PRIVILEGES ON DATABASE greenroasteries TO greenroasteries;
EOF
        
        # Restore the database
        sudo -u postgres psql greenroasteries < /tmp/backup.sql
        rm /tmp/backup.sql

        # Run Prisma migrations
        cd $DEPLOY_PATH
        npx prisma migrate deploy
        
        # Restart the application
        pm2 restart greenroasteries
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database restored successfully${NC}"
    else
        echo -e "${RED}Database restoration failed${NC}"
        exit 1
    fi
}

# Main deployment process
main() {
    # 1. Check and fix code errors
    check_errors
    
    # 2. Backup local database
    backup_local_db
    
    # 3. Deploy to server
    deploy_to_server
    
    # 4. Restore database on server
    restore_db_on_server
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Run the deployment
main 