#!/bin/bash

# Script to set up upload directories properly
# This ensures all upload paths exist with correct permissions

echo "🔧 Setting up upload directories..."

# Base directory
PUBLIC_DIR="/var/www/greenroasteries/public"

# Create all necessary upload directories
mkdir -p "$PUBLIC_DIR/uploads/products"
mkdir -p "$PUBLIC_DIR/uploads/products/gallery"
mkdir -p "$PUBLIC_DIR/uploads/products/variations"
mkdir -p "$PUBLIC_DIR/uploads/categories"
mkdir -p "$PUBLIC_DIR/uploads/sliders"
mkdir -p "$PUBLIC_DIR/uploads/content"

# Set proper ownership
chown -R www-data:www-data "$PUBLIC_DIR/uploads"

# Set proper permissions
chmod -R 755 "$PUBLIC_DIR/uploads"

echo "✅ Upload directories created with proper permissions"

# Copy any existing images from old locations if they exist
if [ -d "$PUBLIC_DIR/products" ]; then
  echo "📦 Migrating existing product images..."
  cp -rn "$PUBLIC_DIR/products/"* "$PUBLIC_DIR/uploads/products/" 2>/dev/null || true
  echo "✅ Images migrated"
fi

if [ -d "$PUBLIC_DIR/categories" ]; then
  echo "📦 Migrating existing category images..."
  cp -rn "$PUBLIC_DIR/categories/"* "$PUBLIC_DIR/uploads/categories/" 2>/dev/null || true
  echo "✅ Category images migrated"
fi

if [ -d "$PUBLIC_DIR/sliders" ]; then
  echo "📦 Migrating existing slider images..."
  cp -rn "$PUBLIC_DIR/sliders/"* "$PUBLIC_DIR/uploads/sliders/" 2>/dev/null || true
  echo "✅ Slider images migrated"
fi

echo "🎉 Upload directory setup complete!" 