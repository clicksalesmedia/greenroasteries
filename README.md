# Green Roasteries Website

This is the website for Green Roasteries, a coffee shop.

## Development

### Prerequisites

- Node.js (version specified in package.json)
- npm or yarn
- Docker and Docker Compose (for containerized development)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the content from `sample-env.txt`:
   ```
   cp sample-env.txt .env
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Docker Setup Guide

This guide explains how to set up and work with Docker for the Green Roasteries website project.

## Table of Contents
- [Docker Environments](#docker-environments)
- [Setup Instructions](#setup-instructions)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

## Docker Environments

The project has two Docker environments:

1. **Production Environment** (`docker-compose.yml`)
   - Builds and runs the application in production mode
   - Uses a static build of the application
   - No live code updates

2. **Development Environment** (`docker-compose.dev.yml`)
   - Uses bind mounts for live code updates
   - Runs the application in development mode with hot reloading
   - Ideal for active development

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed on your machine
- PostgreSQL client tools (for database operations)

### Production Setup

1. **Build and start the containers:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Access the application:**
   - Web: http://localhost:3001

3. **Stop the containers:**
   ```bash
   docker-compose down
   ```

### Development Setup

1. **Start the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the development application:**
   - Web: http://localhost:3001

3. **Stop the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Development Workflow

### Making Code Changes

With the development environment, any changes to your local files will be automatically reflected in the container:

1. Start the development environment
2. Edit files locally
3. Changes will be automatically detected and the application will reload

### Building for Production

To test production builds:

```bash
# Stop development containers if running
docker-compose -f docker-compose.dev.yml down

# Build and run production containers
docker-compose build
docker-compose up -d
```

## Database Management

### Backing Up the Database

```bash
# Create a backup directory if it doesn't exist
mkdir -p backups

# Backup from local PostgreSQL
pg_dump -h localhost -U postgres greenroasteries > backups/greenroasteries_$(date +%Y%m%d).sql

# Backup from Docker container
docker exec -it greenroasteries-db-dev pg_dump -U postgres greenroasteries > backups/greenroasteries_$(date +%Y%m%d).sql
```

### Restoring the Database

```bash
# Copy backup to container
docker cp backups/greenroasteries_YYYYMMDD.sql greenroasteries-db-dev:/tmp/

# Drop existing database
docker exec -it greenroasteries-db-dev psql -U postgres -c "DROP DATABASE IF EXISTS greenroasteries;"

# Create new database
docker exec -it greenroasteries-db-dev psql -U postgres -c "CREATE DATABASE greenroasteries;"

# Restore from backup
docker exec -it greenroasteries-db-dev psql -U postgres -d greenroasteries -f /tmp/greenroasteries_YYYYMMDD.sql
```

### Running Prisma Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in the Docker container
docker exec -it greenroasteries-app-dev npx prisma migrate deploy
```

### Accessing the Database

```bash
# Connect to the database
docker exec -it greenroasteries-db-dev psql -U postgres -d greenroasteries
```

### Seeding the Database

```bash
docker exec -it greenroasteries-app-dev npx prisma db seed
```

## Troubleshooting

### Container Logs

```bash
# View app container logs
docker logs greenroasteries-app-dev

# View database container logs
docker logs greenroasteries-db-dev

# Follow logs in real-time
docker logs -f greenroasteries-app-dev
```

### Restarting Containers

```bash
# Restart app container
docker restart greenroasteries-app-dev

# Restart database container
docker restart greenroasteries-db-dev
```

### Database Connection Issues

If the application can't connect to the database:

1. Check if the database container is running:
   ```bash
   docker ps | grep greenroasteries-db
   ```

2. Check database logs:
   ```bash
   docker logs greenroasteries-db-dev
   ```

3. Verify the DATABASE_URL environment variable in the docker-compose file

### Rebuilding Containers

If you need to rebuild containers after significant changes:

```bash
# Development environment
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose down
docker-compose build
docker-compose up -d
```

## Production Deployment

For production deployment, make sure to set the appropriate environment variables in your deployment environment.

## Hetzner Server Deployment

This guide explains how the Green Roasteries website is deployed to a Hetzner server and how to manage it.

### Server Information
- IP Address: 167.235.137.52
- URL: http://167.235.137.52
- Admin Area: http://167.235.137.52/backend

### Deployment Architecture

The website is deployed using Docker containers with the following components:

1. **Next.js Application**: Running on port 3001 inside a Docker container
2. **PostgreSQL Database**: Running on port 5432 inside a Docker container
3. **Nginx**: Acting as a reverse proxy to route traffic from port 80 to the application

### Server Setup Steps

1. **Update server packages:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Install Docker and Docker Compose:**
   ```bash
   apt install -y docker.io docker-compose git
   ```

3. **Clone the repository:**
   ```bash
   mkdir -p /var/www && cd /var/www
   git clone https://github.com/clicksalesmedia/greenroasteries.git
   cd greenroasteries
   ```

4. **Set up environment:**
   ```bash
   cp .env.local .env
   ```

5. **Build and start Docker containers:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

6. **Install and configure Nginx:**
   ```bash
   apt install -y nginx
   ```

   Create Nginx configuration file at `/etc/nginx/sites-available/greenroasteries`:
   ```nginx
   server {
       listen 80;
       server_name 167.235.137.52;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site and restart Nginx:
   ```bash
   ln -s /etc/nginx/sites-available/greenroasteries /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t
   systemctl restart nginx
   ```

7. **Restore database data if needed:**
   ```bash
   docker exec -i greenroasteries-db psql -U postgres -d greenroasteries < /var/www/greenroasteries/greenroasteries_backup.sql
   docker restart greenroasteries-app
   ```

### Updating the Website

To update the website with new code:

1. **Connect to the server:**
   ```bash
   ssh root@167.235.137.52
   ```

2. **Navigate to the application directory:**
   ```bash
   cd /var/www/greenroasteries
   ```

3. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```

4. **Rebuild and restart the containers:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

### Database Management in Production

#### Making Database Changes

To apply database schema changes:

1. **Create migrations locally:**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit the migration files to git**

3. **On the server, pull the changes and apply migrations:**
   ```bash
   cd /var/www/greenroasteries
   git pull origin main
   docker exec -it greenroasteries-app npx prisma migrate deploy
   docker restart greenroasteries-app
   ```

#### Backing Up the Database

```bash
# On the server
docker exec greenroasteries-db pg_dump -U postgres greenroasteries > /var/www/greenroasteries/backups/backup_$(date +%Y%m%d).sql

# Download backup to local machine
scp root@167.235.137.52:/var/www/greenroasteries/backups/backup_YYYYMMDD.sql ./backups/
```

#### Restoring the Database

```bash
# Upload backup to server if needed
scp backup.sql root@167.235.137.52:/var/www/greenroasteries/backups/

# Restore from backup
docker exec -i greenroasteries-db psql -U postgres -d greenroasteries < /var/www/greenroasteries/backups/backup_YYYYMMDD.sql

# Restart the app container to refresh connections
docker restart greenroasteries-app
```

### Troubleshooting Production Deployment

If you encounter issues with the website:

1. **Check application logs:**
   ```bash
   docker logs greenroasteries-app
   ```

2. **Check database status:**
   ```bash
   docker exec greenroasteries-db psql -U postgres -d greenroasteries -c 'SELECT COUNT(*) FROM "Product"'
   ```

3. **Restart the application container:**
   ```bash
   docker restart greenroasteries-app
   ```

4. **Check Nginx configuration:**
   ```bash
   nginx -t
   systemctl status nginx
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development, production, test)

## Database

The application uses PostgreSQL with Prisma ORM. The database schema is defined in `prisma/schema.prisma`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
