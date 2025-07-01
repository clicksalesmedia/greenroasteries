const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function fixImageUrls() {
  console.log('🔍 Starting image URL fix...');
  
  try {
    // Fix product main images
    const productsWithBadUrls = await prisma.product.findMany({
      where: {
        imageUrl: {
          startsWith: '/products/'
        }
      }
    });

    console.log(`📦 Found ${productsWithBadUrls.length} products with incorrect image URLs`);

    for (const product of productsWithBadUrls) {
      const correctUrl = product.imageUrl.replace('/products/', '/uploads/products/');
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: correctUrl }
      });
      console.log(`✅ Fixed product: ${product.name} - ${product.imageUrl} → ${correctUrl}`);
    }

    // Fix product gallery images
    const galleryImagesWithBadUrls = await prisma.productImage.findMany({
      where: {
        url: {
          startsWith: '/products/'
        }
      }
    });

    console.log(`🖼️ Found ${galleryImagesWithBadUrls.length} gallery images with incorrect URLs`);

    for (const image of galleryImagesWithBadUrls) {
      const correctUrl = image.url.replace('/products/', '/uploads/products/');
      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: correctUrl }
      });
      console.log(`✅ Fixed gallery image: ${image.url} → ${correctUrl}`);
    }

    // Fix variation images
    const variationsWithBadUrls = await prisma.productVariation.findMany({
      where: {
        imageUrl: {
          startsWith: '/products/'
        }
      }
    });

    console.log(`🔄 Found ${variationsWithBadUrls.length} variations with incorrect image URLs`);

    for (const variation of variationsWithBadUrls) {
      const correctUrl = variation.imageUrl.replace('/products/', '/uploads/products/');
      await prisma.productVariation.update({
        where: { id: variation.id },
        data: { imageUrl: correctUrl }
      });
      console.log(`✅ Fixed variation image: ${variation.imageUrl} → ${correctUrl}`);
    }

    console.log('🎉 All image URLs have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixImageUrls(); 