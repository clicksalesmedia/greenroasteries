#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"
DOMAIN="thegreenroasteries.com"
EMAIL="info@thegreenroasteries.com"  # For Let's Encrypt notifications

# SSH into server and setup SSL
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Install Certbot and Nginx plugin
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
systemctl stop nginx

# Get SSL certificate
certbot certonly --standalone \
    -d thegreenroasteries.com \
    -d www.thegreenroasteries.com \
    --non-interactive \
    --agree-tos \
    --email info@thegreenroasteries.com

# Update Nginx configuration with SSL
cat > /etc/nginx/sites-available/greenroasteries << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    ssl_certificate /etc/letsencrypt/live/thegreenroasteries.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thegreenroasteries.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/thegreenroasteries.com/chain.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 1.0.0.1 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Security headers
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

# Test Nginx configuration
nginx -t

# Start Nginx
systemctl start nginx

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Show status
echo "=== SSL Certificate Info ==="
certbot certificates
echo "=== Nginx Status ==="
systemctl status nginx
ENDSSH 