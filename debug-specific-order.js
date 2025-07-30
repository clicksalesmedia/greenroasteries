const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();

async function debugSpecificOrder() {
  try {
    console.log('🔍 Debugging the specific order from screenshot...');
    
    // Find orders with "Special Turkish Dark" product
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              name: {
                contains: 'Special Turkish Dark'
              }
            }
          }
        }
      },
      include: {
        items: {
          include: {
            variation: {
              include: {
                size: true,
                type: true,
                beans: true
              }
            },
            product: { 
              select: { 
                name: true, 
                id: true,
                variations: {
                  include: {
                    size: true,
                    type: true,
                    beans: true
                  }
                }
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (orders.length === 0) {
      console.log('❌ No orders found with Special Turkish Dark');
      return;
    }
    
    const order = orders[0];
    console.log(`\n📦 Order: ${order.id}`);
    console.log(`📅 Created: ${order.createdAt}`);
    console.log(`👤 Customer: ${order.customerEmail}`);
    console.log(`💰 Total: ${order.total} AED`);
    
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      console.log(`\n  🛒 Item ${i+1}:`);
      console.log(`    📦 Product: ${item.product.name}`);
      console.log(`    🆔 Product ID: ${item.productId}`);
      console.log(`    🔗 Variation ID: ${item.variationId || 'NULL ❌'}`);
      console.log(`    📊 Quantity: ${item.quantity}`);
      console.log(`    💵 Unit Price: ${item.unitPrice} AED`);
      
      // Check if product has variations available
      console.log(`    🔢 Product has ${item.product.variations.length} variations available`);
      
      if (item.product.variations.length > 0) {
        console.log(`    📋 Sample variations for this product:`);
        item.product.variations.slice(0, 3).forEach((v, idx) => {
          console.log(`      ${idx+1}. ID: ${v.id}, Size: ${v.size?.displayName || 'None'}, Beans: ${v.beans?.name || 'None'}, Type: ${v.type?.name || 'None'}, Price: ${v.price} AED`);
        });
      }
      
      if (item.variationId && item.variation) {
        console.log(`    ✅ SUCCESS! Variation Details Found:`);
        console.log(`      ⚖️  Size: ${item.variation.size?.displayName || 'None'}`);
        console.log(`      🫘 Beans: ${item.variation.beans?.name || 'None'}`);
        console.log(`      ➕ Type: ${item.variation.type?.name || 'None'}`);
        console.log(`      💰 Price: ${item.variation.price || 'None'} AED`);
        console.log(`      🔧 Backend Status: WORKING ✅`);
      } else if (item.variationId && !item.variation) {
        console.log(`    ⚠️  HAS VARIATION ID BUT NO VARIATION DATA LOADED`);
        console.log(`    🔍 Trying to find variation ${item.variationId} in database...`);
        
        // Check if the variation exists separately
        const variation = await prisma.productVariation.findUnique({
          where: { id: item.variationId },
          include: {
            size: true,
            type: true,
            beans: true
          }
        });
        
        if (variation) {
          console.log(`    ✅ Variation exists in database but not loaded properly`);
          console.log(`    📋 Variation details: Size: ${variation.size?.displayName}, Beans: ${variation.beans?.name}, Type: ${variation.type?.name}`);
        } else {
          console.log(`    ❌ Variation ${item.variationId} does NOT exist in database`);
        }
      } else {
        console.log(`    ❌ NO VARIATION ID - Customer didn't select variation OR our fix didn't work`);
        
        if (item.product.variations.length > 0) {
          console.log(`    🔧 This product HAS variations but order has no variationId - Frontend issue`);
        } else {
          console.log(`    ℹ️  This product has no variations - Normal behavior`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSpecificOrder(); 