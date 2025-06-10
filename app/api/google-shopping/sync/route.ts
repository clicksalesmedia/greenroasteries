import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { checkAuth } from '@/app/lib/auth';
import { GoogleShoppingService } from '@/app/lib/google-shopping';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { 
      productIds = [], 
      syncAll = false, 
      dryRun = false,
      includeVariations = true,
      batchSize = 5  // Process 5 products at a time to prevent timeouts
    } = body;

    // Validate Google Shopping configuration
    const googleShopping = new GoogleShoppingService();
    if (!googleShopping.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'Google Shopping API not configured. Please add required environment variables.',
          required: [
            'GOOGLE_MERCHANT_CENTER_ID',
            'GOOGLE_SERVICE_ACCOUNT_KEY',
            'GOOGLE_SHOPPING_COUNTRY',
            'GOOGLE_SHOPPING_LANGUAGE'
          ]
        },
        { status: 400 }
      );
    }

    let products;
    
    if (syncAll) {
      // Get all active products
      products = await prisma.product.findMany({
        where: {
          inStock: true,
        },
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
    } else if (productIds.length > 0) {
      // Get specific products
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          inStock: true,
        },
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
    } else {
      return NextResponse.json(
        { error: 'Either specify productIds or set syncAll to true' },
        { status: 400 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { message: 'No products found to sync' },
        { status: 200 }
      );
    }

    // Prepare sync results
    const results = {
      totalProducts: products.length,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [] as any[],
      syncedProducts: [] as any[],
      dryRun,
      message: '' as string
    };

    console.log(`Starting Google Shopping sync for ${products.length} products (dryRun: ${dryRun}, batchSize: ${batchSize})`);

    // Process products in batches to prevent timeouts
    const totalProducts = products.length;
    const processBatch = Math.min(batchSize, totalProducts);
    const processedProducts = products.slice(0, processBatch);
    
    console.log(`Processing batch of ${processedProducts.length} products (total: ${totalProducts})`);

    // Process each product in the current batch
    for (const product of processedProducts) {
      try {
        // Convert product to Google Shopping format
        const productData = await googleShopping.convertProductToGoogleFormat(product, includeVariations);
        
        if (dryRun) {
          // Just validate the conversion
          results.syncedProducts.push({
            productId: product.id,
            productName: product.name,
            googleProductId: productData.mainProduct.offerId,
            variations: productData.variations.length || 0,
            status: 'validated'
          });
          results.successCount++;
        } else {
          // Actually sync to Google Shopping
          const syncResult = await googleShopping.syncProduct(productData);
          
          if (syncResult.success) {
            results.syncedProducts.push({
              productId: product.id,
              productName: product.name,
              googleProductId: syncResult.googleProductId,
              variations: syncResult.variationCount || 0,
              status: 'synced'
            });
            results.successCount++;
          } else {
            results.errors.push({
              productId: product.id,
              productName: product.name,
              error: syncResult.error
            });
            results.errorCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.errors.push({
          productId: product.id,
          productName: product.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.errorCount++;
      }
    }

    // Log the sync operation
    console.log(`Google Shopping sync completed. Success: ${results.successCount}, Errors: ${results.errorCount}, Skipped: ${results.skippedCount}`);

    // Add information about remaining products
    const remainingProducts = totalProducts - processedProducts.length;
    if (remainingProducts > 0) {
      results.message = `Processed ${processedProducts.length} of ${totalProducts} products. ${remainingProducts} products remaining. Run sync again to continue.`;
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Google Shopping sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync products to Google Shopping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    // Get sync status and configuration
    const googleShopping = new GoogleShoppingService();
    const isConfigured = googleShopping.isConfigured();
    
    // Get product counts
    const totalProducts = await prisma.product.count({
      where: { inStock: true }
    });
    
    const productsWithVariations = await prisma.product.count({
      where: {
        inStock: true,
        variations: {
          some: { isActive: true }
        }
      }
    });

    return NextResponse.json({
      configured: isConfigured,
      totalProducts,
      productsWithVariations,
      configuration: isConfigured ? {
        merchantId: process.env.GOOGLE_MERCHANT_CENTER_ID ? 'configured' : 'missing',
        serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'configured' : 'missing',
        country: process.env.GOOGLE_SHOPPING_COUNTRY || 'AE',
        language: process.env.GOOGLE_SHOPPING_LANGUAGE || 'en',
        currency: process.env.GOOGLE_SHOPPING_CURRENCY || 'AED'
      } : null
    });

  } catch (error) {
    console.error('Error getting Google Shopping status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
} 