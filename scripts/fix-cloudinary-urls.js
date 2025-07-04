const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function fixCloudinaryUrls() {
  console.log('Starting to fix Cloudinary URLs with duplicate paths...');
  
  try {
    // Fix Product imageUrl
    console.log('\n1. Fixing Product imageUrls...');
    const products = await prisma.product.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let productCount = 0;
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.includes('greenroasteries/products/greenroasteries/products/')) {
        const fixedUrl = product.imageUrl.replace(
          /greenroasteries\/(products|categories|sliders|variations)\/greenroasteries\/(products|categories|sliders|variations)\//g,
          'greenroasteries/$1/'
        );
        
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: fixedUrl }
        });
        
        console.log(`Fixed: ${product.name}`);
        console.log(`  Old: ${product.imageUrl}`);
        console.log(`  New: ${fixedUrl}`);
        productCount++;
      }
    }
    console.log(`Fixed ${productCount} product imageUrls`);
    
    // Fix ProductImage urls
    console.log('\n2. Fixing ProductImage urls...');
    const productImages = await prisma.productImage.findMany({
      where: {
        url: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let imageCount = 0;
    for (const image of productImages) {
      if (image.url && image.url.includes('greenroasteries/products/greenroasteries/products/')) {
        const fixedUrl = image.url.replace(
          /greenroasteries\/(products|categories|sliders|variations)\/greenroasteries\/(products|categories|sliders|variations)\//g,
          'greenroasteries/$1/'
        );
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: fixedUrl }
        });
        
        console.log(`Fixed gallery image: ${image.id}`);
        imageCount++;
      }
    }
    console.log(`Fixed ${imageCount} gallery images`);
    
    // Fix ProductVariation imageUrls
    console.log('\n3. Fixing ProductVariation imageUrls...');
    const variations = await prisma.productVariation.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let variationCount = 0;
    for (const variation of variations) {
      if (variation.imageUrl && variation.imageUrl.includes('greenroasteries/variations/greenroasteries/variations/')) {
        const fixedUrl = variation.imageUrl.replace(
          /greenroasteries\/(products|categories|sliders|variations)\/greenroasteries\/(products|categories|sliders|variations)\//g,
          'greenroasteries/$1/'
        );
        
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: fixedUrl }
        });
        
        console.log(`Fixed variation: ${variation.id}`);
        variationCount++;
      }
    }
    console.log(`Fixed ${variationCount} variation images`);
    
    // Fix Category imageUrls
    console.log('\n4. Fixing Category imageUrls...');
    const categories = await prisma.category.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let categoryCount = 0;
    for (const category of categories) {
      if (category.imageUrl && category.imageUrl.includes('greenroasteries/categories/greenroasteries/categories/')) {
        const fixedUrl = category.imageUrl.replace(
          /greenroasteries\/(products|categories|sliders|variations)\/greenroasteries\/(products|categories|sliders|variations)\//g,
          'greenroasteries/$1/'
        );
        
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: fixedUrl }
        });
        
        console.log(`Fixed category: ${category.name}`);
        categoryCount++;
      }
    }
    console.log(`Fixed ${categoryCount} category images`);
    
    // Fix Slider imageUrls
    console.log('\n5. Fixing Slider imageUrls...');
    const sliders = await prisma.slider.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let sliderCount = 0;
    for (const slider of sliders) {
      if (slider.imageUrl && slider.imageUrl.includes('greenroasteries/sliders/greenroasteries/sliders/')) {
        const fixedUrl = slider.imageUrl.replace(
          /greenroasteries\/(products|categories|sliders|variations)\/greenroasteries\/(products|categories|sliders|variations)\//g,
          'greenroasteries/$1/'
        );
        
        await prisma.slider.update({
          where: { id: slider.id },
          data: { imageUrl: fixedUrl }
        });
        
        console.log(`Fixed slider: ${slider.title}`);
        sliderCount++;
      }
    }
    console.log(`Fixed ${sliderCount} slider images`);
    
    console.log('\n✅ All Cloudinary URLs have been fixed!');
    console.log(`Total fixes: ${productCount + imageCount + variationCount + categoryCount + sliderCount}`);
    
  } catch (error) {
    console.error('Error fixing URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixCloudinaryUrls(); 