import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
        variations: true,
        promotions: true,
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check all dependencies
    const dependencies = {
      orderItems: await prisma.orderItem.count({
        where: { productId }
      }),
      bundleItems: await prisma.bundleItem.count({
        where: {
          OR: [
            { bundleProductId: productId },
            { containedProductId: productId }
          ]
        }
      }),
      images: product.images.length,
      variations: product.variations.length,
      promotions: product.promotions.length,
    };

    // Check if product can be safely deleted
    const canDelete = dependencies.orderItems === 0 && dependencies.bundleItems === 0;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        category: product.category.name,
      },
      dependencies,
      canDelete,
      recommendation: canDelete 
        ? 'Product can be safely deleted'
        : 'Product cannot be deleted due to dependencies. Consider deactivating instead.'
    });

  } catch (error) {
    console.error('Error in debug product deletion:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product dependencies' },
      { status: 500 }
    );
  }
} 