import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET beans for product variations
export async function GET(request: NextRequest) {
  try {
    const beans = await prisma.variationBeans.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(beans);
  } catch (error) {
    console.error('Error fetching beans variations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beans variations' },
      { status: 500 }
    );
  }
}

// Create a new bean variation
export async function POST(request: Request) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Create the bean variation
    const beans = await prisma.variationBeans.create({
      data: {
        name: body.name,
        arabicName: body.arabicName,
        description: body.description,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });
    
    return NextResponse.json(beans, { status: 201 });
  } catch (error) {
    console.error('Failed to create bean variation:', error);
    return NextResponse.json(
      { error: 'Failed to create bean variation' },
      { status: 500 }
    );
  }
} 