const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function revertGalleryImages() {
  console.log('🔄 Reverting gallery images back to local paths...');
  
  try {
    // Revert ProductImage (gallery images) back to local paths
    console.log('\n1️⃣ Reverting gallery images...');
    const galleryImages = await prisma.productImage.findMany({
      where: {
        url: {
          contains: 'greenroasteries/products/gallery/greenroasteries/products/gallery/'
        }
      }
    });
    
    let galleryCount = 0;
    for (const image of galleryImages) {
      if (image.url && image.url.includes('greenroasteries/products/gallery/greenroasteries/products/gallery/')) {
        // Extract filename from Cloudinary URL
        const urlParts = image.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        // Create local path
        const localPath = `/products/gallery/${filename}`;
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: localPath }
        });
        
        console.log(`✅ Reverted gallery image: ${filename}`);
        galleryCount++;
      }
    }
    console.log(`📊 Reverted ${galleryCount} gallery images to local paths`);
    
    // Test some gallery images
    console.log('\n🔍 Testing reverted gallery images...');
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
    console.error('❌ Error reverting gallery images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the revert
revertGalleryImages(); 