#!/usr/bin/env node

async function checkArabicContent() {
  const { PrismaClient } = require('./app/generated/prisma');
  const prisma = new PrismaClient();
  
  try {
    console.log('🌍 Green Roasteries - Arabic Content Analysis');
    console.log('='.repeat(48));
    
    // Get total product count
    const totalProducts = await prisma.product.count();
    console.log(`📊 Total products in database: ${totalProducts}`);
    
    // Get products with Arabic names
    const productsWithArabicNames = await prisma.product.count({
      where: {
        AND: [
          { nameAr: { not: null } },
          { nameAr: { not: '' } }
        ]
      }
    });
    
    // Get products with Arabic descriptions  
    const productsWithArabicDescriptions = await prisma.product.count({
      where: {
        AND: [
          { descriptionAr: { not: null } },
          { descriptionAr: { not: '' } }
        ]
      }
    });
    
    // Get in-stock products with Arabic content
    const inStockArabicProducts = await prisma.product.count({
      where: {
        inStock: true,
        AND: [
          { nameAr: { not: null } },
          { nameAr: { not: '' } }
        ]
      }
    });
    
    console.log(`🔤 Products with Arabic names: ${productsWithArabicNames}`);
    console.log(`📝 Products with Arabic descriptions: ${productsWithArabicDescriptions}`);
    console.log(`✅ In-stock products with Arabic names: ${inStockArabicProducts}`);
    
    const arabicReadiness = Math.round((productsWithArabicNames / Math.max(totalProducts, 1)) * 100);
    console.log(`📈 Arabic readiness: ${arabicReadiness}%`);
    
    if (inStockArabicProducts > 0) {
      console.log('\n🔍 Sample Arabic products:');
      
      const sampleProducts = await prisma.product.findMany({
        where: {
          inStock: true,
          AND: [
            { nameAr: { not: null } },
            { nameAr: { not: '' } }
          ]
        },
        include: {
          category: true,
          variations: {
            where: { isActive: true }
          }
        },
        take: 10
      });
      
      sampleProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.nameAr}`);
        console.log(`      English: ${product.name}`);
        console.log(`      Category: ${product.category?.nameAr || product.category?.name || 'No category'}`);
        console.log(`      Variations: ${product.variations.length}`);
        console.log(`      In Stock: ${product.inStock ? '✅' : '❌'}`);
        console.log('');
      });
      
      console.log('🎯 Ready for Google Shopping Arabic sync!');
      console.log(`📦 ${inStockArabicProducts} products can be synced to Google Shopping`);
      
      // Show categories with Arabic content
      console.log('\n📂 Categories with Arabic content:');
      const categoriesWithArabic = await prisma.category.findMany({
        where: {
          AND: [
            { nameAr: { not: null } },
            { nameAr: { not: '' } }
          ]
        }
      });
      
      categoriesWithArabic.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.nameAr} (${category.name})`);
      });
      
    } else {
      console.log('\n⚠️  No products ready for Arabic Google Shopping sync');
      console.log('💡 To prepare products for Arabic sync:');
      console.log('   1. Add Arabic names to products (nameAr field)');
      console.log('   2. Add Arabic descriptions (descriptionAr field)');
      console.log('   3. Ensure products are in stock');
      console.log('   4. Add Arabic category names (category.nameAr field)');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkArabicContent().catch(console.error); 