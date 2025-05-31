#!/bin/bash

# Clean up PM2 processes script
echo "Cleaning up PM2 processes..."

# Stop all greenroasteries processes
pm2 stop all
pm2 delete all

# Clear PM2 logs
pm2 flush

# Show clean state
pm2 list

echo "PM2 cleanup complete" 