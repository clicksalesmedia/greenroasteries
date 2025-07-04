const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function checkGalleryImages() {
  console.log('🔍 Checking gallery images...');
  
  try {
    // Find products with gallery images
    const productsWithGallery = await prisma.product.findMany({
      where: {
        images: {
          some: {}
        }
      },
      include: {
        images: true
      },
      take: 5
    });
    
    console.log(`Found ${productsWithGallery.length} products with gallery images:`);
    
    productsWithGallery.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Gallery images: ${product.images.length}`);
      product.images.forEach((img, imgIndex) => {
        console.log(`     ${imgIndex + 1}: ${img.url}`);
      });
    });
    
    // Test API for one of these products
    if (productsWithGallery.length > 0) {
      const testProduct = productsWithGallery[0];
      console.log(`\n🧪 Testing API for product: ${testProduct.name}`);
      console.log(`Product ID: ${testProduct.id}`);
      console.log(`Should have ${testProduct.images.length} gallery images`);
    }
    
  } catch (error) {
    console.error('❌ Error checking gallery images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkGalleryImages(); 