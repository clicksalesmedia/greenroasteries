const { PrismaClient } = require('../app/generated/prisma');

async function testGoogleShoppingSyncProducts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== GOOGLE SHOPPING SYNC DEBUG TEST ===\n');
    
    // Test 1: Check total products in database
    console.log('1. CHECKING TOTAL PRODUCTS IN DATABASE:');
    const totalProducts = await prisma.product.count();
    console.log(`   Total products in database: ${totalProducts}`);
    
    // Test 2: Check products with old filter (inStock: true)
    console.log('\n2. PRODUCTS WITH OLD RESTRICTIVE FILTER (inStock: true):');
    const inStockProducts = await prisma.product.findMany({
      where: { inStock: true },
      include: { category: true }
    });
    console.log(`   Products with inStock=true: ${inStockProducts.length}`);
    console.log('   Categories (old filter):');
    const oldCategories = [...new Set(inStockProducts.map(p => p.category?.name).filter(Boolean))];
    oldCategories.forEach(cat => console.log(`     - ${cat}`));
    
    // Test 3: Check all products (new filter - no restrictions)
    console.log('\n3. ALL PRODUCTS (NEW FILTER - NO RESTRICTIONS):');
    const allProducts = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`   All products: ${allProducts.length}`);
    console.log('   Categories (new filter):');
    const allCategories = [...new Set(allProducts.map(p => p.category?.name).filter(Boolean))];
    allCategories.forEach(cat => console.log(`     - ${cat}`));
    
    // Test 4: Check for specific categories mentioned by user
    console.log('\n4. CHECKING FOR NEW CATEGORIES (Chocolates, Deals):');
    const chocolateProducts = allProducts.filter(p => 
      p.category?.name?.toLowerCase().includes('chocolate') ||
      p.name?.toLowerCase().includes('chocolate')
    );
    console.log(`   Chocolate products found: ${chocolateProducts.length}`);
    chocolateProducts.forEach(p => 
      console.log(`     - ${p.name} (Category: ${p.category?.name}, Stock: ${p.stockQuantity}, InStock: ${p.inStock})`)
    );
    
    const dealProducts = allProducts.filter(p => 
      p.category?.name?.toLowerCase().includes('deal') ||
      p.name?.toLowerCase().includes('deal')
    );
    console.log(`   Deal products found: ${dealProducts.length}`);
    dealProducts.forEach(p => 
      console.log(`     - ${p.name} (Category: ${p.category?.name}, Stock: ${p.stockQuantity}, InStock: ${p.inStock})`)
    );
    
    // Test 5: Show recent products
    console.log('\n5. MOST RECENT 10 PRODUCTS (to find new additions):');
    const recentProducts = allProducts.slice(0, 10);
    recentProducts.forEach(p => 
      console.log(`   - ${p.name} (Category: ${p.category?.name}, Created: ${p.createdAt}, Stock: ${p.stockQuantity}, InStock: ${p.inStock})`)
    );
    
    // Test 6: Show stock status breakdown
    console.log('\n6. STOCK STATUS BREAKDOWN:');
    const inStockCount = allProducts.filter(p => p.inStock && p.stockQuantity > 0).length;
    const inStockZeroQty = allProducts.filter(p => p.inStock && p.stockQuantity === 0).length;
    const outOfStockCount = allProducts.filter(p => !p.inStock).length;
    
    console.log(`   In Stock (with quantity): ${inStockCount}`);
    console.log(`   In Stock (but qty=0): ${inStockZeroQty}`);
    console.log(`   Out of Stock: ${outOfStockCount}`);
    console.log(`   Total: ${inStockCount + inStockZeroQty + outOfStockCount}`);
    
    // Test 7: Simulate what old vs new sync would include
    console.log('\n7. SYNC COMPARISON:');
    console.log(`   OLD SYNC (inStock=true only): ${inStockProducts.length} products`);
    console.log(`   NEW SYNC (all products): ${allProducts.length} products`);
    console.log(`   DIFFERENCE: ${allProducts.length - inStockProducts.length} additional products now included`);
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error testing Google Shopping sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleShoppingSyncProducts(); 