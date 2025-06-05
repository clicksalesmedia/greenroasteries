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

// Optimize database connections with better pooling
export const optimizeConnection = async () => {
  try {
    // Test connection and warm up the pool
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection optimized');
    
    // Set optimal connection parameters
    await prisma.$executeRaw`SET statement_timeout = '30s'`;
    await prisma.$executeRaw`SET lock_timeout = '10s'`;
    await prisma.$executeRaw`SET idle_in_transaction_session_timeout = '60s'`;
    
    console.log('Database session parameters optimized');
  } catch (error) {
    console.error('Database optimization failed:', error);
  }
};

// Enhanced connection health check
export const checkConnectionHealth = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    console.log(`Database health check: ${responseTime}ms response time`);
    return { healthy: true, responseTime };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error };
  }
};

// Graceful shutdown with proper cleanup
export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

// Connection monitoring
export const getConnectionInfo = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        max(now() - query_start) as longest_query_time,
        count(*) FILTER (WHERE state = 'active') as active_queries
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[];
    
    return result[0];
  } catch (error) {
    console.error('Failed to get connection info:', error);
    return null;
  }
};

export default prisma; 