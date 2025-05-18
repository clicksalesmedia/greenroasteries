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
  log "step" "Starting deployment of latest code..."
  
  # 1. Create deployment package
  log "step" "Creating deployment package..."
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  PACKAGE_NAME="website-update-$TIMESTAMP.tar.gz"
  
  # Create deployment package excluding unnecessary files
  log "info" "Packaging local codebase (excluding node_modules, .next, etc.)..."
  tar --exclude="node_modules" \
      --exclude=".next" \
      --exclude=".git" \
      --exclude="website-update-*.tar.gz" \
      --exclude="*.log" \
      -czf $PACKAGE_NAME . || {
    log "error" "Failed to create deployment package"
    exit 1
  }
  
  log "success" "Deployment package created: $PACKAGE_NAME"
  
  # 2. Upload to server
  log "step" "Uploading package to server..."
  
  # Check if the package exists
  if [ ! -f "$PACKAGE_NAME" ]; then
    log "error" "Package $PACKAGE_NAME not found"
    exit 1
  fi
  
  # Upload the package
  log "info" "Uploading package to server (this may take a few minutes)..."
  scp $PACKAGE_NAME $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ || {
    log "error" "Failed to upload package to server"
    exit 1
  }
  
  log "success" "Package uploaded successfully"
  
  # 3. Extract and deploy on server
  log "step" "Deploying latest code on server..."
  
  ssh $SERVER_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR
    
    # Create a backup of important files
    echo "Creating backup of current files..."
    mkdir -p backups
    cp -f docker-compose.yml backups/docker-compose.yml.bak || true
    cp -f Dockerfile backups/Dockerfile.bak || true
    cp -f .env backups/.env.bak || true
    
    # Extract the package
    echo "Extracting updated codebase..."
    tar -xzf $PACKAGE_NAME || {
      echo "Failed to extract the package"
      exit 1
    }
    
    # Preserve Prisma schema and Docker configuration (if needed)
    echo "Ensuring Prisma schema exists..."
    if [ ! -f "prisma/schema.prisma" ]; then
      echo "Prisma schema not found in uploaded package, restoring from existing..."
      cp -f backups/schema.prisma prisma/schema.prisma 2>/dev/null || {
        # Create minimal schema if backup doesn't exist
        mkdir -p prisma
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
      }
    fi
    
    # Create/update the .env file
    echo "Setting up environment variables..."
    cat > .env << 'ENV_FILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
ENV_FILE
    
    # Check and update Docker configuration if needed
    if ! grep -q "greenroasteries-app" docker-compose.yml 2>/dev/null; then
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
    fi
    
    # Update Dockerfile to handle Prisma properly
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
    
    # Stop and remove existing containers
    echo "Stopping existing containers..."
    docker-compose down
    
    # Clean up any old containers with old naming
    echo "Cleaning up old containers..."
    docker ps -a | grep -E 'cool_mccarthy|loving_blackburn|kind_noyce' | awk '{print \$1}' | xargs -r docker rm -f
    
    # Rebuild and start containers with new code
    echo "Building and starting containers with latest code..."
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for containers to start
    echo "Waiting for containers to start..."
    sleep 30
    
    # Show container status
    echo "Current container status:"
    docker ps
    
    # Show application logs
    echo "Application logs:"
    docker logs greenroasteries-app 2>&1 | tail -n 30 || echo "No app container logs available"
    
    # Clean up the package to save space
    echo "Cleaning up..."
    rm -f $PACKAGE_NAME
    
    echo "Deployment completed!"
EOF
  
  # 4. Clean up local package
  log "step" "Cleaning up local files..."
  rm -f $PACKAGE_NAME
  
  log "success" "Latest code deployed successfully!"
  log "info" "Website with your latest changes should now be available at https://thegreenroasteries.com"
}

# Run the main function
main 