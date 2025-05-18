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
  log "step" "Starting server update process..."
  
  # 1. Create deployment package
  log "step" "Creating deployment package..."
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  PACKAGE_NAME="website-update-$TIMESTAMP.tar.gz"
  
  # Create deployment package excluding unnecessary files
  tar --exclude="node_modules" \
      --exclude=".next" \
      --exclude=".git" \
      --exclude="website-update-*.tar.gz" \
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
  scp $PACKAGE_NAME $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ || {
    log "error" "Failed to upload package to server"
    exit 1
  }
  
  log "success" "Package uploaded successfully"
  
  # 3. Extract and apply update
  log "step" "Extracting and applying update on the server..."
  
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR
    
    # Create a backup directory if it doesn't exist
    mkdir -p $REMOTE_DIR/backups
    
    # Check for existing Docker volumes to preserve database
    DB_VOLUME=\$(docker volume ls | grep greenroasteries-data || docker volume ls | grep postgres_data || echo "")
    if [ -n "\$DB_VOLUME" ]; then
      echo "Found existing database volume: \$DB_VOLUME"
      echo "Database data will be preserved during the update."
    else
      echo "No existing database volume found. Will create a new one."
    fi
    
    # Extract the package
    echo "Extracting update package..."
    tar -xzf $PACKAGE_NAME -C $REMOTE_DIR || {
      echo "Failed to extract the package"
      exit 1
    }
    
    echo "Package extracted successfully, preparing to start services..."
    
    # Make scripts executable
    chmod +x $REMOTE_DIR/scripts/*.sh 2>/dev/null || true
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
      echo "Docker or Docker Compose not found. Installing..."
      apt-get update
      apt-get install -y docker.io docker-compose
      systemctl enable docker
      systemctl start docker
    fi
    
    # Stop all containers that might be related to the app
    echo "Stopping any running containers..."
    docker-compose down 2>/dev/null || true
    
    # Clean up old containers if they exist
    OLD_CONTAINERS=\$(docker ps -a | grep -E 'kind_noyce|cool_mccarthy|loving_blackburn' | awk '{print \$1}' || echo "")
    if [ -n "\$OLD_CONTAINERS" ]; then
      echo "Removing old containers that are no longer needed..."
      docker rm \$OLD_CONTAINERS 2>/dev/null || true
    fi
    
    # Ensure we're using the correct docker-compose file
    if [ -f "docker-compose.yml" ]; then
      echo "Checking docker-compose.yml format..."
      if ! grep -q "greenroasteries-app" docker-compose.yml; then
        echo "Updating docker-compose.yml to use the correct container names..."
        mv docker-compose.yml docker-compose.yml.bak
        cat > docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: greenroasteries-app
    restart: always
    ports:
      - "3001:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
      - JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    command: >
      sh -c "npx prisma generate &&
             npx prisma migrate deploy &&
             npm start"
    networks:
      - greenroasteries-network

  db:
    image: postgres:16-alpine
    container_name: greenroasteries-db
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=greenroasteries
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - greenroasteries-network

volumes:
  postgres_data:
    name: greenroasteries-data

networks:
  greenroasteries-network:
    name: greenroasteries-network
DOCKERCOMPOSE
      else
        echo "docker-compose.yml file looks good!"
      fi
    fi
    
    # Ensure the .env file exists with required values
    if [ ! -f ".env" ]; then
      echo "Creating .env file with default values..."
      cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
ENVFILE
    fi
    
    # Rebuild and restart the containers
    echo "Building and starting Docker containers..."
    docker-compose up --build -d || {
      echo "Failed to start Docker containers"
      docker-compose logs
      exit 1
    }
    
    # Wait for containers to be fully up
    echo "Waiting for containers to be fully up..."
    sleep 15
    
    # Check if containers are running
    if ! docker ps | grep -q "greenroasteries"; then
      echo "WARNING: Containers may not be running properly. Checking logs..."
      docker-compose logs
    else
      echo "Containers are running properly!"
      
      # Wait a bit more for the database to be ready
      echo "Waiting for the database to be fully initialized..."
      sleep 10
      
      # Perform a database check
      docker exec greenroasteries-db pg_isready -U postgres || echo "Database not yet ready, but continuing..."
    fi
    
    # Restart Nginx service
    echo "Restarting Nginx service..."
    if command -v nginx &> /dev/null || command -v systemctl &> /dev/null; then
      systemctl restart nginx || {
        echo "Failed to restart Nginx"
        echo "Attempting to start Nginx if it's not running..."
        systemctl start nginx || echo "Could not start Nginx, may need manual configuration."
      }
    else
      echo "Nginx not found. You may need to install and configure it manually."
    fi
    
    # Clean up the package
    rm $PACKAGE_NAME
    
    echo "Update applied successfully"
    echo "Running containers:"
    docker ps
EOF
  
  # 4. Clean up local package
  log "step" "Cleaning up local files..."
  rm $PACKAGE_NAME
  
  log "success" "Server update completed successfully!"
  log "info" "Website should be available at http://$SERVER_IP:3001"
}

# Run the main function
main 