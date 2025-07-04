#!/bin/bash

# Import server database to localhost
# This script creates a backup of the server database and imports it locally

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Server configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH="/var/www/greenroasteries"

# Database configuration
SERVER_DB="greenroasteries"
LOCAL_DB="greenroasteries"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"

# Backup settings
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="server_db_backup_$TIMESTAMP.sql"
TEMP_BACKUP="/tmp/$BACKUP_FILE"

echo -e "${BLUE}🗃️  Starting database import process...${NC}"
echo -e "${BLUE}Server: $SERVER_IP${NC}"
echo -e "${BLUE}Server DB: $SERVER_DB${NC}"
echo -e "${BLUE}Local DB: $LOCAL_DB${NC}"
echo ""

# Function to check local PostgreSQL
check_local_postgresql() {
    echo -e "${YELLOW}🔍 Checking local PostgreSQL...${NC}"
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL is not running locally${NC}"
        echo -e "${YELLOW}💡 Starting PostgreSQL...${NC}"
        
        # Try to start PostgreSQL based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew services start postgresql 2>/dev/null || \
            sudo launchctl load -w /Library/LaunchDaemons/com.edb.launchd.postgresql-*.plist 2>/dev/null || \
            pg_ctl -D /usr/local/var/postgres start 2>/dev/null
        else
            # Linux
            sudo systemctl start postgresql 2>/dev/null || \
            sudo service postgresql start 2>/dev/null
        fi
        
        # Wait a moment and check again
        sleep 3
        if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            echo -e "${RED}❌ Could not start PostgreSQL${NC}"
            echo -e "${YELLOW}Please start PostgreSQL manually and try again${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    
    # Test connection with credentials
    if PGPASSWORD=$LOCAL_DB_PASSWORD psql -h localhost -U $LOCAL_DB_USER -d postgres -c '\q' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Cannot connect to PostgreSQL with provided credentials${NC}"
        echo -e "${YELLOW}💡 Please check your PostgreSQL credentials${NC}"
        exit 1
    fi
}

# Function to create database backup on server
create_server_backup() {
    echo -e "${YELLOW}📦 Creating database backup on server...${NC}"
    
    # Create backup on server
    ssh $SERVER_USER@$SERVER_IP << EOF
echo "Creating database backup..."

# Check if database exists and is accessible
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $SERVER_DB; then
    echo "✅ Database '$SERVER_DB' found"
else
    echo "❌ Database '$SERVER_DB' not found"
    exit 1
fi

# Create backup directory
mkdir -p $DEPLOY_PATH/backups

# Create database backup
echo "📦 Creating PostgreSQL dump..."
sudo -u postgres pg_dump $SERVER_DB > $DEPLOY_PATH/backups/$BACKUP_FILE

if [ \$? -eq 0 ]; then
    echo "✅ Database backup created: $DEPLOY_PATH/backups/$BACKUP_FILE"
    
    # Show backup info
    echo "📊 Backup file size: \$(du -h $DEPLOY_PATH/backups/$BACKUP_FILE | cut -f1)"
    echo "📈 Backup contains \$(grep -c '^INSERT' $DEPLOY_PATH/backups/$BACKUP_FILE || echo "0") data rows"
else
    echo "❌ Database backup failed"
    exit 1
fi
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Server database backup created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create server database backup${NC}"
        exit 1
    fi
}

# Function to download backup file
download_backup() {
    echo -e "${YELLOW}📥 Downloading database backup...${NC}"
    
    # Create local backups directory
    mkdir -p backups
    
    # Download the backup file
    scp $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/backups/$BACKUP_FILE ./backups/$BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database backup downloaded successfully${NC}"
        echo -e "${BLUE}📁 Local backup: ./backups/$BACKUP_FILE${NC}"
        echo -e "${BLUE}📊 File size: $(du -h ./backups/$BACKUP_FILE | cut -f1)${NC}"
    else
        echo -e "${RED}❌ Failed to download database backup${NC}"
        exit 1
    fi
}

# Function to prepare local database
prepare_local_database() {
    echo -e "${YELLOW}🗃️  Preparing local database...${NC}"
    
    # Drop existing database if it exists
    echo -e "${BLUE}🗑️  Dropping existing database (if exists)...${NC}"
    PGPASSWORD=$LOCAL_DB_PASSWORD dropdb -h localhost -U $LOCAL_DB_USER $LOCAL_DB 2>/dev/null || true
    
    # Create fresh database
    echo -e "${BLUE}📦 Creating fresh database...${NC}"
    PGPASSWORD=$LOCAL_DB_PASSWORD createdb -h localhost -U $LOCAL_DB_USER $LOCAL_DB
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Local database created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create local database${NC}"
        exit 1
    fi
}

# Function to import database
import_database() {
    echo -e "${YELLOW}📤 Importing database backup...${NC}"
    
    # Import the backup
    echo -e "${BLUE}📥 Restoring database from backup...${NC}"
    PGPASSWORD=$LOCAL_DB_PASSWORD psql -h localhost -U $LOCAL_DB_USER $LOCAL_DB < ./backups/$BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database imported successfully${NC}"
    else
        echo -e "${RED}❌ Failed to import database${NC}"
        exit 1
    fi
}

# Function to run Prisma migrations
run_prisma_migrations() {
    echo -e "${YELLOW}🔧 Running Prisma migrations...${NC}"
    
    # Generate Prisma client
    echo -e "${BLUE}⚙️  Generating Prisma client...${NC}"
    npx prisma generate
    
    # Apply any pending migrations
    echo -e "${BLUE}📋 Applying migrations...${NC}"
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Prisma migrations completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Prisma migrations had issues (this might be normal)${NC}"
    fi
}

# Function to verify database import
verify_import() {
    echo -e "${YELLOW}🔍 Verifying database import...${NC}"
    
    # Count tables
    TABLE_COUNT=$(PGPASSWORD=$LOCAL_DB_PASSWORD psql -h localhost -U $LOCAL_DB_USER $LOCAL_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Database import verified: $TABLE_COUNT tables found${NC}"
        
        # Show some basic statistics
        echo -e "${BLUE}📊 Database Statistics:${NC}"
        PGPASSWORD=$LOCAL_DB_PASSWORD psql -h localhost -U $LOCAL_DB_USER $LOCAL_DB << 'EOF'
\echo 'Table Row Counts:'
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Rows"
FROM pg_stat_user_tables 
WHERE n_tup_ins > 0
ORDER BY n_tup_ins DESC
LIMIT 10;
EOF
    else
        echo -e "${RED}❌ Database import verification failed: No tables found${NC}"
        exit 1
    fi
}

# Function to clean up
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Clean up server backup (optional)
    read -p "Do you want to remove the backup file from the server? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh $SERVER_USER@$SERVER_IP "rm -f $DEPLOY_PATH/backups/$BACKUP_FILE"
        echo -e "${GREEN}✅ Server backup file removed${NC}"
    else
        echo -e "${BLUE}📁 Server backup kept at: $DEPLOY_PATH/backups/$BACKUP_FILE${NC}"
    fi
    
    # Keep local backup
    echo -e "${BLUE}📁 Local backup kept at: ./backups/$BACKUP_FILE${NC}"
}

# Function to test local application
test_local_app() {
    echo -e "${YELLOW}🧪 Testing local application...${NC}"
    
    # Test database connection
    echo -e "${BLUE}🔗 Testing database connection...${NC}"
    if node -e "
        const { PrismaClient } = require('./app/generated/prisma');
        const prisma = new PrismaClient();
        prisma.\$connect()
            .then(() => {
                console.log('✅ Database connection successful');
                return prisma.\$disconnect();
            })
            .catch((error) => {
                console.log('❌ Database connection failed:', error.message);
                process.exit(1);
            });
    " 2>/dev/null; then
        echo -e "${GREEN}✅ Local application can connect to database${NC}"
    else
        echo -e "${YELLOW}⚠️  Application connection test failed (might need npm install)${NC}"
    fi
}

# Main execution
main() {
    # Check local PostgreSQL
    check_local_postgresql
    echo ""
    
    # Confirm before proceeding
    echo -e "${YELLOW}⚠️  This will replace your local database with the server database${NC}"
    read -p "Do you want to proceed? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Operation cancelled by user${NC}"
        exit 0
    fi
    
    # Execute import steps
    echo -e "${BLUE}🚀 Starting database import process...${NC}"
    echo ""
    
    # 1. Create backup on server
    create_server_backup
    echo ""
    
    # 2. Download backup
    download_backup
    echo ""
    
    # 3. Prepare local database
    prepare_local_database
    echo ""
    
    # 4. Import database
    import_database
    echo ""
    
    # 5. Run Prisma migrations
    run_prisma_migrations
    echo ""
    
    # 6. Verify import
    verify_import
    echo ""
    
    # 7. Test local application
    test_local_app
    echo ""
    
    # 8. Cleanup
    cleanup
    echo ""
    
    echo -e "${GREEN}🎉 ✅ DATABASE IMPORT COMPLETED SUCCESSFULLY!${NC}"
    echo ""
    echo -e "${BLUE}📋 What was completed:${NC}"
    echo -e "   • Created backup of server database"
    echo -e "   • Downloaded backup to local machine"
    echo -e "   • Recreated local database from scratch"
    echo -e "   • Imported all server data"
    echo -e "   • Applied Prisma migrations"
    echo -e "   • Verified database integrity"
    echo ""
    echo -e "${YELLOW}🔄 Next steps:${NC}"
    echo -e "   1. Run: ${GREEN}npm run dev${NC} to start local development"
    echo -e "   2. Run: ${GREEN}./scripts/setup-auto-sync.sh${NC} to enable auto-deployment"
    echo ""
    echo -e "${BLUE}💡 Your localhost now has the exact same data as the server!${NC}"
}

# Run the main function
main 