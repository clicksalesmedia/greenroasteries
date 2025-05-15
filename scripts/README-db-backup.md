# Database Backup and Restore

This directory contains scripts for backing up and restoring the Green Roasteries PostgreSQL database.

## Prerequisites

- Docker and Docker Compose must be installed and running
- The database container (`greenroasteries-db`) must be running

## Backup Script

The `backup-db.sh` script creates a backup of the PostgreSQL database.

### Usage

```bash
./scripts/backup-db.sh
```

This will:
1. Create a `backups` directory if it doesn't exist
2. Generate a timestamped backup file (e.g., `greenroasteries_db_backup_20240615_123045.sql.gz`)
3. Save the compressed backup in the `backups` directory

## Restore Script

The `restore-db.sh` script restores a backup to the PostgreSQL database.

### Usage

```bash
./scripts/restore-db.sh <backup_filename>
```

For example:
```bash
./scripts/restore-db.sh greenroasteries_db_backup_20240615_123045.sql.gz
```

This will:
1. Check if the specified backup file exists
2. Uncompress the backup file if it's compressed
3. Prompt for confirmation before overwriting the existing database
4. Restore the database from the backup file

## Scheduled Backup Script

The `scheduled-backup.sh` script is designed to be run as a cron job for automatic backups.

### Features

- Creates timestamped database backups
- Includes backup rotation (keeps the most recent 7 backups by default)
- Logs backup activities

### Setting up a Cron Job

To run daily backups at 3:00 AM:

1. Edit your crontab:
   ```bash
   crontab -e
   ```

2. Add the following line (adjust paths as needed):
   ```
   0 3 * * * /full/path/to/greenroasteries/website/scripts/scheduled-backup.sh >> /full/path/to/greenroasteries/website/backups/backup.log 2>&1
   ```

3. Save and exit

## Important Notes

- **Backups are stored in the `./backups` directory by default**
- **Restoring will overwrite the current database completely**
- Both scripts check if the database container is running before attempting operations
- You can view available backups by running the restore script without arguments 