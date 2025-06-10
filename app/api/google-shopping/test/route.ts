import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { checkAuth } from '@/app/lib/auth';
import { GoogleShoppingService } from '@/app/lib/google-shopping';

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

    const googleShopping = new GoogleShoppingService();
    
    // Test configuration
    const configTest = {
      configured: googleShopping.isConfigured(),
      merchantId: !!process.env.GOOGLE_MERCHANT_CENTER_ID,
      serviceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      country: process.env.GOOGLE_SHOPPING_COUNTRY || 'AE',
      language: process.env.GOOGLE_SHOPPING_LANGUAGE || 'en',
      currency: process.env.GOOGLE_SHOPPING_CURRENCY || 'AED',
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://greenroasteries.com'
    };

    // Test database connection and get sample product
    let productTest = null;
    try {
      const sampleProduct = await prisma.product.findFirst({
        where: {
          inStock: true,
        },
        include: {
          category: true,
          images: true,
          variations: {
            where: { isActive: true },
            take: 2,
            include: {
              size: true,
              type: true,
              beans: true,
            }
          }
        }
      });

      if (sampleProduct) {
        // Test product conversion
        const productData = await googleShopping.convertProductToGoogleFormat(sampleProduct, true);
        
        productTest = {
          found: true,
          productId: sampleProduct.id,
          productName: sampleProduct.name,
          hasImages: sampleProduct.images.length > 0,
          hasVariations: sampleProduct.variations.length > 0,
          googleFormat: {
            offerId: productData.mainProduct.offerId,
            title: productData.mainProduct.title,
            description: productData.mainProduct.description?.substring(0, 100) + '...',
            price: productData.mainProduct.price,
            availability: productData.mainProduct.availability,
            variationsCount: productData.variations.length || 0
          }
        };
      } else {
        productTest = { found: false, message: 'No in-stock products found' };
      }
    } catch (dbError) {
      productTest = { 
        found: false, 
        error: dbError instanceof Error ? dbError.message : 'Database error' 
      };
    }

    // Test Google API authentication (if configured)
    let authTest = null;
    if (configTest.configured) {
      try {
        const authClient = await (googleShopping as any).getAuthClient();
        authTest = {
          success: true,
          message: 'Authentication successful'
        };
      } catch (authError) {
        authTest = {
          success: false,
          error: authError instanceof Error ? authError.message : 'Authentication failed'
        };
      }
    } else {
      authTest = {
        success: false,
        message: 'Configuration incomplete'
      };
    }

    // Get product counts
    const productCounts = await prisma.product.aggregate({
      where: { inStock: true },
      _count: true
    });

    const variationCounts = await prisma.productVariation.aggregate({
      where: { 
        isActive: true,
        product: { inStock: true }
      },
      _count: true
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      configuration: configTest,
      authentication: authTest,
      database: {
        connected: true,
        totalProducts: productCounts._count,
        totalVariations: variationCounts._count
      },
      productTest,
      status: configTest.configured && authTest?.success ? 'ready' : 'needs_configuration',
      nextSteps: configTest.configured 
        ? authTest?.success 
          ? ['Test with individual product sync', 'Run validation on all products', 'Sync products to Google Shopping']
          : ['Check service account permissions', 'Verify Merchant Center access']
        : ['Set up environment variables', 'Configure Google Cloud project', 'Create service account']
    });

  } catch (error) {
    console.error('Google Shopping test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const startTime = Date.now();
    console.log('Starting Google Shopping API test...');

    // Test 1: Check configuration
    const googleShopping = new GoogleShoppingService();
    const isConfigured = googleShopping.isConfigured();
    console.log(`Configuration test: ${isConfigured ? 'PASS' : 'FAIL'}`);

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Google Shopping not configured',
        timeElapsed: Date.now() - startTime
      });
    }

    // Test 2: Try to authenticate with Google API
    try {
      console.log('Testing Google API authentication...');
      const testProduct = {
        mainProduct: {
          offerId: 'test-product-001',
          title: 'Test Product',
          description: 'Test product for API connectivity',
          link: 'https://thegreenroasteries.com/test',
          imageLink: 'https://thegreenroasteries.com/images/logo.png',
          contentLanguage: 'en',
          targetCountry: 'AE',
          channel: 'online' as const,
          availability: 'in stock' as const,
          condition: 'new' as const,
          price: {
            value: '10.00',
            currency: 'AED'
          },
          brand: 'Green Roasteries',
          mpn: 'test-001',
          googleProductCategory: 'Food, Beverages & Tobacco > Beverages > Coffee',
          material: 'Coffee',
          ageGroup: 'adult',
          gender: 'unisex',
          customAttributes: [
            { name: 'test', value: 'true' }
          ]
        },
        variations: []
      };

      console.log('Attempting test product sync...');
      const syncResult = await googleShopping.syncProduct(testProduct);
      console.log('Sync result:', syncResult);

      return NextResponse.json({
        success: true,
        configured: true,
        authTest: 'PASS',
        syncTest: syncResult.success ? 'PASS' : 'FAIL',
        syncError: syncResult.error,
        timeElapsed: Date.now() - startTime
      });

    } catch (authError) {
      console.error('Google API authentication failed:', authError);
      return NextResponse.json({
        success: false,
        configured: true,
        authTest: 'FAIL',
        authError: authError instanceof Error ? authError.message : 'Unknown auth error',
        timeElapsed: Date.now() - startTime
      });
    }

  } catch (error) {
    console.error('Google Shopping test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - Date.now()
      },
      { status: 500 }
    );
  }
} 