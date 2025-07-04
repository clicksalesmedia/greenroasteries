#!/usr/bin/env node

/**
 * Comprehensive Cloudinary Migration Script
 * 
 * This script migrates all local images to Cloudinary and updates database references
 * while maintaining backward compatibility and zero downtime.
 */

const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function makeApiCall(action) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ action });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/cloudinary-migration',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function displayMigrationStats(stats) {
  console.log('\n🔄 MIGRATION RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Total Images: ${stats.total}`);
  console.log(`✅ Successfully Migrated: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏭️  Skipped (Already migrated): ${stats.skipped}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Detailed breakdown
  if (stats.details) {
    console.log('\n📋 DETAILED BREAKDOWN:');
    
    const sections = [
      { name: 'Categories', data: stats.details.categories },
      { name: 'Products', data: stats.details.products },
      { name: 'Product Gallery', data: stats.details.productImages },
      { name: 'Variations', data: stats.details.variations },
      { name: 'Sliders', data: stats.details.sliders }
    ];

    sections.forEach(section => {
      if (section.data && section.data.length > 0) {
        const sectionSuccess = section.data.filter(r => r.success).length;
        const sectionFailed = section.data.filter(r => !r.success).length;
        console.log(`\n🏷️  ${section.name}: ${sectionSuccess} success, ${sectionFailed} failed`);
        
        // Show failed items
        const failures = section.data.filter(r => !r.success);
        if (failures.length > 0) {
          console.log('   Failed items:');
          failures.forEach(failure => {
            console.log(`   ❌ ${failure.localPath}: ${failure.error || failure.message}`);
          });
        }
      }
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function runMigration() {
  console.log('🚀 CLOUDINARY MIGRATION TOOL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This tool will migrate all your images to Cloudinary and update database references.');
  console.log('');
  console.log('📝 What will be migrated:');
  console.log('   • Category images');
  console.log('   • Product main images');
  console.log('   • Product gallery images');
  console.log('   • Product variation images');
  console.log('   • Slider images and overlays');
  console.log('');
  console.log('✨ Benefits:');
  console.log('   • Faster image loading');
  console.log('   • Automatic optimization (WebP, compression)');
  console.log('   • Better performance');
  console.log('   • CDN delivery worldwide');
  console.log('');
  console.log('⚠️  Important notes:');
  console.log('   • Original files will remain untouched');
  console.log('   • Database URLs will be updated to Cloudinary');
  console.log('   • Already migrated images will be skipped');
  console.log('   • Process can be run multiple times safely');
  console.log('');

  const answer = await new Promise(resolve => {
    rl.question('Do you want to proceed with the migration? (y/N): ', resolve);
  });

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ Migration cancelled.');
    rl.close();
    return;
  }

  console.log('\n🔄 Starting migration...');
  console.log('This may take a few minutes depending on the number of images...\n');

  try {
    const startTime = Date.now();
    const result = await makeApiCall('migrate-all');
    const endTime = Date.now();
    
    if (result.success) {
      console.log(`✅ Migration completed successfully in ${Math.round((endTime - startTime) / 1000)}s`);
      displayMigrationStats(result.stats);
      
      if (result.stats.failed > 0) {
        console.log('\n⚠️  Some images failed to migrate. Please check the details above.');
        console.log('You can run this script again to retry failed migrations.');
      } else {
        console.log('\n🎉 All images successfully migrated to Cloudinary!');
        console.log('Your website is now using optimized Cloudinary delivery.');
      }
    } else {
      console.log('❌ Migration failed:', result.message);
      if (result.error) {
        console.log('Error details:', result.error);
      }
    }
  } catch (error) {
    console.log('❌ Error during migration:', error.message);
    console.log('\nMake sure your development server is running (npm run dev) and try again.');
  }

  rl.close();
}

// Check if server is running
console.log('🔍 Checking if development server is running...');

makeApiCall('test').then(() => {
  runMigration();
}).catch(() => {
  console.log('❌ Development server not found!');
  console.log('Please start your development server first:');
  console.log('   npm run dev');
  console.log('');
  console.log('Then run this script again.');
  rl.close();
}); 