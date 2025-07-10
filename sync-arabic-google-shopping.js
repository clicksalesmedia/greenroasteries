#!/usr/bin/env node

// Since we're in a Node.js environment, we need to use dynamic imports for TypeScript
async function syncArabicProducts() {
  const { PrismaClient } = require('./app/generated/prisma');
  
  // Dynamic import for the TypeScript Google Shopping service
  const { GoogleShoppingService } = await import('./app/lib/google-shopping.js');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting Arabic Google Shopping Sync...\n');
    
    // Initialize Google Shopping service for Arabic
    const googleShopping = new GoogleShoppingService('ar');
    
    if (!googleShopping.isConfigured()) {
      console.error('❌ Google Shopping not configured. Please check your environment variables.');
      process.exit(1);
    }
    
    // Get products with Arabic content
    console.log('📋 Fetching products with Arabic content...');
    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        AND: [
          { nameAr: { not: null } },
          { nameAr: { not: '' } }
        ]
      },
      include: {
        category: true,
        images: true,
        variations: {
          where: { isActive: true },
          include: {
            variationType: true,
            beans: true,
            size: true
          }
        }
      },
      take: 20 // Start with first 20 products
    });
    
    console.log(`📊 Found ${products.length} products with Arabic content\n`);
    
    if (products.length === 0) {
      console.log('⚠️  No products with Arabic content found.');
      console.log('💡 To add Arabic products, ensure your products have:');
      console.log('   • nameAr field with Arabic product names');
      console.log('   • descriptionAr field with Arabic descriptions');
      process.exit(0);
    }
    
    // Show sample of products found
    console.log('🔍 Sample Arabic products found:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.nameAr} (${product.variations.length} variations)`);
    });
    console.log('');
    
    // Sync each product
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const [index, product] of products.entries()) {
      try {
        console.log(`🔄 [${index + 1}/${products.length}] Processing: ${product.nameAr}...`);
        
        const result = await googleShopping.convertProductToGoogleFormat(
          product, 
          true, // include variations
          'ar'  // Arabic language
        );
        
        if (result && result.mainProduct) {
          console.log(`   ✅ Converted to Google format (SKU: ${result.mainProduct.offerId})`);
          console.log(`   📦 Variations: ${result.variations.length}`);
          successCount++;
        } else {
          throw new Error('Failed to convert product format');
        }
        
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errors.push({
          productName: product.nameAr || product.name,
          error: error.message
        });
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 ARABIC GOOGLE SHOPPING SYNC SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log(`📊 Success rate: ${Math.round((successCount / products.length) * 100)}%`);
    
    if (errors.length > 0) {
      console.log('\n🔍 Error Details:');
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.productName}: ${err.error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n🎉 Arabic products are now formatted for Google Shopping!');
      console.log('📝 Next steps:');
      console.log('   1. Check Google Merchant Center for new Arabic products');
      console.log('   2. Arabic products will have SKUs ending with "-ar"');
      console.log('   3. Run more products by increasing the "take" limit in the script');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error('🔧 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
console.log('🌍 Green Roasteries - Arabic Google Shopping Sync Tool');
console.log('=' + '='.repeat(48));
syncArabicProducts().catch(console.error); 