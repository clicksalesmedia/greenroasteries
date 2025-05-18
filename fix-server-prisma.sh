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
  log "step" "Starting Prisma schema fix..."
  
  # Create a temporary directory for Prisma files
  log "step" "Creating temporary directory for Prisma files..."
  mkdir -p prisma_temp
  
  # Copy Prisma files to temporary directory
  log "step" "Copying Prisma files to temporary directory..."
  cp -r prisma/* prisma_temp/
  
  # Create a tar file with just the Prisma directory
  log "step" "Creating Prisma package..."
  tar -czf prisma-fix.tar.gz prisma_temp
  
  # Upload the Prisma package to server
  log "step" "Uploading Prisma package to server..."
  scp prisma-fix.tar.gz $SERVER_USER@$SERVER_IP:$REMOTE_DIR/
  
  # SSH into the server and fix the issues
  log "step" "Applying Prisma fix on server..."
  
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR
    
    # Extract the Prisma package
    echo "Extracting Prisma package..."
    tar -xzf prisma-fix.tar.gz
    
    # Ensure prisma directory exists
    echo "Ensuring prisma directory exists..."
    mkdir -p prisma
    
    # Copy files to the prisma directory
    echo "Copying Prisma files to the correct location..."
    cp -r prisma_temp/* prisma/
    
    # Fix file permissions
    echo "Setting correct permissions..."
    chmod -R 755 prisma
    
    # Ensure NODE_ENV is set to production
    echo "Updating environment variables..."
    grep -q "NODE_ENV=production" .env || echo "NODE_ENV=production" >> .env
    
    # Remove old containers to ensure clean restart
    echo "Stopping any running containers..."
    docker-compose down
    
    # Rebuild the application
    echo "Rebuilding and starting the application..."
    docker-compose up --build -d
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 20
    
    # Check container status
    echo "Docker container status:"
    docker ps
    
    # Check logs for any issues
    echo "Container logs:"
    docker logs \$(docker ps | grep greenroasteries-app | awk '{print \$1}') 2>&1 | tail -n 30
    
    # Restart Nginx
    echo "Restarting Nginx..."
    systemctl restart nginx
    
    # Clean up temporary files
    echo "Cleaning up temporary files..."
    rm -rf prisma_temp
    rm prisma-fix.tar.gz
EOF
  
  # Clean up local temporary files
  log "step" "Cleaning up local temporary files..."
  rm -rf prisma_temp
  rm -f prisma-fix.tar.gz
  
  log "success" "Prisma schema fix completed!"
  log "info" "Please check if the website is now accessible at https://thegreenroasteries.com"
}

# Run the main function
main 