import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET() {
  try {
    // Test database connection by running a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get all PageContent records
    const pageContents = await prisma.pageContent.findMany();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      testQuery: result,
      pageContentCount: pageContents.length,
      pageContents: pageContents
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 