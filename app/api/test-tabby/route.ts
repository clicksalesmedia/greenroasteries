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

    // Test a simple API call to Tabby
    const testUrl = 'https://api.tabby.ai/api/v2/configuration';
    
    console.log('Testing Tabby API with:', {
      url: testUrl,
      authHeader: `Bearer ${secretKey.substring(0, 10)}...`,
      merchantCode
    });

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('Tabby API Response:', {
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
      apiTest: {
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