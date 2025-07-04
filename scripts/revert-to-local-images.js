const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revertToLocalImages() {
  try {
    console.log('Starting to revert Cloudinary URLs back to local paths...\n');

    // 1. Revert main product images
    const productsWithCloudinary = await prisma.product.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });

    console.log(`Found ${productsWithCloudinary.length} products with Cloudinary URLs`);

    for (const product of productsWithCloudinary) {
      // Extract filename from Cloudinary URL
      const match = product.imageUrl.match(/greenroasteries\/products\/([^\/]+)$/);
      if (match) {
        const filename = match[1] + '.webp';
        const localPath = `/products/${filename}`;
        
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: localPath }
        });
        
        console.log(`Reverted product ${product.id}: ${product.imageUrl} -> ${localPath}`);
      }
    }

    // 2. Revert gallery images
    const galleryImagesWithCloudinary = await prisma.productImage.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });

    console.log(`\nFound ${galleryImagesWithCloudinary.length} gallery images with Cloudinary URLs`);

    for (const image of galleryImagesWithCloudinary) {
      // Extract filename from Cloudinary URL
      const match = image.imageUrl.match(/greenroasteries\/products\/gallery\/([^\/]+)$/);
      if (match) {
        const filename = match[1] + '.webp';
        const localPath = `/products/gallery/${filename}`;
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { imageUrl: localPath }
        });
        
        console.log(`Reverted gallery image ${image.id}: ${image.imageUrl} -> ${localPath}`);
      }
    }

    // 3. Check variations (they should still be Cloudinary URLs as they were migrated earlier)
    const variationsCount = await prisma.productVariation.count({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });

    console.log(`\n${variationsCount} variations still have Cloudinary URLs (keeping them as is)`);

    // 4. Check categories
    const categoriesCount = await prisma.category.count({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });

    console.log(`${categoriesCount} categories still have Cloudinary URLs (keeping them as is)`);

    console.log('\nReversion complete!');

  } catch (error) {
    console.error('Error reverting images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertToLocalImages(); 