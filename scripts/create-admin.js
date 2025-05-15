#!/usr/bin/env node

const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    console.log('\n🔐 GREEN ROASTERIES ADMIN CREATION TOOL 🔐\n');
    
    // Get email
    const email = await new Promise(resolve => {
      rl.question('Enter admin email: ', resolve);
    });
    
    // Get name
    const name = await new Promise(resolve => {
      rl.question('Enter admin name: ', resolve);
    });
    
    // Get password
    const password = await new Promise(resolve => {
      rl.question('Enter admin password (min 8 characters): ', resolve);
    });
    
    if (!email || !password || password.length < 8) {
      console.error('Error: Valid email and password (min 8 characters) are required');
      process.exit(1);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.error(`Error: User with email ${email} already exists`);
      process.exit(1);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log(`\n✅ Admin user created successfully with ID: ${user.id}`);
    console.log(`\nYou can now login at: http://localhost:3000/backend/login`);
    console.log(`Email: ${email}`);
    console.log(`Password: [The password you entered]`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main(); 