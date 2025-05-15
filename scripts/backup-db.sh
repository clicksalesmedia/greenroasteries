#!/bin/bash

# Database backup script for Green Roasteries website
# This script creates a database backup from the PostgreSQL container

# Set variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="greenroasteries_db_backup_$TIMESTAMP.sql"
CONTAINER_NAME="greenroasteries-db"
DB_NAME="greenroasteries"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Check if Docker container is running
if docker ps | grep -q $CONTAINER_NAME; then
    # Run pg_dump inside the container
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/$BACKUP_FILENAME"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILENAME"
    
    echo "Backup created successfully: $BACKUP_DIR/${BACKUP_FILENAME}.gz"
    echo "Backup size: $(du -h "$BACKUP_DIR/${BACKUP_FILENAME}.gz" | cut -f1)"
else
    echo "Error: Docker container '$CONTAINER_NAME' is not running."
    echo "Please start the container using 'docker-compose up -d' first."
    exit 1
fi 