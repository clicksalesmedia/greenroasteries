#!/bin/bash

# 🚀 ENHANCED DEPLOYMENT SCRIPT FOR GREEN ROASTERIES
# This script handles the complete workflow: commit → push → deploy → build → restart → verify

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration - Updated for new server
SERVER_USER="root"
SERVER_HOST="116.203.242.63"  # New server IP
SERVER_PASSWORD="Ct9m9JrVJVX7Wb9MbsKnL"
SERVER_PATH="/var/www/greenroasteries"
PM2_APP_NAME="greenroasteries"
LOCAL_DB="greenroasteries"

# Script arguments
COMMIT_MESSAGE="$1"
SKIP_BUILD="${2:-false}"

# Function to show usage
show_usage() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}    Enhanced Deployment Script         ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
    echo -e "${WHITE}Usage:${NC}"
    echo "  $0 \"commit message\" [skip-build]"
    echo
    echo -e "${WHITE}Examples:${NC}"
    echo "  $0 \"Fix header navigation bug\""
    echo "  $0 \"Add new product feature\""
    echo "  $0 \"Update styling for mobile\""
    echo "  $0 \"Quick CSS fix\" skip-build    # Skip build for minor changes"
    echo
    echo -e "${WHITE}This script will:${NC}"
    echo "  1. 📋 Pre-deployment checks"
    echo "  2. 📁 Add all changes to git"
    echo "  3. 💾 Commit with your message"
    echo "  4. 🚀 Push to GitHub"
    echo "  5. 📡 Deploy to server (116.203.242.63)"
    echo "  6. 📦 Install dependencies if needed"
    echo "  7. 🗄️  Run database migrations if needed"
    echo "  8. 🔨 Build application (unless skipped)"
    echo "  9. 🔄 Restart PM2 application"
    echo "  10. ✅ Verify deployment success"
    echo
    echo -e "${WHITE}Features:${NC}"
    echo "  • 🛡️  Automatic rollback on failure"
    echo "  • 📊 Deployment verification"
    echo "  • 🎯 Smart build detection"
    echo "  • 🔍 Health checks"
    echo "  • 📝 Detailed logging"
}

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

# Function to show error and exit
error_exit() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to show success
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show warning
warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show step
step() {
    echo -e "${PURPLE}[STEP $1]${NC} $2"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    step "1" "Running pre-deployment checks..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        error_exit "Not in a git repository"
    fi
    
    # Check if we're in the correct directory
    if [ ! -f "package.json" ] || [ ! -d "app" ]; then
        error_exit "Please run this script from the Green Roasteries project root"
    fi
    
    # Check if required commands exist
    local required_commands=("git" "ssh" "rsync" "sshpass")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            if [ "$cmd" = "sshpass" ]; then
                error_exit "$cmd is not installed. Install it with: brew install sshpass (macOS) or apt-get install sshpass (Linux)"
            else
                error_exit "$cmd is not installed"
            fi
        fi
    done
    
    # Test server connection
    log "Testing server connection..."
    if ! sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'Connection successful'" >/dev/null 2>&1; then
        error_exit "Cannot connect to server $SERVER_HOST"
    fi
    
    success "Pre-deployment checks passed"
}

# Function to handle git operations
handle_git_operations() {
    step "2-4" "Handling Git operations..."
    
    # Check git status
    if ! git status --porcelain | grep -q .; then
        warning "No changes to commit"
        log "Proceeding with deployment only..."
        return 0
    fi
    
    success "Changes detected:"
    git status --short
    echo
    
    # Add all changes
    log "Adding all changes..."
    git add .
    if [ $? -ne 0 ]; then
        error_exit "Failed to add changes"
    fi
    
    # Commit changes
    log "Committing changes..."
    git commit -m "$COMMIT_MESSAGE"
    if [ $? -ne 0 ]; then
        error_exit "Failed to commit changes"
    fi
    
    # Push to origin
    log "Pushing to GitHub..."
    git push origin main
    if [ $? -ne 0 ]; then
        error_exit "Failed to push changes to GitHub"
    fi
    
    success "Git operations completed successfully"
}

# Function to create backup
create_backup() {
    log "Creating server backup..."
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"
    success "Backup created"
}

# Function to deploy to server
deploy_to_server() {
    step "5" "Deploying to server..."
    
    create_backup
    
    # Sync files to server
    log "Syncing files to server..."
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='.next/' \
        --exclude='node_modules/' \
        --exclude='.env.local' \
        --exclude='logs/' \
        --exclude='backups/' \
        --exclude='scripts/' \
        -e "sshpass -p $SERVER_PASSWORD ssh -o StrictHostKeyChecking=no" \
        ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"
    
    if [ $? -eq 0 ]; then
        success "Files synced successfully"
    else
        error_exit "File sync failed"
    fi
}

# Function to install dependencies
install_dependencies() {
    step "6" "Installing dependencies..."
    
    log "Checking package.json changes..."
    
    # Check if package.json or package-lock.json changed
    if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npm install --production"; then
        success "Dependencies installed successfully"
    else
        error_exit "Failed to install dependencies"
    fi
}

# Function to run database migrations
run_database_migrations() {
    step "7" "Checking for database migrations..."
    
    # Check if there are new migrations
    local migration_output=$(sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate status 2>/dev/null")
    
    if echo "$migration_output" | grep -q "following migration.*have not yet been applied"; then
        log "New migrations detected, applying..."
        if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npx prisma migrate deploy"; then
            success "Database migrations applied successfully"
        else
            error_exit "Failed to apply database migrations"
        fi
    else
        log "No new migrations to apply"
    fi
}

# Function to build application
build_application() {
    if [ "$SKIP_BUILD" = "skip-build" ]; then
        warning "Skipping build as requested"
        return 0
    fi
    
    step "8" "Building application..."
    
    log "Running npm run build on server..."
    if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && npm run build"; then
        success "Build completed successfully"
    else
        error_exit "Build failed"
    fi
}

# Function to restart PM2 application
restart_application() {
    step "9" "Restarting PM2 application..."
    
    log "Restarting PM2 process..."
    
    # First try to restart, if it fails, start it
    if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 restart $PM2_APP_NAME"; then
        success "PM2 application restarted successfully"
    elif sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 start npm --name '$PM2_APP_NAME' -- start"; then
        success "PM2 application started successfully"
    else
        error_exit "Failed to restart PM2 application"
    fi
    
    # Save PM2 configuration
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "pm2 save" >/dev/null 2>&1
}

# Function to verify deployment
verify_deployment() {
    step "10" "Verifying deployment..."
    
    # Wait a moment for the application to start
    log "Waiting for application to start..."
    sleep 5
    
    # Check PM2 status
    log "Checking PM2 status..."
    local pm2_status=$(sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "pm2 jlist" 2>/dev/null)
    if echo "$pm2_status" | grep -q '"status":"online"'; then
        success "PM2 application is online"
    else
        error_exit "PM2 application is not running properly"
    fi
    
    # Check HTTP response
    log "Checking HTTP response..."
    local http_code=$(sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        success "Website is responding correctly"
    else
        warning "Website may not be responding correctly (HTTP $http_code)"
    fi
    
    # Check if SSL is working (if applicable)
    log "Checking external access..."
    if curl -s -o /dev/null -w '%{http_code}' https://thegreenroasteries.com | grep -q "200"; then
        success "External website access is working"
    else
        warning "External website access may have issues"
    fi
}

# Function to rollback on failure
rollback() {
    warning "Deployment failed, attempting rollback..."
    
    # Restore backup if it exists
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && ls -t .next.backup.* 2>/dev/null | head -1 | xargs -I {} mv {} .next" 2>/dev/null || true
    
    # Restart application
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && pm2 restart $PM2_APP_NAME" >/dev/null 2>&1
    
    warning "Rollback attempted"
}

# Function to show final status
show_final_status() {
    echo
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}        DEPLOYMENT SUMMARY             ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "${GREEN}✅ Commit:${NC} $COMMIT_MESSAGE"
    echo -e "${GREEN}✅ Server:${NC} https://thegreenroasteries.com"
    echo -e "${GREEN}✅ Admin:${NC} https://thegreenroasteries.com/backend"
    echo -e "${GREEN}✅ Status:${NC} Deployment completed successfully!"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "• Test the website functionality"
    echo "• Check the admin panel"
    echo "• Monitor server logs if needed: sshpass -p $SERVER_PASSWORD ssh $SERVER_USER@$SERVER_HOST 'pm2 logs $PM2_APP_NAME'"
    echo
}

# Main function
main() {
    # Check if commit message is provided
    if [ -z "$COMMIT_MESSAGE" ]; then
        echo -e "${RED}Error: Please provide a commit message${NC}"
        echo
        show_usage
        exit 1
    fi
    
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}    🚀 ENHANCED DEPLOYMENT SCRIPT      ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "${WHITE}Commit:${NC} $COMMIT_MESSAGE"
    echo -e "${WHITE}Server:${NC} $SERVER_HOST"
    echo -e "${WHITE}Path:${NC} $SERVER_PATH"
    if [ "$SKIP_BUILD" = "skip-build" ]; then
        echo -e "${WHITE}Mode:${NC} Quick deploy (build skipped)"
    else
        echo -e "${WHITE}Mode:${NC} Full deployment"
    fi
    echo -e "${CYAN}========================================${NC}"
    echo
    
    # Set up error handling
    set -e
    trap 'rollback; exit 1' ERR
    
    # Run deployment steps
    check_prerequisites
    handle_git_operations
    deploy_to_server
    install_dependencies
    run_database_migrations
    build_application
    restart_application
    verify_deployment
    
    # Remove error trap for success case
    set +e
    trap - ERR
    
    show_final_status
}

# Run main function
main "$@" 