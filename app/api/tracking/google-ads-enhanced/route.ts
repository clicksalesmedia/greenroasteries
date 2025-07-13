import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper function to hash user data for Enhanced Conversions
async function hashUserData(data: string): Promise<string> {
  if (!data) return '';
  const cleanData = data.toLowerCase().trim();
  return crypto.createHash('sha256').update(cleanData).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      event_name,
      send_to,
      value,
      currency,
      transaction_id,
      user_data,
      custom_data
    } = body;

    console.log('📊 Google Ads Enhanced Conversion (Server-side):', {
      event: event_name,
      send_to,
      value,
      currency,
      transaction_id,
      has_user_data: !!user_data,
      has_custom_data: !!custom_data
    });

    // Hash user data for Enhanced Conversions
    const hashedUserData: any = {};
    if (user_data) {
      if (user_data.email) {
        hashedUserData.sha256_email_address = [await hashUserData(user_data.email)];
      }
      if (user_data.phone) {
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = user_data.phone.replace(/[^+\d]/g, '');
        hashedUserData.sha256_phone_number = [await hashUserData(cleanPhone)];
      }
      if (user_data.first_name) {
        hashedUserData.sha256_first_name = [await hashUserData(user_data.first_name)];
      }
      if (user_data.last_name) {
        hashedUserData.sha256_last_name = [await hashUserData(user_data.last_name)];
      }
    }

    // For server-side Google Ads Enhanced Conversions, we would typically use
    // the Google Ads API, but since the user wants a simple implementation
    // without API complexity, we'll log the enhanced conversion data
    // and let the client-side tracking handle the actual conversion

    console.log('✅ Google Ads Enhanced Conversion data prepared:', {
      event_name,
      conversion_data: {
        send_to,
        value,
        currency,
        transaction_id,
        user_data: hashedUserData,
        custom_data
      }
    });

    // Note: In a full Google Ads API implementation, this would be sent to:
    // https://googleads.googleapis.com/v14/customers/{customer_id}/conversionUploads:upload
    // with OAuth authentication and the Enhanced Conversions API

    // For now, we'll return success since client-side tracking handles the conversion
    return NextResponse.json({
      success: true,
      message: 'Enhanced conversion data processed',
      event_name,
      send_to,
      value,
      currency,
      transaction_id,
      enhanced_data_prepared: true,
      user_data_hashed: Object.keys(hashedUserData).length > 0
    });

  } catch (error) {
    console.error('Google Ads Enhanced Conversion error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process enhanced conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 