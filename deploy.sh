#!/bin/bash

# Deployment script for Green Roasteries website
# This script deploys the website updates to the production server

# Variables
SERVER_IP="167.235.137.52"
SERVER_USER="root"
REMOTE_DIR="/root/greenroasteries-website"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment to server: $SERVER_IP"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Make sure you're in the website root directory."
  exit 1
fi

# Create a deployment package
echo "📦 Creating deployment package..."
DEPLOY_PACKAGE="deploy-$(date +%Y%m%d%H%M%S).tar.gz"
tar --exclude="node_modules" --exclude=".next" --exclude="deploy-*.tar.gz" -czf $DEPLOY_PACKAGE .

# Upload the deployment package to the server
echo "📤 Uploading package to server..."
scp $DEPLOY_PACKAGE $SERVER_USER@$SERVER_IP:~/ || { echo "❌ Upload failed"; exit 1; }

# Connect to the server and deploy
echo "🔄 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
  # Check if remote directory exists
  if [ ! -d "$REMOTE_DIR" ]; then
    echo "Creating remote directory..."
    mkdir -p $REMOTE_DIR
  fi

  # Extract the deployment package
  echo "Extracting deployment package..."
  tar -xzf ~/$DEPLOY_PACKAGE -C $REMOTE_DIR

  # Go to the website directory
  cd $REMOTE_DIR

  # Check if Docker Compose file exists
  if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Creating Docker Compose file..."
    cat > $DOCKER_COMPOSE_FILE << 'DOCKERCOMPOSE'
version: '3.8'

services:
  db:
    image: postgres:14
    container_name: greenroasteries-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: greenroasteries
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - greenroasteries-network

  website:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: greenroasteries-website
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
      - NODE_ENV=production
    networks:
      - greenroasteries-network

networks:
  greenroasteries-network:
    driver: bridge

volumes:
  pgdata:
DOCKERCOMPOSE
  fi

  # Create or update Dockerfile if it doesn't exist
  if [ ! -f "Dockerfile" ]; then
    echo "Creating Dockerfile..."
    cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Run the application
CMD ["npm", "start"]
DOCKERFILE
  fi

  # Build and restart the containers
  echo "Building and starting Docker containers..."
  docker-compose down
  docker-compose build
  docker-compose up -d

  # Show container status
  docker ps

  # Clean up
  echo "Cleaning up..."
  rm ~/$DEPLOY_PACKAGE
EOF

# Clean up local deployment package
echo "🧹 Cleaning up local files..."
rm $DEPLOY_PACKAGE

echo "✅ Deployment completed successfully!"
echo "🌐 Website should be available at http://$SERVER_IP:3000" 