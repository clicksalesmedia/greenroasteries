import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(_req: NextRequest) {
  try {
    console.log('🔍 Starting image URL fix via API...');
    
    // Fix product main images
    const productsWithBadUrls = await prisma.product.findMany({
      where: {
        imageUrl: {
          startsWith: '/products/'
        }
      }
    });

    console.log(`📦 Found ${productsWithBadUrls.length} products with incorrect image URLs`);
    
    let fixedCount = 0;

    for (const product of productsWithBadUrls) {
      if (product.imageUrl && product.imageUrl.startsWith('/products/')) {
        const correctUrl = product.imageUrl.replace('/products/', '/uploads/products/');
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: correctUrl }
        });
        fixedCount++;
      }
    }

    // Fix variation images
    const variationsWithBadUrls = await prisma.productVariation.findMany({
      where: {
        imageUrl: {
          startsWith: '/products/'
        }
      }
    });

    console.log(`🔄 Found ${variationsWithBadUrls.length} variations with incorrect image URLs`);

    let variationFixedCount = 0;
    for (const variation of variationsWithBadUrls) {
      if (variation.imageUrl && variation.imageUrl.startsWith('/products/')) {
        const correctUrl = variation.imageUrl.replace('/products/', '/uploads/products/');
        await prisma.productVariation.update({
          where: { id: variation.id },
          data: { imageUrl: correctUrl }
        });
        variationFixedCount++;
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Image URLs fixed successfully!',
      results: {
        productsFixed: fixedCount,
        variationsFixed: variationFixedCount,
        totalFixed: fixedCount + variationFixedCount
      }
    });

  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 