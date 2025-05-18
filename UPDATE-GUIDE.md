# Green Roasteries Website Update Guide

This guide explains how to update the Green Roasteries website that is currently running on the Hetzner server.

## Prerequisites

- SSH access to the server (IP: 167.235.137.52)
- Root credentials (password: TpFdwT2XKZ7UuF1jF8)
- Local copy of the website codebase with your changes

## Automated Update Process

We've created an automated update script that handles the entire process. This script will:

1. Fix ESLint errors automatically
2. Create a backup of the current database
3. Build the application locally
4. Create a deployment package
5. Upload the package to the server
6. Extract and apply the update
7. Restart the Docker containers

### Running the Update Script

To update the website with your latest changes:

```bash
# Make sure you're in the website root directory
cd /path/to/greenroasteries/website

# Run the update script
./update-server.sh
```

The script will automatically handle everything and provide detailed feedback during the process.

## Manual Update Process (if needed)

If you need to update the website manually, follow these steps:

### 1. Fix ESLint Errors

```bash
npm run lint -- --fix
```

### 2. Build the Application

```bash
npm run build
```

### 3. Create a Deployment Package

```bash
tar --exclude="node_modules" --exclude=".next/cache" --exclude=".git" -czf website-update.tar.gz .
```

### 4. Upload the Package to the Server

```bash
scp website-update.tar.gz root@167.235.137.52:/var/www/greenroasteries/
```

### 5. SSH into the Server

```bash
ssh root@167.235.137.52
```

### 6. Extract and Apply the Update

```bash
cd /var/www/greenroasteries
tar -xzf website-update.tar.gz -C .
docker-compose down
docker-compose up --build -d
```

### 7. Verify the Update

Access the website at http://167.235.137.52:3001 to ensure everything is working correctly.

## Troubleshooting

### Database Issues

If you encounter database issues after an update:

1. Restore from the latest backup:

```bash
ssh root@167.235.137.52
cd /var/www/greenroasteries/backups
# Find the latest backup file
ls -la

# Restore the database
docker exec -i greenroasteries-db psql -U postgres greenroasteries < db_backup_YYYYMMDDHHMMSS.sql
```

### Docker Container Issues

If the Docker containers aren't starting properly:

```bash
ssh root@167.235.137.52
cd /var/www/greenroasteries
docker-compose logs
```

This will show you the logs from the containers to help diagnose the issue.

## Continuous Integration

For future updates, consider setting up a GitHub Actions workflow that automatically deploys changes when you push to the main branch. This can be done by:

1. Creating a GitHub repository for the codebase
2. Setting up a workflow file in `.github/workflows/deploy.yml`
3. Configuring the workflow to run the update script automatically

## Contact for Support

If you encounter any issues during the update process, please contact:

- Email: your-email@example.com
- Phone: your-phone-number 