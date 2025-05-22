// ES Module script to add Normal addition option
import { PrismaClient } from '@prisma/client';

const main = async () => {
  console.log('Starting script to add Normal addition option...');
  
  try {
    // Initialize Prisma client
    console.log('Initializing Prisma client...');
    const prisma = new PrismaClient();
    
    // Check if "Normal" addition already exists
    console.log('Checking for existing Normal option...');
    const existingNormal = await prisma.variationType.findFirst({
      where: {
        name: {
          mode: 'insensitive',
          equals: 'Normal'
        }
      }
    });
    
    if (existingNormal) {
      console.log('A "Normal" addition option already exists:', existingNormal);
    } else {
      // Add the Normal addition option
      console.log('Creating Normal addition option...');
      const normalAddition = await prisma.variationType.create({
        data: {
          name: 'Normal',
          arabicName: 'عادي',
          description: 'Default option for products without any additions',
          isActive: true,
        }
      });
      
      console.log('Successfully added "Normal" addition option:', normalAddition);
    }
    
    // Disconnect Prisma client
    await prisma.$disconnect();
    console.log('Script completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main(); 