const { PrismaClient } = require('./app/generated/prisma');

async function testGoogleShopping() {
  const prisma = new PrismaClient();
  
  try {
    // Get a few sample products
    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true },
      take: 5
    });
    
    console.log('=== PRODUCT ID ANALYSIS ===');
    products.forEach(p => {
      const offerId = p.sku || `gr-${p.id}`;
      const googleProductId = `online:en:AE:${offerId}`;
      console.log(`Product: ${p.name}`);
      console.log(`  SKU: ${p.sku || 'NULL'}`);
      console.log(`  Offer ID: ${offerId}`);
      console.log(`  Google Product ID: ${googleProductId}`);
      console.log('---');
    });
    
    // Check if there are products without SKUs
    const productsWithoutSku = await prisma.product.count({
      where: { sku: null }
    });
    
    const productsWithSku = await prisma.product.count({
      where: { sku: { not: null } }
    });
    
    console.log(`\nProducts without SKU: ${productsWithoutSku}`);
    console.log(`Products with SKU: ${productsWithSku}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleShopping(); 