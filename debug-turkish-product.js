const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function checkTurkishProduct() {
  try {
    console.log('🔍 Checking Special Turkish Dark product variations...');
    
    const product = await prisma.product.findUnique({
      where: { id: '264954c6-3360-4fb9-af0c-c4318fede0ee' },
      include: {
        variations: {
          include: {
            size: true,
            type: true,
            beans: true
          }
        }
      }
    });
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }
    
    console.log(`\n📦 Product: ${product.name}`);
    console.log(`🔢 Total variations: ${product.variations.length}`);
    
    console.log(`\n📋 All variations:`);
    product.variations.forEach((v, i) => {
      console.log(`  ${i+1}. ID: ${v.id}`);
      console.log(`     Size: ${v.size?.displayName || 'None'}`);
      console.log(`     Beans: ${v.beans?.name || 'None'}`);
      console.log(`     Type: ${v.type?.name || 'None'}`);
      console.log(`     Price: ${v.price} AED`);
      console.log(`     Active: ${v.isActive}`);
      console.log('');
    });
    
    // Check if there's a "Normal" variation
    const normalVariation = product.variations.find(v => {
      const typeName = v.type?.name || '';
      return typeName.toLowerCase() === 'normal';
    });
    
    if (normalVariation) {
      console.log(`✅ Found "Normal" variation: ${normalVariation.id}`);
    } else {
      console.log(`❌ NO "Normal" variation found!`);
      console.log(`🔧 Our code should select first variation: ${product.variations[0]?.id}`);
      console.log(`🔧 First variation details:`);
      const first = product.variations[0];
      if (first) {
        console.log(`   Size: ${first.size?.displayName}`);
        console.log(`   Beans: ${first.beans?.name}`);
        console.log(`   Type: ${first.type?.name || 'None'}`);
        console.log(`   Price: ${first.price} AED`);
      }
    }
    
    console.log(`\n🔧 DIAGNOSIS:`);
    console.log(`   - Product HAS variations: ✅`);
    console.log(`   - Normal variation exists: ${normalVariation ? '✅' : '❌'}`);
    console.log(`   - First variation exists: ${product.variations[0] ? '✅' : '❌'}`);
    console.log(`   - Issue: Default selection logic or Add to Cart validation`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTurkishProduct(); 