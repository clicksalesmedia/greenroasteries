const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function fixAllImageUrls() {
  console.log('🔧 Fixing all image URLs to match actual Cloudinary structure...');
  
  try {
    let totalFixed = 0;
    
    // 1. Fix Product main images (imageUrl)
    console.log('\n1️⃣ Fixing Product main images...');
    const products = await prisma.product.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let productMainCount = 0;
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
        // Check if it needs the duplicate path restored
        if (!product.imageUrl.includes('greenroasteries/products/greenroasteries/products/')) {
          const correctedUrl = product.imageUrl.replace(
            /greenroasteries\/products\//,
            'greenroasteries/products/greenroasteries/products/'
          );
          
          await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: correctedUrl }
          });
          
          console.log(`✅ Fixed main image: ${product.name}`);
          productMainCount++;
        }
      }
    }
    console.log(`📊 Fixed ${productMainCount} product main images`);
    totalFixed += productMainCount;
    
    // 2. Fix Product gallery images
    console.log('\n2️⃣ Fixing Product gallery images...');
    const productsWithGallery = await prisma.product.findMany({
      where: {
        images: {
          some: {
            url: {
              contains: 'cloudinary.com'
            }
          }
        }
      },
      include: {
        images: true
      }
    });
    
    let galleryCount = 0;
    for (const product of productsWithGallery) {
      for (const image of product.images) {
        if (image.url && image.url.includes('cloudinary.com')) {
          // Check if it needs the duplicate path restored for gallery
          if (!image.url.includes('greenroasteries/products/gallery/greenroasteries/products/gallery/') &&
              !image.url.includes('greenroasteries/products/greenroasteries/products/')) {
            
            let correctedUrl;
            if (image.url.includes('products/gallery/')) {
              // Gallery image
              correctedUrl = image.url.replace(
                /greenroasteries\/products\/gallery\//,
                'greenroasteries/products/gallery/greenroasteries/products/gallery/'
              );
            } else {
              // Regular product image in gallery
              correctedUrl = image.url.replace(
                /greenroasteries\/products\//,
                'greenroasteries/products/greenroasteries/products/'
              );
            }
            
            await prisma.productImage.update({
              where: { id: image.id },
              data: { url: correctedUrl }
            });
            
            console.log(`✅ Fixed gallery image: ${image.id}`);
            galleryCount++;
          }
        }
      }
    }
    console.log(`📊 Fixed ${galleryCount} gallery images`);
    totalFixed += galleryCount;
    
    // 3. Fix Product variation images
    console.log('\n3️⃣ Fixing Product variation images...');
    const variations = await prisma.productVariation.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let variationCount = 0;
    for (const variation of variations) {
      if (variation.imageUrl && variation.imageUrl.includes('cloudinary.com')) {
        // Check if it needs the duplicate path restored
        if (!variation.imageUrl.includes('greenroasteries/variations/greenroasteries/variations/')) {
          const correctedUrl = variation.imageUrl.replace(
            /greenroasteries\/variations\//,
            'greenroasteries/variations/greenroasteries/variations/'
          );
          
          await prisma.productVariation.update({
            where: { id: variation.id },
            data: { imageUrl: correctedUrl }
          });
          
          console.log(`✅ Fixed variation image: ${variation.id}`);
          variationCount++;
        }
      }
    }
    console.log(`📊 Fixed ${variationCount} variation images`);
    totalFixed += variationCount;
    
    // 4. Fix Category images
    console.log('\n4️⃣ Fixing Category images...');
    const categories = await prisma.category.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let categoryCount = 0;
    for (const category of categories) {
      if (category.imageUrl && category.imageUrl.includes('cloudinary.com')) {
        // Check if it needs the duplicate path restored
        if (!category.imageUrl.includes('greenroasteries/categories/greenroasteries/categories/')) {
          const correctedUrl = category.imageUrl.replace(
            /greenroasteries\/categories\//,
            'greenroasteries/categories/greenroasteries/categories/'
          );
          
          await prisma.category.update({
            where: { id: category.id },
            data: { imageUrl: correctedUrl }
          });
          
          console.log(`✅ Fixed category image: ${category.name}`);
          categoryCount++;
        }
      }
    }
    console.log(`📊 Fixed ${categoryCount} category images`);
    totalFixed += categoryCount;
    
    // 5. Fix Slider images
    console.log('\n5️⃣ Fixing Slider images...');
    const sliders = await prisma.slider.findMany({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    let sliderCount = 0;
    for (const slider of sliders) {
      if (slider.imageUrl && slider.imageUrl.includes('cloudinary.com')) {
        // Check if it needs the duplicate path restored
        if (!slider.imageUrl.includes('greenroasteries/sliders/greenroasteries/sliders/')) {
          const correctedUrl = slider.imageUrl.replace(
            /greenroasteries\/sliders\//,
            'greenroasteries/sliders/greenroasteries/sliders/'
          );
          
          await prisma.slider.update({
            where: { id: slider.id },
            data: { imageUrl: correctedUrl }
          });
          
          console.log(`✅ Fixed slider image: ${slider.title}`);
          sliderCount++;
        }
      }
    }
    console.log(`📊 Fixed ${sliderCount} slider images`);
    totalFixed += sliderCount;
    
    // Summary
    console.log('\n🎉 All image URLs have been fixed!');
    console.log(`📈 Total images fixed: ${totalFixed}`);
    console.log('   - Product main images:', productMainCount);
    console.log('   - Gallery images:', galleryCount);
    console.log('   - Variation images:', variationCount);
    console.log('   - Category images:', categoryCount);
    console.log('   - Slider images:', sliderCount);
    
    // Test a few URLs
    console.log('\n🔍 Testing some URLs...');
    const testProduct = await prisma.product.findFirst({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    if (testProduct && testProduct.imageUrl) {
      console.log('Sample product URL:', testProduct.imageUrl);
    }
    
    const testVariation = await prisma.productVariation.findFirst({
      where: {
        imageUrl: {
          contains: 'cloudinary.com'
        }
      }
    });
    
    if (testVariation && testVariation.imageUrl) {
      console.log('Sample variation URL:', testVariation.imageUrl);
    }
    
  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAllImageUrls(); 