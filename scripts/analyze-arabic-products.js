#!/usr/bin/env node
const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function analyzeProducts() {
  try {
    console.log('🔍 Analyzing products in database...\n');
    
    // Get all products
    const allProducts = await prisma.product.findMany({
      include: {
        category: true,
        variations: {
          include: {
            size: true,
            type: true,
            beans: true
          }
        }
      }
    });
    
    console.log(`📊 Total products found: ${allProducts.length}\n`);
    
    // Categorize products
    const arabicProducts = [];
    const englishOnlyProducts = [];
    const mixedProducts = [];
    
    for (const product of allProducts) {
      const hasArabicName = product.nameAr && product.nameAr.trim() !== '';
      const hasArabicDescription = product.descriptionAr && product.descriptionAr.trim() !== '';
      const hasEnglishName = product.name && product.name.trim() !== '';
      const hasEnglishDescription = product.description && product.description.trim() !== '';
      
      if (hasArabicName || hasArabicDescription) {
        if (hasEnglishName || hasEnglishDescription) {
          mixedProducts.push(product);
        } else {
          arabicProducts.push(product);
        }
      } else {
        englishOnlyProducts.push(product);
      }
    }
    
    console.log('📋 Product Analysis:');
    console.log(`   • Arabic-only products: ${arabicProducts.length}`);
    console.log(`   • English-only products: ${englishOnlyProducts.length}`);
    console.log(`   • Mixed (Arabic + English) products: ${mixedProducts.length}\n`);
    
    // Show sample products from each category
    if (arabicProducts.length > 0) {
      console.log('🔤 Sample Arabic-only products:');
      arabicProducts.slice(0, 3).forEach(product => {
        console.log(`   • ${product.nameAr || product.name} (ID: ${product.id})`);
      });
      console.log('');
    }
    
    if (englishOnlyProducts.length > 0) {
      console.log('🔤 Sample English-only products:');
      englishOnlyProducts.slice(0, 3).forEach(product => {
        console.log(`   • ${product.name} (ID: ${product.id})`);
      });
      console.log('');
    }
    
    if (mixedProducts.length > 0) {
      console.log('🔤 Sample Mixed products:');
      mixedProducts.slice(0, 3).forEach(product => {
        console.log(`   • EN: ${product.name} | AR: ${product.nameAr || 'N/A'} (ID: ${product.id})`);
      });
      console.log('');
    }
    
    // Analyze categories
    const allCategories = await prisma.category.findMany();
    
    const arabicCategories = [];
    const englishOnlyCategories = [];
    const mixedCategories = [];
    
    for (const category of allCategories) {
      const hasArabicName = category.nameAr && category.nameAr.trim() !== '';
      const hasArabicDescription = category.descriptionAr && category.descriptionAr.trim() !== '';
      const hasEnglishName = category.name && category.name.trim() !== '';
      const hasEnglishDescription = category.description && category.description.trim() !== '';
      
      if (hasArabicName || hasArabicDescription) {
        if (hasEnglishName || hasEnglishDescription) {
          mixedCategories.push(category);
        } else {
          arabicCategories.push(category);
        }
      } else {
        englishOnlyCategories.push(category);
      }
    }
    
    console.log('📂 Category Analysis:');
    console.log(`   • Arabic-only categories: ${arabicCategories.length}`);
    console.log(`   • English-only categories: ${englishOnlyCategories.length}`);
    console.log(`   • Mixed (Arabic + English) categories: ${mixedCategories.length}\n`);
    
    // Show what would be deleted
    console.log('🗑️  Products that would be DELETED (English-only):');
    if (englishOnlyProducts.length > 0) {
      englishOnlyProducts.forEach(product => {
        console.log(`   • ${product.name} (ID: ${product.id}) - ${product.variations.length} variations`);
      });
    } else {
      console.log('   • None found');
    }
    
    console.log('\n🗑️  Categories that would be DELETED (English-only):');
    if (englishOnlyCategories.length > 0) {
      englishOnlyCategories.forEach(category => {
        console.log(`   • ${category.name} (ID: ${category.id})`);
      });
    } else {
      console.log('   • None found');
    }
    
    console.log('\n✅ Products that would be KEPT (Arabic or Mixed):');
    const keptProducts = [...arabicProducts, ...mixedProducts];
    console.log(`   • Total: ${keptProducts.length} products`);
    
    if (keptProducts.length > 0) {
      console.log('   • Sample:');
      keptProducts.slice(0, 5).forEach(product => {
        console.log(`     - ${product.nameAr || product.name} (ID: ${product.id})`);
      });
    }
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`   • Products to DELETE: ${englishOnlyProducts.length}`);
    console.log(`   • Products to KEEP: ${keptProducts.length}`);
    console.log(`   • Categories to DELETE: ${englishOnlyCategories.length}`);
    console.log(`   • Categories to KEEP: ${arabicCategories.length + mixedCategories.length}`);
    
    return {
      productsToDelete: englishOnlyProducts.map(p => p.id),
      productsToKeep: keptProducts.map(p => p.id),
      categoriesToDelete: englishOnlyCategories.map(c => c.id),
      categoriesToKeep: [...arabicCategories, ...mixedCategories].map(c => c.id)
    };
    
  } catch (error) {
    console.error('❌ Error analyzing products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeProducts().then(result => {
  console.log('\n✅ Analysis complete!');
  console.log('💡 Run "node scripts/cleanup-english-products.js" to proceed with cleanup');
}).catch(console.error); 