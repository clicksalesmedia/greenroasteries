#!/bin/bash
set -e

echo "Building and deploying Green Roasteries website..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker to continue."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker to continue."
    exit 1
fi

# Build and deploy with docker-compose
echo "Building Docker images..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up -d

echo "Deployment complete! The website should be accessible at http://localhost:3001"
echo "Database is running at localhost:5432"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop the deployment, run: docker-compose down" 