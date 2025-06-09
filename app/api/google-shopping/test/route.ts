import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { checkAuth } from '@/app/lib/auth';
import { GoogleShoppingService } from '@/app/lib/google-shopping';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
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
        const googleProduct = await googleShopping.convertProductToGoogleFormat(sampleProduct, true);
        
        productTest = {
          found: true,
          productId: sampleProduct.id,
          productName: sampleProduct.name,
          hasImages: sampleProduct.images.length > 0,
          hasVariations: sampleProduct.variations.length > 0,
          googleFormat: {
            offerId: googleProduct.offerId,
            title: googleProduct.title,
            description: googleProduct.description?.substring(0, 100) + '...',
            price: googleProduct.price,
            availability: googleProduct.availability,
            variationsCount: googleProduct.variations?.length || 0
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
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const googleShopping = new GoogleShoppingService();
    
    if (!googleShopping.isConfigured()) {
      return NextResponse.json(
        { error: 'Google Shopping not configured' },
        { status: 400 }
      );
    }

    // Get specific product for testing
    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    // Test product conversion
    const googleProduct = await googleShopping.convertProductToGoogleFormat(product, true);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        imagesCount: product.images.length,
        variationsCount: product.variations.length
      },
      googleProduct: {
        offerId: googleProduct.offerId,
        title: googleProduct.title,
        description: googleProduct.description?.substring(0, 200) + '...',
        link: googleProduct.link,
        imageLink: googleProduct.imageLink,
        price: googleProduct.price,
        availability: googleProduct.availability,
        brand: googleProduct.brand,
        category: googleProduct.googleProductCategory,
        variations: googleProduct.variations?.map(v => ({
          offerId: v.offerId,
          title: v.title,
          price: v.price,
          size: v.size
        })) || []
      },
      validation: {
        hasRequiredFields: !!(
          googleProduct.offerId &&
          googleProduct.title &&
          googleProduct.description &&
          googleProduct.link &&
          googleProduct.imageLink &&
          googleProduct.price
        ),
        issues: []
      }
    });

  } catch (error) {
    console.error('Product test error:', error);
    return NextResponse.json(
      { 
        error: 'Product test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 