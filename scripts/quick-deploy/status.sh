#!/bin/bash

# Quick Deploy Status Script
# Shows the current status of deployment, database, and application

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Green Roasteries Status Check     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: Please run this script from the Green Roasteries project root${NC}"
    exit 1
fi

# 1. Git Status
echo -e "${BLUE}🔄 Git Status${NC}"
echo -e "${BLUE}=============${NC}"
if git status --porcelain | grep -q .; then
    echo -e "${YELLOW}Uncommitted changes detected:${NC}"
    git status --short
else
    echo -e "${GREEN}✓ Working directory clean${NC}"
fi

echo -e "${BLUE}Latest commit:${NC}"
git log --oneline -1
echo

# 2. Server Connection
echo -e "${BLUE}🌐 Server Connection${NC}"
echo -e "${BLUE}===================${NC}"
if ssh -q "$SERVER_USER@$SERVER_HOST" exit; then
    echo -e "${GREEN}✓ Server connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to server${NC}"
    exit 1
fi
echo

# 3. Application Status
echo -e "${BLUE}🚀 Application Status${NC}"
echo -e "${BLUE}=====================${NC}"
APP_STATUS=$(ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 jlist" 2>/dev/null)
if echo "$APP_STATUS" | grep -q '"status":"online"'; then
    echo -e "${GREEN}✓ Application is running${NC}"
    
    # Show PM2 status
    echo -e "${BLUE}PM2 Status:${NC}"
    ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 status" 2>/dev/null || echo "Could not get PM2 status"
else
    echo -e "${RED}✗ Application is not running properly${NC}"
    echo -e "${BLUE}PM2 Status:${NC}"
    ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 status" 2>/dev/null || echo "Could not get PM2 status"
fi
echo

# 4. Database Status
echo -e "${BLUE}🗄️  Database Status${NC}"
echo -e "${BLUE}==================${NC}"
DB_STATUS=$(ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate status" 2>/dev/null)
if echo "$DB_STATUS" | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓ Database is up to date${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations pending${NC}"
    echo -e "${BLUE}Migration status:${NC}"
    echo "$DB_STATUS"
fi
echo

# 5. Server Resources
echo -e "${BLUE}💻 Server Resources${NC}"
echo -e "${BLUE}==================${NC}"
echo -e "${BLUE}Disk Usage:${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "df -h | grep -E '/$|/var'" 2>/dev/null || echo "Could not get disk usage"

echo -e "${BLUE}Memory Usage:${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "free -h" 2>/dev/null || echo "Could not get memory usage"
echo

# 6. Website Status
echo -e "${BLUE}🌍 Website Status${NC}"
echo -e "${BLUE}=================${NC}"
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST" | grep -q "200"; then
    echo -e "${GREEN}✓ Website is accessible${NC}"
else
    echo -e "${RED}✗ Website is not accessible${NC}"
fi
echo

# 7. Recent Logs
echo -e "${BLUE}📋 Recent Application Logs${NC}"
echo -e "${BLUE}==========================${NC}"
echo -e "${BLUE}Last 10 lines:${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 logs --lines 10 --nostream" 2>/dev/null || echo "Could not get logs"
echo

# 8. Git Sync Status
echo -e "${BLUE}🔄 Git Sync Status${NC}"
echo -e "${BLUE}==================${NC}"
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && git rev-parse HEAD" 2>/dev/null)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✓ Local and server are in sync${NC}"
    echo -e "${BLUE}Current commit: ${LOCAL_COMMIT:0:8}${NC}"
else
    echo -e "${YELLOW}⚠️  Local and server commits differ${NC}"
    echo -e "${BLUE}Local:  ${LOCAL_COMMIT:0:8}${NC}"
    echo -e "${BLUE}Server: ${REMOTE_COMMIT:0:8}${NC}"
fi
echo

# 9. Quick Actions
echo -e "${BLUE}⚡ Quick Actions${NC}"
echo -e "${BLUE}================${NC}"
echo -e "${BLUE}Deploy changes:${NC}     ./scripts/quick-deploy/commit-deploy.sh \"message\""
echo -e "${BLUE}Deploy with DB:${NC}     ./scripts/quick-deploy/commit-deploy-db.sh \"message\""
echo -e "${BLUE}Server logs:${NC}        ssh $SERVER_USER@$SERVER_HOST 'pm2 logs'"
echo -e "${BLUE}Restart app:${NC}        ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && pm2 restart all'"
echo -e "${BLUE}Migration status:${NC}   ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && npx prisma migrate status'"
echo

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}           Status Check Complete        ${NC}"
echo -e "${GREEN}========================================${NC}" 