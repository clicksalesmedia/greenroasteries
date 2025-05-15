import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET sizes for product variations
export async function GET(request: NextRequest) {
  try {
    const sizes = await prisma.variationSize.findMany({
      orderBy: {
        value: 'asc',
      },
    });
    
    return NextResponse.json(sizes);
  } catch (error) {
    console.error('Error fetching variation sizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variation sizes' },
      { status: 500 }
    );
  }
}

// Create a new variation size
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
    if (!body.name || !body.displayName || body.value === undefined) {
      return NextResponse.json(
        { error: 'Name, displayName, and value are required' },
        { status: 400 }
      );
    }
    
    // Create the size
    const size = await prisma.variationSize.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        value: body.value,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });
    
    return NextResponse.json(size, { status: 201 });
  } catch (error) {
    console.error('Failed to create variation size:', error);
    return NextResponse.json(
      { error: 'Failed to create variation size' },
      { status: 500 }
    );
  }
} 