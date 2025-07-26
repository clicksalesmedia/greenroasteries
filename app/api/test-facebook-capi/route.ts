import { NextRequest, NextResponse } from 'next/server';
import FacebookCapiService from '@/app/lib/facebook-capi';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Facebook CAPI] Starting connection test...');
    
    const isConnected = await FacebookCapiService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Facebook CAPI connection successful',
        pixel_id: process.env.FACEBOOK_PIXEL_ID || '3805848799548541',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Facebook CAPI connection failed',
        pixel_id: process.env.FACEBOOK_PIXEL_ID || '3805848799548541',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test Facebook CAPI] Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Facebook CAPI test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, productId, productName, price, userEmail } = body;
    
    console.log(`[Test Facebook CAPI] Testing ${eventType} event...`);
    
    // Test data
    const testUserData = {
      email: userEmail || 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      city: 'Dubai',
      country: 'AE',
      clientIpAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      clientUserAgent: request.headers.get('user-agent') || 'Test-Agent'
    };
    
    const testProduct = {
      id: productId || 'test-product-123',
      name: productName || 'Test Coffee',
      price: price || 50.00,
      quantity: 1,
      category: 'Coffee',
      brand: 'Green Roasteries'
    };
    
    let result;
    
    switch (eventType) {
      case 'ViewContent':
        result = await FacebookCapiService.trackViewContent(testProduct, testUserData);
        break;
      case 'AddToCart':
        result = await FacebookCapiService.trackAddToCart(testProduct, testUserData);
        break;
      case 'Purchase':
        const testOrderData = {
          orderId: 'test-order-' + Date.now(),
          total: testProduct.price,
          currency: 'AED',
          items: [testProduct],
          paymentMethod: 'stripe',
          isNewCustomer: true
        };
        result = await FacebookCapiService.trackPurchase(testOrderData, testUserData, 'website');
        break;
      case 'Lead':
        result = await FacebookCapiService.trackLead('newsletter', testUserData);
        break;
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `${eventType} event tracked successfully`,
      eventType,
      testData: {
        product: testProduct,
        user: { ...testUserData, email: 'hidden' }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test Facebook CAPI] POST Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Facebook CAPI test event failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 