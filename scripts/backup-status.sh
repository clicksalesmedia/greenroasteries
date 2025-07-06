#!/bin/bash

# Green Roasteries Backup Status Checker
# This script shows the current backup status and recent backups

# Configuration
BACKUP_DIR="/var/www/greenroasteries/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Green Roasteries Backup Status     ${NC}"
echo -e "${BLUE}======================================${NC}"
echo

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}ERROR: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Show disk usage
echo -e "${GREEN}Disk Usage:${NC}"
df -h "$BACKUP_DIR" | tail -1 | awk '{print "  Available: " $4 " / Used: " $3 " (" $5 ")"}'
echo

# Show backup directory size
backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo -e "${GREEN}Backup Directory Size:${NC} $backup_size"
echo

# Show recent database backups
echo -e "${GREEN}Recent Database Backups (last 5):${NC}"
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -nr | head -5 | while read timestamp file; do
    if [ -n "$timestamp" ]; then
        date=$(date -d "@$timestamp" '+%Y-%m-%d %H:%M:%S')
        size=$(stat -c%s "$file" 2>/dev/null | numfmt --to=iec 2>/dev/null || echo "Unknown")
        basename=$(basename "$file")
        echo "  $basename ($date, $size)"
    fi
done
echo

# Show recent website backups
echo -e "${GREEN}Recent Website Backups (last 5):${NC}"
find "$BACKUP_DIR" -name "website_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -nr | head -5 | while read timestamp file; do
    if [ -n "$timestamp" ]; then
        date=$(date -d "@$timestamp" '+%Y-%m-%d %H:%M:%S')
        size=$(stat -c%s "$file" 2>/dev/null | numfmt --to=iec 2>/dev/null || echo "Unknown")
        basename=$(basename "$file")
        echo "  $basename ($date, $size)"
    fi
done
echo

# Show cron job status
echo -e "${GREEN}Cron Job Status:${NC}"
cron_job=$(crontab -l 2>/dev/null | grep backup-system.sh)
if [ -n "$cron_job" ]; then
    echo -e "  ${GREEN}✓ Active:${NC} $cron_job"
else
    echo -e "  ${RED}✗ Not found${NC}"
fi
echo

# Show last backup log entries
echo -e "${GREEN}Last Backup Log Entries:${NC}"
if [ -f "$BACKUP_DIR/backup.log" ]; then
    tail -10 "$BACKUP_DIR/backup.log" | sed 's/^/  /'
else
    echo "  No backup log found"
fi
echo

# Show backup count by type
db_count=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | wc -l)
website_count=$(find "$BACKUP_DIR" -name "website_backup_*.tar.gz" -type f | wc -l)

echo -e "${GREEN}Backup Summary:${NC}"
echo "  Database backups: $db_count"
echo "  Website backups: $website_count"
echo

# Check if backups are recent (within 25 hours)
latest_db=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -printf '%T@\n' | sort -nr | head -1 | cut -d. -f1)
latest_website=$(find "$BACKUP_DIR" -name "website_backup_*.tar.gz" -type f -printf '%T@\n' | sort -nr | head -1 | cut -d. -f1)

current_time=$(date +%s)
one_day_ago=$((current_time - 86400 - 3600)) # 25 hours ago

echo -e "${GREEN}Backup Freshness:${NC}"
if [ -n "$latest_db" ] && [ "$latest_db" -gt "$one_day_ago" ]; then
    echo -e "  Database: ${GREEN}✓ Recent${NC}"
else
    echo -e "  Database: ${RED}✗ Old or missing${NC}"
fi

if [ -n "$latest_website" ] && [ "$latest_website" -gt "$one_day_ago" ]; then
    echo -e "  Website: ${GREEN}✓ Recent${NC}"
else
    echo -e "  Website: ${RED}✗ Old or missing${NC}"
fi

echo
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}Commands:${NC}"
echo -e "  List all backups: ${BLUE}./restore-system.sh --list${NC}"
echo -e "  Manual backup: ${BLUE}./backup-system.sh${NC}"
echo -e "  View logs: ${BLUE}tail -f $BACKUP_DIR/backup.log${NC}"
echo -e "${BLUE}======================================${NC}" 