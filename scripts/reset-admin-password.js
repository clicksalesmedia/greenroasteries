const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcrypt');

// Initialize Prisma client
const prisma = new PrismaClient();

// New admin details
const adminEmail = 'admin@thegreenroasteries.com';
const newPassword = 'Admin@123'; // Replace with your desired password
const saltRounds = 10;

async function resetAdminPassword() {
  try {
    console.log(`Looking for admin user with email: ${adminEmail}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!user) {
      console.log('Admin user not found! Creating new admin user...');
      
      // Create new admin user if not found
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log(`New admin user created with ID: ${newUser.id}`);
    } else {
      console.log(`Admin user found with ID: ${user.id}`);
      
      // Update existing user
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isActive: true,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin password has been reset successfully!');
      console.log(`User details: Email: ${updatedUser.email}, Role: ${updatedUser.role}, Active: ${updatedUser.isActive}`);
    }
    
    console.log(`\nNew login credentials:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\nPlease use these credentials to log in to the admin dashboard.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 