# Green Roasteries Website Deployment

The Green Roasteries website has been successfully deployed to a Hetzner server with the following details:

## Server Information
- IP Address: 167.235.137.52
- URL: http://167.235.137.52
- Username: root

## Deployment Architecture

The website is deployed using Docker containers with the following components:

1. **Next.js Application**: Running on port 3001 inside a Docker container
2. **PostgreSQL Database**: Running on port 5432 inside a Docker container
3. **Nginx**: Acting as a reverse proxy to route traffic from port 80 to the application

## Accessing the Website

- Public URL: http://167.235.137.52
- Admin Area: http://167.235.137.52/backend

## Admin Login Credentials
- Email: admin@thegreenroasteries.com
- Password: (Ask website owner for password)

## Deployment Steps Completed

1. Updated server packages
2. Installed Docker and Docker Compose
3. Cloned the repository from GitHub
4. Built the Docker containers
5. Launched the application
6. Set up Nginx as a reverse proxy
7. Restored database data from backup
8. Restarted the application to ensure all connections work properly

## Server Management

### Docker Commands

To manage the application containers:
```bash
# Check container status
docker ps

# View application logs
docker logs greenroasteries-app

# Restart containers
docker-compose -f /var/www/greenroasteries/docker-compose.yml restart

# Stop containers
docker-compose -f /var/www/greenroasteries/docker-compose.yml down

# Start containers
docker-compose -f /var/www/greenroasteries/docker-compose.yml up -d
```

### File Locations

- Application files: `/var/www/greenroasteries/`
- Nginx configuration: `/etc/nginx/sites-available/greenroasteries`
- Database data: Docker volume `greenroasteries-data`

### Update Process

To update the application:

1. Connect to the server: `ssh root@167.235.137.52`
2. Navigate to application directory: `cd /var/www/greenroasteries`
3. Pull latest changes: `git pull origin main`
4. Rebuild and restart containers: `docker-compose build && docker-compose up -d`

## Backup and Restore

### Database Backup
```bash
docker exec greenroasteries-db pg_dump -U postgres greenroasteries > /var/www/greenroasteries/backups/backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
# Copy backup to server if needed
# scp backup.sql root@167.235.137.52:/var/www/greenroasteries/backups/

# Restore from backup
docker exec -i greenroasteries-db psql -U postgres -d greenroasteries < /var/www/greenroasteries/backups/backup_YYYYMMDD.sql

# Restart the app container to refresh connections
docker restart greenroasteries-app
```

## Troubleshooting

If you encounter issues with the website:

1. Check application logs:
   ```bash
   docker logs greenroasteries-app
   ```

2. Check database status:
   ```bash
   docker exec greenroasteries-db psql -U postgres -d greenroasteries -c 'SELECT COUNT(*) FROM "Product"'
   ```

3. Restart the application container:
   ```bash
   docker restart greenroasteries-app
   ```

4. Check Nginx configuration:
   ```bash
   nginx -t
   systemctl status nginx
   ``` 