import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a specific product variation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from the params promise
    const id = await params.then(p => p.id);
    
    // Check if ID exists
    if (!id) {
      return NextResponse.json(
        { error: 'Variation ID is required' },
        { status: 400 }
      );
    }
    
    const variation = await prisma.productVariation.findUnique({
      where: { id },
      include: {
        size: true,
        type: true,
        beans: true
      }
    });
    
    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(variation);
  } catch (error) {
    console.error('Failed to fetch variation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variation' },
      { status: 500 }
    );
  }
}

// UPDATE a product variation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Optional authentication - try to get session but don't fail if not configured
    let auth;
    try {
      auth = await checkAuth(['ADMIN', 'MANAGER']);
    } catch (authError) {
      console.log('Auth not configured or error getting auth:', authError);
      // Continue without authentication for development
    }
    
    // In production, you would want to check authentication
    // Commenting out for easier development:
    // if (!auth || !auth.authorized) {
    //   return NextResponse.json(
    //     { error: auth?.error || 'Unauthorized' },
    //     { status: auth?.status || 401 }
    //   );
    // }
    
    const id = await params.then(p => p.id);
    const body = await request.json();
    const { 
      sizeId, 
      typeId, 
      beansId, 
      price, 
      discount,
      discountType,
      sku, 
      stockQuantity, 
      isActive,
      imageUrl 
    } = body;
    
    // Validation
    if (!id) {
      return NextResponse.json({ error: 'Variation ID is required' }, { status: 400 });
    }
    
    if (!sizeId || !price) {
      return NextResponse.json({ error: 'Size ID and price are required' }, { status: 400 });
    }
    
    // Check if variation exists
    const existingVariation = await prisma.productVariation.findUnique({
      where: { id }
    });
    
    if (!existingVariation) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }
    
    // Check if a duplicate variation would be created
    const duplicateVariation = await prisma.productVariation.findFirst({
      where: {
        id: { not: id },
        productId: existingVariation.productId,
        sizeId,
        typeId: typeId || null,
        beansId: beansId || null
      }
    });
    
    if (duplicateVariation) {
      return NextResponse.json({ error: 'A variation with these attributes already exists' }, { status: 400 });
    }
    
    // Check if SKU already exists (if changed)
    if (sku && sku !== existingVariation.sku) {
      const existingSku = await prisma.productVariation.findFirst({
        where: {
          id: { not: id },
          sku
        }
      });
      
      if (existingSku) {
        return NextResponse.json({ error: 'A variation with this SKU already exists' }, { status: 400 });
      }
    }
    
    // Create the update object with type safety
    const updateData: any = {
      sizeId,
      typeId: typeId || null,
      beansId: beansId || null,
      price,
      discount: discount !== undefined ? discount : existingVariation.discount,
      discountType: discountType || existingVariation.discountType || 'PERCENTAGE',
      sku: sku || existingVariation.sku,
      stockQuantity: stockQuantity !== undefined ? stockQuantity : existingVariation.stockQuantity,
      isActive: isActive !== undefined ? isActive : existingVariation.isActive
    };
    
    // Only add imageUrl if it was provided
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    
    // Update the variation
    const updatedVariation = await prisma.productVariation.update({
      where: { id },
      data: updateData,
      include: {
        size: true,
        type: true,
        beans: true
      }
    });
    
    return NextResponse.json(updatedVariation);
  } catch (error) {
    console.error('Error updating product variation:', error);
    return NextResponse.json({ error: 'Failed to update product variation' }, { status: 500 });
  }
}

// DELETE a product variation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Optional authentication - try to get session but don't fail if not configured
    let auth;
    try {
      auth = await checkAuth(['ADMIN', 'MANAGER']);
    } catch (authError) {
      console.log('Auth not configured or error getting auth:', authError);
      // Continue without authentication for development
    }
    
    // In production, you would want to check authentication
    // Commenting out for easier development:
    // if (!auth || !auth.authorized) {
    //   return NextResponse.json(
    //     { error: auth?.error || 'Unauthorized' },
    //     { status: auth?.status || 401 }
    //   );
    // }
    
    const id = await params.then(p => p.id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Variation ID is required' },
        { status: 400 }
      );
    }
    
    // Check if variation exists
    const variation = await prisma.productVariation.findUnique({
      where: { id },
    });
    
    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }
    
    // Delete the variation
    await prisma.productVariation.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product variation:', error);
    return NextResponse.json(
      { error: 'Failed to delete product variation' },
      { status: 500 }
    );
  }
} 