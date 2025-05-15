import { PrismaClient } from '../app/generated/prisma';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const hashedPassword = await hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@greenroasteries.com' },
      update: {},
      create: {
        email: 'admin@greenroasteries.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log('Admin user created:', admin.email);
    
    // Create categories
    const coffeeCategory = await prisma.category.upsert({
      where: { slug: 'coffee' },
      update: {},
      create: {
        name: 'Coffee',
        description: 'Freshly roasted coffee beans from around the world',
        slug: 'coffee',
        isActive: true,
      },
    });
    
    const nutsCategory = await prisma.category.upsert({
      where: { slug: 'nuts' },
      update: {},
      create: {
        name: 'Nuts',
        description: 'Premium quality nuts and dried fruits',
        slug: 'nuts',
        isActive: true,
      },
    });
    
    console.log('Categories created');
    
    // Create coffee subcategories
    const arabicaCategory = await prisma.category.upsert({
      where: { slug: 'arabica' },
      update: {},
      create: {
        name: 'Arabica',
        description: 'Premium Arabica coffee beans',
        slug: 'arabica',
        isActive: true,
        parentId: coffeeCategory.id,
      },
    });
    
    const robustaCategory = await prisma.category.upsert({
      where: { slug: 'robusta' },
      update: {},
      create: {
        name: 'Robusta',
        description: 'Strong and rich Robusta coffee beans',
        slug: 'robusta',
        isActive: true,
        parentId: coffeeCategory.id,
      },
    });
    
    // Create nuts subcategories
    const almondCategory = await prisma.category.upsert({
      where: { slug: 'almonds' },
      update: {},
      create: {
        name: 'Almonds',
        description: 'Premium quality almonds',
        slug: 'almonds',
        isActive: true,
        parentId: nutsCategory.id,
      },
    });
    
    const walnutCategory = await prisma.category.upsert({
      where: { slug: 'walnuts' },
      update: {},
      create: {
        name: 'Walnuts',
        description: 'Premium quality walnuts',
        slug: 'walnuts',
        isActive: true,
        parentId: nutsCategory.id,
      },
    });
    
    console.log('Subcategories created');
    
    // Create sample products
    const ethiopianCoffee = await prisma.product.upsert({
      where: { sku: 'COFFEE-ETH-001' },
      update: {},
      create: {
        name: 'Ethiopian Yirgacheffe',
        description: 'Ethiopian Yirgacheffe is a coffee from the Yirgacheffe region of southern Ethiopia. It has a distinctive floral and fruit tone with a bright acidity.',
        price: 14.99,
        imageUrl: 'https://example.com/images/ethiopian-coffee.jpg',
        categoryId: arabicaCategory.id,
        origin: 'Ethiopia',
        inStock: true,
        stockQuantity: 100,
        sku: 'COFFEE-ETH-001',
        weight: 0.5,
      },
    });
    
    const colombianCoffee = await prisma.product.upsert({
      where: { sku: 'COFFEE-COL-001' },
      update: {},
      create: {
        name: 'Colombian Supremo',
        description: 'Colombian Supremo is known for its rich, full body and bright acidity. It has a balanced flavor with caramel sweetness and nutty undertones.',
        price: 12.99,
        imageUrl: 'https://example.com/images/colombian-coffee.jpg',
        categoryId: arabicaCategory.id,
        origin: 'Colombia',
        inStock: true,
        stockQuantity: 150,
        sku: 'COFFEE-COL-001',
        weight: 0.5,
      },
    });
    
    const ugandanCoffee = await prisma.product.upsert({
      where: { sku: 'COFFEE-UGA-001' },
      update: {},
      create: {
        name: 'Ugandan Robusta',
        description: 'Ugandan Robusta has a strong, full-bodied flavor with earthy notes and a strong caffeine content.',
        price: 10.99,
        imageUrl: 'https://example.com/images/ugandan-coffee.jpg',
        categoryId: robustaCategory.id,
        origin: 'Uganda',
        inStock: true,
        stockQuantity: 120,
        sku: 'COFFEE-UGA-001',
        weight: 0.5,
      },
    });
    
    const almonds = await prisma.product.upsert({
      where: { sku: 'NUTS-ALM-001' },
      update: {},
      create: {
        name: 'Organic Almonds',
        description: 'Premium organic almonds, perfect for snacking or baking.',
        price: 8.99,
        imageUrl: 'https://example.com/images/almonds.jpg',
        categoryId: almondCategory.id,
        origin: 'California',
        inStock: true,
        stockQuantity: 200,
        sku: 'NUTS-ALM-001',
        weight: 0.5,
      },
    });
    
    const walnuts = await prisma.product.upsert({
      where: { sku: 'NUTS-WAL-001' },
      update: {},
      create: {
        name: 'Premium Walnuts',
        description: 'Premium quality walnuts, rich in omega-3 fatty acids.',
        price: 9.99,
        imageUrl: 'https://example.com/images/walnuts.jpg',
        categoryId: walnutCategory.id,
        origin: 'California',
        inStock: true,
        stockQuantity: 180,
        sku: 'NUTS-WAL-001',
        weight: 0.5,
      },
    });
    
    console.log('Sample products created');
    
    // Create a promotion
    const promotion = await prisma.promotion.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        name: 'Welcome Discount',
        description: 'Get 10% off your first order',
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 20,
        maxUses: 1000,
        currentUses: 0,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Valid for 1 year
      },
    });
    
    console.log('Promotion created');
    
    // Seed variation sizes
    console.log('Seeding variation sizes...');
    
    const sizesData = [
      { name: '250g', value: 250, displayName: '250g' },
      { name: '500g', value: 500, displayName: '500g' },
      { name: '1kg', value: 1000, displayName: '1 kg' },
    ];
    
    for (const sizeData of sizesData) {
      const existingSize = await prisma.variationSize.findFirst({
        where: {
          value: sizeData.value,
        },
      });
      
      if (!existingSize) {
        await prisma.variationSize.create({
          data: sizeData,
        });
        console.log(`Created size: ${sizeData.displayName}`);
      } else {
        console.log(`Size ${sizeData.displayName} already exists, skipping.`);
      }
    }
    
    // Seed variation types
    console.log('Seeding variation types...');
    
    const typesData = [
      { name: 'Whole Beans', arabicName: 'حبوب كاملة' },
      { name: 'Ground', arabicName: 'حبوب مطحونة' },
      { name: 'Beans', arabicName: 'حبوب' },
    ];
    
    for (const typeData of typesData) {
      const existingType = await prisma.variationType.findFirst({
        where: {
          name: typeData.name,
        },
      });
      
      if (!existingType) {
        await prisma.variationType.create({
          data: typeData,
        });
        console.log(`Created type: ${typeData.name}`);
      } else {
        console.log(`Type ${typeData.name} already exists, skipping.`);
      }
    }
    
    // Seed bean variations
    console.log('Seeding bean variations...');
    
    const beansData = [
      { name: 'Arabica', arabicName: 'عربيكا', description: 'High-quality coffee known for its smooth, complex flavors' },
      { name: 'Robusta', arabicName: 'روبوستا', description: 'Strong coffee with higher caffeine content' },
      { name: 'Blend', arabicName: 'مزيج', description: 'A balanced blend of different coffee beans' },
      { name: 'Specialty', arabicName: 'متخصص', description: 'Premium quality specialty coffee beans' },
    ];
    
    for (const beanData of beansData) {
      const existingBean = await prisma.variationBeans.findFirst({
        where: {
          name: beanData.name,
        },
      });
      
      if (!existingBean) {
        await prisma.variationBeans.create({
          data: beanData,
        });
        console.log(`Created bean variation: ${beanData.name}`);
      } else {
        console.log(`Bean variation ${beanData.name} already exists, skipping.`);
      }
    }
    
    console.log('Seeding completed.');
    
    console.log('Database has been seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 