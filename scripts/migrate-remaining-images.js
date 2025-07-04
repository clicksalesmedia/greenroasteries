const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function migrateRemainingImages() {
  console.log('🔄 Migrating remaining images to Cloudinary...');
  
  try {
    let totalMigrated = 0;
    
    // 1. Migrate ProductImage (gallery images)
    console.log('\n1️⃣ Migrating gallery images...');
    const galleryImages = await prisma.productImage.findMany({
      where: {
        url: {
          startsWith: '/products/gallery/'
        }
      }
    });
    
    let galleryCount = 0;
    for (const image of galleryImages) {
      if (image.url && image.url.startsWith('/products/gallery/')) {
        // Extract filename
        const filename = image.url.split('/').pop();
        const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Create Cloudinary URL with proper duplicate path structure
        const cloudinaryUrl = `https://res.cloudinary.com/dgcexgq5g/image/upload/v1751619000/greenroasteries/products/gallery/greenroasteries/products/gallery/${filenameWithoutExt}.webp`;
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: cloudinaryUrl }
        });
        
        console.log(`✅ Migrated gallery image: ${filename}`);
        galleryCount++;
      }
    }
    console.log(`📊 Migrated ${galleryCount} gallery images`);
    totalMigrated += galleryCount;
    
    // 2. Migrate Slider images
    console.log('\n2️⃣ Migrating slider images...');
    const sliders = await prisma.slider.findMany({
      where: {
        imageUrl: {
          startsWith: '/sliders/'
        }
      }
    });
    
    let sliderCount = 0;
    for (const slider of sliders) {
      if (slider.imageUrl && slider.imageUrl.startsWith('/sliders/')) {
        // Extract filename
        const filename = slider.imageUrl.split('/').pop();
        const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Create Cloudinary URL with proper duplicate path structure
        const cloudinaryUrl = `https://res.cloudinary.com/dgcexgq5g/image/upload/v1751619000/greenroasteries/sliders/greenroasteries/sliders/${filenameWithoutExt}.webp`;
        
        await prisma.slider.update({
          where: { id: slider.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        console.log(`✅ Migrated slider image: ${filename}`);
        sliderCount++;
      }
    }
    console.log(`📊 Migrated ${sliderCount} slider images`);
    totalMigrated += sliderCount;
    
    // 3. Check for any remaining local images
    console.log('\n3️⃣ Checking for other local images...');
    
    // Check categories
    const localCategories = await prisma.category.findMany({
      where: {
        imageUrl: {
          startsWith: '/uploads/'
        }
      }
    });
    
    let categoryCount = 0;
    for (const category of localCategories) {
      if (category.imageUrl && category.imageUrl.startsWith('/uploads/')) {
        // Extract filename
        const pathParts = category.imageUrl.split('/');
        const filename = pathParts.pop();
        const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Create Cloudinary URL with proper duplicate path structure
        const cloudinaryUrl = `https://res.cloudinary.com/dgcexgq5g/image/upload/v1751619000/greenroasteries/categories/greenroasteries/categories/${filenameWithoutExt}.webp`;
        
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        console.log(`✅ Migrated category image: ${filename}`);
        categoryCount++;
      }
    }
    console.log(`📊 Migrated ${categoryCount} additional category images`);
    totalMigrated += categoryCount;
    
    // Check products with local images
    const localProducts = await prisma.product.findMany({
      where: {
        imageUrl: {
          startsWith: '/uploads/'
        }
      }
    });
    
    let productCount = 0;
    for (const product of localProducts) {
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        // Extract filename
        const pathParts = product.imageUrl.split('/');
        const filename = pathParts.pop();
        const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Create Cloudinary URL with proper duplicate path structure
        const cloudinaryUrl = `https://res.cloudinary.com/dgcexgq5g/image/upload/v1751619000/greenroasteries/products/greenroasteries/products/${filenameWithoutExt}.webp`;
        
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        console.log(`✅ Migrated product image: ${filename}`);
        productCount++;
      }
    }
    console.log(`📊 Migrated ${productCount} additional product images`);
    totalMigrated += productCount;
    
    // Check variations with local images
    const localVariations = await prisma.productVariation.findMany({
      where: {
        imageUrl: {
          startsWith: '/uploads/'
        }
      }
    });
    
    let variationCount = 0;
    for (const variation of localVariations) {
      if (variation.imageUrl && variation.imageUrl.startsWith('/uploads/')) {
        // Extract filename
        const pathParts = variation.imageUrl.split('/');
        const filename = pathParts.pop();
        const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Create Cloudinary URL with proper duplicate path structure
        const cloudinaryUrl = `https://res.cloudinary.com/dgcexgq5g/image/upload/v1751619000/greenroasteries/variations/greenroasteries/variations/${filenameWithoutExt}.webp`;
        
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: cloudinaryUrl }
        });
        
        console.log(`✅ Migrated variation image: ${filename}`);
        variationCount++;
      }
    }
    console.log(`📊 Migrated ${variationCount} additional variation images`);
    totalMigrated += variationCount;
    
    // Summary
    console.log('\n🎉 Migration complete!');
    console.log(`📈 Total images migrated: ${totalMigrated}`);
    console.log('   - Gallery images:', galleryCount);
    console.log('   - Slider images:', sliderCount);
    console.log('   - Additional category images:', categoryCount);
    console.log('   - Additional product images:', productCount);
    console.log('   - Additional variation images:', variationCount);
    
    // Test some gallery images
    console.log('\n🔍 Testing gallery images...');
    const testGalleryImages = await prisma.productImage.findMany({
      where: {
        url: {
          contains: 'cloudinary.com'
        }
      },
      take: 3
    });
    
    testGalleryImages.forEach((image, index) => {
      console.log(`Sample gallery image ${index + 1}: ${image.url}`);
    });
    
  } catch (error) {
    console.error('❌ Error migrating images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateRemainingImages(); 