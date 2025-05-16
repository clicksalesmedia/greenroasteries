# Green Roasteries - Deployment & Update Guide

This guide describes how to make code changes and update the deployment on the Hetzner server.

## Development Workflow

### 1. Local Development

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd website

# Create a branch for your changes
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Start the development server
npm run dev
```

Make your code changes and test them locally.

### 2. Push to GitHub

```bash
# Add your changes
git add .

# Commit your changes
git commit -m "Description of your changes"

# Push to GitHub
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Go to GitHub repository
- Create a pull request from your branch to main
- Review and merge the pull request

## Deploying Updates to Server

### Option 1: Pull and Deploy (Recommended)

```bash
# SSH into the server
ssh root@167.235.137.52

# Navigate to the project directory
cd /var/www/greenroasteries

# Pull the latest changes
git pull origin main

# Rebuild and restart Docker containers
docker-compose down
docker-compose up --build -d

# View logs to ensure everything started correctly
docker logs greenroasteries-app
```

### Option 2: Direct Server Edits (For Quick Fixes)

For small changes, you can edit directly on the server:

```bash
# SSH into the server
ssh root@167.235.137.52

# Navigate to the project directory
cd /var/www/greenroasteries

# Edit files using vim or nano
nano app/path/to/your/file.ts

# Rebuild and restart Docker containers
docker-compose down
docker-compose up --build -d
```

After making direct edits, make sure to commit these changes to your local repository and push to GitHub to keep everything in sync:

```bash
# On the server
git add .
git commit -m "Quick fix for issue X"
git push origin main
```

## Checking Deployment Status

```bash
# Check running containers
docker ps

# View application logs
docker logs greenroasteries-app

# View database logs
docker logs greenroasteries-db

# Check application status
curl http://167.235.137.52/api/health
```

## Important Files & Directories

- `/var/www/greenroasteries` - Project root directory
- `docker-compose.yml` - Docker configuration
- `.env` - Environment variables
- `app/` - Application source code
- `prisma/` - Database schema and migrations

## Database Management

### Backup Database

```bash
docker exec greenroasteries-db pg_dump -U postgres greenroasteries > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup_filename.sql | docker exec -i greenroasteries-db psql -U postgres -d greenroasteries
```

## Troubleshooting

### Cookie/Authentication Issues

If users experience login issues:

1. Check middleware.ts for correct cookie name (`auth_token`)
2. Verify correct JWT_SECRET in .env
3. Check login route and authentication flow

### API Endpoints Not Working

1. Check middleware.ts to ensure endpoints are in PUBLIC_PATHS if needed
2. Verify database connection in .env
3. Check server logs for errors 