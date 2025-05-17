# Deployment Guide for The Green Roasteries

This guide explains how to deploy code changes and database updates to the production server on Hetzner.

## Server Information
- **Server IP**: 167.235.137.52
- **Domain**: thegreenroasteries.com
- **Technology Stack**: Next.js, PostgreSQL, Docker, Nginx

## Deploying Code Changes

### 1. Local Development Workflow

```bash
# Make your code changes locally
# Test them thoroughly
npm run dev

# Commit changes to Git
git add .
git commit -m "Description of changes"
git push
```

### 2. Deploying to Production Server

```bash
# SSH into the server
ssh root@167.235.137.52

# Navigate to project directory
cd /var/www/greenroasteries

# Pull the latest changes
git pull

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# Check the logs to ensure everything is working
docker logs greenroasteries-app
```

## Database Changes

### Option 1: Using Prisma Migrations (Recommended)

```bash
# Locally - Create migration
npx prisma migrate dev --name describe_your_change

# Test locally
# Then commit and push the migration files
git add .
git commit -m "Add database migration"
git push

# On server - Pull and apply migrations
ssh root@167.235.137.52
cd /var/www/greenroasteries
git pull
docker-compose down
docker-compose up -d  # Migrations will apply during startup
```

### Option 2: Direct Database Changes (For Quick Fixes)

```bash
# SSH into the server
ssh root@167.235.137.52

# Access the PostgreSQL database
docker exec -it greenroasteries-db psql -U postgres -d greenroasteries

# Make your SQL changes
# Example: UPDATE "Product" SET "name" = 'New Coffee' WHERE "id" = '123';
# Type \q to exit
```

### Option 3: Database Backup & Restore

```bash
# Export your local database
pg_dump -U postgres greenroasteries > local_backup.sql

# Copy to server
scp local_backup.sql root@167.235.137.52:/var/www/greenroasteries/

# SSH into the server
ssh root@167.235.137.52
cd /var/www/greenroasteries

# Restore the database
cat local_backup.sql | docker exec -i greenroasteries-db psql -U postgres -d greenroasteries

# Restart the app container
docker restart greenroasteries-app
```

## Troubleshooting

### Common Issues

1. **Website shows "Database does not exist" error**
   ```bash
   # SSH into server
   ssh root@167.235.137.52
   
   # Check if database exists
   docker exec greenroasteries-db psql -U postgres -l
   
   # If needed, create database
   docker exec greenroasteries-db psql -U postgres -c 'CREATE DATABASE greenroasteries;'
   
   # Restore from backup if needed
   cat greenroasteries_backup.sql | docker exec -i greenroasteries-db psql -U postgres -d greenroasteries
   ```

2. **Nginx configuration issues**
   ```bash
   # Check Nginx configuration
   nginx -t
   
   # Restart Nginx if needed
   systemctl restart nginx
   ```

3. **SSL certificate renewal**
   ```bash
   # Renew SSL certificates
   certbot --nginx -d thegreenroasteries.com -d www.thegreenroasteries.com
   ```

## Maintenance

### Docker commands

```bash
# View running containers
docker ps

# View container logs
docker logs greenroasteries-app
docker logs greenroasteries-db

# Restart containers
docker restart greenroasteries-app
docker restart greenroasteries-db

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d
```

### Database Backup

```bash
# Create a backup of the current database
docker exec greenroasteries-db pg_dump -U postgres greenroasteries > backup_$(date +%Y%m%d).sql
```

## Security

- Keep your SSH key secure
- Regularly update packages: `apt update && apt upgrade -y`
- Monitor logs for suspicious activity
- Ensure database credentials are strong 