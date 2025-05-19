#!/bin/bash

# Configuration
SERVER_IP="167.235.137.52"
SERVER_USER="root"

# Create and upload environment file
cat > .env.temp << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenroasteries
JWT_SECRET=8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k=
EOF

# Upload to server
scp .env.temp $SERVER_USER@$SERVER_IP:/var/www/greenroasteries/.env

# Clean up local temp file
rm .env.temp

# SSH into server and setup database
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/greenroasteries

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Restart the application
pm2 restart greenroasteries

# Show status
echo "=== Database Status ==="
sudo -u postgres psql -d greenroasteries -c "\dt"
echo "=== PM2 Status ==="
pm2 status
ENDSSH 