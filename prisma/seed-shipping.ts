import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function seedShippingRules() {
  console.log('🚚 Seeding shipping rules...');

  // Clear existing shipping rules
  await prisma.shippingRule.deleteMany();

  // Create default shipping rules
  const shippingRules = [
    {
      name: 'Free Shipping',
      nameAr: 'شحن مجاني',
      description: 'Free shipping for orders over 200 AED',
      descriptionAr: 'شحن مجاني للطلبات التي تزيد عن 200 درهم',
      type: 'FREE' as const,
      cost: 0,
      freeShippingThreshold: 200,
      isActive: true,
      estimatedDays: 3,
      cities: []
    },
    {
      name: 'Standard Shipping',
      nameAr: 'شحن عادي',
      description: 'Standard shipping rate for all orders',
      descriptionAr: 'سعر الشحن العادي لجميع الطلبات',
      type: 'STANDARD' as const,
      cost: 25,
      freeShippingThreshold: null,
      isActive: true,
      estimatedDays: 5,
      cities: []
    },
    {
      name: 'Express Shipping',
      nameAr: 'شحن سريع',
      description: 'Fast delivery within 1-2 business days',
      descriptionAr: 'توصيل سريع خلال 1-2 أيام عمل',
      type: 'EXPRESS' as const,
      cost: 50,
      freeShippingThreshold: null,
      isActive: true,
      estimatedDays: 2,
      cities: []
    }
  ];

  for (const rule of shippingRules) {
    await prisma.shippingRule.create({
      data: rule
    });
  }

  console.log('✅ Shipping rules seeded successfully');
}

seedShippingRules()
  .catch((e) => {
    console.error('❌ Error seeding shipping rules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 