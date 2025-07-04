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
  // Remove data:image/[type];base64, prefix
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Helper function to get file extension from base64 string
function getExtensionFromBase64(base64String) {
  const match = base64String.match(/^data:image\/([a-z]+);base64,/);
  return match ? match[1] : 'jpg';
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
        format: 'webp', // Convert all images to webp for better performance
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

// Function to process base64 images
async function processBase64Images() {
  console.log('\n🔄 Processing Base64 Images...\n');
  
  // Get all products with base64 images
  const productsWithBase64 = await prisma.product.findMany({
    where: {
      imageUrl: {
        startsWith: 'data:image'
      }
    },
    select: {
      id: true,
      sku: true,
      name: true,
      imageUrl: true
    }
  });

  console.log(`Found ${productsWithBase64.length} products with base64 images`);

  const results = {
    success: [],
    failed: []
  };

  for (const product of productsWithBase64) {
    try {
      // Generate unique public ID
      const publicId = `products/${product.sku || product.id}`;
      
      // Convert base64 to buffer
      const imageBuffer = base64ToBuffer(product.imageUrl);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageBuffer, publicId, 'greenroasteries/products');
      
      // Update database
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: cloudinaryUrl }
      });
      
      results.success.push({
        id: product.id,
        name: product.name,
        oldImage: 'base64',
        newImage: cloudinaryUrl
      });
      
      console.log(`✅ Updated product ${product.name || product.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to process product ${product.name || product.id}:`, error.message);
      results.failed.push({
        id: product.id,
        name: product.name,
        error: error.message
      });
    }
  }

  return results;
}

// Function to process local files
async function processLocalFiles() {
  console.log('\n🔄 Processing Local Files...\n');
  
  // Get all products with local file paths
  const productsWithLocalFiles = await prisma.product.findMany({
    where: {
      OR: [
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

  console.log(`Found ${productsWithLocalFiles.length} products with local files`);

  const results = {
    success: [],
    failed: []
  };

  for (const product of productsWithLocalFiles) {
    try {
      // Clean up the file path
      let filePath = product.image;
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      
      // Construct full file path
      const fullPath = path.join(process.cwd(), 'public', filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        console.log(`⚠️  File not found: ${fullPath}, skipping...`);
        results.failed.push({
          id: product.id,
          slug: product.slug,
          error: 'File not found'
        });
        continue;
      }
      
      // Generate unique public ID
      const publicId = `products/${product.slug || product.id}`;
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadLocalFileToCloudinary(fullPath, publicId, 'greenroasteries/products');
      
      // Update database
      await prisma.product.update({
        where: { id: product.id },
        data: { image: cloudinaryUrl }
      });
      
      results.success.push({
        id: product.id,
        slug: product.slug,
        oldImage: product.image,
        newImage: cloudinaryUrl
      });
      
      console.log(`✅ Updated product ${product.slug || product.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to process product ${product.slug || product.id}:`, error.message);
      results.failed.push({
        id: product.id,
        slug: product.slug,
        error: error.message
      });
    }
  }

  return results;
}

// Function to process product variations
async function processVariations() {
  console.log('\n🔄 Processing Product Variations...\n');
  
  const variations = await prisma.productVariation.findMany({
    where: {
      OR: [
        { image: { startsWith: 'data:image' } },
        { image: { startsWith: '/uploads/' } },
        { image: { startsWith: '/products/' } },
        { image: { startsWith: 'uploads/' } },
        { image: { startsWith: 'products/' } }
      ]
    },
    select: {
      id: true,
      image: true,
      product: {
        select: {
          slug: true
        }
      }
    }
  });

  console.log(`Found ${variations.length} variations with images to migrate`);

  const results = {
    success: [],
    failed: []
  };

  for (const variation of variations) {
    try {
      let cloudinaryUrl;
      const publicId = `variations/${variation.product.slug || variation.id}_var_${variation.id}`;
      
      if (variation.image.startsWith('data:image')) {
        // Handle base64
        const imageBuffer = base64ToBuffer(variation.image);
        cloudinaryUrl = await uploadToCloudinary(imageBuffer, publicId, 'greenroasteries/variations');
      } else {
        // Handle local file
        let filePath = variation.image;
        if (filePath.startsWith('/')) {
          filePath = filePath.substring(1);
        }
        
        const fullPath = path.join(process.cwd(), 'public', filePath);
        
        try {
          await fs.access(fullPath);
          cloudinaryUrl = await uploadLocalFileToCloudinary(fullPath, publicId, 'greenroasteries/variations');
        } catch (error) {
          console.log(`⚠️  Variation file not found: ${fullPath}, skipping...`);
          results.failed.push({
            id: variation.id,
            error: 'File not found'
          });
          continue;
        }
      }
      
      // Update database
      await prisma.productVariation.update({
        where: { id: variation.id },
        data: { image: cloudinaryUrl }
      });
      
      results.success.push({
        id: variation.id,
        oldImage: variation.image.substring(0, 50) + '...',
        newImage: cloudinaryUrl
      });
      
      console.log(`✅ Updated variation ${variation.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to process variation ${variation.id}:`, error.message);
      results.failed.push({
        id: variation.id,
        error: error.message
      });
    }
  }

  return results;
}

// Main migration function
async function migrateAllImages() {
  console.log('🚀 Starting Complete Image Migration to Cloudinary\n');
  console.log('=====================================\n');

  try {
    // Test Cloudinary connection
    console.log('🔗 Testing Cloudinary connection...');
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful\n');

    const allResults = {
      base64: await processBase64Images(),
      localFiles: await processLocalFiles(),
      variations: await processVariations()
    };

    // Summary report
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('====================');
    console.log(`Base64 Images: ${allResults.base64.success.length} success, ${allResults.base64.failed.length} failed`);
    console.log(`Local Files: ${allResults.localFiles.success.length} success, ${allResults.localFiles.failed.length} failed`);
    console.log(`Variations: ${allResults.variations.success.length} success, ${allResults.variations.failed.length} failed`);

    const totalSuccess = allResults.base64.success.length + allResults.localFiles.success.length + allResults.variations.success.length;
    const totalFailed = allResults.base64.failed.length + allResults.localFiles.failed.length + allResults.variations.failed.length;

    console.log(`\n🎉 TOTAL: ${totalSuccess} images migrated successfully, ${totalFailed} failed`);

    if (totalFailed > 0) {
      console.log('\n❌ Failed items:');
      [...allResults.base64.failed, ...allResults.localFiles.failed, ...allResults.variations.failed].forEach(item => {
        console.log(`  - ${item.id || item.slug}: ${item.error}`);
      });
    }

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
  migrateAllImages()
    .then(() => {
      console.log('\n✅ Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAllImages }; 