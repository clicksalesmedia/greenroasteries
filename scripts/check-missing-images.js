#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function checkMissingImages() {
  try {
    // Fetch all products from API
    const response = await fetch('https://thegreenroasteries.com/api/products');
    const products = await response.json();
    
    const missingImages = [];
    const workingImages = [];
    
    console.log(`Checking ${products.length} products for missing images...`);
    
    for (const product of products) {
      if (product.imageUrl) {
        // Test if image is accessible
        try {
          const imageResponse = await fetch(`https://thegreenroasteries.com${product.imageUrl}`, { method: 'HEAD' });
          
          if (imageResponse.status === 200) {
            workingImages.push({
              id: product.id,
              name: product.name,
              imageUrl: product.imageUrl
            });
          } else {
            missingImages.push({
              id: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              status: imageResponse.status
            });
          }
        } catch (error) {
          missingImages.push({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            error: error.message
          });
        }
      } else {
        missingImages.push({
          id: product.id,
          name: product.name,
          imageUrl: null,
          issue: 'No image URL in database'
        });
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log(`✅ Working images: ${workingImages.length}`);
    console.log(`❌ Missing images: ${missingImages.length}`);
    
    if (missingImages.length > 0) {
      console.log('\n=== MISSING IMAGES ===');
      missingImages.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   URL: ${product.imageUrl || 'NULL'}`);
        console.log(`   Issue: ${product.status || product.error || product.issue}`);
        console.log('');
      });
      
      // Save missing images list to file
      fs.writeFileSync(
        path.join(__dirname, '../missing-images-report.json'),
        JSON.stringify({ missingImages, workingImages }, null, 2)
      );
      
      console.log('📄 Report saved to missing-images-report.json');
      
      // If there's a working image, suggest using it as template
      if (workingImages.length > 0) {
        console.log(`\n💡 Suggestion: Use ${workingImages[0].imageUrl} as a placeholder for missing images`);
      }
    }
    
    return { missingImages, workingImages };
    
  } catch (error) {
    console.error('Error checking images:', error);
    return null;
  }
}

// Run the check
checkMissingImages(); 