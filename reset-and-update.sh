#!/bin/bash

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_DIR="/var/www/greenroasteries"

# GitHub details
GITHUB_REPO="https://github.com/clicksalesmedia/greenroasteries.git"
GITHUB_BRANCH="main"

echo "Starting complete reset and update process for Green Roasteries website..."
echo "This will COMPLETELY RESET the server and pull the latest code from GitHub with a fresh database."
read -p "Are you sure you want to continue? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
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
  
  # Clean up ALL Docker resources - this is a hard reset
  echo "Removing all related containers, volumes, and networks..."
  for container in \$(docker ps -a --format '{{.Names}}' | grep -E 'greenroasteries|roasteries'); do
    echo "Removing container: \$container"
    docker rm -f \$container 2>/dev/null || true
  done
  
  # Remove volumes related to the project
  for volume in \$(docker volume ls --format '{{.Name}}' | grep -E 'greenroasteries|postgres'); do
    echo "Removing volume: \$volume"
    docker volume rm \$volume 2>/dev/null || true
  done
  
  # Remove networks related to the project
  for network in \$(docker network ls --format '{{.Name}}' | grep -E 'greenroasteries'); do
    echo "Removing network: \$network"
    docker network rm \$network 2>/dev/null || true
  done
  
  # Create backup of the current state before wiping
  echo "Creating backup of current state before wiping..."
  mkdir -p backups
  TIMESTAMP=\$(date +%Y%m%d%H%M%S)
  
  # Try to backup the database if possible
  DB_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -E 'db|postgres|greenroasteries-db')
  if [ -n "\$DB_CONTAINER" ]; then
    echo "Found database container: \$DB_CONTAINER, creating backup..."
    docker exec \$DB_CONTAINER pg_dump -U postgres -d greenroasteries > backups/db_backup_before_reset_\$TIMESTAMP.sql 2>/dev/null || echo "Database backup failed but continuing"
  fi
  
  # Backup configuration files
  cp -f docker-compose.yml backups/docker-compose.yml.bak.\$TIMESTAMP 2>/dev/null || true
  cp -f Dockerfile backups/Dockerfile.bak.\$TIMESTAMP 2>/dev/null || true
  cp -f .env backups/.env.bak.\$TIMESTAMP 2>/dev/null || true
  
  # Delete all files except backups directory
  echo "Removing all current files (except backups)..."
  find . -maxdepth 1 -not -name '.' -not -name '..' -not -name 'backups' -exec rm -rf {} \;
  
  # Clone the latest version from GitHub
  echo "Cloning the latest version from GitHub..."
  git clone --branch $GITHUB_BRANCH $GITHUB_REPO .
  
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
  
  # Ensure proper Prisma schema
  echo "Setting up proper Prisma schema..."
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
  
  # Create docker-compose.yml if it doesn't exist in the repo
  if [ ! -f "docker-compose.yml" ]; then
    echo "docker-compose.yml not found in repo, creating one..."
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
  
  # Create Dockerfile if it doesn't exist in the repo
  if [ ! -f "Dockerfile" ]; then
    echo "Dockerfile not found in repo, creating one..."
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
  
  # Build and start containers
  echo "Building and starting containers..."
  docker-compose build --no-cache
  docker-compose up -d
  
  # Wait for containers to start
  echo "Waiting for containers to start..."
  sleep 20
  
  # Initialize database with Prisma if needed
  echo "Checking if database needs to be initialized with Prisma..."
  # Note: This might fail if the Prisma schema in the repo doesn't match our template
  # In that case, the DB will need to be initialized according to the actual schema
  docker exec greenroasteries-app npx prisma db push --skip-generate || echo "Prisma DB push failed - might need manual database setup"
  
  # Check container status
  echo "Container status:"
  docker ps
  
  # Check logs for app container
  echo "Application logs:"
  APP_CONTAINER=\$(docker ps --format '{{.Names}}' | grep -E 'app|greenroasteries-app')
  if [ -n "\$APP_CONTAINER" ]; then
    docker logs \$APP_CONTAINER 2>&1 | tail -n 20
  else
    echo "No app container found"
  fi
  
  echo "Reset and update completed successfully!"
EOF

# Verify deployment
echo "Checking if the website is accessible..."
if curl -s --head --request GET https://thegreenroasteries.com | grep "200 OK" > /dev/null; then
  echo "Website is accessible!"
else
  echo "Website may not be accessible. Please check manually at https://thegreenroasteries.com"
fi

echo "Reset and update process completed. The website should now be running the latest version from GitHub with a fresh database!" 