import { PrismaClient } from '../generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if PrismaClient is available before creating a new instance
let prisma: PrismaClient;

try {
  // Create Prisma client with optimized configuration
  prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://mounirbennassar@localhost:5432/greenroasteries"
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal'
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw new Error('Database connection failed');
}

// Optimize database connections
export const optimizeConnection = async () => {
  try {
    // Test connection and warm up the pool
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection optimized');
  } catch (error) {
    console.error('Database optimization failed:', error);
  }
};

// Graceful shutdown
export const disconnectDB = async () => {
  await prisma.$disconnect();
};

export default prisma; 