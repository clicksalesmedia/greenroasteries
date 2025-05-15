import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a specific bean variation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await params.then(p => p.id);
    
    const bean = await prisma.variationBeans.findUnique({
      where: { id },
    });
    
    if (!bean) {
      return NextResponse.json(
        { error: 'Bean variation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(bean);
  } catch (error) {
    console.error('Error fetching bean variation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bean variation' },
      { status: 500 }
    );
  }
}

// UPDATE a bean variation (full update)
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
    
    // Check if the bean exists
    const existingBean = await prisma.variationBeans.findUnique({
      where: { id },
    });
    
    if (!existingBean) {
      return NextResponse.json(
        { error: 'Bean variation not found' },
        { status: 404 }
      );
    }
    
    // Update the bean
    const updatedBean = await prisma.variationBeans.update({
      where: { id },
      data: {
        name: body.name,
        arabicName: body.arabicName,
        description: body.description,
        isActive: body.isActive !== undefined ? body.isActive : existingBean.isActive,
      },
    });
    
    return NextResponse.json(updatedBean);
  } catch (error) {
    console.error('Error updating bean variation:', error);
    return NextResponse.json(
      { error: 'Failed to update bean variation' },
      { status: 500 }
    );
  }
}

// PATCH a bean variation (partial update)
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
    
    // Check if the bean exists
    const existingBean = await prisma.variationBeans.findUnique({
      where: { id },
    });
    
    if (!existingBean) {
      return NextResponse.json(
        { error: 'Bean variation not found' },
        { status: 404 }
      );
    }
    
    // Update only the provided fields
    const updatedBean = await prisma.variationBeans.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        arabicName: body.arabicName !== undefined ? body.arabicName : undefined,
        description: body.description !== undefined ? body.description : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });
    
    return NextResponse.json(updatedBean);
  } catch (error) {
    console.error('Error updating bean variation:', error);
    return NextResponse.json(
      { error: 'Failed to update bean variation' },
      { status: 500 }
    );
  }
}

// DELETE a bean variation
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
    
    // Check if the bean exists
    const existingBean = await prisma.variationBeans.findUnique({
      where: { id },
    });
    
    if (!existingBean) {
      return NextResponse.json(
        { error: 'Bean variation not found' },
        { status: 404 }
      );
    }
    
    // Check if this bean is used in any product variations
    const usedInVariations = await prisma.productVariation.findFirst({
      where: { beansId: id },
    });
    
    if (usedInVariations) {
      return NextResponse.json(
        { error: 'Cannot delete this bean variation as it is used in product variations' },
        { status: 400 }
      );
    }
    
    // Delete the bean
    await prisma.variationBeans.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bean variation:', error);
    return NextResponse.json(
      { error: 'Failed to delete bean variation' },
      { status: 500 }
    );
  }
} 