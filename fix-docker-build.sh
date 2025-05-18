#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_PASSWORD="TpFdwT2XKZ7UuF1jF8"
REMOTE_DIR="/var/www/greenroasteries"

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
    "step")
      echo -e "${CYAN}[STEP]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Main function
main() {
  log "step" "Starting Docker build and Nginx fix..."
  
  # SSH into the server and update the Dockerfile
  log "step" "Updating Dockerfile on server..."
  
  ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd /var/www/greenroasteries
    
    # Create prisma directory and schema
    echo "Setting up Prisma schema..."
    mkdir -p prisma
    
    # Create schema.prisma file
    cat > prisma/schema.prisma << 'PRISMA_SCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      String   @default("CUSTOMER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
PRISMA_SCHEMA
    
    # Update the Dockerfile to handle Prisma better
    echo "Updating Dockerfile..."
    cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and create prisma directory
COPY package.json package-lock.json* ./
RUN mkdir -p prisma

# Create minimal schema for build
RUN echo 'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}' > prisma/schema.prisma

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Add migration step before starting the application
CMD npx prisma generate && npx prisma migrate deploy && node server.js
DOCKERFILE
    
    # Update docker-compose.yml
    echo "Updating docker-compose.yml..."
    cat > docker-compose.yml << 'DOCKER_COMPOSE'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: greenroasteries-app
    restart: always
    ports:
      - "3001:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
      - JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    networks:
      - greenroasteries-network

  db:
    image: postgres:16-alpine
    container_name: greenroasteries-db
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=greenroasteries
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - greenroasteries-network

volumes:
  postgres_data:
    name: greenroasteries-data

networks:
  greenroasteries-network:
    name: greenroasteries-network
DOCKER_COMPOSE
    
    # Update Nginx configuration
    echo "Updating Nginx configuration..."
    cat > /etc/nginx/sites-available/default << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name thegreenroasteries.com www.thegreenroasteries.com 167.235.137.52;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    access_log /var/log/nginx/greenroasteries.access.log;
    error_log /var/log/nginx/greenroasteries.error.log;
}
NGINX_CONF
    
    # Test Nginx configuration
    echo "Testing Nginx configuration..."
    nginx -t
    
    # Create .env file with required variables
    echo "Creating .env file..."
    cat > .env << 'ENV_FILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
ENV_FILE
    
    # Remove any existing containers
    echo "Stopping existing containers..."
    docker-compose down
    
    # Remove any old containers with non-standard names
    echo "Cleaning up old containers..."
    docker ps -a | grep -E 'cool_mccarthy|loving_blackburn|kind_noyce' | awk '{print $1}' | xargs -r docker rm -f
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 30
    
    # Check container status
    echo "Container status:"
    docker ps
    
    # Check logs
    echo "App container logs:"
    docker logs greenroasteries-app 2>&1 | tail -n 50 || echo "No app container logs available"
    
    # Restart Nginx
    echo "Restarting Nginx..."
    systemctl restart nginx
    
    # Check if site is accessible
    echo "Testing site accessibility:"
    curl -I localhost:3001 || echo "Site not available on port 3001"
    
    # Check Nginx error logs
    echo "Nginx error logs:"
    tail -n 20 /var/log/nginx/error.log
EOF
  
  log "success" "Docker build and Nginx configuration updated!"
  log "info" "Please check if the website is now accessible at https://thegreenroasteries.com"
  log "info" "If the issue persists, please check the server logs for more details."
}

# Run the main function
main 