import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const publicKey = process.env.TABBY_PUBLIC_KEY;
    const secretKey = process.env.TABBY_SECRET_KEY;
    const merchantCode = process.env.TABBY_MERCHANT_CODE;

    console.log('Tabby Debug - Environment Variables:', {
      publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'NOT_SET',
      secretKey: secretKey ? `${secretKey.substring(0, 10)}...` : 'NOT_SET',
      merchantCode: merchantCode || 'NOT_SET',
      isTestMode: secretKey?.startsWith('sk_test_') || false
    });

    if (!secretKey || !publicKey) {
      return NextResponse.json({
        error: 'Missing Tabby credentials',
        details: {
          hasPublicKey: !!publicKey,
          hasSecretKey: !!secretKey,
          hasMerchantCode: !!merchantCode
        }
      }, { status: 400 });
    }

    // Test the actual checkout endpoint used in production
    const testUrl = 'https://api.tabby.ai/api/v2/checkout';
    
    // Create a minimal test payload
    const testPayload = {
      payment: {
        amount: "100.00",
        currency: "AED",
        description: "Test payment",
        buyer: {
          phone: "+971501234567",
          email: secretKey.startsWith('sk_test_') ? "test" : "test@example.com",
          name: "Test User",
          dob: "1990-01-01T00:00:00.000Z"
        },
        shipping_address: {
          city: "Dubai",
          address: "Test Address",
          zip: "1111"
        },
        order: {
          tax_amount: "0.00",
          shipping_amount: "0.00",
          discount_amount: "0.00",
          updated_at: new Date().toISOString(),
          reference_id: `test_${Date.now()}`,
          items: [{
            title: "Test Product",
            description: "Test Description",
            quantity: 1,
            unit_price: "100.00",
            discount_amount: "0.00",
            reference_id: "test_product_1",
            image_url: "https://example.com/",
            product_url: "https://example.com/",
            gender: "Other",
            category: "Coffee",
            color: "brown",
            product_material: "organic",
            size_type: "weight",
            size: "M",
            brand: "Green Roasteries",
            is_refundable: true,
            barcode: "12345678",
            ppn: "GR-test_product_1",
            seller: "Green Roasteries"
          }]
        },
        buyer_history: {
          registered_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          loyalty_level: 1,
          wishlist_count: 2,
          is_social_networks_connected: true,
          is_phone_number_verified: true,
          is_email_verified: true
        },
        order_history: [],
        meta: {
          order_id: `test_${Date.now()}`,
          customer: secretKey.startsWith('sk_test_') ? "test" : "test@example.com"
        },
        attachment: {
          body: "{}",
          content_type: "application/json"
        }
      },
      lang: "en",
      merchant_code: merchantCode,
      merchant_urls: {
        success: "https://thegreenroasteries.com/checkout/thank-you?payment=tabby&session_id={payment.id}",
        cancel: "https://thegreenroasteries.com/checkout?payment=cancelled",
        failure: "https://thegreenroasteries.com/checkout?payment=failed"
      },
      token: null
    };
    
    console.log('Testing Tabby checkout API with:', {
      url: testUrl,
      authHeader: `Bearer ${secretKey.substring(0, 10)}...`,
      merchantCode,
      payloadSample: {
        amount: testPayload.payment.amount,
        currency: testPayload.payment.currency,
        merchant_code: testPayload.merchant_code
      }
    });

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('Tabby checkout API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    });

    return NextResponse.json({
      success: true,
      credentials: {
        publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'NOT_SET',
        secretKey: secretKey ? `${secretKey.substring(0, 10)}...` : 'NOT_SET',
        merchantCode: merchantCode || 'NOT_SET',
        isTestMode: secretKey?.startsWith('sk_test_') || false
      },
      checkoutApiTest: {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      }
    });

  } catch (error) {
    console.error('Tabby debug error:', error);
    return NextResponse.json({
      error: 'Failed to test Tabby API',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 