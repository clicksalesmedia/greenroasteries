#!/bin/bash

# Fix upload paths - move files from public/uploads/uploads/* to public/uploads/*
# Run this on the server to correct the path structure

UPLOADS_DIR="/var/www/greenroasteries/public/uploads"
NESTED_UPLOADS_DIR="/var/www/greenroasteries/public/uploads/uploads"

# Check if nested uploads directory exists
if [ -d "$NESTED_UPLOADS_DIR" ]; then
  echo "Found nested uploads directory at $NESTED_UPLOADS_DIR"
  echo "Moving files from $NESTED_UPLOADS_DIR to $UPLOADS_DIR..."
  
  # Move all files and directories from nested uploads to main uploads
  find "$NESTED_UPLOADS_DIR" -mindepth 1 -maxdepth 1 -exec mv {} "$UPLOADS_DIR" \;
  
  # Remove the now-empty nested uploads directory
  rmdir "$NESTED_UPLOADS_DIR"
  
  # Fix permissions
  chown -R www-data:www-data "$UPLOADS_DIR"
  find "$UPLOADS_DIR" -type d -exec chmod 775 {} \;
  find "$UPLOADS_DIR" -type f -exec chmod 664 {} \;
  
  echo "Path structure fixed! All files moved to $UPLOADS_DIR"
else
  echo "No nested uploads directory found at $NESTED_UPLOADS_DIR"
  echo "Checking for direct file in $UPLOADS_DIR..."
  
  # Check if the requested file exists but in the wrong location
  # Extract filename from URL, assume format /uploads/products/filename.ext
  if [ $# -eq 1 ]; then
    FILE_PATH="$1"
    FILENAME=$(basename "$FILE_PATH")
    SUBFOLDER=$(echo "$FILE_PATH" | cut -d'/' -f2)
    
    echo "Looking for $FILENAME in alternative locations..."
    
    # Check common misplacement patterns
    POSSIBLE_LOCATIONS=(
      "$UPLOADS_DIR/$FILENAME"
      "$UPLOADS_DIR/$SUBFOLDER/$FILENAME" 
      "$UPLOADS_DIR/products/variations/$FILENAME"
      "$UPLOADS_DIR/products/$FILENAME"
    )
    
    for LOCATION in "${POSSIBLE_LOCATIONS[@]}"; do
      if [ -f "$LOCATION" ]; then
        echo "Found file at $LOCATION"
        TARGET_DIR="$UPLOADS_DIR/$SUBFOLDER"
        echo "Making sure target directory exists: $TARGET_DIR"
        mkdir -p "$TARGET_DIR"
        
        # Copy (don't move in case it's referenced elsewhere)
        echo "Copying to correct location: $UPLOADS_DIR/$SUBFOLDER/$FILENAME"
        cp "$LOCATION" "$UPLOADS_DIR/$SUBFOLDER/$FILENAME"
        chown www-data:www-data "$UPLOADS_DIR/$SUBFOLDER/$FILENAME"
        chmod 664 "$UPLOADS_DIR/$SUBFOLDER/$FILENAME"
        echo "File copied to correct location."
        exit 0
      fi
    done
    
    echo "File not found in any expected location."
    echo "Listing all files in products directory:"
    find "$UPLOADS_DIR/products" -type f | sort
  else
    echo "No specific file path provided for search."
    echo "Listing all uploads directories:"
    ls -la "$UPLOADS_DIR"
  fi
fi

exit 0 