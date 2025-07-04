const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgcexgq5g',
  api_key: process.env.CLOUDINARY_API_KEY || '263832946349343',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Hsq4Z_l8Yij5Z52Qd9lhFQ-cpi0',
});

// Function to convert base64 to file
function base64ToFile(base64Data, filename) {
  try {
    // Extract the base64 data (remove data:image/webp;base64, part)
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data');
    }

    const mimeType = matches[1];
    const base64 = matches[2];
    const extension = mimeType.split('/')[1] || 'webp';
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join('public', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilename = `${filename}.${extension}`;
    const tempPath = path.join(tempDir, tempFilename);
    
    // Write base64 data to file
    fs.writeFileSync(tempPath, base64, 'base64');
    
    console.log(`✅ Converted base64 to file: ${tempPath}`);
    return `/temp/${tempFilename}`;
  } catch (error) {
    console.error(`❌ Error converting base64 to file:`, error.message);
    return null;
  }
}

// Function to upload image to Cloudinary
async function uploadToCloudinary(imagePath, folder, isBase64 = false) {
  try {
    let fullPath;
    let tempFile = null;
    
    if (isBase64) {
      // Convert base64 to temporary file
      const filename = uuidv4();
      const tempImagePath = base64ToFile(imagePath, filename);
      if (!tempImagePath) return null;
      
      fullPath = path.join('public', tempImagePath.startsWith('/') ? tempImagePath.slice(1) : tempImagePath);
      tempFile = fullPath; // Keep track to delete later
    } else {
      fullPath = path.join('public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath);
    }
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${fullPath}`);
      return null;
    }

    console.log(`📤 Uploading: ${fullPath} to ${folder}/`);
    
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `greenroasteries/${folder}`,
      use_filename: true,
      unique_filename: false,
    });

    // Clean up temporary file if it was created from base64
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`🗑️ Cleaned up temp file: ${tempFile}`);
    }

    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${imagePath}:`, error.message);
    return null;
  }
}

// Function to determine image type and process accordingly
async function processImage(imageUrl, folder) {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('data:image/')) {
    console.log(`🔄 Processing base64 image...`);
    return await uploadToCloudinary(imageUrl, folder, true);
  } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/products/') || imageUrl.startsWith('/categories/') || imageUrl.startsWith('/sliders/')) {
    console.log(`📁 Processing local file: ${imageUrl}`);
    return await uploadToCloudinary(imageUrl, folder, false);
  } else {
    console.log(`⏭️ Skipping already processed or external URL: ${imageUrl}`);
    return imageUrl; // Return as-is if it's already a Cloudinary URL or external URL
  }
}

async function migrateAllImages() {
  try {
    console.log('🚀 Starting comprehensive Cloudinary migration (including base64 images)...\n');

    // 1. Migrate main product images
    console.log('📋 STEP 1: Migrating main product images...');
    const allProducts = await prisma.product.findMany({
      where: {
        imageUrl: { not: null }
      }
    });

    console.log(`Found ${allProducts.length} products with images\n`);

    let productSuccessCount = 0;
    for (const product of allProducts) {
      console.log(`Processing product: ${product.name}`);
      console.log(`Current imageUrl: ${product.imageUrl.substring(0, 100)}${product.imageUrl.length > 100 ? '...' : ''}`);
      
      const cloudinaryUrl = await processImage(product.imageUrl, 'products');
      
      if (cloudinaryUrl && cloudinaryUrl !== product.imageUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: cloudinaryUrl }
        });
        productSuccessCount++;
        console.log(`✅ Updated product ${product.name} with Cloudinary URL\n`);
      } else if (cloudinaryUrl === product.imageUrl) {
        console.log(`⏭️ Product ${product.name} already has valid URL\n`);
      } else {
        console.log(`❌ Failed to upload image for product ${product.name}\n`);
      }
    }

    // 2. Migrate product gallery images
    console.log('📋 STEP 2: Migrating product gallery images...');
    const allGalleryImages = await prisma.productImage.findMany({
      where: {
        url: { not: null }
      }
    });

    console.log(`Found ${allGalleryImages.length} gallery images\n`);

    let gallerySuccessCount = 0;
    for (const image of allGalleryImages) {
      console.log(`Processing gallery image: ${image.url.substring(0, 100)}${image.url.length > 100 ? '...' : ''}`);
      
      const cloudinaryUrl = await processImage(image.url, 'products/gallery');
      
      if (cloudinaryUrl && cloudinaryUrl !== image.url) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: cloudinaryUrl }
        });
        gallerySuccessCount++;
        console.log(`✅ Updated gallery image with Cloudinary URL\n`);
      } else if (cloudinaryUrl === image.url) {
        console.log(`⏭️ Gallery image already has valid URL\n`);
      } else {
        console.log(`❌ Failed to upload gallery image\n`);
      }
    }

    // 3. Migrate product variation images
    console.log('📋 STEP 3: Migrating product variation images...');
    const allVariationImages = await prisma.productVariation.findMany({
      where: {
        imageUrl: { not: null }
      }
    });

    console.log(`Found ${allVariationImages.length} variation images\n`);

    let variationSuccessCount = 0;
    for (const variation of allVariationImages) {
      console.log(`Processing variation image: ${variation.imageUrl.substring(0, 100)}${variation.imageUrl.length > 100 ? '...' : ''}`);
      
      const cloudinaryUrl = await processImage(variation.imageUrl, 'products/variations');
      
      if (cloudinaryUrl && cloudinaryUrl !== variation.imageUrl) {
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: cloudinaryUrl }
        });
        variationSuccessCount++;
        console.log(`✅ Updated variation image with Cloudinary URL\n`);
      } else if (cloudinaryUrl === variation.imageUrl) {
        console.log(`⏭️ Variation image already has valid URL\n`);
      } else {
        console.log(`❌ Failed to upload variation image\n`);
      }
    }

    // 4. Migrate category images
    console.log('📋 STEP 4: Migrating category images...');
    const allCategoryImages = await prisma.category.findMany({
      where: {
        imageUrl: { not: null }
      }
    });

    console.log(`Found ${allCategoryImages.length} category images\n`);

    let categorySuccessCount = 0;
    for (const category of allCategoryImages) {
      console.log(`Processing category image for ${category.name}: ${category.imageUrl.substring(0, 100)}${category.imageUrl.length > 100 ? '...' : ''}`);
      
      const cloudinaryUrl = await processImage(category.imageUrl, 'categories');
      
      if (cloudinaryUrl && cloudinaryUrl !== category.imageUrl) {
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: cloudinaryUrl }
        });
        categorySuccessCount++;
        console.log(`✅ Updated category ${category.name} with Cloudinary URL\n`);
      } else if (cloudinaryUrl === category.imageUrl) {
        console.log(`⏭️ Category ${category.name} already has valid URL\n`);
      } else {
        console.log(`❌ Failed to upload category image\n`);
      }
    }

    // 5. Migrate slider images
    console.log('📋 STEP 5: Migrating slider images...');
    const allSliderImages = await prisma.slider.findMany({
      where: {
        imageUrl: { not: null }
      }
    });

    console.log(`Found ${allSliderImages.length} slider images\n`);

    let sliderSuccessCount = 0;
    for (const slider of allSliderImages) {
      console.log(`Processing slider image: ${slider.imageUrl.substring(0, 100)}${slider.imageUrl.length > 100 ? '...' : ''}`);
      
      const cloudinaryUrl = await processImage(slider.imageUrl, 'sliders');
      
      if (cloudinaryUrl && cloudinaryUrl !== slider.imageUrl) {
        await prisma.slider.update({
          where: { id: slider.id },
          data: { imageUrl: cloudinaryUrl }
        });
        sliderSuccessCount++;
        console.log(`✅ Updated slider with Cloudinary URL\n`);
      } else if (cloudinaryUrl === slider.imageUrl) {
        console.log(`⏭️ Slider already has valid URL\n`);
      } else {
        console.log(`❌ Failed to upload slider image\n`);
      }
    }

    // Clean up temp directory
    const tempDir = path.join('public', 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up temp directory\n`);
    }

    // Final summary
    console.log('🎉 MIGRATION COMPLETE!\n');
    console.log('📊 SUMMARY:');
    console.log(`✅ Product images: ${productSuccessCount} migrated`);
    console.log(`✅ Gallery images: ${gallerySuccessCount} migrated`);
    console.log(`✅ Variation images: ${variationSuccessCount} migrated`);
    console.log(`✅ Category images: ${categorySuccessCount} migrated`);
    console.log(`✅ Slider images: ${sliderSuccessCount} migrated`);
    console.log(`\n🎯 Total: ${productSuccessCount + gallerySuccessCount + variationSuccessCount + categorySuccessCount + sliderSuccessCount} images migrated to Cloudinary`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAllImages(); 