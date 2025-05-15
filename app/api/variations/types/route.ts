import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET types for product variations
export async function GET(request: NextRequest) {
  try {
    const types = await prisma.variationType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching variation types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variation types' },
      { status: 500 }
    );
  }
}

// Create a new variation type
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
    
    // Create the type
    const type = await prisma.variationType.create({
      data: {
        name: body.name,
        arabicName: body.arabicName,
        description: body.description,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });
    
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error('Failed to create variation type:', error);
    return NextResponse.json(
      { error: 'Failed to create variation type' },
      { status: 500 }
    );
  }
} 