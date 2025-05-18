#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_PASSWORD="TpFdwT2XKZ7UuF1jF8"
REMOTE_DIR="/var/www/greenroasteries"

# Log message with color
log() {
  local type=$1
  local message=$2
  
  case $type in
    "info")
      echo -e "${BLUE}[INFO]${NC} $message"
      ;;
    "success")
      echo -e "${GREEN}[SUCCESS]${NC} $message"
      ;;
    "warning")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      ;;
    "error")
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    "step")
      echo -e "${CYAN}[STEP]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Main function
main() {
  log "step" "Starting upload of latest code..."
  
  # 1. Create deployment package
  log "step" "Creating deployment package..."
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  PACKAGE_NAME="website-update-$TIMESTAMP.tar.gz"
  
  # Create deployment package excluding unnecessary files
  log "info" "Packaging local codebase (excluding node_modules, .next, etc.)..."
  tar --exclude="node_modules" \
      --exclude=".next" \
      --exclude=".git" \
      --exclude="website-update-*.tar.gz" \
      --exclude="*.log" \
      -czf $PACKAGE_NAME . || {
    log "error" "Failed to create deployment package"
    exit 1
  }
  
  log "success" "Deployment package created: $PACKAGE_NAME"
  
  # 2. Upload to server
  log "step" "Uploading package to server..."
  
  # Check if the package exists
  if [ ! -f "$PACKAGE_NAME" ]; then
    log "error" "Package $PACKAGE_NAME not found"
    exit 1
  fi
  
  # Upload the package
  log "info" "Uploading package to server (this may take a few minutes)..."
  scp $PACKAGE_NAME $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ || {
    log "error" "Failed to upload package to server"
    exit 1
  }
  
  log "success" "Package uploaded successfully"
  
  # 3. Extract package on server (simple operation)
  log "step" "Extracting package on server..."
  
  ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && tar -xzf $PACKAGE_NAME && echo 'Package extracted successfully'"
  
  # 4. Restart containers
  log "step" "Restarting containers on server..."
  
  ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker-compose down && docker-compose up -d && echo 'Containers restarted'"
  
  # 5. Clean up local package
  log "step" "Cleaning up local files..."
  rm -f $PACKAGE_NAME
  
  log "success" "Latest code uploaded successfully!"
  log "info" "Website with your latest changes should now be available at https://thegreenroasteries.com"
  log "warning" "If the site is not updated, you may need to SSH into the server and restart the containers manually."
}

# Run the main function
main 