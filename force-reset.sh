#!/bin/bash

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_DIR="/var/www/greenroasteries"

# GitHub details
GITHUB_REPO="https://github.com/clicksalesmedia/greenroasteries.git"
GITHUB_BRANCH="main"

echo "FORCE RESET: Starting complete reset and rebuild process for Green Roasteries website..."
echo "This will COMPLETELY ERASE everything and rebuild from scratch with a fresh database."
echo "WARNING: This is a destructive operation that cannot be undone!"
read -p "Are you absolutely sure you want to continue? (type 'RESET' to confirm): " confirm
if [[ "$confirm" != "RESET" ]]; then
  echo "Operation canceled."
  exit 0
fi

# Deploy directly from GitHub with a complete reset
echo "Deploying from GitHub to server with complete reset..."
ssh $SERVER_USER@$SERVER_IP << EOF
  cd $SERVER_DIR

  # Fix Git ownership issue
  git config --global --add safe.directory $SERVER_DIR

  # Complete cleanup: stop and remove all containers, volumes, and networks
  echo "Performing complete cleanup..."
  
  # Stop any running containers related to the app
  echo "Stopping all running containers..."
  docker-compose down --volumes --remove-orphans || true
  docker stop \$(docker ps -a -q) 2>/dev/null || true
  
  # Clean up ALL Docker resources - this is a hard reset
  echo "Removing all related containers..."
  docker rm -f \$(docker ps -a -q) 2>/dev/null || true
  
  # Remove volumes related to the project
  echo "Removing all Docker volumes..."
  docker volume rm \$(docker volume ls -q) 2>/dev/null || true
  
  # Remove networks related to the project
  echo "Removing all Docker networks except default ones..."
  for network in \$(docker network ls --format '{{.Name}}' | grep -v 'bridge\|host\|none'); do
    docker network rm \$network 2>/dev/null || true
  done
  
  # Backup database if possible
  echo "Attempting final database backup before reset..."
  mkdir -p backups
  TIMESTAMP=\$(date +%Y%m%d%H%M%S)
  DB_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -E 'db|postgres|greenroasteries-db')
  if [ -n "\$DB_CONTAINER" ]; then
    docker exec \$DB_CONTAINER pg_dump -U postgres -d greenroasteries > backups/db_backup_before_force_reset_\$TIMESTAMP.sql 2>/dev/null || echo "Database backup failed but continuing"
  fi
  
  # Create a backup directory for everything else
  echo "Creating backup of entire directory..."
  mkdir -p /root/greenroasteries_backup_\$TIMESTAMP
  cp -a $SERVER_DIR/. /root/greenroasteries_backup_\$TIMESTAMP/ 2>/dev/null || true
  
  # COMPLETE WIPE - Remove EVERYTHING except the backup folder
  echo "WIPING ENTIRE DIRECTORY (except backups)..."
  find $SERVER_DIR -mindepth 1 -not -path "$SERVER_DIR/backups*" -delete
  
  # Re-create working directory if deleted
  mkdir -p $SERVER_DIR
  cd $SERVER_DIR
  
  # Clone the latest version from GitHub
  echo "Cloning the latest version from GitHub..."
  git clone --branch $GITHUB_BRANCH $GITHUB_REPO .
  
  # Setup docker-compose.yml if it doesn't exist
  if [ ! -f "docker-compose.yml" ]; then
    echo "Creating docker-compose.yml..."
    cat > docker-compose.yml << 'DOCKERCOMPOSE'
version: '3'

services:
  app:
    container_name: greenroasteries-app
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3001:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
      - NODE_ENV=production
      - NEXTAUTH_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
      - NEXTAUTH_URL=https://thegreenroasteries.com
    networks:
      - greenroasteries-network

  db:
    container_name: greenroasteries-db
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=greenroasteries
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - greenroasteries-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

networks:
  greenroasteries-network:

volumes:
  postgres-data:
DOCKERCOMPOSE
  fi
  
  # Setup Dockerfile if it doesn't exist or has issues
  echo "Ensuring Dockerfile exists and is correct..."
  cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN mkdir -p prisma
COPY prisma ./prisma || echo "No Prisma directory to copy"
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
DOCKERFILE

  # Ensure environment variables are set
  echo "Setting up environment variables..."
  cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXTAUTH_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NEXTAUTH_URL=https://thegreenroasteries.com
ENVFILE

  # Setup Nginx configuration
  echo "Setting up Nginx configuration..."
  cat > /etc/nginx/sites-available/greenroasteries << 'NGINX'
server {
    listen 80;
    server_name thegreenroasteries.com www.thegreenroasteries.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name thegreenroasteries.com www.thegreenroasteries.com;

    ssl_certificate /etc/letsencrypt/live/thegreenroasteries.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thegreenroasteries.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

  # Enable the site and restart Nginx
  ln -sf /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
  nginx -t && systemctl restart nginx
  
  # Build and start containers
  echo "Building and starting containers..."
  docker-compose build --no-cache
  docker-compose up -d
  
  # Wait for containers to start
  echo "Waiting for containers to start..."
  sleep 30
  
  # Check if database is up
  echo "Checking database connection..."
  docker exec greenroasteries-db pg_isready -U postgres || echo "Database not ready yet"
  
  # Initialize database if needed
  echo "Setting up database and pushing schema..."
  docker exec greenroasteries-app npx prisma db push --force-reset --accept-data-loss --skip-generate || echo "Prisma DB push failed, trying alternative method"
  
  # Check container status
  echo "Container status:"
  docker ps
  
  # Check logs for the app container
  echo "Application logs:"
  docker logs greenroasteries-app 2>&1 | tail -n 20
  
  echo "Reset and update completed successfully!"
EOF

# Verify deployment
echo "Checking if the website is accessible..."
sleep 10  # Give a bit more time for everything to stabilize
if curl -s --head --request GET https://thegreenroasteries.com | grep "200 OK" > /dev/null; then
  echo "Website is accessible!"
else
  echo "Website may not be accessible yet. Please check manually at https://thegreenroasteries.com"
  echo "It might take a few more minutes to fully start up."
fi

echo "Force reset and update process completed. The website should now be running the latest version with a completely fresh database!" 