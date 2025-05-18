#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
REMOTE_DIR="/var/www/greenroasteries"

# Create a directory for the files to transfer
mkdir -p deploy_temp

# Copy the modified files
cp -r app/contexts/LanguageContext.tsx deploy_temp/
cp -r app/shop/page.tsx deploy_temp/
cp -r app/page.tsx deploy_temp/

# Create a tar file with only the modified files
cd deploy_temp
tar -czf ../update.tar.gz *
cd ..

# Transfer the tar file to the server
scp update.tar.gz $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# Execute commands on the server
ssh $SERVER_USER@$SERVER_IP << EOF
  cd $REMOTE_DIR
  
  # Extract the updated files
  mkdir -p temp_update
  tar -xzf update.tar.gz -C temp_update
  
  # Copy the files to their respective locations
  cp -r temp_update/LanguageContext.tsx app/contexts/
  cp -r temp_update/page.tsx app/shop/
  cp -r temp_update/page.tsx app/
  
  # Fix permissions
  chown -R www-data:www-data app
  
  # Clean cache directories that might contain stale data
  find /var/www/greenroasteries/.next/cache -type d -exec rm -rf {} + 2>/dev/null || true
  
  # Stop Docker containers
  docker-compose down || true
  
  # Force rebuild the Docker image
  docker-compose build --no-cache app
  
  # Start Docker containers
  docker-compose up -d
  
  # Restart Nginx to apply changes
  systemctl restart nginx
  
  # Clean up
  rm -rf temp_update
  rm update.tar.gz
EOF

# Clean up locally
rm -rf deploy_temp
rm update.tar.gz

echo "Deployment completed!" 