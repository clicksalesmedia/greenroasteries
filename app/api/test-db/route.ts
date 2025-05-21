import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const pageContents = await prisma.pageContent.findMany();
    
    // Check if PageContent model exists
    const models = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      pageContents: pageContents,
      models: models
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: `Database connection failed: ${error.message}`,
      error: error
    }, { status: 500 });
  }
} 