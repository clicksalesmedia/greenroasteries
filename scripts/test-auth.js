const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcrypt');

// Initialize Prisma client
const prisma = new PrismaClient();

// Test credentials
const email = 'admin@thegreenroasteries.com';
const password = 'your-password-here'; // Replace with the actual password

async function testAuth() {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        name: true
      }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log(`User found: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
    console.log(`Password hash in DB: ${user.password.substring(0, 20)}...`);

    // Verify password
    console.log('Testing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match: ${isMatch}`);

    if (isMatch) {
      console.log('Authentication successful!');
    } else {
      console.log('Authentication failed: Incorrect password');
      
      // Check if the password is actually stored as a hash
      if (!user.password.startsWith('$2')) {
        console.log('Warning: Password does not appear to be a bcrypt hash!');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 