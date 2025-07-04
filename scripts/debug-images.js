const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function debugImages() {
  console.log('🔍 Debugging image issues...\n');
  
  try {
    // 1. Check gallery images
    console.log('1️⃣ Gallery Images:');
    const galleryImages = await prisma.productImage.findMany({
      take: 5,
      include: {
        product: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Total gallery images: ${galleryImages.length}`);
    galleryImages.forEach((img, index) => {
      console.log(`   ${index + 1}. Product: ${img.product.name}`);
      console.log(`      URL: ${img.url}`);
      console.log(`      ProductId: ${img.productId}`);
    });
    
    // 2. Check products with gallery images
    console.log('\n2️⃣ Products with Gallery Images:');
    const productsWithGallery = await prisma.product.findMany({
      where: {
        images: {
          some: {}
        }
      },
      include: {
        images: true
      },
      take: 3
    });
    
    console.log(`Products with gallery: ${productsWithGallery.length}`);
    productsWithGallery.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.images.length} images)`);
      product.images.forEach((img, imgIndex) => {
        console.log(`      - ${imgIndex + 1}: ${img.url}`);
      });
    });
    
    // 3. Check sliders
    console.log('\n3️⃣ Sliders:');
    const sliders = await prisma.slider.findMany({
      take: 5
    });
    
    console.log(`Total sliders: ${sliders.length}`);
    sliders.forEach((slider, index) => {
      console.log(`   ${index + 1}. ${slider.title}`);
      console.log(`      URL: ${slider.imageUrl}`);
      console.log(`      Active: ${slider.isActive}`);
    });
    
    // 4. Check categories
    console.log('\n4️⃣ Categories:');
    const categories = await prisma.category.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      take: 3
    });
    
    console.log(`Categories with images: ${categories.length}`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
      console.log(`      URL: ${cat.imageUrl}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugImages(); 