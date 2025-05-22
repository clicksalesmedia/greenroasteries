#!/bin/bash

# Fix permissions for uploaded files
# This script is called by the upload-file API after a successful upload

# Set ownership and permissions for the uploads directory
# Args: $1 - path to the uploaded file (relative to public/uploads)

# Configuration
UPLOADS_BASE_DIR="/var/www/greenroasteries/public/uploads"
OWNER="www-data"
GROUP="www-data"
DIR_PERMISSIONS=775
FILE_PERMISSIONS=664

# Check if a specific file was provided
if [ -n "$1" ]; then
  UPLOADED_FILE="$UPLOADS_BASE_DIR/$1"
  
  # Get the directory of the uploaded file
  UPLOADED_DIR=$(dirname "$UPLOADED_FILE")
  
  echo "Fixing permissions for file: $UPLOADED_FILE"
  
  # Ensure directory exists with proper permissions
  mkdir -p "$UPLOADED_DIR"
  chown "$OWNER:$GROUP" "$UPLOADED_DIR"
  chmod "$DIR_PERMISSIONS" "$UPLOADED_DIR"
  
  # Set permissions for the specific file
  if [ -f "$UPLOADED_FILE" ]; then
    chown "$OWNER:$GROUP" "$UPLOADED_FILE"
    chmod "$FILE_PERMISSIONS" "$UPLOADED_FILE"
    echo "File permissions fixed: $UPLOADED_FILE"
  else
    echo "Warning: File not found: $UPLOADED_FILE"
  fi
else
  # No specific file provided, fix all uploads
  echo "Fixing permissions for all uploads in $UPLOADS_BASE_DIR"
  
  # Ensure the main uploads directory exists
  mkdir -p "$UPLOADS_BASE_DIR"
  
  # Set ownership recursively
  chown -R "$OWNER:$GROUP" "$UPLOADS_BASE_DIR"
  
  # Set directory permissions (775)
  find "$UPLOADS_BASE_DIR" -type d -exec chmod "$DIR_PERMISSIONS" {} \;
  
  # Set file permissions (664)
  find "$UPLOADS_BASE_DIR" -type f -exec chmod "$FILE_PERMISSIONS" {} \;
  
  echo "All upload permissions fixed!"
fi

exit 0 