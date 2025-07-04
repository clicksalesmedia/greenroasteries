const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function fixOldGalleryPaths() {
  console.log('🔄 Fixing old gallery image paths...');
  
  try {
    // Find gallery images with old /uploads/ paths
    const oldGalleryImages = await prisma.productImage.findMany({
      where: {
        url: {
          startsWith: '/uploads/products/gallery/'
        }
      }
    });
    
    console.log(`Found ${oldGalleryImages.length} gallery images with old paths`);
    
    let fixedCount = 0;
    for (const image of oldGalleryImages) {
      if (image.url && image.url.startsWith('/uploads/products/gallery/')) {
        // Extract filename
        const filename = image.url.split('/').pop();
        
        // Create new path
        const newPath = `/products/gallery/${filename}`;
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: newPath }
        });
        
        console.log(`✅ Fixed: ${image.url} → ${newPath}`);
        fixedCount++;
      }
    }
    
    console.log(`📊 Fixed ${fixedCount} gallery image paths`);
    
    // Verify the fix
    console.log('\n🔍 Testing fixed paths...');
    const testGalleryImages = await prisma.productImage.findMany({
      where: {
        url: {
          startsWith: '/products/gallery/'
        }
      },
      take: 3
    });
    
    testGalleryImages.forEach((image, index) => {
      console.log(`Sample gallery image ${index + 1}: ${image.url}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing gallery paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixOldGalleryPaths(); 