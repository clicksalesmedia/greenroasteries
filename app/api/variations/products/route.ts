import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// Helper function to generate SKU
async function generateSku(productId: string, sizeId: string, typeId?: string, beansId?: string): Promise<string> {
  try {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        name: true,
        category: { select: { name: true } }
      }
    });
    
    // Get size details
    const size = await prisma.variationSize.findUnique({
      where: { id: sizeId },
      select: { displayName: true }
    });
    
    // Generate base SKU from product name and category
    const productCode = product?.name.substring(0, 3).toUpperCase() || 'PRD';
    const categoryCode = product?.category?.name.substring(0, 3).toUpperCase() || 'CAT';
    const sizeCode = size?.displayName.replace(/[^0-9]/g, '') || 'SZ';
    
    // Add type and beans codes if available
    let typeCode = '';
    let beansCode = '';
    
    if (typeId) {
      const type = await prisma.variationType.findUnique({
        where: { id: typeId },
        select: { name: true }
      });
      typeCode = `-${type?.name.substring(0, 2).toUpperCase() || 'TP'}`;
    }
    
    if (beansId) {
      const beans = await prisma.variationBeans.findUnique({
        where: { id: beansId },
        select: { name: true }
      });
      beansCode = `-${beans?.name.substring(0, 2).toUpperCase() || 'BN'}`;
    }
    
    // Generate a unique timestamp suffix
    const timestamp = Date.now().toString().slice(-4);
    
    // Combine all parts to create the SKU
    return `${productCode}-${categoryCode}-${sizeCode}${typeCode}${beansCode}-${timestamp}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    return `SKU-${Date.now()}`;
  }
}

// GET product variations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const variations = await prisma.productVariation.findMany({
      where: {
        productId: productId,
      },
      include: {
        size: true,
        type: true,
        beans: true,
      },
      orderBy: [
        { size: { value: 'asc' } },
        { type: { name: 'asc' } },
      ],
    });
    
    return NextResponse.json(variations);
  } catch (error) {
    console.error('Error fetching product variations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product variations' },
      { status: 500 }
    );
  }
}

// Create a new product variation
export async function POST(request: NextRequest) {
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
    const { 
      productId, 
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
    if (!productId || !sizeId || !price) {
      return NextResponse.json(
        { error: 'Product ID, size ID, and price are required' },
        { status: 400 }
      );
    }
    
    // Check if a variation with the same attributes already exists
    const existingVariation = await prisma.productVariation.findFirst({
      where: {
        productId,
        sizeId,
        typeId: typeId || null,
        beansId: beansId || null
      }
    });
    
    if (existingVariation) {
      return NextResponse.json(
        { error: 'A variation with these attributes already exists' },
        { status: 400 }
      );
    }
    
    // Check if SKU already exists (if provided)
    if (sku) {
      const existingSku = await prisma.productVariation.findFirst({
        where: { 
          sku,
          NOT: { productId }
        }
      });
      
      if (existingSku) {
        return NextResponse.json(
          { error: 'A variation with this SKU already exists' },
          { status: 400 }
        );
      }
    }
    
    // Generate a default SKU if not provided
    const finalSku = sku || await generateSku(productId, sizeId, typeId, beansId);
    
    // Create the data object with type safety
    const createData: any = {
      productId,
      sizeId,
      typeId: typeId || null,
      beansId: beansId || null,
      price,
      discount,
      discountType,
      sku: finalSku,
      stockQuantity: stockQuantity || 0,
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Only add imageUrl if it was provided
    if (imageUrl !== undefined) {
      createData.imageUrl = imageUrl;
    }
    
    // Create the variation
    const variation = await prisma.productVariation.create({
      data: createData,
      include: {
        size: true,
        type: true,
        beans: true
      }
    });
    
    return NextResponse.json(variation, { status: 201 });
  } catch (error) {
    console.error('Error creating product variation:', error);
    return NextResponse.json(
      { error: 'Failed to create product variation' },
      { status: 500 }
    );
  }
} 