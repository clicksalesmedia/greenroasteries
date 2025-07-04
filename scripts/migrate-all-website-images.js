const { PrismaClient } = require('../app/generated/prisma');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Load environment variables manually from .env files
function loadEnvVariables() {
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fsSync.existsSync(envPath)) {
      const envContent = fsSync.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([^#\s][^=]*?)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

// Load environment variables
loadEnvVariables();

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgcexgq5g',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to convert base64 to buffer
function base64ToBuffer(base64String) {
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Helper function to check if string is base64 image
function isBase64Image(str) {
  return str && str.startsWith('data:image');
}

// Helper function to check if string is local file path
function isLocalFile(str) {
  return str && (
    str.startsWith('/uploads/') || 
    str.startsWith('/products/') ||
    str.startsWith('uploads/') || 
    str.startsWith('products/') ||
    str.startsWith('/public/') ||
    str.startsWith('public/') ||
    str.includes('/images/') ||
    str.includes('/sliders/') ||
    str.includes('/categories/')
  );
}

// Helper function to upload to Cloudinary
async function uploadToCloudinary(fileBuffer, publicId, folder = 'greenroasteries') {
  try {
    console.log(`📤 Uploading ${publicId} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
      {
        public_id: publicId,
        folder: folder,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto',
      }
    );
    
    console.log(`✅ Successfully uploaded ${publicId}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${publicId}:`, error.message);
    throw error;
  }
}

// Helper function to upload local file to Cloudinary
async function uploadLocalFileToCloudinary(filePath, publicId, folder = 'greenroasteries') {
  try {
    console.log(`📤 Uploading local file ${filePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: folder,
      overwrite: true,
      resource_type: 'image',
      format: 'webp',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
    
    console.log(`✅ Successfully uploaded ${filePath} as ${publicId}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    throw error;
  }
}

// Function to process a single image
async function processImage(imageUrl, publicId, folder) {
  if (!imageUrl) return null;
  
  if (isBase64Image(imageUrl)) {
    const imageBuffer = base64ToBuffer(imageUrl);
    return await uploadToCloudinary(imageBuffer, publicId, folder);
  } else if (isLocalFile(imageUrl)) {
    let filePath = imageUrl;
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    try {
      await fs.access(fullPath);
      return await uploadLocalFileToCloudinary(fullPath, publicId, folder);
    } catch (error) {
      console.log(`⚠️  File not found: ${fullPath}, skipping...`);
      return null;
    }
  }
  
  return null; // Already a URL or not processable
}

// 1. Process Product Images
async function processProducts() {
  console.log('\n🔄 Processing Product Images...\n');
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: 'data:image' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: { startsWith: '/products/' } },
        { imageUrl: { startsWith: 'uploads/' } },
        { imageUrl: { startsWith: 'products/' } }
      ]
    },
    select: {
      id: true,
      sku: true,
      name: true,
      imageUrl: true
    }
  });

  console.log(`Found ${products.length} products with images to migrate`);

  const results = { success: [], failed: [] };

  for (const product of products) {
    try {
      const publicId = `products/${product.sku || product.id}`;
      const cloudinaryUrl = await processImage(product.imageUrl, publicId, 'greenroasteries/products');
      
      if (cloudinaryUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        results.success.push({
          type: 'Product',
          id: product.id,
          name: product.name,
          newImage: cloudinaryUrl
        });
        
        console.log(`✅ Updated product ${product.name || product.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process product ${product.name || product.id}:`, error.message);
      results.failed.push({
        type: 'Product',
        id: product.id,
        name: product.name,
        error: error.message
      });
    }
  }

  return results;
}

// 2. Process Product Variations
async function processVariations() {
  console.log('\n🔄 Processing Product Variations...\n');
  
  const variations = await prisma.productVariation.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: 'data:image' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: { startsWith: '/products/' } },
        { imageUrl: { startsWith: 'uploads/' } },
        { imageUrl: { startsWith: 'products/' } }
      ]
    },
    select: {
      id: true,
      imageUrl: true,
      product: {
        select: {
          name: true,
          sku: true
        }
      }
    }
  });

  console.log(`Found ${variations.length} variations with images to migrate`);

  const results = { success: [], failed: [] };

  for (const variation of variations) {
    try {
      const publicId = `variations/${variation.product.sku || variation.id}_var_${variation.id}`;
      const cloudinaryUrl = await processImage(variation.imageUrl, publicId, 'greenroasteries/variations');
      
      if (cloudinaryUrl) {
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        results.success.push({
          type: 'Variation',
          id: variation.id,
          product: variation.product.name,
          newImage: cloudinaryUrl
        });
        
        console.log(`✅ Updated variation ${variation.id} for ${variation.product.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process variation ${variation.id}:`, error.message);
      results.failed.push({
        type: 'Variation',
        id: variation.id,
        error: error.message
      });
    }
  }

  return results;
}

// 3. Process Product Gallery Images
async function processProductImages() {
  console.log('\n🔄 Processing Product Gallery Images...\n');
  
  const productImages = await prisma.productImage.findMany({
    where: {
      OR: [
        { url: { startsWith: 'data:image' } },
        { url: { startsWith: '/uploads/' } },
        { url: { startsWith: '/products/' } },
        { url: { startsWith: 'uploads/' } },
        { url: { startsWith: 'products/' } }
      ]
    },
    select: {
      id: true,
      url: true,
      product: {
        select: {
          name: true,
          sku: true
        }
      }
    }
  });

  console.log(`Found ${productImages.length} gallery images to migrate`);

  const results = { success: [], failed: [] };

  for (const image of productImages) {
    try {
      const publicId = `gallery/${image.product.sku || image.id}_img_${image.id}`;
      const cloudinaryUrl = await processImage(image.url, publicId, 'greenroasteries/gallery');
      
      if (cloudinaryUrl) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: cloudinaryUrl }
        });
        
        results.success.push({
          type: 'Gallery',
          id: image.id,
          product: image.product.name,
          newImage: cloudinaryUrl
        });
        
        console.log(`✅ Updated gallery image ${image.id} for ${image.product.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process gallery image ${image.id}:`, error.message);
      results.failed.push({
        type: 'Gallery',
        id: image.id,
        error: error.message
      });
    }
  }

  return results;
}

// 4. Process Categories
async function processCategories() {
  console.log('\n🔄 Processing Category Images...\n');
  
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: 'data:image' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: { startsWith: '/categories/' } },
        { imageUrl: { startsWith: 'uploads/' } },
        { imageUrl: { startsWith: 'categories/' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true
    }
  });

  console.log(`Found ${categories.length} categories with images to migrate`);

  const results = { success: [], failed: [] };

  for (const category of categories) {
    try {
      const publicId = `categories/${category.slug || category.id}`;
      const cloudinaryUrl = await processImage(category.imageUrl, publicId, 'greenroasteries/categories');
      
      if (cloudinaryUrl) {
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        results.success.push({
          type: 'Category',
          id: category.id,
          name: category.name,
          newImage: cloudinaryUrl
        });
        
        console.log(`✅ Updated category ${category.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process category ${category.name}:`, error.message);
      results.failed.push({
        type: 'Category',
        id: category.id,
        name: category.name,
        error: error.message
      });
    }
  }

  return results;
}

// 5. Process Sliders
async function processSliders() {
  console.log('\n🔄 Processing Slider Images...\n');
  
  const sliders = await prisma.slider.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: 'data:image' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: { startsWith: '/sliders/' } },
        { imageUrl: { startsWith: 'uploads/' } },
        { imageUrl: { startsWith: 'sliders/' } },
        { overlayImageUrl: { startsWith: 'data:image' } },
        { overlayImageUrl: { startsWith: '/uploads/' } },
        { overlayImageUrl: { startsWith: '/sliders/' } },
        { overlayImageUrl: { startsWith: 'uploads/' } },
        { overlayImageUrl: { startsWith: 'sliders/' } }
      ]
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      overlayImageUrl: true
    }
  });

  console.log(`Found ${sliders.length} sliders with images to migrate`);

  const results = { success: [], failed: [] };

  for (const slider of sliders) {
    try {
      let updateData = {};
      
      // Process main image
      if (slider.imageUrl) {
        const publicId = `sliders/${slider.id}_main`;
        const cloudinaryUrl = await processImage(slider.imageUrl, publicId, 'greenroasteries/sliders');
        if (cloudinaryUrl) {
          updateData.imageUrl = cloudinaryUrl;
        }
      }
      
      // Process overlay image
      if (slider.overlayImageUrl) {
        const publicId = `sliders/${slider.id}_overlay`;
        const cloudinaryUrl = await processImage(slider.overlayImageUrl, publicId, 'greenroasteries/sliders');
        if (cloudinaryUrl) {
          updateData.overlayImageUrl = cloudinaryUrl;
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.slider.update({
          where: { id: slider.id },
          data: updateData
        });
        
        results.success.push({
          type: 'Slider',
          id: slider.id,
          title: slider.title,
          updates: Object.keys(updateData)
        });
        
        console.log(`✅ Updated slider ${slider.title || slider.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process slider ${slider.title || slider.id}:`, error.message);
      results.failed.push({
        type: 'Slider',
        id: slider.id,
        title: slider.title,
        error: error.message
      });
    }
  }

  return results;
}

// 6. Process Offer Banners
async function processOfferBanners() {
  console.log('\n🔄 Processing Offer Banner Images...\n');
  
  const banners = await prisma.offerBanner.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: 'data:image' } },
        { imageUrl: { startsWith: '/uploads/' } },
        { imageUrl: { startsWith: 'uploads/' } }
      ]
    },
    select: {
      id: true,
      title: true,
      imageUrl: true
    }
  });

  console.log(`Found ${banners.length} offer banners with images to migrate`);

  const results = { success: [], failed: [] };

  for (const banner of banners) {
    try {
      const publicId = `banners/${banner.id}`;
      const cloudinaryUrl = await processImage(banner.imageUrl, publicId, 'greenroasteries/banners');
      
      if (cloudinaryUrl) {
        await prisma.offerBanner.update({
          where: { id: banner.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        results.success.push({
          type: 'Banner',
          id: banner.id,
          title: banner.title,
          newImage: cloudinaryUrl
        });
        
        console.log(`✅ Updated banner ${banner.title || banner.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process banner ${banner.title || banner.id}:`, error.message);
      results.failed.push({
        type: 'Banner',
        id: banner.id,
        title: banner.title,
        error: error.message
      });
    }
  }

  return results;
}

// Main migration function
async function migrateAllWebsiteImages() {
  console.log('🚀 Starting COMPLETE Website Image Migration to Cloudinary\n');
  console.log('========================================================\n');

  try {
    // Test Cloudinary connection
    console.log('🔗 Testing Cloudinary connection...');
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful\n');

    const allResults = {
      products: await processProducts(),
      variations: await processVariations(),
      gallery: await processProductImages(),
      categories: await processCategories(),
      sliders: await processSliders(),
      banners: await processOfferBanners()
    };

    // Summary report
    console.log('\n📊 COMPLETE MIGRATION SUMMARY');
    console.log('==============================');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    Object.entries(allResults).forEach(([type, result]) => {
      const success = result.success.length;
      const failed = result.failed.length;
      totalSuccess += success;
      totalFailed += failed;
      console.log(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${success} success, ${failed} failed`);
    });

    console.log(`\n🎉 GRAND TOTAL: ${totalSuccess} images migrated successfully, ${totalFailed} failed`);

    if (totalFailed > 0) {
      console.log('\n❌ Failed items:');
      Object.values(allResults).forEach(result => {
        result.failed.forEach(item => {
          console.log(`  - ${item.type} ${item.id || item.name}: ${item.error}`);
        });
      });
    }

    console.log('\n✅ ALL WEBSITE IMAGES MIGRATED TO CLOUDINARY!');
    return allResults;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAllWebsiteImages()
    .then(() => {
      console.log('\n🎊 COMPLETE WEBSITE MIGRATION FINISHED!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAllWebsiteImages }; 