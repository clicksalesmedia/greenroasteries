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
