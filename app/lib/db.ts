import { PrismaClient } from '../generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if PrismaClient is available before creating a new instance
let prisma: PrismaClient;

try {
  // Create Prisma client with direct database URL
  prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://mounirbennassar@localhost:5432/greenroasteries"
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw new Error('Database connection failed');
}

export default prisma; 