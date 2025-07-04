#!/bin/bash

# Clean up localhost environment before syncing with server
# This script safely cleans the local environment and prepares for server sync

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Local database configuration
LOCAL_DB="greenroasteries"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"

echo -e "${BLUE}🧹 Starting localhost cleanup process...${NC}"
echo ""

# Function to confirm destructive actions
confirm_action() {
    local message="$1"
    echo -e "${YELLOW}⚠️  $message${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Operation cancelled by user${NC}"
        exit 1
    fi
}

# 1. Stop local development server if running
echo -e "${YELLOW}🛑 Stopping local development server...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "yarn dev" 2>/dev/null || true
echo -e "${GREEN}✅ Local development server stopped${NC}"

# 2. Clean up Node.js artifacts
echo -e "${YELLOW}🗑️  Cleaning Node.js artifacts...${NC}"
rm -rf node_modules
rm -rf .next
rm -rf dist
rm -rf build
rm -f package-lock.json
rm -f yarn.lock
echo -e "${GREEN}✅ Node.js artifacts cleaned${NC}"

# 3. Clean up logs and temporary files
echo -e "${YELLOW}🗑️  Cleaning logs and temporary files...${NC}"
rm -rf logs
rm -f *.log
rm -f .env.local.backup
rm -rf tmp
rm -rf temp
echo -e "${GREEN}✅ Logs and temporary files cleaned${NC}"

# 4. Clean up local uploads and generated content
echo -e "${YELLOW}🗑️  Cleaning local uploads and generated content...${NC}"
confirm_action "This will delete all local uploads, products images, categories, and sliders. These will be restored from server."

# Backup current local uploads if they exist
if [ -d "public/uploads" ] || [ -d "public/products" ] || [ -d "public/categories" ] || [ -d "public/sliders" ]; then
    echo -e "${BLUE}📦 Creating backup of current local uploads...${NC}"
    mkdir -p backups/localhost-cleanup-$(date +%Y%m%d_%H%M%S)
    [ -d "public/uploads" ] && cp -r public/uploads backups/localhost-cleanup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    [ -d "public/products" ] && cp -r public/products backups/localhost-cleanup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    [ -d "public/categories" ] && cp -r public/categories backups/localhost-cleanup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    [ -d "public/sliders" ] && cp -r public/sliders backups/localhost-cleanup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    echo -e "${GREEN}✅ Local uploads backed up${NC}"
fi

# Remove current uploads
rm -rf public/uploads
rm -rf public/products
rm -rf public/categories
rm -rf public/sliders
echo -e "${GREEN}✅ Local uploads cleaned${NC}"

# 5. Reset local database
echo -e "${YELLOW}🗃️  Resetting local database...${NC}"
confirm_action "This will completely drop and recreate the local database '$LOCAL_DB'. All local data will be lost."

# Drop existing database
echo -e "${BLUE}📦 Dropping existing database...${NC}"
PGPASSWORD=$LOCAL_DB_PASSWORD dropdb -h localhost -U $LOCAL_DB_USER $LOCAL_DB 2>/dev/null || true

# Create fresh database
echo -e "${BLUE}📦 Creating fresh database...${NC}"
PGPASSWORD=$LOCAL_DB_PASSWORD createdb -h localhost -U $LOCAL_DB_USER $LOCAL_DB

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local database reset successfully${NC}"
else
    echo -e "${RED}❌ Failed to reset local database${NC}"
    echo -e "${YELLOW}⚠️  Please ensure PostgreSQL is running and credentials are correct${NC}"
    echo -e "${BLUE}💡 Run: brew services start postgresql (macOS) or sudo systemctl start postgresql (Linux)${NC}"
    exit 1
fi

# 6. Clean up Prisma generated files
echo -e "${YELLOW}🗑️  Cleaning Prisma generated files...${NC}"
rm -rf app/generated
rm -rf prisma/generated
echo -e "${GREEN}✅ Prisma generated files cleaned${NC}"

# 7. Clean up Git working directory (but keep changes)
echo -e "${YELLOW}🗑️  Cleaning Git working directory...${NC}"
git add . 2>/dev/null || true
git stash push -m "Cleanup stash - $(date)" 2>/dev/null || true
echo -e "${GREEN}✅ Git working directory cleaned (changes stashed)${NC}"

# 8. Clean up old backups (keep last 5)
echo -e "${YELLOW}🗑️  Cleaning old backups...${NC}"
if [ -d "backups" ]; then
    cd backups
    ls -1t local_backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    ls -1t localhost-cleanup-* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    cd ..
fi
echo -e "${GREEN}✅ Old backups cleaned${NC}"

# 9. Verify system requirements
echo -e "${YELLOW}🔍 Verifying system requirements...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | head -1)
    echo -e "${GREEN}✅ PostgreSQL: $PSQL_VERSION${NC}"
else
    echo -e "${RED}❌ PostgreSQL not found${NC}"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git: $GIT_VERSION${NC}"
else
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
fi

# 10. Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p backups
mkdir -p public/uploads
mkdir -p public/products
mkdir -p public/categories
mkdir -p public/sliders
mkdir -p logs
echo -e "${GREEN}✅ Directories created${NC}"

echo ""
echo -e "${GREEN}🎉 ✅ LOCALHOST CLEANUP COMPLETED SUCCESSFULLY!${NC}"
echo ""
echo -e "${BLUE}📋 What was cleaned:${NC}"
echo -e "   • Stopped development server"
echo -e "   • Removed node_modules, .next, build artifacts"
echo -e "   • Cleaned logs and temporary files"
echo -e "   • Backed up and removed local uploads"
echo -e "   • Reset local database completely"
echo -e "   • Cleaned Prisma generated files"
echo -e "   • Stashed git changes"
echo -e "   • Cleaned old backups (kept last 5)"
echo -e "   • Verified system requirements"
echo -e "   • Created necessary directories"
echo ""
echo -e "${YELLOW}🔄 Next steps:${NC}"
echo -e "   1. Run: ${GREEN}./scripts/pull-server-data.sh${NC} to pull code from server"
echo -e "   2. Run: ${GREEN}./scripts/import-server-database.sh${NC} to import database"
echo -e "   3. Run: ${GREEN}./scripts/setup-auto-sync.sh${NC} to enable automatic deployment"
echo ""
echo -e "${BLUE}💡 Or run the master script: ${GREEN}./scripts/sync-from-server.sh${NC} to do everything automatically${NC}" 