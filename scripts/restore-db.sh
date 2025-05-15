#!/bin/bash

# Database restore script for Green Roasteries website
# This script restores a database backup to the PostgreSQL container

# Default variables
BACKUP_DIR="./backups"
CONTAINER_NAME="greenroasteries-db"
DB_NAME="greenroasteries"
DB_USER="postgres"

# Check if filename is provided
if [ $# -eq 0 ]; then
    echo "Error: No backup file specified."
    echo "Usage: $0 <backup_filename>"
    echo "Available backups:"
    ls -lh $BACKUP_DIR | grep .gz
    exit 1
fi

BACKUP_FILE=$1

# If only filename is provided without path, assume it's in the backups directory
if [[ $BACKUP_FILE != */* ]]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

echo "Starting database restore..."

# Check if Docker container is running
if docker ps | grep -q $CONTAINER_NAME; then
    # If file is compressed, uncompress it first
    if [[ $BACKUP_FILE == *.gz ]]; then
        echo "Uncompressing backup file..."
        gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
        BACKUP_FILE="${BACKUP_FILE%.gz}"
    fi
    
    # Confirm before proceeding
    echo "WARNING: This will overwrite the current database. All current data will be lost."
    read -p "Are you sure you want to proceed? (y/n): " confirm
    
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo "Restoring database from $BACKUP_FILE..."
        
        # Restore the database
        cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
        
        echo "Database restored successfully."
    else
        echo "Restore operation cancelled."
    fi
    
    # Clean up uncompressed file if we created it
    if [[ $1 == *.gz && -f "${BACKUP_FILE}" && "$BACKUP_FILE" != "$1" ]]; then
        rm "${BACKUP_FILE}"
    fi
else
    echo "Error: Docker container '$CONTAINER_NAME' is not running."
    echo "Please start the container using 'docker-compose up -d' first."
    exit 1
fi 