#!/bin/bash

# Scheduled database backup script for Green Roasteries website
# This script creates a database backup and manages backup rotation
# Recommended usage: Set up a cron job to run this script regularly
# Example cron entry (daily at 3 AM):
# 0 3 * * * /path/to/project/scripts/scheduled-backup.sh >> /path/to/project/backups/backup.log 2>&1

# Set variables
BACKUP_DIR="$(dirname "$(dirname "$0")")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="greenroasteries_db_backup_$TIMESTAMP.sql"
CONTAINER_NAME="greenroasteries-db"
DB_NAME="greenroasteries"
DB_USER="postgres"
MAX_BACKUPS=7  # Keep last 7 backups by default

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "==== Backup started at $(date) ===="

# Check if Docker container is running
if docker ps | grep -q $CONTAINER_NAME; then
    # Run pg_dump inside the container
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/$BACKUP_FILENAME"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        # Compress the backup
        gzip "$BACKUP_DIR/$BACKUP_FILENAME"
        
        echo "Backup created successfully: $BACKUP_DIR/${BACKUP_FILENAME}.gz"
        echo "Backup size: $(du -h "$BACKUP_DIR/${BACKUP_FILENAME}.gz" | cut -f1)"
        
        # Backup rotation - remove old backups if we have more than MAX_BACKUPS
        BACKUP_COUNT=$(ls -1 $BACKUP_DIR/greenroasteries_db_backup_*.sql.gz 2>/dev/null | wc -l)
        if [ $BACKUP_COUNT -gt $MAX_BACKUPS ]; then
            echo "Performing backup rotation (keeping last $MAX_BACKUPS backups)..."
            ls -1t $BACKUP_DIR/greenroasteries_db_backup_*.sql.gz | tail -n +$(($MAX_BACKUPS+1)) | xargs rm -f
            echo "Removed $(($BACKUP_COUNT-$MAX_BACKUPS)) old backup(s)"
        fi
    else
        echo "Error: Database backup failed"
    fi
else
    echo "Error: Docker container '$CONTAINER_NAME' is not running."
fi

echo "==== Backup finished at $(date) ===="
echo "" 