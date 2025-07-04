#!/bin/bash

# Automatic deployment script
# This script is called when files change locally

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

# Deployment settings
CHANGED_FILE="$1"
BATCH_DEPLOY=${BATCH_DEPLOY:-false}

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

# Function to deploy changes
deploy_changes() {
    local deploy_type="$1"
    local file_changed="$2"
    
    log "🚀 Starting auto-deployment ($deploy_type)..."
    
    case $deploy_type in
        "code")
            # Deploy code changes
            log "📝 Syncing code changes..."
            rsync -avz --delete \
                --exclude='node_modules' \
                --exclude='.git' \
                --exclude='.next' \
                --exclude='backups' \
                --exclude='public/uploads' \
                --exclude='public/products' \
                --exclude='public/categories' \
                --exclude='public/sliders' \
                --exclude='.env.local' \
                ./ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/
            
            # Restart server if needed
            if [[ "$file_changed" == *.js || "$file_changed" == *.ts || "$file_changed" == *.tsx || "$file_changed" == *package.json ]]; then
                log "🔄 Restarting server..."
                ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && npm run build && pm2 restart greenroasteries"
            fi
            ;;
            
        "media")
            # Deploy media changes
            log "🖼️  Syncing media files..."
            rsync -avz ./public/uploads/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/uploads/
            rsync -avz ./public/products/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/products/
            rsync -avz ./public/categories/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/categories/
            rsync -avz ./public/sliders/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/sliders/
            ;;
            
        "database")
            # Deploy database changes (via migrations)
            log "🗃️  Deploying database changes..."
            rsync -avz ./prisma/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/prisma/
            ssh $SERVER_USER@$SERVER_IP "cd $DEPLOY_PATH && npx prisma migrate deploy && pm2 restart greenroasteries"
            ;;
            
        "full")
            # Full deployment
            log "🌟 Performing full deployment..."
            ./scripts/deploy-production.sh
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log "✅ Auto-deployment completed successfully"
    else
        log "❌ Auto-deployment failed"
    fi
}

# Function to determine deployment type
determine_deploy_type() {
    local file="$1"
    
    if [[ "$file" == *"prisma/"* ]]; then
        echo "database"
    elif [[ "$file" == *"public/uploads/"* || "$file" == *"public/products/"* || "$file" == *"public/categories/"* || "$file" == *"public/sliders/"* ]]; then
        echo "media"
    elif [[ "$file" == *"package.json" || "$file" == *".env"* ]]; then
        echo "full"
    else
        echo "code"
    fi
}

# Main deployment logic
if [ -n "$CHANGED_FILE" ]; then
    DEPLOY_TYPE=$(determine_deploy_type "$CHANGED_FILE")
    deploy_changes "$DEPLOY_TYPE" "$CHANGED_FILE"
else
    deploy_changes "full" ""
fi
