# Green Roasteries Backup System

## Overview

This automated backup system creates daily backups of your Green Roasteries website and database, with automatic cleanup of old backups after 7 days.

## Components

- **backup-system.sh** - Creates daily backups of database and website files
- **restore-system.sh** - Restores from backups with safety checks
- **Cron Job** - Runs daily backups automatically at 2:00 AM

## Backup Schedule

- **Daily Backups**: Every day at 2:00 AM
- **Retention**: 7 days (older backups are automatically deleted)
- **Location**: `/var/www/greenroasteries/backups/`

## What Gets Backed Up

### Database Backup
- Complete PostgreSQL database dump
- Compressed with gzip for space efficiency
- Named: `db_backup_YYYYMMDD_HHMMSS.sql.gz`

### Website Backup
- All website files from `/var/www/greenroasteries/`
- Excludes: `node_modules`, `.next`, `backups`, `logs`, `.git`, temp files
- Named: `website_backup_YYYYMMDD_HHMMSS.tar.gz`

## Manual Backup

To create a backup manually:

```bash
sudo /var/www/greenroasteries/scripts/backup-system.sh
```

## Restore Options

### 1. List Available Backups

```bash
sudo /var/www/greenroasteries/scripts/restore-system.sh --list
```

### 2. Restore Database Only

```bash
sudo /var/www/greenroasteries/scripts/restore-system.sh --database /var/www/greenroasteries/backups/db_backup_20250705_165813.sql.gz
```

### 3. Restore Website Only

```bash
sudo /var/www/greenroasteries/scripts/restore-system.sh --website /var/www/greenroasteries/backups/website_backup_20250705_165813.tar.gz
```

### 4. Restore Both (Complete Restore)

```bash
sudo /var/www/greenroasteries/scripts/restore-system.sh --all 20250705_165813
```

## Safety Features

- **Pre-restore Backup**: Before any restore, the current state is backed up
- **Confirmation Required**: All restore operations require explicit confirmation
- **Automatic Rollback**: If restore fails, attempts to restore previous state
- **Application Management**: Automatically stops/starts PM2 during restore

## Monitoring

### Backup Logs
- Main log: `/var/www/greenroasteries/backups/backup.log`
- Cron log: `/var/www/greenroasteries/backups/cron.log`

### Check Backup Status
```bash
tail -f /var/www/greenroasteries/backups/backup.log
```

### Check Cron Job
```bash
crontab -l
```

## Disk Space Management

- Backups are automatically cleaned up after 7 days
- Database backups are compressed to save space
- System warns if less than 1GB free space available

## Emergency Procedures

### If Backup Fails
1. Check logs: `cat /var/www/greenroasteries/backups/backup.log`
2. Ensure PostgreSQL is running: `systemctl status postgresql`
3. Check disk space: `df -h /var/www/greenroasteries/backups/`
4. Run manual backup to test: `sudo /var/www/greenroasteries/scripts/backup-system.sh`

### If Restore Fails
1. The system automatically attempts to restore the pre-restore backup
2. Check logs: `cat /var/www/greenroasteries/backups/restore.log`
3. Manually restart application if needed: `pm2 restart greenroasteries`

## Configuration

Edit the scripts to modify:
- **Retention Period**: Change `RETENTION_DAYS=7` in backup-system.sh
- **Backup Time**: Modify cron job with `crontab -e`
- **Database Credentials**: Update DB_* variables in both scripts

## Best Practices

1. **Test Restores**: Periodically test restore procedures
2. **Monitor Space**: Keep an eye on backup directory disk usage
3. **Verify Backups**: Check backup integrity regularly
4. **Off-site Backups**: Consider additional off-site backup solution

## Support

For issues or modifications, contact your system administrator.

## File Locations

- Scripts: `/var/www/greenroasteries/scripts/`
- Backups: `/var/www/greenroasteries/backups/`
- Logs: `/var/www/greenroasteries/backups/*.log`
- Cron: `crontab -l` to view schedule 