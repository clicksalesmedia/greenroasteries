const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function populateProductSlugs() {
  try {
    console.log('🔍 Finding products without slugs...');
    
    // Find all products and filter those without slugs
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    const productsWithoutSlugs = allProducts.filter(product => 
      !product.slug || product.slug.trim() === ''
    );

    console.log(`📦 Found ${productsWithoutSlugs.length} products without slugs`);

    if (productsWithoutSlugs.length === 0) {
      console.log('✅ All products already have slugs!');
      return;
    }

    // Generate and update slugs
    const updates = [];
    const slugMap = new Map(); // To track slug uniqueness

    for (const product of productsWithoutSlugs) {
      let baseSlug = generateSlug(product.name);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness
      while (slugMap.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Check if slug already exists in database
      const existingProduct = await prisma.product.findUnique({
        where: { slug: slug }
      });

      if (existingProduct) {
        // If slug exists, add counter
        while (true) {
          slug = `${baseSlug}-${counter}`;
          const checkExisting = await prisma.product.findUnique({
            where: { slug: slug }
          });
          if (!checkExisting) break;
          counter++;
        }
      }

      slugMap.set(slug, product.id);
      updates.push({
        id: product.id,
        name: product.name,
        oldSlug: product.slug,
        newSlug: slug
      });
    }

    console.log('🔄 Updating product slugs...');
    
    // Update products with new slugs
    for (const update of updates) {
      await prisma.product.update({
        where: { id: update.id },
        data: { slug: update.newSlug }
      });
      
      console.log(`  ✓ ${update.name} → ${update.newSlug}`);
    }

    console.log(`✅ Successfully updated ${updates.length} product slugs!`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedProducts = await prisma.product.findMany({
      where: {
        id: {
          in: updates.map(u => u.id)
        }
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log('📋 Updated products:');
    updatedProducts.forEach(product => {
      console.log(`  • ${product.name}: /product/${product.slug}`);
    });

  } catch (error) {
    console.error('❌ Error populating product slugs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populateProductSlugs()
    .then(() => {
      console.log('\n🎉 Product slug population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateProductSlugs }; 