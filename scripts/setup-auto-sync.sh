#!/bin/bash

# Setup automatic sync from localhost to server
# This script sets up file watchers and git hooks for immediate deployment

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

echo -e "${BLUE}🔄 Setting up automatic sync system...${NC}"
echo ""

# Function to install required tools
install_tools() {
    echo -e "${YELLOW}📦 Installing required tools...${NC}"
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v fswatch &> /dev/null; then
            echo -e "${BLUE}Installing fswatch via Homebrew...${NC}"
            brew install fswatch
        fi
        WATCH_TOOL="fswatch"
    else
        # Linux
        if ! command -v inotifywait &> /dev/null; then
            echo -e "${BLUE}Installing inotify-tools...${NC}"
            sudo apt-get update && sudo apt-get install -y inotify-tools 2>/dev/null || \
            sudo yum install -y inotify-tools 2>/dev/null || \
            echo -e "${YELLOW}⚠️  Please install inotify-tools manually${NC}"
        fi
        WATCH_TOOL="inotifywait"
    fi
    
    echo -e "${GREEN}✅ Required tools checked${NC}"
}

# Function to create deployment script
create_deployment_script() {
    echo -e "${YELLOW}🚀 Creating deployment script...${NC}"
    
    cat > scripts/auto-deploy.sh << 'EOF'
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
EOF

    chmod +x scripts/auto-deploy.sh
    echo -e "${GREEN}✅ Auto-deployment script created${NC}"
}

# Function to create file watcher
create_file_watcher() {
    echo -e "${YELLOW}👁️  Creating file watcher...${NC}"
    
    cat > scripts/start-file-watcher.sh << 'EOF'
#!/bin/bash

# File watcher script
# Monitors local file changes and triggers auto-deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}👁️  Starting file watcher for auto-deployment...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop watching${NC}"
echo ""

# Determine OS and use appropriate tool
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use fswatch
    fswatch -r \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='backups' \
        --exclude='*.log' \
        --exclude='package-lock.json' \
        --latency 2 \
        . | while read file; do
        
        echo -e "${YELLOW}📝 File changed: $file${NC}"
        ./scripts/auto-deploy.sh "$file"
    done
else
    # Linux - use inotifywait
    inotifywait -m -r \
        --exclude='(node_modules|\.git|\.next|backups|.*\.log|package-lock\.json)' \
        --format '%w%f' \
        -e modify,create,delete,move \
        . | while read file; do
        
        echo -e "${YELLOW}📝 File changed: $file${NC}"
        ./scripts/auto-deploy.sh "$file"
    done
fi
EOF

    chmod +x scripts/start-file-watcher.sh
    echo -e "${GREEN}✅ File watcher script created${NC}"
}

# Function to setup git hooks
setup_git_hooks() {
    echo -e "${YELLOW}🔗 Setting up Git hooks...${NC}"
    
    # Create post-commit hook
    cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

echo "🔄 Auto-deploying after commit..."
./scripts/auto-deploy.sh
EOF

    chmod +x .git/hooks/post-commit
    
    # Create pre-push hook
    cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🔍 Running pre-deploy checks..."

# Check for build errors
if ! npm run build; then
    echo "❌ Build failed. Push cancelled."
    exit 1
fi

echo "✅ Pre-deploy checks passed"
EOF

    chmod +x .git/hooks/pre-push
    
    echo -e "${GREEN}✅ Git hooks configured${NC}"
}

# Function to create systemd service (Linux)
create_systemd_service() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        return
    fi
    
    echo -e "${YELLOW}⚙️  Creating systemd service...${NC}"
    
    cat > /tmp/greenroasteries-watcher.service << EOF
[Unit]
Description=Green Roasteries File Watcher
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/scripts/start-file-watcher.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    echo -e "${BLUE}📋 Systemd service file created at /tmp/greenroasteries-watcher.service${NC}"
    echo -e "${YELLOW}💡 To install as a system service, run:${NC}"
    echo -e "   sudo cp /tmp/greenroasteries-watcher.service /etc/systemd/system/"
    echo -e "   sudo systemctl enable greenroasteries-watcher"
    echo -e "   sudo systemctl start greenroasteries-watcher"
}

# Function to create launchd service (macOS)
create_launchd_service() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        return
    fi
    
    echo -e "${YELLOW}⚙️  Creating launchd service...${NC}"
    
    local plist_file="$HOME/Library/LaunchAgents/com.greenroasteries.watcher.plist"
    
    cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.greenroasteries.watcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(pwd)/scripts/start-file-watcher.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$(pwd)/logs/watcher.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/logs/watcher-error.log</string>
</dict>
</plist>
EOF

    echo -e "${BLUE}📋 LaunchAgent created at $plist_file${NC}"
    echo -e "${YELLOW}💡 To start as a background service, run:${NC}"
    echo -e "   launchctl load $plist_file"
    echo -e "   launchctl start com.greenroasteries.watcher"
}

# Function to create control scripts
create_control_scripts() {
    echo -e "${YELLOW}🎮 Creating control scripts...${NC}"
    
    # Start sync script
    cat > scripts/start-sync.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Green Roasteries Auto-Sync..."

# Kill any existing watchers
pkill -f "start-file-watcher.sh" 2>/dev/null || true

# Start new watcher in background
nohup ./scripts/start-file-watcher.sh > logs/watcher.log 2>&1 &
WATCHER_PID=$!

echo "✅ File watcher started (PID: $WATCHER_PID)"
echo "📁 Logs: logs/watcher.log"
echo "🛑 To stop: ./scripts/stop-sync.sh"

# Save PID for stopping later
echo $WATCHER_PID > .watcher.pid
EOF

    # Stop sync script
    cat > scripts/stop-sync.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Green Roasteries Auto-Sync..."

# Kill watcher processes
pkill -f "start-file-watcher.sh" 2>/dev/null || true
pkill -f "fswatch" 2>/dev/null || true
pkill -f "inotifywait" 2>/dev/null || true

# Remove PID file
rm -f .watcher.pid

echo "✅ Auto-sync stopped"
EOF

    # Status script
    cat > scripts/sync-status.sh << 'EOF'
#!/bin/bash

echo "📊 Green Roasteries Auto-Sync Status"
echo "=================================="

if pgrep -f "start-file-watcher.sh" > /dev/null; then
    echo "🟢 Status: RUNNING"
    echo "📝 PID: $(pgrep -f "start-file-watcher.sh")"
    
    if [ -f "logs/watcher.log" ]; then
        echo ""
        echo "📋 Recent activity:"
        tail -5 logs/watcher.log
    fi
else
    echo "🔴 Status: STOPPED"
fi

echo ""
echo "🎮 Controls:"
echo "   Start:  ./scripts/start-sync.sh"
echo "   Stop:   ./scripts/stop-sync.sh"
echo "   Status: ./scripts/sync-status.sh"
EOF

    chmod +x scripts/start-sync.sh scripts/stop-sync.sh scripts/sync-status.sh
    echo -e "${GREEN}✅ Control scripts created${NC}"
}

# Function to test auto-sync
test_auto_sync() {
    echo -e "${YELLOW}🧪 Testing auto-sync setup...${NC}"
    
    # Test SSH connection
    if ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection to server working${NC}"
    else
        echo -e "${RED}❌ SSH connection failed${NC}"
        echo -e "${YELLOW}💡 Please ensure SSH key authentication is set up${NC}"
        return 1
    fi
    
    # Test rsync
    if command -v rsync &> /dev/null; then
        echo -e "${GREEN}✅ rsync available${NC}"
    else
        echo -e "${RED}❌ rsync not found${NC}"
        return 1
    fi
    
    # Test file watcher tool
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v fswatch &> /dev/null; then
            echo -e "${GREEN}✅ fswatch available${NC}"
        else
            echo -e "${RED}❌ fswatch not found${NC}"
            return 1
        fi
    else
        if command -v inotifywait &> /dev/null; then
            echo -e "${GREEN}✅ inotifywait available${NC}"
        else
            echo -e "${RED}❌ inotifywait not found${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Auto-sync setup test passed${NC}"
}

# Main execution
main() {
    # Create logs directory
    mkdir -p logs
    
    # Install required tools
    install_tools
    echo ""
    
    # Create deployment script
    create_deployment_script
    echo ""
    
    # Create file watcher
    create_file_watcher
    echo ""
    
    # Setup git hooks
    setup_git_hooks
    echo ""
    
    # Create system services
    create_systemd_service
    create_launchd_service
    echo ""
    
    # Create control scripts
    create_control_scripts
    echo ""
    
    # Test setup
    test_auto_sync
    echo ""
    
    echo -e "${GREEN}🎉 ✅ AUTO-SYNC SETUP COMPLETED SUCCESSFULLY!${NC}"
    echo ""
    echo -e "${BLUE}📋 What was configured:${NC}"
    echo -e "   • Auto-deployment script for different file types"
    echo -e "   • File watcher for real-time monitoring"
    echo -e "   • Git hooks for commit-based deployment"
    echo -e "   • System service files for background operation"
    echo -e "   • Control scripts for managing the watcher"
    echo ""
    echo -e "${YELLOW}🎮 How to use:${NC}"
    echo -e "   • Start watching: ${GREEN}./scripts/start-sync.sh${NC}"
    echo -e "   • Stop watching:  ${GREEN}./scripts/stop-sync.sh${NC}"
    echo -e "   • Check status:   ${GREEN}./scripts/sync-status.sh${NC}"
    echo -e "   • Manual deploy:  ${GREEN}./scripts/auto-deploy.sh${NC}"
    echo ""
    echo -e "${BLUE}🚀 Quick start:${NC}"
    echo -e "   ${GREEN}./scripts/start-sync.sh${NC}"
    echo ""
    echo -e "${YELLOW}💡 Note: Changes will now automatically deploy to server!${NC}"
    
    # Ask if user wants to start watching immediately
    read -p "Do you want to start the file watcher now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/start-sync.sh
    fi
}

# Run the main function
main 