const { PrismaClient } = require('../app/generated/prisma');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgcexgq5g',
  api_key: process.env.CLOUDINARY_API_KEY || '263832946349343',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Hsq4Z_l8Yij5Z52Qd9lhFQ-cpi0',
});

// Function to upload image to Cloudinary
async function uploadToCloudinary(imagePath, folder) {
  try {
    const fullPath = path.join('public', imagePath.startsWith('/') ? imagePath.slice(1) : imagePath);
    
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

    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${imagePath}:`, error.message);
    return null;
  }
}

async function migrateAllImages() {
  try {
    console.log('🚀 Starting comprehensive Cloudinary migration...\n');

    // 1. Migrate main product images
    console.log('📋 STEP 1: Migrating main product images...');
    const productsWithLocalImages = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: '/uploads/' } },
          { imageUrl: { startsWith: '/products/' } }
        ]
      }
    });

    console.log(`Found ${productsWithLocalImages.length} products with local images\n`);

    let productSuccessCount = 0;
    for (const product of productsWithLocalImages) {
      console.log(`Processing product: ${product.name} (${product.imageUrl})`);
      
      const cloudinaryUrl = await uploadToCloudinary(product.imageUrl, 'products');
      
      if (cloudinaryUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: cloudinaryUrl }
        });
        productSuccessCount++;
        console.log(`✅ Updated product ${product.name} with Cloudinary URL\n`);
      } else {
        console.log(`❌ Failed to upload image for product ${product.name}\n`);
      }
    }

    // 2. Migrate product gallery images
    console.log('📋 STEP 2: Migrating product gallery images...');
    const galleryImages = await prisma.productImage.findMany({
      where: {
        OR: [
          { url: { startsWith: '/uploads/' } },
          { url: { startsWith: '/products/' } }
        ]
      }
    });

    console.log(`Found ${galleryImages.length} gallery images with local paths\n`);

    let gallerySuccessCount = 0;
    for (const image of galleryImages) {
      console.log(`Processing gallery image: ${image.url}`);
      
      const cloudinaryUrl = await uploadToCloudinary(image.url, 'products/gallery');
      
      if (cloudinaryUrl) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: cloudinaryUrl }
        });
        gallerySuccessCount++;
        console.log(`✅ Updated gallery image with Cloudinary URL\n`);
      } else {
        console.log(`❌ Failed to upload gallery image\n`);
      }
    }

    // 3. Migrate product variation images
    console.log('📋 STEP 3: Migrating product variation images...');
    const variationImages = await prisma.productVariation.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: '/uploads/' } },
          { imageUrl: { startsWith: '/products/' } }
        ]
      }
    });

    console.log(`Found ${variationImages.length} variation images with local paths\n`);

    let variationSuccessCount = 0;
    for (const variation of variationImages) {
      console.log(`Processing variation image: ${variation.imageUrl}`);
      
      const cloudinaryUrl = await uploadToCloudinary(variation.imageUrl, 'products/variations');
      
      if (cloudinaryUrl) {
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: cloudinaryUrl }
        });
        variationSuccessCount++;
        console.log(`✅ Updated variation image with Cloudinary URL\n`);
      } else {
        console.log(`❌ Failed to upload variation image\n`);
      }
    }

    // 4. Migrate category images
    console.log('📋 STEP 4: Migrating category images...');
    const categoryImages = await prisma.category.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: '/uploads/' } },
          { imageUrl: { startsWith: '/categories/' } }
        ]
      }
    });

    console.log(`Found ${categoryImages.length} category images with local paths\n`);

    let categorySuccessCount = 0;
    for (const category of categoryImages) {
      console.log(`Processing category image: ${category.imageUrl}`);
      
      const cloudinaryUrl = await uploadToCloudinary(category.imageUrl, 'categories');
      
      if (cloudinaryUrl) {
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: cloudinaryUrl }
        });
        categorySuccessCount++;
        console.log(`✅ Updated category ${category.name} with Cloudinary URL\n`);
      } else {
        console.log(`❌ Failed to upload category image\n`);
      }
    }

    // 5. Migrate slider images
    console.log('📋 STEP 5: Migrating slider images...');
    const sliderImages = await prisma.slider.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: '/uploads/' } },
          { imageUrl: { startsWith: '/sliders/' } }
        ]
      }
    });

    console.log(`Found ${sliderImages.length} slider images with local paths\n`);

    let sliderSuccessCount = 0;
    for (const slider of sliderImages) {
      console.log(`Processing slider image: ${slider.imageUrl}`);
      
      const cloudinaryUrl = await uploadToCloudinary(slider.imageUrl, 'sliders');
      
      if (cloudinaryUrl) {
        await prisma.slider.update({
          where: { id: slider.id },
          data: { imageUrl: cloudinaryUrl }
        });
        sliderSuccessCount++;
        console.log(`✅ Updated slider with Cloudinary URL\n`);
      } else {
        console.log(`❌ Failed to upload slider image\n`);
      }
    }

    // Final summary
    console.log('🎉 MIGRATION COMPLETE!\n');
    console.log('📊 SUMMARY:');
    console.log(`✅ Product images: ${productSuccessCount}/${productsWithLocalImages.length} migrated`);
    console.log(`✅ Gallery images: ${gallerySuccessCount}/${galleryImages.length} migrated`);
    console.log(`✅ Variation images: ${variationSuccessCount}/${variationImages.length} migrated`);
    console.log(`✅ Category images: ${categorySuccessCount}/${categoryImages.length} migrated`);
    console.log(`✅ Slider images: ${sliderSuccessCount}/${sliderImages.length} migrated`);
    console.log(`\n🎯 Total: ${productSuccessCount + gallerySuccessCount + variationSuccessCount + categorySuccessCount + sliderSuccessCount} images migrated to Cloudinary`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAllImages(); 