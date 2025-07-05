#!/bin/bash

# Check Server Database Configuration
# This script verifies the database setup on the production server

SERVER_USER="root"
SERVER_HOST="167.235.137.52"

echo "🔍 Checking server database configuration..."

ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
echo "=== Checking Database Services ==="

# Check if PostgreSQL is installed and running
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    if systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL is running"
        echo "PostgreSQL version: $(psql --version)"
        
        # Try to list databases
        echo ""
        echo "=== PostgreSQL Databases ==="
        sudo -u postgres psql -l 2>/dev/null || echo "❌ Could not list PostgreSQL databases"
        
        # Check if greenroasteries database exists
        echo ""
        echo "=== Checking greenroasteries database ==="
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw greenroasteries; then
            echo "✅ greenroasteries database exists in PostgreSQL"
        else
            echo "❌ greenroasteries database NOT found in PostgreSQL"
        fi
    else
        echo "❌ PostgreSQL is not running"
    fi
else
    echo "❌ PostgreSQL is not installed"
fi

echo ""

# Check if MySQL/MariaDB is installed and running
if command -v mysql &> /dev/null; then
    echo "✅ MySQL/MariaDB is installed"
    if systemctl is-active --quiet mysql || systemctl is-active --quiet mariadb; then
        echo "✅ MySQL/MariaDB is running"
        echo "MySQL version: $(mysql --version)"
        
        # Check if greenroasteries database exists
        echo ""
        echo "=== Checking MySQL databases ==="
        if mysql -u root -e "SHOW DATABASES;" 2>/dev/null | grep -q greenroasteries; then
            echo "✅ greenroasteries database exists in MySQL"
        else
            echo "❌ greenroasteries database NOT found in MySQL"
        fi
    else
        echo "❌ MySQL/MariaDB is not running"
    fi
else
    echo "❌ MySQL/MariaDB is not installed"
fi

echo ""
echo "=== Checking current .env database configuration ==="
if [ -f /var/www/greenroasteries/.env ]; then
    grep "DATABASE_URL" /var/www/greenroasteries/.env | sed 's/PASSWORD=.*/PASSWORD=***/'
else
    echo "❌ No .env file found at /var/www/greenroasteries/.env"
fi

echo ""
echo "=== Current PM2 Status ==="
pm2 status || echo "PM2 not running or not installed"

ENDSSH 