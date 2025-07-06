# Green Roasteries Deployment System

## Overview

This is a clean, simple deployment system for syncing code changes from localhost to your Hetzner server.

## Scripts

- **deploy.sh** - Main deployment script for code changes
- **sync-uploads.sh** - Sync uploads/assets between localhost and server

## Quick Start

### 1. Deploy Code Changes (Recommended)

```bash
# Deploy only code changes (fastest, most common)
./scripts/deploy.sh --code-only

# Preview what would be deployed
./scripts/deploy.sh --code-only --dry-run

# Deploy everything including uploads
./scripts/deploy.sh --full
```

### 2. Sync Uploads

```bash
# Upload local uploads to server
./scripts/sync-uploads.sh --upload

# Download server uploads to localhost
./scripts/sync-uploads.sh --download

# Preview upload sync
./scripts/sync-uploads.sh --upload --dry-run
```

## Deployment Options

### Code-Only Deployment (Recommended)
- **Fast**: Only syncs code changes
- **Safe**: Excludes uploads, environment files, and build artifacts
- **Use for**: Regular development deployments

### Full Deployment
- **Complete**: Syncs everything including uploads
- **Slower**: Transfers all files
- **Use for**: Initial deployments or major updates

### Dry Run
- **Preview**: Shows what would be deployed without doing it
- **Safe**: No actual changes made
- **Use for**: Checking changes before deployment

## What Gets Deployed

### Included in Code Deployment
- All application files (`app/`, `lib/`, `components/`)
- Configuration files (`package.json`, `next.config.js`, etc.)
- Prisma schema and migrations
- Public assets (except uploads)

### Excluded from Code Deployment
- `node_modules/` (rebuilt on server)
- `.next/` (rebuilt on server)
- `.git/` (version control)
- `backups/` (server-specific)
- `logs/` (server-specific)
- `.env.local` (server has its own)
- `public/uploads/` (use sync-uploads.sh)
- `scripts/` (deployment scripts)
- Documentation files

## Workflow

### Typical Development Workflow
1. Make changes locally
2. Test locally
3. Deploy code: `./scripts/deploy.sh --code-only`
4. Application automatically rebuilds and restarts

### Initial Setup or Major Updates
1. Deploy everything: `./scripts/deploy.sh --full`
2. Sync uploads if needed: `./scripts/sync-uploads.sh --download`

### Upload Management
- **Upload new assets**: `./scripts/sync-uploads.sh --upload`
- **Get server assets**: `./scripts/sync-uploads.sh --download`

## Deployment Process

1. **Connection Test**: Verifies server connectivity
2. **File Sync**: Uses rsync to transfer files efficiently
3. **Build**: Runs `npm run build` on server
4. **Restart**: Restarts PM2 application
5. **Verification**: Confirms application is running

## Configuration

Edit the scripts to modify:
- **Server Details**: `SERVER_USER`, `SERVER_HOST`, `SERVER_PATH`
- **Local Path**: `LOCAL_PATH`
- **Exclusions**: Add/remove `--exclude` patterns

## Troubleshooting

### Connection Issues
```bash
# Test SSH connection
ssh root@167.235.137.52

# Check server status
ssh root@167.235.137.52 "pm2 status"
```

### Build Issues
```bash
# Check server logs
ssh root@167.235.137.52 "cd /var/www/greenroasteries && pm2 logs"

# Manual build
ssh root@167.235.137.52 "cd /var/www/greenroasteries && npm run build"
```

### Upload Issues
```bash
# Check uploads directory permissions
ssh root@167.235.137.52 "ls -la /var/www/greenroasteries/public/uploads/"

# Fix permissions if needed
ssh root@167.235.137.52 "chown -R www-data:www-data /var/www/greenroasteries/public/uploads/"
```

## Best Practices

1. **Use Code-Only**: For regular deployments, use `--code-only`
2. **Test First**: Use `--dry-run` to preview changes
3. **Backup First**: System automatically creates backups daily
4. **Check Status**: Verify deployment success
5. **Sync Uploads Separately**: Keep uploads separate from code deployments

## Safety Features

- **Dry Run**: Preview changes before deployment
- **Connection Testing**: Verifies server connectivity
- **Build Verification**: Ensures successful build
- **Application Monitoring**: Confirms app is running
- **Excludes Sensitive**: Never deploys environment files
- **Efficient Sync**: Only transfers changed files

## Examples

```bash
# Quick code deployment
./scripts/deploy.sh -c

# Full deployment with preview
./scripts/deploy.sh --full --dry-run
./scripts/deploy.sh --full

# Sync uploads both ways
./scripts/sync-uploads.sh --download  # Get server uploads
./scripts/sync-uploads.sh --upload    # Send local uploads

# Preview upload sync
./scripts/sync-uploads.sh --upload --dry-run
```

## File Locations

- Scripts: `./scripts/`
- Configuration: Edit variables at top of each script
- Logs: Deployment logs appear in terminal

## Support

For issues:
1. Check server connection: `ssh root@167.235.137.52`
2. Check application status: `ssh root@167.235.137.52 "pm2 status"`
3. Review server logs: `ssh root@167.235.137.52 "pm2 logs"` 