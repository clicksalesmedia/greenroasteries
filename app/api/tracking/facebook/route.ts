import { NextRequest, NextResponse } from 'next/server';

// Facebook Pixel Configuration
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || '3805848799548541';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || 'EAAX7Xr0jeMQBPKlPE7qzNjNNnFZBilfc36OBvZCz8aN2O9H8NHPkXiZAcHrH6g3dWStgfuObHvzJj52uHqGmX8ivTr2BnfH12jdCCaTnM2H5t7UOHHbDrUkMa2ZCfq3lE6rsswL9KYAowaIssHZCKxXA1o465Q9RQ5P2Bnh3LWGxyqcKUnxrurYy6n3hmzQZDZD';

// Hash function for PII data
function hashData(data: string): string {
  if (!data) return '';
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Send simple event to Facebook Conversions API
async function sendFacebookEvent(eventData: any) {
  try {
    const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PIXEL_ID}/events`;
    
    const payload = {
      data: [eventData],
      access_token: FACEBOOK_ACCESS_TOKEN
    };

    console.log('📱 Sending Facebook event:', eventData.event_name);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('📱 Facebook event sent successfully:', result);
      return { success: true, result };
    } else {
      console.error('📱 Facebook API error:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('📱 Facebook API request failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

// POST - Send conversion event to Facebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📱 Facebook tracking request:', body);

    // Always return success to prevent app crashes
    // Even if Facebook tracking fails, don't break the user experience
    
    // Check if Facebook tracking is disabled
    if (process.env.DISABLE_FACEBOOK_TRACKING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Facebook tracking is disabled'
      });
    }

    // Basic event data structure
    const eventData = {
      event_name: body.event_type || 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
             user_data: {
         client_ip_address: request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           '127.0.0.1',
         client_user_agent: request.headers.get('user-agent') || 'Unknown',
         fbc: body.user_data?.fbc,
         fbp: body.user_data?.fbp,
         em: body.user_data?.email ? [hashData(body.user_data.email)] : undefined,
         ph: body.user_data?.phone ? [hashData(body.user_data.phone)] : undefined,
         fn: body.user_data?.firstName ? [hashData(body.user_data.firstName)] : undefined,
         ln: body.user_data?.lastName ? [hashData(body.user_data.lastName)] : undefined,
         ct: body.user_data?.city ? [hashData(body.user_data.city)] : undefined,
         country: body.user_data?.country ? [hashData(body.user_data.country || 'AE')] : [hashData('AE')],
       },
      custom_data: {
        currency: 'AED',
        value: body.product_data?.price || body.order_data?.total || 0,
        content_type: 'product',
        content_ids: body.product_data?.id ? [body.product_data.id] : 
                    body.order_data?.items?.map((item: any) => item.id) || [],
        content_name: body.product_data?.name || 'Green Roasteries Product',
        content_category: body.product_data?.category || 'Coffee',
        num_items: body.order_data?.items?.length || 1,
      },
      event_id: `${body.event_type || 'PageView'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

         // Clean up undefined values
     Object.keys(eventData.user_data).forEach(key => {
       if ((eventData.user_data as any)[key] === undefined) {
         delete (eventData.user_data as any)[key];
       }
     });

    // Send to Facebook (but don't fail if it doesn't work)
    const result = await sendFacebookEvent(eventData);

    // Always return success
    return NextResponse.json({
      success: true,
      event_sent: result.success,
      pixel_id: FACEBOOK_PIXEL_ID,
      event_type: eventData.event_name,
      message: result.success ? 'Event tracked successfully' : 'Event tracking attempted',
      debug: process.env.NODE_ENV === 'development' ? result : undefined
    });

  } catch (error) {
    console.error('📱 Facebook tracking error:', error);
    
    // Always return success to prevent app crashes
    return NextResponse.json({
      success: true,
      event_sent: false,
      message: 'Facebook tracking temporarily unavailable',
      debug: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    configured: true,
    pixel_id: FACEBOOK_PIXEL_ID,
    health_status: 'healthy',
    supported_events: [
      'PageView',
      'ViewContent',
      'AddToCart',
      'InitiateCheckout',
      'AddPaymentInfo',
      'Purchase',
      'Lead',
      'Search'
    ],
    message: 'Facebook Pixel tracking is configured'
  });
} 