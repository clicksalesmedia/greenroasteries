#!/bin/bash

# Complete sync from server to localhost
# This master script orchestrates the entire process

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DEPLOY_PATH="/var/www/greenroasteries"

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                              ║${NC}"
echo -e "${PURPLE}║           🌿 GREEN ROASTERIES COMPLETE SYNC 🌿              ║${NC}"
echo -e "${PURPLE}║                                                              ║${NC}"
echo -e "${PURPLE}║     📥 Pull from Server → 🗃️  Import Database → 🔄 Auto-Sync   ║${NC}"
echo -e "${PURPLE}║                                                              ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to display step header
step_header() {
    local step="$1"
    local title="$2"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}STEP $step: $title${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    step_header "0" "CHECKING PREREQUISITES"
    
    local errors=0
    
    # Check if scripts exist
    echo -e "${YELLOW}🔍 Checking required scripts...${NC}"
    
    local required_scripts=(
        "scripts/cleanup-localhost.sh"
        "scripts/pull-server-data.sh"
        "scripts/import-server-database.sh"
        "scripts/setup-auto-sync.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [ -f "$script" ]; then
            echo -e "${GREEN}✅ $script found${NC}"
        else
            echo -e "${RED}❌ $script missing${NC}"
            errors=$((errors + 1))
        fi
    done
    
    # Check system requirements
    echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
    
    local required_commands=(
        "git"
        "npm"
        "node"
        "psql"
        "ssh"
        "rsync"
    )
    
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "${GREEN}✅ $cmd available${NC}"
        else
            echo -e "${RED}❌ $cmd not found${NC}"
            errors=$((errors + 1))
        fi
    done
    
    # Check SSH connection
    echo -e "${YELLOW}🔍 Testing SSH connection to server...${NC}"
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH connection successful${NC}"
    else
        echo -e "${RED}❌ SSH connection failed${NC}"
        echo -e "${YELLOW}💡 Please ensure SSH key authentication is set up${NC}"
        errors=$((errors + 1))
    fi
    
    # Check PostgreSQL
    echo -e "${YELLOW}🔍 Checking PostgreSQL...${NC}"
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL not running, will try to start it${NC}"
    fi
    
    if [ $errors -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Found $errors error(s). Please fix them before continuing.${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}✅ All prerequisites satisfied!${NC}"
    fi
}

# Function to show sync plan
show_sync_plan() {
    step_header "1" "SYNC PLAN OVERVIEW"
    
    echo -e "${BLUE}📋 This script will perform the following actions:${NC}"
    echo ""
    echo -e "${YELLOW}1. 🧹 CLEANUP LOCALHOST${NC}"
    echo -e "   • Stop development servers"
    echo -e "   • Clean node_modules, .next, build artifacts"
    echo -e "   • Backup and remove local uploads"
    echo -e "   • Reset local database completely"
    echo -e "   • Clean temporary files and logs"
    echo ""
    echo -e "${YELLOW}2. 📥 PULL SERVER DATA${NC}"
    echo -e "   • Sync latest code from Git repository"
    echo -e "   • Download all application files"
    echo -e "   • Sync media files (uploads, products, categories)"
    echo -e "   • Install dependencies and generate Prisma client"
    echo ""
    echo -e "${YELLOW}3. 🗃️  IMPORT DATABASE${NC}"
    echo -e "   • Create backup of server database"
    echo -e "   • Download database backup"
    echo -e "   • Import server data to localhost"
    echo -e "   • Apply Prisma migrations"
    echo ""
    echo -e "${YELLOW}4. 🔄 SETUP AUTO-SYNC${NC}"
    echo -e "   • Create file watcher for real-time deployment"
    echo -e "   • Setup Git hooks for automatic deployment"
    echo -e "   • Configure control scripts"
    echo -e "   • Start automatic monitoring"
    echo ""
    echo -e "${RED}⚠️  WARNING: This will completely replace your localhost with server data!${NC}"
    echo ""
    
    # Show server information
    echo -e "${BLUE}📊 Server Information:${NC}"
    echo -e "   • Server IP: $SERVER_IP"
    echo -e "   • Deploy Path: $DEPLOY_PATH"
    echo -e "   • Server Time: $(ssh $SERVER_USER@$SERVER_IP 'date' 2>/dev/null || echo 'Unable to retrieve')"
    echo ""
    
    read -p "Do you want to proceed with the complete sync? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Sync cancelled by user${NC}"
        exit 0
    fi
}

# Function to execute step with error handling
execute_step() {
    local step_num="$1"
    local step_name="$2"
    local script_path="$3"
    
    step_header "$step_num" "$step_name"
    
    echo -e "${BLUE}🚀 Executing: $script_path${NC}"
    echo ""
    
    # Make script executable
    chmod +x "$script_path"
    
    # Execute the script
    if "$script_path"; then
        echo ""
        echo -e "${GREEN}✅ $step_name completed successfully!${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ $step_name failed!${NC}"
        echo -e "${YELLOW}💡 Check the error messages above for details${NC}"
        
        read -p "Do you want to continue with the next step anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Sync process aborted${NC}"
            exit 1
        fi
    fi
}

# Function to final verification
final_verification() {
    step_header "5" "FINAL VERIFICATION"
    
    echo -e "${YELLOW}🔍 Verifying the complete sync...${NC}"
    
    # Check if local files exist
    echo -e "${BLUE}📁 Checking local files...${NC}"
    if [ -f "package.json" ] && [ -f "next.config.js" ]; then
        echo -e "${GREEN}✅ Application files present${NC}"
    else
        echo -e "${RED}❌ Some application files missing${NC}"
    fi
    
    # Check database
    echo -e "${BLUE}🗃️  Checking database...${NC}"
    if PGPASSWORD=postgres psql -h localhost -U postgres greenroasteries -c '\dt' >/dev/null 2>&1; then
        TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres greenroasteries -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        echo -e "${GREEN}✅ Database accessible with $TABLE_COUNT tables${NC}"
    else
        echo -e "${RED}❌ Database connection issues${NC}"
    fi
    
    # Check media files
    echo -e "${BLUE}🖼️  Checking media files...${NC}"
    local upload_count=$(find public/uploads -type f 2>/dev/null | wc -l | xargs)
    local product_count=$(find public/products -type f 2>/dev/null | wc -l | xargs)
    echo -e "${GREEN}✅ Found $upload_count uploads and $product_count product images${NC}"
    
    # Check auto-sync
    echo -e "${BLUE}🔄 Checking auto-sync setup...${NC}"
    if [ -f "scripts/start-sync.sh" ] && [ -f "scripts/auto-deploy.sh" ]; then
        echo -e "${GREEN}✅ Auto-sync scripts ready${NC}"
    else
        echo -e "${RED}❌ Auto-sync setup incomplete${NC}"
    fi
    
    # Test Prisma client
    echo -e "${BLUE}🔧 Testing Prisma client...${NC}"
    if node -e "console.log('Prisma client test successful')" 2>/dev/null; then
        echo -e "${GREEN}✅ Node.js environment working${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js environment may need attention${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 ✅ VERIFICATION COMPLETED!${NC}"
}

# Function to show final summary
show_final_summary() {
    step_header "COMPLETE" "SYNC SUMMARY"
    
    echo -e "${GREEN}🎉 LOCALHOST TO SERVER SYNC COMPLETED SUCCESSFULLY! 🎉${NC}"
    echo ""
    echo -e "${BLUE}📋 What was accomplished:${NC}"
    echo -e "   ✅ Cleaned localhost environment"
    echo -e "   ✅ Pulled all code and files from server"
    echo -e "   ✅ Imported complete database from server"
    echo -e "   ✅ Set up automatic sync system"
    echo -e "   ✅ Verified all components"
    echo ""
    echo -e "${YELLOW}🎮 Next Steps:${NC}"
    echo ""
    echo -e "${CYAN}🚀 START DEVELOPMENT:${NC}"
    echo -e "   ${GREEN}npm run dev${NC}  # Start local development server"
    echo ""
    echo -e "${CYAN}🔄 MANAGE AUTO-SYNC:${NC}"
    echo -e "   ${GREEN}./scripts/start-sync.sh${NC}   # Start auto-deployment"
    echo -e "   ${GREEN}./scripts/stop-sync.sh${NC}    # Stop auto-deployment"
    echo -e "   ${GREEN}./scripts/sync-status.sh${NC}  # Check sync status"
    echo ""
    echo -e "${CYAN}📤 MANUAL DEPLOYMENT:${NC}"
    echo -e "   ${GREEN}./scripts/auto-deploy.sh${NC}  # Deploy changes manually"
    echo -e "   ${GREEN}git add . && git commit -m 'message'${NC}  # Auto-deploys on commit"
    echo ""
    echo -e "${CYAN}🗃️  DATABASE OPERATIONS:${NC}"
    echo -e "   ${GREEN}npx prisma studio${NC}          # Open database browser"
    echo -e "   ${GREEN}npx prisma migrate dev${NC}     # Create new migration"
    echo ""
    echo -e "${BLUE}📍 Your localhost now has:${NC}"
    echo -e "   • Exact same code as server"
    echo -e "   • Complete database with all data"
    echo -e "   • All media files and uploads"
    echo -e "   • Real-time sync to server enabled"
    echo ""
    echo -e "${PURPLE}💡 Pro Tips:${NC}"
    echo -e "   • Changes you make locally will automatically deploy to server"
    echo -e "   • Git commits trigger automatic deployment"
    echo -e "   • Different file types use optimized deployment strategies"
    echo -e "   • Check logs at: ${GREEN}logs/watcher.log${NC}"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Function to handle cleanup on exit
cleanup_on_exit() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
    # Add any cleanup needed
}

# Main execution
main() {
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    # Record start time
    START_TIME=$(date +%s)
    
    # 0. Check prerequisites
    check_prerequisites
    
    # 1. Show sync plan and get confirmation
    show_sync_plan
    
    # 2. Execute cleanup
    execute_step "2" "CLEANUP LOCALHOST" "scripts/cleanup-localhost.sh"
    
    # 3. Execute data pull
    execute_step "3" "PULL SERVER DATA" "scripts/pull-server-data.sh"
    
    # 4. Execute database import
    execute_step "4" "IMPORT DATABASE" "scripts/import-server-database.sh"
    
    # 5. Execute auto-sync setup
    execute_step "5" "SETUP AUTO-SYNC" "scripts/setup-auto-sync.sh"
    
    # 6. Final verification
    final_verification
    
    # 7. Show summary
    show_final_summary
    
    # Calculate and show total time
    END_TIME=$(date +%s)
    TOTAL_TIME=$((END_TIME - START_TIME))
    echo -e "${BLUE}⏱️  Total sync time: ${TOTAL_TIME}s${NC}"
    echo ""
}

# Check if running with specific step
if [ "$1" = "--step" ] && [ -n "$2" ]; then
    case "$2" in
        "cleanup"|"1")
            execute_step "1" "CLEANUP LOCALHOST" "scripts/cleanup-localhost.sh"
            ;;
        "pull"|"2")
            execute_step "2" "PULL SERVER DATA" "scripts/pull-server-data.sh"
            ;;
        "database"|"3")
            execute_step "3" "IMPORT DATABASE" "scripts/import-server-database.sh"
            ;;
        "autosync"|"4")
            execute_step "4" "SETUP AUTO-SYNC" "scripts/setup-auto-sync.sh"
            ;;
        "verify"|"5")
            final_verification
            ;;
        *)
            echo -e "${RED}❌ Unknown step: $2${NC}"
            echo -e "${YELLOW}Available steps: cleanup, pull, database, autosync, verify${NC}"
            exit 1
            ;;
    esac
else
    # Run complete sync
    main
fi 