#!/bin/bash

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_DIR="/var/www/greenroasteries"

echo "🚀 Creating deployment package..."
tar --exclude="node_modules" \
    --exclude=".next" \
    --exclude=".git" \
    --exclude=".github" \
    --exclude="*.tar.gz" \
    -czf update.tar.gz .

echo "📤 Uploading to server..."
scp update.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_DIR/

echo "🔨 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP <<EOF
  cd $SERVER_DIR
  tar -xzf update.tar.gz
  docker-compose down
  docker-compose up -d --build
  rm update.tar.gz
  echo "✅ Deployment completed"
EOF

echo "🧹 Cleaning up local files..."
rm update.tar.gz

echo "✅ Done! Website should be updated."
echo "🌐 Visit https://thegreenroasteries.com to check." 