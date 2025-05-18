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
  log "step" "Starting Nginx/Docker fix process..."
  
  # SSH into the server and fix the issues
  log "step" "Connecting to server to diagnose issues..."
  
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR
    
    # Check if Docker containers are running
    echo "Checking Docker container status..."
    if ! docker ps | grep -q "greenroasteries-app"; then
      echo "Application container is not running! Checking what happened..."
      docker ps -a | grep greenroasteries
      
      # Check container logs
      echo "Checking container logs for errors..."
      docker logs \$(docker ps -a | grep greenroasteries-app | awk '{print \$1}') 2>&1 || echo "Could not get container logs"
      
      # Check Nginx configuration
      echo "Checking Nginx configuration..."
      nginx -t 2>&1 || echo "Nginx configuration has errors"
      
      # Make sure port 3001 is being exposed correctly
      echo "Checking if port 3001 is exposed and listening..."
      netstat -tulpn | grep 3001 || echo "Port 3001 is not listening"
      
      # Fix Nginx configuration if needed
      echo "Updating Nginx configuration to properly proxy to the Docker container..."
      cat > /etc/nginx/sites-available/default << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINX_CONF
      
      # Verify nginx config
      nginx -t

      # Restart containers
      echo "Restarting Docker containers..."
      cd $REMOTE_DIR
      docker-compose down
      
      # Ensure volumes are preserved but containers are recreated
      docker-compose up --build -d
      
      # Wait for containers to be fully up
      echo "Waiting for containers to start..."
      sleep 15
      
      # Print container status
      docker ps
      
      # Restart Nginx with new configuration
      echo "Restarting Nginx..."
      systemctl restart nginx
      
      # Check if site is now reachable
      echo "Testing if the site is now reachable..."
      curl -I http://localhost:3001 || echo "Site still not reachable locally"
    else
      echo "Application container is running. Checking configuration..."
      
      # Update Nginx config anyway to fix potential issues
      echo "Updating Nginx configuration..."
      cat > /etc/nginx/sites-available/default << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINX_CONF
      
      # Verify nginx config
      nginx -t
      
      # Restart Nginx
      systemctl restart nginx
      
      # Check if site is now reachable
      echo "Testing if the site is now reachable..."
      curl -I http://localhost:3001 || echo "Site still not reachable locally"
    fi
    
    # Final status check
    echo "Current container status:"
    docker ps
    
    echo "Nginx status:"
    systemctl status nginx | grep Active
    
    echo "Error logs from Nginx:"
    tail -n 20 /var/log/nginx/error.log
    
    echo "Firewall status (make sure port 80 is allowed):"
    ufw status || echo "UFW not installed or not enabled"
EOF
  
  log "success" "Diagnostic and fix process completed!"
  log "info" "Please check if the website is now accessible at https://thegreenroasteries.com"
  log "info" "If issues persist, check the logs from the fix process above for more details."
}

# Run the main function
main 