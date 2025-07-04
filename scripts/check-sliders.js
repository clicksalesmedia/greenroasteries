const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function checkSliders() {
  console.log('🔍 Checking sliders...');
  
  try {
    // Find all sliders (including inactive ones)
    const sliders = await prisma.slider.findMany({
      take: 10
    });
    
    console.log(`Found ${sliders.length} sliders in database:`);
    
    sliders.forEach((slider, index) => {
      console.log(`\n${index + 1}. Slider: ${slider.title}`);
      console.log(`   ID: ${slider.id}`);
      console.log(`   Image URL: ${slider.imageUrl}`);
      console.log(`   Active: ${slider.isActive}`);
      console.log(`   Order: ${slider.order}`);
    });
    
    // Check if any sliders need URL fixing
    const slidersWithLocalPaths = await prisma.slider.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: '/uploads/' } },
          { imageUrl: { startsWith: '/sliders/' } }
        ]
      }
    });
    
    console.log(`\n🔧 Found ${slidersWithLocalPaths.length} sliders with local paths that may need fixing`);
    
    slidersWithLocalPaths.forEach((slider, index) => {
      console.log(`${index + 1}. ${slider.title}: ${slider.imageUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking sliders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSliders(); 