#!/bin/bash

# Server details
SERVER_IP="167.235.137.52"
SERVER_USER="root"
SERVER_DIR="/var/www/greenroasteries"

echo "Restoring previous working container setup..."

ssh $SERVER_USER@$SERVER_IP << EOF
  cd $SERVER_DIR
  
  # Stop any running containers
  echo "Stopping any running containers..."
  docker-compose down --remove-orphans || true
  
  # Clean up all containers with greenroasteries in the name
  echo "Cleaning up all greenroasteries containers..."
  for container in \$(docker ps -a --format '{{.Names}}' | grep -E 'greenroasteries|roasteries'); do
    echo "Removing container: \$container"
    docker rm -f \$container 2>/dev/null || true
  done
  
  # Create docker-compose.yml with the original working configuration
  echo "Creating docker-compose.yml with the original working configuration..."
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

  # Create Dockerfile with the working configuration
  echo "Creating Dockerfile with the working configuration..."
  cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN mkdir -p prisma
RUN echo 'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}' > prisma/schema.prisma
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
  cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://postgres:postgres@db:5432/greenroasteries
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
ENVFILE

  # Rebuild and start containers
  echo "Rebuilding and starting containers..."
  docker-compose build --no-cache
  docker-compose up -d
  
  # Wait for containers to start
  echo "Waiting for containers to start..."
  sleep 20
  
  # Check container status
  echo "Container status:"
  docker ps
  
  echo "Restoration completed."
EOF

echo "Checking if the website is back online..."
if curl -s --head --request GET https://thegreenroasteries.com | grep "200 OK" > /dev/null; then
  echo "Website is back online!"
else
  echo "Website may still be offline. Please check manually at https://thegreenroasteries.com"
fi

echo "Restoration process completed." 