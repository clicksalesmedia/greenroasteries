#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
max_retries=30
counter=0
until pg_isready -h db -U postgres -d greenroasteries || [ $counter -eq $max_retries ]; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  counter=$((counter+1))
  sleep 1
done

if [ $counter -eq $max_retries ]; then
  echo "Failed to connect to PostgreSQL after $max_retries seconds. Exiting."
  exit 1
fi

echo "PostgreSQL is up - executing database setup"
echo "DATABASE_URL: $DATABASE_URL"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Try to apply migrations
echo "Running database migrations..."
npx prisma migrate deploy

# If migrations successful, check if we need to seed
SEED_NEEDED=$(npx prisma db execute --stdin <<SQL
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Product';
SQL
)

if [[ $SEED_NEEDED == *"0"* ]]; then
  echo "Database tables exist but no products found. Running seed script..."
  npx prisma db seed
else
  echo "Database already contains data. Skipping seed."
fi

echo "Database setup complete!" 