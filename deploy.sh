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
SERVER_DIR="/var/www/greenroasteries"

# GitHub details
GITHUB_REPO="clicksalesmedia/greenroasteries.git"
GITHUB_BRANCH="main"

# Function to print step header
print_step() {
  echo -e "\n${CYAN}====== $1 ======${NC}"
}

# Function to print success message
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to print info message
print_info() {
  echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to print warning message
print_warning() {
  echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to confirm action
confirm_action() {
  read -p "$(echo -e ${YELLOW}$1 ${NC}(y/n): )" response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Function to backup database on the server
backup_database() {
  print_step "Backing up database"
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_DIR
    mkdir -p backups
    TIMESTAMP=\$(date +%Y%m%d%H%M%S)
    echo "Creating database backup..."
    docker exec greenroasteries-db pg_dump -U postgres -d greenroasteries > backups/db_backup_\$TIMESTAMP.sql 2>/dev/null && echo "✅ Database backup created successfully" || echo "⚠️ Database backup failed but continuing deployment"
EOF
  print_success "Database backup process completed"
}

# Function to push changes to GitHub
push_to_github() {
  print_step "Pushing changes to GitHub"
  
  if confirm_action "Do you want to commit and push changes to GitHub?"; then
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
      print_info "Uncommitted changes detected"
      git status -s
      
      # Ask for commit message
      read -p "Enter commit message: " commit_message
      
      # Commit changes
      git add .
      git commit -m "$commit_message"
      
      # Push to GitHub
      if git push origin $GITHUB_BRANCH; then
        print_success "Changes pushed to GitHub successfully"
      else
        print_error "Failed to push changes to GitHub"
        if confirm_action "Continue with deployment anyway?"; then
          print_warning "Continuing deployment without GitHub push"
        else
          print_info "Deployment aborted"
          exit 1
        fi
      fi
    else
      print_info "No changes to commit"
    fi
  else
    print_info "Skipping GitHub push"
  fi
}

# Function to create deployment package
create_deployment_package() {
  print_step "Creating deployment package"
  
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  PACKAGE_NAME="update-$TIMESTAMP.tar.gz"
  
  print_info "Packaging codebase (excluding node_modules, .next, etc.)..."
  tar --exclude="node_modules" \
      --exclude=".next" \
      --exclude=".git" \
      --exclude=".github" \
      --exclude="*.tar.gz" \
      --exclude="backups" \
      -czf $PACKAGE_NAME . || {
    print_error "Failed to create deployment package"
    exit 1
  }
  
  print_success "Deployment package created: $PACKAGE_NAME"
  
  echo $PACKAGE_NAME  # Return the package name
}

# Function to upload and deploy to server
deploy_to_server() {
  local package_name=$1
  
  print_step "Uploading package to server"
  print_info "Uploading $package_name to $SERVER_USER@$SERVER_IP:$SERVER_DIR/"
  
  # Upload the package
  if scp $package_name $SERVER_USER@$SERVER_IP:$SERVER_DIR/; then
    print_success "Package uploaded successfully"
  else
    print_error "Failed to upload package to server"
    exit 1
  fi
  
  print_step "Deploying on server"
  
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_DIR
    
    # Create backups of important files
    echo "Creating backup of configuration files..."
    mkdir -p backups
    cp -f docker-compose.yml backups/docker-compose.yml.bak 2>/dev/null || true
    cp -f Dockerfile backups/Dockerfile.bak 2>/dev/null || true
    cp -f .env backups/.env.bak 2>/dev/null || true
    
    # Extract the package
    echo "Extracting updated codebase..."
    tar -xzf $package_name || {
      echo "Failed to extract the package"
      exit 1
    }
    
    # Ensure correct configuration
    echo "Setting up configuration..."
    
    # Ensure environment variables are set
    cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
ENVFILE
    
    # Ensure prisma directory exists
    mkdir -p prisma
    
    # Ensure prisma migrations directory exists
    mkdir -p prisma/migrations
    
    # Stop running containers
    echo "Stopping running containers..."
    docker-compose down
    
    # Clean up old containers
    echo "Cleaning up old containers..."
    docker ps -a | grep -E 'cool_mccarthy|loving_blackburn|kind_noyce' | awk '{print \$1}' | xargs -r docker rm -f 2>/dev/null || true
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 20
    
    # Check container status
    echo "Container status:"
    docker ps
    
    # Check logs for any issues
    echo "Application logs:"
    docker logs greenroasteries-app 2>&1 | tail -n 20 || echo "No app container logs available"
    
    # Check database status
    echo "Database status:"
    docker exec greenroasteries-db pg_isready -U postgres || echo "Database not ready yet"
    
    # Clean up
    echo "Cleaning up..."
    rm -f $package_name
    
    echo "✅ Deployment completed successfully!"
EOF

  # Clean up local package
  rm -f $package_name
  print_success "Deployment process completed"
}

# Function to verify deployment
verify_deployment() {
  print_step "Verifying deployment"
  
  print_info "Checking if the website is accessible..."
  
  # Use curl to check if the website is accessible
  if curl -s --head --request GET https://thegreenroasteries.com | grep "200 OK" > /dev/null; then
    print_success "Website is accessible!"
  else
    print_warning "Website may not be accessible or is returning a non-200 status code"
    print_info "You should manually check https://thegreenroasteries.com"
  fi
}

# Main function
main() {
  print_step "Starting comprehensive deployment process"
  
  # First backup the database
  backup_database
  
  # Push changes to GitHub if requested
  push_to_github
  
  # Create deployment package
  package_name=$(create_deployment_package)
  
  # Deploy to server
  deploy_to_server $package_name
  
  # Verify deployment
  verify_deployment
  
  print_step "Deployment completed"
  print_success "The website https://thegreenroasteries.com should now be updated with the latest changes!"
  print_info "If you experience any issues, refer to the deployment logs above or SSH into the server to investigate."
}

# Run the main function
main 