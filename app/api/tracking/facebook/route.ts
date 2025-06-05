import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface FacebookEventData {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_source_url?: string;
  user_data: {
    em?: string[]; // email (hashed)
    ph?: string[]; // phone (hashed)
    fn?: string[]; // first name (hashed)
    ln?: string[]; // last name (hashed)
    ct?: string[]; // city (hashed)
    st?: string[]; // state (hashed)
    zp?: string[]; // zip code (hashed)
    country?: string[]; // country (hashed)
    external_id?: string[]; // external ID (hashed)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    predicted_ltv?: number;
    num_items?: number;
    search_string?: string;
    status?: string;
  };
  event_id?: string; // For deduplication
}

interface FacebookConversionEvent {
  pixel_id: string;
  data: FacebookEventData[];
  test_event_code?: string;
}

// Hash function for PII data
function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Validate and sanitize event data
function validateEventData(eventData: any): FacebookEventData | null {
  try {
    const requiredFields = ['event_name', 'event_time', 'action_source'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Hash PII data in user_data
    const userData = eventData.user_data || {};
    const hashedUserData: any = {};

    if (userData.email) {
      hashedUserData.em = [hashData(userData.email)];
    }
    if (userData.phone) {
      hashedUserData.ph = [hashData(userData.phone)];
    }
    if (userData.first_name) {
      hashedUserData.fn = [hashData(userData.first_name)];
    }
    if (userData.last_name) {
      hashedUserData.ln = [hashData(userData.last_name)];
    }
    if (userData.city) {
      hashedUserData.ct = [hashData(userData.city)];
    }
    if (userData.state) {
      hashedUserData.st = [hashData(userData.state)];
    }
    if (userData.zip_code) {
      hashedUserData.zp = [hashData(userData.zip_code)];
    }
    if (userData.country) {
      hashedUserData.country = [hashData(userData.country)];
    }

    // Add non-PII data
    if (userData.client_ip_address) {
      hashedUserData.client_ip_address = userData.client_ip_address;
    }
    if (userData.client_user_agent) {
      hashedUserData.client_user_agent = userData.client_user_agent;
    }
    if (userData.fbc) {
      hashedUserData.fbc = userData.fbc;
    }
    if (userData.fbp) {
      hashedUserData.fbp = userData.fbp;
    }

    return {
      event_name: eventData.event_name,
      event_time: eventData.event_time,
      action_source: eventData.action_source,
      event_source_url: eventData.event_source_url,
      user_data: hashedUserData,
      custom_data: eventData.custom_data || {},
      event_id: eventData.event_id || crypto.randomUUID()
    };
  } catch (error) {
    console.error('Error validating event data:', error);
    return null;
  }
}

// Send event to Facebook Conversions API
async function sendToFacebook(pixelId: string, accessToken: string, eventData: FacebookEventData[]): Promise<any> {
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
  
  const payload: FacebookConversionEvent = {
    pixel_id: pixelId,
    data: eventData,
    test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE // Optional for testing
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Facebook API Error: ${result.error?.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending to Facebook Conversions API:', error);
    throw error;
  }
}

// POST - Send conversion event to Facebook
export async function POST(request: NextRequest) {
  try {
    // Get Facebook credentials from environment or config
    let pixelId = process.env.FACEBOOK_PIXEL_ID;
    let accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    // Try to get from database config if not in environment
    if (!pixelId || !accessToken) {
      try {
        const configResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/config`);
        if (configResponse.ok) {
          const config = await configResponse.json();
          pixelId = pixelId || config.metaAds?.pixelId;
          accessToken = accessToken || config.metaAds?.accessToken;
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    }

    // Fallback to hardcoded values if still not found
    if (!pixelId) {
      pixelId = '3805848799548541';
    }
    if (!accessToken) {
      accessToken = 'EAAX7Xr0jeMQBO2lCgCyyRhnG1AVnKMdILdHv6gRwomuZBVF4Aoz1beFjoLhzDf3njCZAB2eg3u9bw2EjnlEuyvnaxH7h3gZCtWFBw0QZAxacZCBs3ieR2OP1KUyAevlrMTdCb62pfkJZBoVPkkAvBvoIKWeXVxgUbBnMBm6KuZCAT2d1k1N6DZCRl1I9fwP96T3IZCQZDZD';
    }

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: 'Facebook Pixel ID or Access Token not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Support single event or batch of events
    const events = Array.isArray(body.events) ? body.events : [body];
    
    // Validate and process each event
    const validatedEvents: FacebookEventData[] = [];
    for (const event of events) {
      const validatedEvent = validateEventData(event);
      if (validatedEvent) {
        validatedEvents.push(validatedEvent);
      }
    }

    if (validatedEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events found' },
        { status: 400 }
      );
    }

    // Send to Facebook Conversions API
    const result = await sendToFacebook(pixelId, accessToken, validatedEvents);

    return NextResponse.json({
      success: true,
      events_received: result.events_received || validatedEvents.length,
      fbtrace_id: result.fbtrace_id,
      messages: result.messages || []
    });

  } catch (error) {
    console.error('Facebook Conversions API error:', error);
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
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  return NextResponse.json({
    configured: !!(pixelId && accessToken),
    pixel_id: pixelId ? `${pixelId.substring(0, 6)}...` : null,
    endpoints: {
      send_event: '/api/tracking/facebook'
    },
    supported_events: [
      'Purchase',
      'AddToCart',
      'InitiateCheckout',
      'AddPaymentInfo',
      'Lead',
      'CompleteRegistration',
      'ViewContent',
      'Search',
      'AddToWishlist',
      'PageView'
    ]
  });
} 