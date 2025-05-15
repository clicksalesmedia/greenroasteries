import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a specific variation size by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await params.then(p => p.id);
    
    const size = await prisma.variationSize.findUnique({
      where: { id },
    });
    
    if (!size) {
      return NextResponse.json(
        { error: 'Variation weight not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(size);
  } catch (error) {
    console.error('Error fetching variation weight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variation weight' },
      { status: 500 }
    );
  }
}

// UPDATE a variation size (full update)
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
    if (!body.name || !body.value) {
      return NextResponse.json(
        { error: 'Name and value are required' },
        { status: 400 }
      );
    }
    
    // Check if the size exists
    const existingSize = await prisma.variationSize.findUnique({
      where: { id },
    });
    
    if (!existingSize) {
      return NextResponse.json(
        { error: 'Variation weight not found' },
        { status: 404 }
      );
    }
    
    // Update the size
    const updatedSize = await prisma.variationSize.update({
      where: { id },
      data: {
        name: body.name,
        value: body.value,
        displayName: body.displayName,
        isActive: body.isActive !== undefined ? body.isActive : existingSize.isActive,
      },
    });
    
    return NextResponse.json(updatedSize);
  } catch (error) {
    console.error('Error updating variation weight:', error);
    return NextResponse.json(
      { error: 'Failed to update variation weight' },
      { status: 500 }
    );
  }
}

// PATCH a variation size (partial update)
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
    
    // Check if the size exists
    const existingSize = await prisma.variationSize.findUnique({
      where: { id },
    });
    
    if (!existingSize) {
      return NextResponse.json(
        { error: 'Variation weight not found' },
        { status: 404 }
      );
    }
    
    // Update only the provided fields
    const updatedSize = await prisma.variationSize.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        value: body.value !== undefined ? body.value : undefined,
        displayName: body.displayName !== undefined ? body.displayName : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });
    
    return NextResponse.json(updatedSize);
  } catch (error) {
    console.error('Error updating variation weight:', error);
    return NextResponse.json(
      { error: 'Failed to update variation weight' },
      { status: 500 }
    );
  }
}

// DELETE a variation size
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
    
    // Check if the size exists
    const existingSize = await prisma.variationSize.findUnique({
      where: { id },
    });
    
    if (!existingSize) {
      return NextResponse.json(
        { error: 'Variation weight not found' },
        { status: 404 }
      );
    }
    
    // Check if this size is used in any product variations
    const usedInVariations = await prisma.productVariation.findFirst({
      where: { sizeId: id },
    });
    
    if (usedInVariations) {
      return NextResponse.json(
        { error: 'Cannot delete this variation weight as it is used in product variations' },
        { status: 400 }
      );
    }
    
    // Delete the size
    await prisma.variationSize.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variation weight:', error);
    return NextResponse.json(
      { error: 'Failed to delete variation weight' },
      { status: 500 }
    );
  }
} 