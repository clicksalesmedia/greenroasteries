#!/usr/bin/env node
const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function cleanupEnglishProducts() {
  try {
    console.log('🧹 Starting cleanup of English-only products...\n');
    
    // Get all products
    const allProducts = await prisma.product.findMany({
      include: {
        category: true,
        variations: {
          include: {
            orderItems: true
          }
        },
        orderItems: true,
        images: true,
        bundles: true,
        bundleItems: true,
        promotions: true
      }
    });
    
    console.log(`📊 Total products found: ${allProducts.length}\n`);
    
    // Identify English-only products
    const englishOnlyProducts = [];
    const arabicProducts = [];
    
    for (const product of allProducts) {
      const hasArabicName = product.nameAr && product.nameAr.trim() !== '';
      const hasArabicDescription = product.descriptionAr && product.descriptionAr.trim() !== '';
      
      if (!hasArabicName && !hasArabicDescription) {
        englishOnlyProducts.push(product);
      } else {
        arabicProducts.push(product);
      }
    }
    
    console.log('📋 Analysis Results:');
    console.log(`   • Arabic products (to keep): ${arabicProducts.length}`);
    console.log(`   • English-only products (to delete): ${englishOnlyProducts.length}\n`);
    
    if (englishOnlyProducts.length === 0) {
      console.log('✅ No English-only products found. All products have Arabic content!');
      return;
    }
    
    // Check for products with orders
    const productsWithOrders = [];
    const productsWithoutOrders = [];
    
    for (const product of englishOnlyProducts) {
      const hasOrders = product.orderItems.length > 0 || 
                       product.variations.some(v => v.orderItems.length > 0);
      
      if (hasOrders) {
        productsWithOrders.push(product);
      } else {
        productsWithoutOrders.push(product);
      }
    }
    
    console.log('⚠️  Products with existing orders (will be marked inactive):');
    if (productsWithOrders.length > 0) {
      productsWithOrders.forEach(product => {
        console.log(`   • ${product.name} (ID: ${product.id})`);
      });
    } else {
      console.log('   • None found');
    }
    
    console.log('\n🗑️  Products without orders (will be deleted):');
    if (productsWithoutOrders.length > 0) {
      productsWithoutOrders.forEach(product => {
        console.log(`   • ${product.name} (ID: ${product.id})`);
      });
    } else {
      console.log('   • None found');
    }
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This action cannot be undone!');
    console.log(`   • ${productsWithOrders.length} products will be marked as inactive`);
    console.log(`   • ${productsWithoutOrders.length} products will be permanently deleted`);
    
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
    
    console.log('\n🚀 Starting cleanup...\n');
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      let deactivatedCount = 0;
      
      // Mark products with orders as inactive
      for (const product of productsWithOrders) {
        await tx.product.update({
          where: { id: product.id },
          data: { 
            inStock: false,
            stockQuantity: 0
          }
        });
        
        // Also deactivate all variations
        await tx.productVariation.updateMany({
          where: { productId: product.id },
          data: { 
            isActive: false,
            stockQuantity: 0
          }
        });
        
        deactivatedCount++;
        console.log(`📴 Deactivated: ${product.name}`);
      }
      
      // Delete products without orders
      for (const product of productsWithoutOrders) {
        // Delete in proper order due to foreign key constraints
        
        // 1. Delete product promotions
        await tx.productPromotion.deleteMany({
          where: { productId: product.id }
        });
        
        // 2. Delete bundle items
        await tx.bundleItem.deleteMany({
          where: { 
            OR: [
              { bundleProductId: product.id },
              { containedProductId: product.id }
            ]
          }
        });
        
        // 3. Delete product variations (order items will be handled by cascade)
        await tx.productVariation.deleteMany({
          where: { productId: product.id }
        });
        
        // 4. Delete product images
        await tx.productImage.deleteMany({
          where: { productId: product.id }
        });
        
        // 5. Finally delete the product (order items will cascade)
        await tx.product.delete({
          where: { id: product.id }
        });
        
        deletedCount++;
        console.log(`🗑️  Deleted: ${product.name}`);
      }
      
      console.log(`\n✅ Cleanup completed successfully!`);
      console.log(`   • Products deleted: ${deletedCount}`);
      console.log(`   • Products deactivated: ${deactivatedCount}`);
      console.log(`   • Arabic products remaining: ${arabicProducts.length}`);
    });
    
    // Now cleanup empty categories
    console.log('\n🧹 Cleaning up empty categories...');
    
    const allCategories = await prisma.category.findMany({
      include: {
        products: true,
        children: true
      }
    });
    
    const englishOnlyCategories = [];
    
    for (const category of allCategories) {
      const hasArabicName = category.nameAr && category.nameAr.trim() !== '';
      const hasArabicDescription = category.descriptionAr && category.descriptionAr.trim() !== '';
      const hasProducts = category.products.length > 0;
      const hasChildren = category.children.length > 0;
      
      // Delete if English-only AND (no products OR no children)
      if (!hasArabicName && !hasArabicDescription && !hasProducts && !hasChildren) {
        englishOnlyCategories.push(category);
      }
    }
    
    if (englishOnlyCategories.length > 0) {
      console.log('🗑️  Deleting empty English-only categories:');
      for (const category of englishOnlyCategories) {
        await prisma.category.delete({
          where: { id: category.id }
        });
        console.log(`   • ${category.name}`);
      }
    } else {
      console.log('✅ No empty English-only categories to delete.');
    }
    
    // Final summary
    console.log('\n📈 Final Summary:');
    const remainingProducts = await prisma.product.count({
      where: { inStock: true }
    });
    const totalProducts = await prisma.product.count();
    
    console.log(`   • Active products remaining: ${remainingProducts}`);
    console.log(`   • Total products in database: ${totalProducts}`);
    console.log(`   • Categories deleted: ${englishOnlyCategories.length}`);
    console.log('\n🎉 Database now contains only Arabic products!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupEnglishProducts().catch(console.error); 