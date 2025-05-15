import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a specific variation type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await params.then(p => p.id);
    
    const type = await prisma.variationType.findUnique({
      where: { id },
    });
    
    if (!type) {
      return NextResponse.json(
        { error: 'Variation type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(type);
  } catch (error) {
    console.error('Error fetching variation type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variation type' },
      { status: 500 }
    );
  }
}

// UPDATE a variation type (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await params.then(p => p.id);
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Check if the type exists
    const existingType = await prisma.variationType.findUnique({
      where: { id },
    });
    
    if (!existingType) {
      return NextResponse.json(
        { error: 'Variation type not found' },
        { status: 404 }
      );
    }
    
    // Update the type
    const updatedType = await prisma.variationType.update({
      where: { id },
      data: {
        name: body.name,
        arabicName: body.arabicName,
        isActive: body.isActive !== undefined ? body.isActive : existingType.isActive,
      },
    });
    
    return NextResponse.json(updatedType);
  } catch (error) {
    console.error('Error updating variation type:', error);
    return NextResponse.json(
      { error: 'Failed to update variation type' },
      { status: 500 }
    );
  }
}

// PATCH a variation type (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await params.then(p => p.id);
    const body = await request.json();
    
    // Check if the type exists
    const existingType = await prisma.variationType.findUnique({
      where: { id },
    });
    
    if (!existingType) {
      return NextResponse.json(
        { error: 'Variation type not found' },
        { status: 404 }
      );
    }
    
    // Update only the provided fields
    const updatedType = await prisma.variationType.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        arabicName: body.arabicName !== undefined ? body.arabicName : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });
    
    return NextResponse.json(updatedType);
  } catch (error) {
    console.error('Error updating variation type:', error);
    return NextResponse.json(
      { error: 'Failed to update variation type' },
      { status: 500 }
    );
  }
}

// DELETE a variation type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await params.then(p => p.id);
    
    // Check if the type exists
    const existingType = await prisma.variationType.findUnique({
      where: { id },
    });
    
    if (!existingType) {
      return NextResponse.json(
        { error: 'Variation type not found' },
        { status: 404 }
      );
    }
    
    // Check if this type is used in any product variations
    const usedInVariations = await prisma.productVariation.findFirst({
      where: { typeId: id },
    });
    
    if (usedInVariations) {
      return NextResponse.json(
        { error: 'Cannot delete this variation type as it is used in product variations' },
        { status: 400 }
      );
    }
    
    // Delete the type
    await prisma.variationType.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variation type:', error);
    return NextResponse.json(
      { error: 'Failed to delete variation type' },
      { status: 500 }
    );
  }
} 