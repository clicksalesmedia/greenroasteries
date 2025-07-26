import { NextRequest, NextResponse } from 'next/server';
import GoogleAdsEnhancedConversions, {
  type GoogleAdsUserData,
  type GoogleAdsOrderData,
  type GoogleAdsProduct
} from '@/app/lib/google-ads-enhanced-conversions';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Google Ads Enhanced Conversions setup...');
    
    // Test the Google Ads Enhanced Conversions service
    const testResult = await GoogleAdsEnhancedConversions.testConversion();
    
    return NextResponse.json({
      success: true,
      service: 'Google Ads Enhanced Conversions',
      timestamp: new Date().toISOString(),
      test_result: testResult,
      configuration: {
        conversion_id: 'AW-17214709280',
        conversion_label: 'rRb1CIv4r-waEKC8zpBA',
        currency: 'AED',
        enhanced_conversions: true
      }
    });
    
  } catch (error) {
    console.error('❌ Google Ads Enhanced Conversions test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Allow testing with custom data
    const testOrderData: GoogleAdsOrderData = {
      orderId: body.orderId || `test_order_${Date.now()}`,
      total: body.total || 150.00,
      subtotal: body.subtotal || 130.00,
      tax: body.tax || 15.00,
      shippingCost: body.shippingCost || 5.00,
      discount: body.discount || 0,
      currency: body.currency || 'AED',
      items: body.items || [
        {
          id: 'test_product_1',
          name: 'Test Coffee Blend',
          price: 75.00,
          quantity: 1,
          category: 'Coffee',
          brand: 'Green Roasteries',
          description: 'Premium coffee blend for testing'
        },
        {
          id: 'test_product_2',
          name: 'Test Espresso',
          price: 55.00,
          quantity: 1,
          category: 'Coffee',
          brand: 'Green Roasteries',
          description: 'Bold espresso for testing'
        }
      ],
      paymentMethod: body.paymentMethod || 'test',
      isNewCustomer: body.isNewCustomer || false
    };

    const testUserData: GoogleAdsUserData = {
      email: body.email || 'test@greenroasteries.com',
      phone: body.phone || '+971501234567',
      firstName: body.firstName || 'Test',
      lastName: body.lastName || 'Customer',
      city: body.city || 'Dubai',
      country: body.country || 'AE',
      externalId: body.externalId || 'test_user_123'
    };

    console.log('🧪 Testing Google Ads Enhanced Conversions with custom data:', {
      orderId: testOrderData.orderId,
      total: testOrderData.total,
      currency: testOrderData.currency,
      itemsCount: testOrderData.items.length,
      userEmail: testUserData.email
    });

    // Test the purchase conversion tracking
    const result = await GoogleAdsEnhancedConversions.trackPurchase(
      testOrderData, 
      testUserData, 
      'test_api'
    );

    if (result.success) {
      console.log('✅ Google Ads Enhanced Conversions test successful');
      return NextResponse.json({
        success: true,
        message: 'Google Ads Enhanced Conversions test completed successfully',
        conversion_data: {
          conversion_id: 'AW-17214709280',
          conversion_label: 'rRb1CIv4r-waEKC8zpBA',
          order_id: testOrderData.orderId,
          total: testOrderData.total,
          currency: testOrderData.currency,
          items_count: testOrderData.items.length,
          enhanced_conversions: true,
          user_data_provided: {
            email: !!testUserData.email,
            phone: !!testUserData.phone,
            firstName: !!testUserData.firstName,
            lastName: !!testUserData.lastName,
            city: !!testUserData.city,
            country: !!testUserData.country
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Google Ads Enhanced Conversions test failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Google Ads Enhanced Conversions test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 