#!/usr/bin/env node
const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function keepOnlyArabicContent() {
  try {
    console.log('🔄 Converting database to Arabic-only content...\n');
    
    // Get all products
    const allProducts = await prisma.product.findMany({
      include: {
        category: true
      }
    });
    
    console.log(`📊 Total products found: ${allProducts.length}\n`);
    
    // Analyze products
    const mixedProducts = [];
    const arabicOnlyProducts = [];
    const englishOnlyProducts = [];
    
    for (const product of allProducts) {
      const hasArabicName = product.nameAr && product.nameAr.trim() !== '';
      const hasArabicDescription = product.descriptionAr && product.descriptionAr.trim() !== '';
      const hasEnglishName = product.name && product.name.trim() !== '';
      const hasEnglishDescription = product.description && product.description.trim() !== '';
      
      if ((hasArabicName || hasArabicDescription) && (hasEnglishName || hasEnglishDescription)) {
        mixedProducts.push(product);
      } else if (hasArabicName || hasArabicDescription) {
        arabicOnlyProducts.push(product);
      } else {
        englishOnlyProducts.push(product);
      }
    }
    
    console.log('📋 Product Analysis:');
    console.log(`   • Mixed (Arabic + English): ${mixedProducts.length}`);
    console.log(`   • Arabic-only: ${arabicOnlyProducts.length}`);
    console.log(`   • English-only: ${englishOnlyProducts.length}\n`);
    
    // Get all categories
    const allCategories = await prisma.category.findMany({
      include: {
        products: true
      }
    });
    
    const mixedCategories = [];
    const arabicOnlyCategories = [];
    const englishOnlyCategories = [];
    
    for (const category of allCategories) {
      const hasArabicName = category.nameAr && category.nameAr.trim() !== '';
      const hasArabicDescription = category.descriptionAr && category.descriptionAr.trim() !== '';
      const hasEnglishName = category.name && category.name.trim() !== '';
      const hasEnglishDescription = category.description && category.description.trim() !== '';
      
      if ((hasArabicName || hasArabicDescription) && (hasEnglishName || hasEnglishDescription)) {
        mixedCategories.push(category);
      } else if (hasArabicName || hasArabicDescription) {
        arabicOnlyCategories.push(category);
      } else {
        englishOnlyCategories.push(category);
      }
    }
    
    console.log('📂 Category Analysis:');
    console.log(`   • Mixed (Arabic + English): ${mixedCategories.length}`);
    console.log(`   • Arabic-only: ${arabicOnlyCategories.length}`);
    console.log(`   • English-only: ${englishOnlyCategories.length}\n`);
    
    // Show what will be changed
    console.log('🔄 Changes to be made:\n');
    
    console.log('📝 Products - Converting to Arabic-only:');
    if (mixedProducts.length > 0) {
      console.log(`   • ${mixedProducts.length} mixed products will have English content removed`);
      mixedProducts.slice(0, 3).forEach(product => {
        console.log(`     - "${product.name}" → "${product.nameAr}"`);
      });
      if (mixedProducts.length > 3) {
        console.log(`     ... and ${mixedProducts.length - 3} more`);
      }
    }
    
    if (englishOnlyProducts.length > 0) {
      console.log(`   • ${englishOnlyProducts.length} English-only products will be DELETED:`);
      englishOnlyProducts.forEach(product => {
        console.log(`     - "${product.name}" (no Arabic equivalent)`);
      });
    }
    
    console.log('\n📁 Categories - Converting to Arabic-only:');
    if (mixedCategories.length > 0) {
      console.log(`   • ${mixedCategories.length} mixed categories will have English content removed`);
      mixedCategories.slice(0, 3).forEach(category => {
        console.log(`     - "${category.name}" → "${category.nameAr}"`);
      });
    }
    
    if (englishOnlyCategories.length > 0) {
      console.log(`   • ${englishOnlyCategories.length} English-only categories will be DELETED:`);
      englishOnlyCategories.forEach(category => {
        console.log(`     - "${category.name}" (${category.products.length} products)`);
      });
    }
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently remove all English content!');
    console.log('📋 Summary of changes:');
    console.log(`   • Products with English content removed: ${mixedProducts.length}`);
    console.log(`   • Products to be deleted (English-only): ${englishOnlyProducts.length}`);
    console.log(`   • Categories with English content removed: ${mixedCategories.length}`);
    console.log(`   • Categories to be deleted (English-only): ${englishOnlyCategories.length}`);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirm = await new Promise(resolve => {
      rl.question('\nDo you want to proceed? Type "YES" to confirm: ', resolve);
    });
    
    rl.close();
    
    if (confirm !== 'YES') {
      console.log('❌ Operation cancelled by user.');
      return;
    }
    
    console.log('\n🚀 Starting conversion to Arabic-only...\n');
    
    await prisma.$transaction(async (tx) => {
      let productUpdates = 0;
      let productDeletes = 0;
      let categoryUpdates = 0;
      let categoryDeletes = 0;
      
      // 1. Update mixed products - remove English content, keep Arabic
      for (const product of mixedProducts) {
        const updateData = {};
        
        // Set name to Arabic name only
        if (product.nameAr) {
          updateData.name = product.nameAr;
          updateData.nameAr = null; // Remove the separate Arabic field since name will be Arabic
        }
        
        // Set description to Arabic description only
        if (product.descriptionAr) {
          updateData.description = product.descriptionAr;
          updateData.descriptionAr = null; // Remove the separate Arabic field
        } else {
          updateData.description = null; // Remove English description if no Arabic exists
        }
        
        await tx.product.update({
          where: { id: product.id },
          data: updateData
        });
        
        productUpdates++;
        console.log(`✏️  Updated: ${product.name} → ${product.nameAr}`);
      }
      
      // 2. Delete English-only products (and their related data)
      for (const product of englishOnlyProducts) {
        // Delete related data first
        await tx.productPromotion.deleteMany({
          where: { productId: product.id }
        });
        
        await tx.bundleItem.deleteMany({
          where: { 
            OR: [
              { bundleProductId: product.id },
              { containedProductId: product.id }
            ]
          }
        });
        
        await tx.productVariation.deleteMany({
          where: { productId: product.id }
        });
        
        await tx.productImage.deleteMany({
          where: { productId: product.id }
        });
        
        await tx.product.delete({
          where: { id: product.id }
        });
        
        productDeletes++;
        console.log(`🗑️  Deleted: ${product.name}`);
      }
      
      // 3. Update mixed categories - remove English content, keep Arabic
      for (const category of mixedCategories) {
        const updateData = {};
        
        // Set name to Arabic name only
        if (category.nameAr) {
          updateData.name = category.nameAr;
          updateData.nameAr = null; // Remove the separate Arabic field
        }
        
        // Set description to Arabic description only
        if (category.descriptionAr) {
          updateData.description = category.descriptionAr;
          updateData.descriptionAr = null; // Remove the separate Arabic field
        } else {
          updateData.description = null; // Remove English description if no Arabic exists
        }
        
        await tx.category.update({
          where: { id: category.id },
          data: updateData
        });
        
        categoryUpdates++;
        console.log(`📁 Updated category: ${category.name} → ${category.nameAr}`);
      }
      
      // 4. Delete English-only categories (if they have no products)
      for (const category of englishOnlyCategories) {
        if (category.products.length === 0) {
          await tx.category.delete({
            where: { id: category.id }
          });
          categoryDeletes++;
          console.log(`🗑️  Deleted category: ${category.name}`);
        } else {
          console.log(`⚠️  Skipping category "${category.name}" - has ${category.products.length} products`);
        }
      }
      
      console.log('\n✅ Conversion completed successfully!');
      console.log(`   • Products updated: ${productUpdates}`);
      console.log(`   • Products deleted: ${productDeletes}`);
      console.log(`   • Categories updated: ${categoryUpdates}`);
      console.log(`   • Categories deleted: ${categoryDeletes}`);
    });
    
    // Final summary
    console.log('\n📈 Final Summary:');
    const remainingProducts = await prisma.product.count();
    const remainingCategories = await prisma.category.count();
    
    console.log(`   • Total products remaining: ${remainingProducts}`);
    console.log(`   • Total categories remaining: ${remainingCategories}`);
    console.log('\n🎉 Database now contains only Arabic content!');
    
    // Show some sample products
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        name: true,
        description: true
      }
    });
    
    console.log('\n📝 Sample Arabic products:');
    sampleProducts.forEach(product => {
      console.log(`   • ${product.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
keepOnlyArabicContent().catch(console.error); 