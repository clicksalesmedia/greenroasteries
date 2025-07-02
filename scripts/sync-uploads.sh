#!/bin/bash
# Sync uploads directory from main public to standalone public
# This ensures uploaded files are accessible in Next.js standalone mode

MAIN_UPLOADS="/var/www/greenroasteries/public/uploads"
STANDALONE_UPLOADS="/var/www/greenroasteries/.next/standalone/public/uploads"

echo "Syncing uploads directory..."

# Remove existing standalone uploads directory
rm -rf "$STANDALONE_UPLOADS"

# Copy uploads from main public to standalone public
cp -r "$MAIN_UPLOADS" "/var/www/greenroasteries/.next/standalone/public/"

# Set proper permissions
chown -R www-data:www-data "$STANDALONE_UPLOADS"
chmod -R 755 "$STANDALONE_UPLOADS"

echo "Uploads directory synced successfully!"
echo "Main uploads: $(find $MAIN_UPLOADS -type f | wc -l) files"
echo "Standalone uploads: $(find $STANDALONE_UPLOADS -type f | wc -l) files" 