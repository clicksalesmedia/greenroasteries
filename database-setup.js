const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Check connection to PostgreSQL
    console.log('Checking database connection...');
    await execPromise('npx prisma db push --accept-data-loss');
    
    // Run migrations
    console.log('Running migrations...');
    await execPromise('npx prisma migrate deploy');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    await execPromise('npx prisma generate');
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 