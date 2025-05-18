#!/bin/bash

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_DIR="/var/www/greenroasteries"

# GitHub details
GITHUB_REPO="https://github.com/clicksalesmedia/greenroasteries.git"
GITHUB_BRANCH="main"

echo "Starting GitHub-based deployment for Green Roasteries website..."

# Prompt for GitHub token if private repo
read -p "Is this a private repository that requires authentication? (y/n): " needs_auth
if [[ "$needs_auth" =~ ^[Yy]$ ]]; then
  read -p "Enter GitHub Personal Access Token: " github_token
  GITHUB_REPO=$(echo $GITHUB_REPO | sed 's|https://|https://oauth2:'$github_token'@|')
fi

# Deploy directly from GitHub
echo "Deploying from GitHub to server..."
ssh $SERVER_USER@$SERVER_IP << EOF
  cd $SERVER_DIR

  # Fix Git ownership issue
  git config --global --add safe.directory $SERVER_DIR

  # Save running container names to check after deployment
  RUNNING_CONTAINERS=\$(docker ps --format '{{.Names}}' | grep 'greenroasteries\|roasteries')
  echo "Currently running containers: \$RUNNING_CONTAINERS"

  # Backup database
  echo "Creating database backup..."
  mkdir -p backups
  TIMESTAMP=\$(date +%Y%m%d%H%M%S)
  
  # Try to find the correct database container
  DB_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -E 'greenroasteries-db|db|postgres')
  if [ -n "\$DB_CONTAINER" ]; then
    echo "Found database container: \$DB_CONTAINER"
    docker exec \$DB_CONTAINER pg_dump -U postgres -d greenroasteries > backups/db_backup_\$TIMESTAMP.sql 2>/dev/null || echo "Database backup failed but continuing deployment"
  else
    echo "No database container found for backup, continuing deployment"
  fi
  
  # Create backups of important files
  echo "Creating backup of configuration files..."
  mkdir -p backups
  cp -f docker-compose.yml backups/docker-compose.yml.bak.\$TIMESTAMP 2>/dev/null || true
  cp -f Dockerfile backups/Dockerfile.bak.\$TIMESTAMP 2>/dev/null || true
  cp -f .env backups/.env.bak.\$TIMESTAMP 2>/dev/null || true
  
  # Clone or pull repository
  if [ -d ".git" ]; then
    echo "Git repository exists, pulling latest changes..."
    git fetch --all
    git reset --hard origin/$GITHUB_BRANCH
    git pull origin $GITHUB_BRANCH
  else
    echo "Cloning the repository..."
    # Move existing files to temporary location
    mkdir -p /tmp/greenroasteries_backup
    find . -maxdepth 1 -not -name '.' -not -name '..' -not -name 'backups' -not -name '.env' -exec mv {} /tmp/greenroasteries_backup/ \;
    
    # Clone repository
    git clone --branch $GITHUB_BRANCH $GITHUB_REPO .
    
    # Restore important files from backup
    cp -f /tmp/greenroasteries_backup/docker-compose.yml . 2>/dev/null || true
    cp -f /tmp/greenroasteries_backup/Dockerfile . 2>/dev/null || true
  fi
  
  # Ensure correct configuration
  echo "Setting up configuration..."
  
  # Ensure environment variables are set
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
  
  # Create proper Prisma schema
  mkdir -p prisma
  mkdir -p prisma/migrations
  
  cat > prisma/schema.prisma << 'PRISMAFILE'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
PRISMAFILE
  
  # Check if docker-compose.yml exists, if not create a basic one
  if [ ! -f "docker-compose.yml" ]; then
    echo "docker-compose.yml not found, creating a basic version..."
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
  
  # Update Dockerfile if needed
  if [ ! -f "Dockerfile" ]; then
    echo "Dockerfile not found, creating a basic Next.js Dockerfile..."
    cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
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
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
DOCKERFILE
  fi
  
  # Stop running containers - use docker-compose down with --remove-orphans
  echo "Stopping running containers..."
  docker-compose down --remove-orphans || true
  
  # Clean up old containers by the common names if they still exist
  echo "Cleaning up old containers by name pattern..."
  for container in \$(docker ps -a --format '{{.Names}}' | grep -E 'greenroasteries|roasteries'); do
    echo "Removing container: \$container"
    docker rm -f \$container 2>/dev/null || true
  done
  
  # Build and start containers
  echo "Building and starting containers..."
  docker-compose build --no-cache
  docker-compose up -d
  
  # Wait for containers to start
  echo "Waiting for containers to start..."
  sleep 20
  
  # Check container status
  echo "Container status:"
  docker ps
  
  # Check logs for app container - detect by name pattern
  echo "Application logs:"
  APP_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -E 'app|nextjs|greenroasteries-app')
  if [ -n "\$APP_CONTAINER" ]; then
    docker logs \$APP_CONTAINER 2>&1 | tail -n 20
  else
    echo "No app container found"
  fi
  
  echo "Deployment completed successfully!"
EOF

# Verify deployment
echo "Checking if the website is accessible..."
if curl -s --head --request GET https://thegreenroasteries.com | grep "200 OK" > /dev/null; then
  echo "Website is accessible!"
else
  echo "Website may not be accessible. Please check manually at https://thegreenroasteries.com"
fi

echo "Deployment process completed. The website should now be updated with the latest changes from GitHub!" 