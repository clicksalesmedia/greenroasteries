#!/bin/bash

# Configuration
DEPLOY_PATH="/var/www/greenroasteries/public/uploads"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating and fixing upload directories...${NC}"

# Create main upload directory if it doesn't exist
mkdir -p ${DEPLOY_PATH}
echo -e "${GREEN}Main uploads directory created/verified${NC}"

# Create necessary subdirectories for different upload types
mkdir -p ${DEPLOY_PATH}/products
mkdir -p ${DEPLOY_PATH}/products/gallery
mkdir -p ${DEPLOY_PATH}/products/variations
mkdir -p ${DEPLOY_PATH}/categories
mkdir -p ${DEPLOY_PATH}/sliders
mkdir -p ${DEPLOY_PATH}/content
echo -e "${GREEN}Upload subdirectories created${NC}"

# Set ownership to www-data (nginx user)
chown -R www-data:www-data ${DEPLOY_PATH}
echo -e "${GREEN}Ownership set to www-data${NC}"

# Set directory permissions to 775 (rwxrwxr-x)
find ${DEPLOY_PATH} -type d -exec chmod 775 {} \;
echo -e "${GREEN}Directory permissions set to 775${NC}"

# Set file permissions to 664 (rw-rw-r--)
find ${DEPLOY_PATH} -type f -exec chmod 664 {} \;
echo -e "${GREEN}File permissions set to 664${NC}"

# Print summary
echo -e "${YELLOW}Directory structure:${NC}"
ls -la ${DEPLOY_PATH}

echo -e "${YELLOW}Subdirectories:${NC}"
for dir in ${DEPLOY_PATH}/*; do
  if [ -d "$dir" ]; then
    echo -e "${GREEN}$dir${NC}"
    ls -la "$dir"
  fi
done

echo -e "${GREEN}Upload directories setup complete!${NC}" 