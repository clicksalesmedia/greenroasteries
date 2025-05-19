#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"

# Create and upload Nginx configuration
cat > nginx.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
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

# Upload configuration to server
scp nginx.conf $SERVER_USER@$SERVER_IP:/etc/nginx/sites-available/greenroasteries

# SSH into server and apply configuration
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
ln -sf /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
ENDSSH

# Clean up local file
rm nginx.conf 