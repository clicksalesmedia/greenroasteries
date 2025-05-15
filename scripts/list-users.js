const { PrismaClient } = require('../app/generated/prisma');

// Initialize Prisma client
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Fetching all users from the database...');
    
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} users:`);
    console.log('------------------------------------');
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.createdAt.toISOString()}`);
      console.log(`Updated: ${user.updatedAt.toISOString()}`);
      console.log('------------------------------------');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 