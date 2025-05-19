#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DOMAIN="thegreenroasteries.com"
DEPLOY_PATH="/var/www/greenroasteries"

# SSH into the server and fix the deployment
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Stop existing PM2 processes
pm2 delete all

# Navigate to the correct directory
cd /var/www/greenroasteries

# Install dependencies if needed
npm install

# Build the application
npm run build

# Start the application with PM2 in the correct directory
pm2 start npm --name "greenroasteries" --cwd "/var/www/greenroasteries" -- start

# Create Nginx configuration for the domain
cat > /etc/nginx/sites-available/greenroasteries << EOF
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Add security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src * data: 'unsafe-eval' 'unsafe-inline'" always;
        
        # Enable compression
        gzip on;
        gzip_min_length 1000;
        gzip_proxied expired no-cache no-store private auth;
        gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;
    }

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security settings
    location ~ /\. {
        deny all;
    }
    
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }
    
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Show status
echo "=== PM2 Status ==="
pm2 status
echo "=== Nginx Status ==="
systemctl status nginx
ENDSSH 