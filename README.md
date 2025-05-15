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
