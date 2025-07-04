const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function debugAllImages() {
  console.log('🔍 Comprehensive Image Debug Report\n');
  
  try {
    // 1. Check gallery images in database
    console.log('1️⃣ GALLERY IMAGES:');
    const galleryCount = await prisma.productImage.count();
    console.log(`Total gallery images in database: ${galleryCount}`);
    
    if (galleryCount > 0) {
      const sampleGallery = await prisma.productImage.findMany({
        take: 3,
        include: {
          product: {
            select: { name: true }
          }
        }
      });
      
      console.log('Sample gallery images:');
      sampleGallery.forEach((img, index) => {
        console.log(`   ${index + 1}. Product: ${img.product.name}`);
        console.log(`      URL: ${img.url}`);
        console.log(`      ProductId: ${img.productId}`);
      });
    }
    
    // 2. Check products with gallery images via API
    console.log('\n2️⃣ PRODUCTS API RESPONSE:');
    try {
      const response = await fetch('http://localhost:3000/api/products?limit=3');
      const products = await response.json();
      
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. Product: ${product.name}`);
        console.log(`      Main Image: ${product.imageUrl || 'NONE'}`);
        console.log(`      Gallery Images: ${product.images ? product.images.length : 0}`);
        if (product.images && product.images.length > 0) {
          product.images.forEach((img, imgIndex) => {
            console.log(`         ${imgIndex + 1}. ${img.url || img.imageUrl || 'NO URL'}`);
          });
        }
      });
    } catch (error) {
      console.log('   ❌ Failed to fetch products API:', error.message);
    }
    
    // 3. Check slider images
    console.log('\n3️⃣ SLIDER IMAGES:');
    const sliderCount = await prisma.slider.count();
    console.log(`Total sliders in database: ${sliderCount}`);
    
    if (sliderCount > 0) {
      const sliders = await prisma.slider.findMany({
        take: 5
      });
      
      console.log('Sliders:');
      sliders.forEach((slider, index) => {
        console.log(`   ${index + 1}. Title: ${slider.title}`);
        console.log(`      URL: ${slider.imageUrl || 'NONE'}`);
        console.log(`      Active: ${slider.isActive}`);
      });
      
      // Test sliders API
      try {
        const response = await fetch('http://localhost:3000/api/sliders');
        const apiSliders = await response.json();
        console.log(`API returned ${apiSliders.length} active sliders`);
      } catch (error) {
        console.log('   ❌ Failed to fetch sliders API:', error.message);
      }
    }
    
    // 4. Check main product images
    console.log('\n4️⃣ MAIN PRODUCT IMAGES:');
    const productImageStats = await prisma.product.aggregate({
      _count: {
        imageUrl: true
      }
    });
    
    const totalProducts = await prisma.product.count();
    console.log(`Products with main images: ${productImageStats._count.imageUrl}/${totalProducts}`);
    
    // Sample main product images
    const sampleProducts = await prisma.product.findMany({
      where: {
        imageUrl: {
          not: ''
        }
      },
      select: {
        name: true,
        imageUrl: true
      },
      take: 3
    });
    
    console.log('Sample main images:');
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}: ${product.imageUrl}`);
    });
    
    console.log('\n✅ Debug report complete');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAllImages(); 