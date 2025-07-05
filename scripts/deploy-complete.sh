#!/bin/bash

# Complete Deployment Script for Green Roasteries
# This script handles git, database, Cloudinary, Tabby, and full application deployment

set -e  # Exit on any error

echo "🚀 Starting Complete Deployment Process..."

# Configuration
SERVER_USER="root"
SERVER_HOST="144.126.218.13"
PROJECT_PATH="/var/www/greenroasteries"
DB_NAME="greenroasteries"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Step 1: Commit all local changes
log "Step 1: Committing all local changes..."
git add -A
if git diff --staged --quiet; then
    log "No changes to commit"
else
    git commit -m "Complete deployment: database, Cloudinary, Tabby integration $(date +'%Y-%m-%d %H:%M:%S')"
    log "Local changes committed"
fi

# Step 2: Create deployment bundle (avoiding large git push)
log "Step 2: Creating deployment bundle..."
BUNDLE_NAME="deployment_$(date +'%Y%m%d_%H%M%S').tar.gz"

# Create exclusion list for tar
cat > .deploy-exclude << EOF
node_modules
.git
.next
backups
logs
*.log
.env.local
public/uploads/products
public/products
.DS_Store
EOF

# Create compressed bundle of project
tar --exclude-from=.deploy-exclude -czf "$BUNDLE_NAME" .
log "Created deployment bundle: $BUNDLE_NAME"

# Step 3: Upload bundle to server
log "Step 3: Uploading to server..."
scp "$BUNDLE_NAME" "$SERVER_USER@$SERVER_HOST:/tmp/"
if [ $? -eq 0 ]; then
    log "Bundle uploaded successfully"
    rm "$BUNDLE_NAME" .deploy-exclude
else
    error "Failed to upload bundle"
fi

# Step 4: Execute deployment on server
log "Step 4: Executing deployment on server..."
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

# Colors for server output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SERVER] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[SERVER WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[SERVER ERROR] $1${NC}"
    exit 1
}

PROJECT_PATH="/var/www/greenroasteries"
DB_NAME="greenroasteries"

log "Starting server-side deployment..."

# Find the uploaded bundle
BUNDLE=$(ls -t /tmp/deployment_*.tar.gz | head -1)
if [ -z "$BUNDLE" ]; then
    error "No deployment bundle found"
fi

log "Found bundle: $BUNDLE"

# Backup current deployment
if [ -d "$PROJECT_PATH" ]; then
    log "Creating backup of current deployment..."
    BACKUP_PATH="/var/backups/greenroasteries_$(date +'%Y%m%d_%H%M%S')"
    cp -r "$PROJECT_PATH" "$BACKUP_PATH"
    log "Backup created at: $BACKUP_PATH"
fi

# Extract new deployment
log "Extracting new deployment..."
mkdir -p "$PROJECT_PATH"
cd "$PROJECT_PATH"
tar -xzf "$BUNDLE"
rm "$BUNDLE"

# Set proper permissions
log "Setting permissions..."
chown -R www-data:www-data "$PROJECT_PATH"
chmod -R 755 "$PROJECT_PATH"

# Install/update dependencies
log "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --production
    log "Dependencies installed"
else
    warn "No package.json found"
fi

# Setup environment variables
log "Setting up environment variables..."
if [ -f ".env" ]; then
    log "Production .env file found, updating database URL for server..."
    # Update PostgreSQL URL to MySQL URL for server
    sed -i 's|DATABASE_URL=postgresql://.*|DATABASE_URL="mysql://greenroasteries:YourSecurePassword123!@localhost:3306/greenroasteries"|g' .env
    # Ensure NODE_ENV is set to production
    if ! grep -q "NODE_ENV=production" .env; then
        echo "NODE_ENV=production" >> .env
    fi
    log "Environment file updated for server"
else
    log "No .env file found - this should not happen with the deployment bundle"
    error "Production .env file missing"
fi

# Database setup
log "Setting up database..."
if ! mysql -u root -p"YourSecurePassword123!" -e "USE $DB_NAME;" 2>/dev/null; then
    log "Creating database $DB_NAME..."
    mysql -u root -p"YourSecurePassword123!" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    log "Database created"
fi

# Run Prisma migrations
log "Running database migrations..."
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma migrate deploy
    log "Database migrations completed"
else
    warn "No Prisma schema found"
fi

# Build the application
log "Building the application..."
npm run build
if [ $? -eq 0 ]; then
    log "Build completed successfully"
else
    error "Build failed"
fi

# Setup/restart PM2
log "Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
fi

# Stop existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECOEOF'
module.exports = {
  apps: [{
    name: 'greenroasteries',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/greenroasteries',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/greenroasteries-error.log',
    out_file: '/var/log/pm2/greenroasteries-out.log',
    log_file: '/var/log/pm2/greenroasteries.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
ECOEOF

# Start the application
log "Starting the application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx if not already configured
log "Checking Nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/greenroasteries" ]; then
    log "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/greenroasteries << 'NGINXEOF'
server {
    listen 80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    ssl_certificate /etc/letsencrypt/live/thegreenroasteries.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thegreenroasteries.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle static files
    location /_next/static {
        alias /var/www/greenroasteries/.next/static;
        expires 365d;
        access_log off;
    }

    location /static {
        alias /var/www/greenroasteries/public;
        expires 365d;
        access_log off;
    }
}
NGINXEOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    log "Nginx configured and reloaded"
fi

# Final health check
log "Running health check..."
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Application is responding locally"
else
    warn "❌ Application not responding locally"
fi

if curl -f https://thegreenroasteries.com > /dev/null 2>&1; then
    log "✅ Website is accessible online"
else
    warn "❌ Website not accessible online"
fi

# Show PM2 status
log "PM2 Status:"
pm2 status

log "🎉 Server-side deployment completed!"
log "🌐 Website: https://thegreenroasteries.com"
log "📊 PM2 Dashboard: pm2 monit"
log "📝 Logs: pm2 logs greenroasteries"

ENDSSH

# Step 5: Final verification
log "Step 5: Final verification..."
sleep 10

echo ""
log "🎉 Complete Deployment Finished!"
echo ""
log "Testing website accessibility..."

if curl -f https://thegreenroasteries.com > /dev/null 2>&1; then
    log "✅ Website is live: https://thegreenroasteries.com"
else
    warn "❌ Website may not be accessible yet"
fi

echo ""
log "Deployment Summary:"
log "- ✅ Code deployed"
log "- ✅ Database setup"
log "- ✅ Environment configured"
log "- ✅ Application built"
log "- ✅ PM2 started"
log "- ✅ Nginx configured"
echo ""
log "🔧 To monitor: ssh $SERVER_USER@$SERVER_HOST 'pm2 monit'"
log "📝 To check logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs greenroasteries'"
log "🌐 Website: https://thegreenroasteries.com"
echo "" 