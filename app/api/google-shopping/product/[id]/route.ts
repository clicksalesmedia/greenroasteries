import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { checkAuth } from '@/app/lib/auth';
import { GoogleShoppingService } from '@/app/lib/google-shopping';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { includeVariations = true, dryRun = false } = body;

    // Validate Google Shopping configuration
    const googleShopping = new GoogleShoppingService();
    if (!googleShopping.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Shopping API not configured' },
        { status: 400 }
      );
    }

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variations: {
          where: { isActive: true },
          include: {
            size: true,
            type: true,
            beans: true,
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.inStock) {
      return NextResponse.json(
        { error: 'Product is not in stock and cannot be synced' },
        { status: 400 }
      );
    }

    try {
      // Convert product to Google Shopping format
      const productData = await googleShopping.convertProductToGoogleFormat(product, includeVariations);
      
      if (dryRun) {
        return NextResponse.json({
          success: true,
          productId: product.id,
          productName: product.name,
          googleProductId: productData.mainProduct.offerId,
          variationsCount: productData.variations.length || 0,
          status: 'validated',
          dryRun: true,
          googleProduct: productData.mainProduct,
          variations: productData.variations
        });
      }

      // Actually sync to Google Shopping
      const syncResult = await googleShopping.syncProduct(productData);
      
      if (syncResult.success) {
        return NextResponse.json({
          success: true,
          productId: product.id,
          productName: product.name,
          googleProductId: syncResult.googleProductId,
          variations: syncResult.variationCount || 0,
          status: 'synced'
        });
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: syncResult.error,
            productId: product.id,
            productName: product.name
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error syncing product ${product.id}:`, error);
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          productId: product.id,
          productName: product.name
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Product sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync product to Google Shopping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    // Validate Google Shopping configuration
    const googleShopping = new GoogleShoppingService();
    if (!googleShopping.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Shopping API not configured' },
        { status: 400 }
      );
    }

    // Get the product to find its SKU/offerId
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const offerId = product.sku || `gr-${product.id}`;

    try {
      // Delete from Google Shopping
      const deleteResult = await googleShopping.deleteProduct(offerId);
      
      if (deleteResult.success) {
        return NextResponse.json({
          success: true,
          productId: product.id,
          productName: product.name,
          googleProductId: offerId,
          status: 'deleted'
        });
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: deleteResult.error,
            productId: product.id,
            productName: product.name
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error deleting product ${product.id} from Google Shopping:`, error);
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          productId: product.id,
          productName: product.name
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete product from Google Shopping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    // Validate Google Shopping configuration
    const googleShopping = new GoogleShoppingService();
    if (!googleShopping.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Shopping API not configured' },
        { status: 400 }
      );
    }

    // Get the product to find its SKU/offerId
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const offerId = product.sku || `gr-${product.id}`;

    try {
      // Get product from Google Shopping
      const googleProduct = await googleShopping.getProduct(offerId);
      
      return NextResponse.json({
        success: true,
        productId: product.id,
        productName: product.name,
        googleProductId: offerId,
        googleProduct: googleProduct
      });
    } catch (error) {
      console.error(`Error getting product ${product.id} from Google Shopping:`, error);
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Product not found in Google Shopping',
          productId: product.id,
          productName: product.name
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Product get error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get product from Google Shopping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 