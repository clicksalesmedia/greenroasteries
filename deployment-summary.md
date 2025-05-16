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
# Stop containers
docker-compose down

# Start database only
docker-compose up -d db

# Wait for database to be ready
sleep 5

# Restore from backup
cat /var/www/greenroasteries/backups/backup_YYYYMMDD.sql | docker exec -i greenroasteries-db psql -U postgres -d greenroasteries

# Start all containers
docker-compose up -d
``` 