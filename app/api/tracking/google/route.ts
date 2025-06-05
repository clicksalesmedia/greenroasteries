import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface GoogleConversionData {
  conversion_action: string;
  conversion_date_time: string;
  conversion_value?: number;
  currency_code?: string;
  order_id?: string;
  external_attribution_data?: {
    external_attribution_credit?: number;
    external_attribution_model?: string;
  };
  user_identifiers?: {
    hashed_email?: string;
    hashed_phone_number?: string;
    address_info?: {
      hashed_first_name?: string;
      hashed_last_name?: string;
      hashed_street_address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country_code?: string;
    };
  };
  conversion_environment?: 'APP' | 'WEB';
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  cart_data?: {
    merchant_id?: number;
    feed_country_code?: string;
    feed_language_code?: string;
    local_transaction_cost?: number;
    items?: Array<{
      product_id?: string;
      merchant_id?: number;
      country_code?: string;
      language_code?: string;
      quantity?: number;
      unit_price?: number;
    }>;
  };
}

// Hash function for PII data (SHA-256)
function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Normalize phone number
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it; otherwise add country code if needed
  if (!normalized.startsWith('+')) {
    // Assume UAE country code +971 if no country code present
    if (normalized.length === 9 && !normalized.startsWith('0')) {
      normalized = '+971' + normalized;
    } else if (normalized.startsWith('0')) {
      normalized = '+971' + normalized.substring(1);
    }
  }
  
  return normalized;
}

// Validate and process conversion data
function validateConversionData(conversionData: any): GoogleConversionData | null {
  try {
    const requiredFields = ['conversion_action', 'conversion_date_time'];
    for (const field of requiredFields) {
      if (!conversionData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const processedData: GoogleConversionData = {
      conversion_action: conversionData.conversion_action,
      conversion_date_time: conversionData.conversion_date_time,
      conversion_environment: conversionData.conversion_environment || 'WEB'
    };

    // Add optional fields
    if (conversionData.conversion_value) {
      processedData.conversion_value = conversionData.conversion_value;
    }
    if (conversionData.currency_code) {
      processedData.currency_code = conversionData.currency_code;
    }
    if (conversionData.order_id) {
      processedData.order_id = conversionData.order_id;
    }
    if (conversionData.gclid) {
      processedData.gclid = conversionData.gclid;
    }
    if (conversionData.gbraid) {
      processedData.gbraid = conversionData.gbraid;
    }
    if (conversionData.wbraid) {
      processedData.wbraid = conversionData.wbraid;
    }

    // Process user identifiers with hashing
    if (conversionData.user_data) {
      const userData = conversionData.user_data;
      processedData.user_identifiers = {};

      if (userData.email) {
        processedData.user_identifiers.hashed_email = hashData(userData.email);
      }

      if (userData.phone) {
        const normalizedPhone = normalizePhoneNumber(userData.phone);
        processedData.user_identifiers.hashed_phone_number = hashData(normalizedPhone);
      }

      if (userData.first_name || userData.last_name || userData.street_address || 
          userData.city || userData.state || userData.postal_code || userData.country_code) {
        processedData.user_identifiers.address_info = {};

        if (userData.first_name) {
          processedData.user_identifiers.address_info.hashed_first_name = hashData(userData.first_name);
        }
        if (userData.last_name) {
          processedData.user_identifiers.address_info.hashed_last_name = hashData(userData.last_name);
        }
        if (userData.street_address) {
          processedData.user_identifiers.address_info.hashed_street_address = hashData(userData.street_address);
        }
        if (userData.city) {
          processedData.user_identifiers.address_info.city = userData.city;
        }
        if (userData.state) {
          processedData.user_identifiers.address_info.state = userData.state;
        }
        if (userData.postal_code) {
          processedData.user_identifiers.address_info.postal_code = userData.postal_code;
        }
        if (userData.country_code) {
          processedData.user_identifiers.address_info.country_code = userData.country_code;
        }
      }
    }

    // Process cart data for e-commerce
    if (conversionData.cart_data) {
      processedData.cart_data = conversionData.cart_data;
    }

    return processedData;
  } catch (error) {
    console.error('Error validating Google conversion data:', error);
    return null;
  }
}

// Send conversion to Google Ads API
async function sendToGoogleAds(customerId: string, conversionData: GoogleConversionData[]): Promise<any> {
  // Note: This is a simplified example. In production, you would use the Google Ads API client library
  // and proper OAuth2 authentication
  
  const url = `https://googleads.googleapis.com/v14/customers/${customerId}/conversionUploads:uploadClickConversions`;
  const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('Google Ads access token not configured');
  }

  const payload = {
    conversions: conversionData,
    partial_failure_enabled: true
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Google Ads API Error: ${result.error?.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending to Google Ads API:', error);
    throw error;
  }
}

// Alternative: Send via Google Analytics Measurement Protocol for GA4
async function sendToGA4(measurementId: string, apiSecret: string, conversionData: any): Promise<any> {
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
  
  const payload = {
    client_id: conversionData.client_id || crypto.randomUUID(),
    events: [{
      name: 'purchase',
      parameters: {
        transaction_id: conversionData.order_id,
        value: conversionData.conversion_value,
        currency: conversionData.currency_code || 'AED',
        items: conversionData.items || []
      }
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GA4 Measurement Protocol Error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending to GA4 Measurement Protocol:', error);
    throw error;
  }
}

// POST - Send conversion event to Google
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method = 'ga4' } = body; // 'ga4' or 'ads'
    
    // Support single conversion or batch of conversions
    const conversions = Array.isArray(body.conversions) ? body.conversions : [body];
    
    if (method === 'ads') {
      // Google Ads Enhanced Conversions
      const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
      
      if (!customerId) {
        return NextResponse.json(
          { error: 'Google Ads Customer ID not configured' },
          { status: 400 }
        );
      }

      // Validate and process each conversion
      const validatedConversions: GoogleConversionData[] = [];
      for (const conversion of conversions) {
        const validatedConversion = validateConversionData(conversion);
        if (validatedConversion) {
          validatedConversions.push(validatedConversion);
        }
      }

      if (validatedConversions.length === 0) {
        return NextResponse.json(
          { error: 'No valid conversions found' },
          { status: 400 }
        );
      }

      const result = await sendToGoogleAds(customerId, validatedConversions);
      
      return NextResponse.json({
        success: true,
        method: 'google-ads',
        conversions_processed: validatedConversions.length,
        result
      });

    } else {
      // GA4 Measurement Protocol
      let measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      let apiSecret = process.env.GA4_API_SECRET;
      
      // Fallback to hardcoded values if not in environment
      if (!measurementId) {
        measurementId = 'G-RYC9K25QGQ';
      }
      if (!apiSecret) {
        apiSecret = 'default_api_secret';
      }

      const results = [];
      for (const conversion of conversions) {
        try {
          const result = await sendToGA4(measurementId, apiSecret, conversion);
          results.push(result);
        } catch (error) {
          console.error('Error sending conversion to GA4:', error);
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return NextResponse.json({
        success: true,
        method: 'ga4',
        conversions_processed: conversions.length,
        results
      });
    }

  } catch (error) {
    console.error('Google Conversions API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET - Health check and configuration status
export async function GET() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;

  return NextResponse.json({
    ga4_configured: !!(measurementId && apiSecret),
    google_ads_configured: !!(customerId && accessToken),
    measurement_id: measurementId ? `${measurementId.substring(0, 8)}...` : null,
    customer_id: customerId ? `${customerId.substring(0, 6)}...` : null,
    endpoints: {
      send_conversion: '/api/tracking/google'
    },
    methods: {
      ga4: 'Send via GA4 Measurement Protocol',
      ads: 'Send via Google Ads Enhanced Conversions'
    },
    supported_events: [
      'purchase',
      'sign_up',
      'login',
      'add_to_cart',
      'begin_checkout',
      'add_payment_info',
      'view_item',
      'search'
    ]
  });
} 