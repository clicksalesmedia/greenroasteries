#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    *)
      echo "$message"
      ;;
  esac
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check OS
check_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macos"
  else
    echo "unsupported"
  fi
}

# Install required tools based on OS
install_tools() {
  local os=$(check_os)
  
  log "info" "Installing required tools for deployment..."
  
  if [[ "$os" == "linux" ]]; then
    # Ubuntu/Debian
    if command_exists apt-get; then
      log "info" "Installing tools using apt-get..."
      sudo apt-get update
      sudo apt-get install -y rsync sshpass
    # RHEL/CentOS/Fedora
    elif command_exists yum; then
      log "info" "Installing tools using yum..."
      sudo yum install -y rsync sshpass
    else
      log "error" "Unsupported Linux distribution. Please install rsync and sshpass manually."
      exit 1
    fi
  elif [[ "$os" == "macos" ]]; then
    # Check if Homebrew is installed
    if ! command_exists brew; then
      log "info" "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install required tools
    log "info" "Installing tools using Homebrew..."
    brew install rsync
    
    # sshpass is not officially supported in Homebrew, but we can try to install it
    if ! command_exists sshpass; then
      log "info" "Installing sshpass..."
      brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb
    fi
  else
    log "error" "Unsupported OS. Please install rsync and sshpass manually."
    exit 1
  fi
  
  log "success" "Required tools installed successfully!"
}

# Make deploy script executable
make_deploy_executable() {
  log "info" "Making deployment script executable..."
  chmod +x scripts/deploy.js
  log "success" "Deployment script is now executable!"
}

# Create a scripts directory if it doesn't exist
if [ ! -d "scripts" ]; then
  log "info" "Creating scripts directory..."
  mkdir -p scripts
  log "success" "Scripts directory created!"
fi

# Main
log "info" "Setting up deployment environment..."
install_tools
make_deploy_executable
log "success" "Setup completed successfully!"
log "info" "You can now run the deployment script with: node scripts/deploy.js" 