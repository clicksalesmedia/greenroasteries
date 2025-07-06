#!/bin/bash

# Green Roasteries Backup System
# This script creates daily backups of website and database

# Configuration
PROJECT_NAME="greenroasteries"
PROJECT_DIR="/var/www/greenroasteries"
BACKUP_DIR="/var/www/greenroasteries/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=7

# Database Configuration
DB_NAME="greenroasteries"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$BACKUP_DIR/backup.log"
}

# Function to create database backup
backup_database() {
    log "Starting database backup..."
    
    # Set PGPASSWORD environment variable (you may need to adjust this)
    export PGPASSWORD="postgres"
    
    DB_BACKUP_FILE="$BACKUP_DIR/db_backup_${DATE}.sql"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$DB_BACKUP_FILE"; then
        log "Database backup completed: $DB_BACKUP_FILE"
        
        # Compress the database backup
        if gzip "$DB_BACKUP_FILE"; then
            log "Database backup compressed: ${DB_BACKUP_FILE}.gz"
            DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"
        else
            log "WARNING: Database backup compression failed"
        fi
    else
        log "ERROR: Database backup failed"
        return 1
    fi
    
    unset PGPASSWORD
}

# Function to create website files backup
backup_website() {
    log "Starting website files backup..."
    
    WEBSITE_BACKUP_FILE="$BACKUP_DIR/website_backup_${DATE}.tar.gz"
    
    # Exclude unnecessary files and directories
    tar -czf "$WEBSITE_BACKUP_FILE" \
        --exclude="node_modules" \
        --exclude=".next" \
        --exclude="backups" \
        --exclude="logs" \
        --exclude="*.log" \
        --exclude=".git" \
        --exclude="tmp" \
        --exclude="temp" \
        -C "$(dirname "$PROJECT_DIR")" \
        "$(basename "$PROJECT_DIR")"
    
    if [ $? -eq 0 ]; then
        log "Website backup completed: $WEBSITE_BACKUP_FILE"
    else
        log "ERROR: Website backup failed"
        return 1
    fi
}



# Function to clean old backups
cleanup_old_backups() {
    log "Starting cleanup of old backups (older than $RETENTION_DAYS days)..."
    
    # Remove database backups older than retention period
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "db_backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete
    
    # Remove website backups older than retention period
    find "$BACKUP_DIR" -name "website_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Cleanup completed"
}

# Function to check backup integrity
check_backup_integrity() {
    log "Checking backup integrity..."
    
    # Check if backup files exist and are not empty
    for file in "$BACKUP_DIR"/*_backup_${DATE}.*; do
        if [ -f "$file" ]; then
            size=$(stat -c%s "$file")
            if [ $size -gt 0 ]; then
                log "✓ $file ($size bytes)"
            else
                log "✗ $file is empty"
            fi
        fi
    done
}

# Function to send backup notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    log "Backup $status: $message"
    
    # You can add email notification here if needed
    # echo "$message" | mail -s "Green Roasteries Backup $status" your-email@domain.com
}

# Main backup function
main() {
    log "========================================"
    log "Starting backup process for $PROJECT_NAME"
    log "========================================"
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log "ERROR: Project directory not found: $PROJECT_DIR"
        send_notification "FAILED" "Project directory not found"
        exit 1
    fi
    
    # Check available disk space
    available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ $available_space -lt 1000000 ]; then  # Less than 1GB
        log "WARNING: Low disk space available: ${available_space}KB"
    fi
    
    # Perform backups
    backup_database
    backup_website
    
    # Check backup integrity
    check_backup_integrity
    
    # Clean old backups
    cleanup_old_backups
    
    log "========================================"
    log "Backup process completed for $PROJECT_NAME"
    log "========================================"
    
    send_notification "SUCCESS" "Daily backup completed successfully"
}

# Run the main function
main "$@" 