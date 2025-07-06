const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function fixSliderUrls() {
  console.log('🔍 Checking and fixing slider URLs...');
  
  try {
    // First, let's see what we have
    const sliders = await prisma.slider.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        overlayImageUrl: true
      }
    });
    
    console.log(`Found ${sliders.length} sliders:`);
    
    let fixedCount = 0;
    
    for (const slider of sliders) {
      console.log(`\n${slider.title || slider.id}:`);
      console.log(`  Current imageUrl: ${slider.imageUrl}`);
      
      let updateData = {};
      
      // Fix main image URL if it has duplicate paths
      if (slider.imageUrl && slider.imageUrl.includes('greenroasteries/sliders/sliders/')) {
        const fixedImageUrl = slider.imageUrl.replace(
          /greenroasteries\/sliders\/sliders\//g,
          'greenroasteries/sliders/'
        );
        updateData.imageUrl = fixedImageUrl;
        console.log(`  Fixed imageUrl: ${fixedImageUrl}`);
      }
      
      // Fix overlay image URL if it exists and has duplicate paths
      if (slider.overlayImageUrl && slider.overlayImageUrl.includes('greenroasteries/sliders/sliders/')) {
        const fixedOverlayUrl = slider.overlayImageUrl.replace(
          /greenroasteries\/sliders\/sliders\//g,
          'greenroasteries/sliders/'
        );
        updateData.overlayImageUrl = fixedOverlayUrl;
        console.log(`  Fixed overlayImageUrl: ${fixedOverlayUrl}`);
      }
      
      // Update the database if we have changes
      if (Object.keys(updateData).length > 0) {
        await prisma.slider.update({
          where: { id: slider.id },
          data: updateData
        });
        fixedCount++;
        console.log(`  ✅ Updated slider!`);
      } else {
        console.log(`  ✨ No changes needed`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} slider URLs!`);
    
  } catch (error) {
    console.error('❌ Error fixing slider URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSliderUrls(); 