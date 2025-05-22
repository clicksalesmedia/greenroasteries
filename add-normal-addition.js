const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addNormalAddition() {
  try {
    // Check if "Normal" addition already exists
    const existingNormal = await prisma.variationType.findFirst({
      where: {
        name: { equals: 'Normal', mode: 'insensitive' }
      }
    });

    if (existingNormal) {
      console.log('A "Normal" addition option already exists:', existingNormal);
      return;
    }

    // Add the Normal addition option
    const normalAddition = await prisma.variationType.create({
      data: {
        name: 'Normal',
        arabicName: 'عادي',
        description: 'Default option for products without any additions',
        isActive: true,
      }
    });

    console.log('Successfully added "Normal" addition option:', normalAddition);
  } catch (error) {
    console.error('Error adding Normal addition option:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNormalAddition(); 