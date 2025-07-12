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
    // Check if eventData exists and is an object
    if (!eventData || typeof eventData !== 'object') {
      console.warn('Invalid event data: not an object');
      return null;
    }

    const requiredFields = ['event_name', 'event_time', 'action_source'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        console.warn(`Missing required field: ${field}`);
        return null;
      }
    }

    // Validate event_name
    const validEventNames = [
      'Purchase', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 
      'Lead', 'CompleteRegistration', 'ViewContent', 'Search', 
      'AddToWishlist', 'PageView', 'Contact', 'Subscribe'
    ];
    if (!validEventNames.includes(eventData.event_name)) {
      console.warn(`Invalid event_name: ${eventData.event_name}`);
      return null;
    }

    // Validate action_source
    const validActionSources = ['website', 'email', 'app', 'phone_call', 'chat', 'physical_store', 'system_generated', 'other'];
    if (!validActionSources.includes(eventData.action_source)) {
      console.warn(`Invalid action_source: ${eventData.action_source}`);
      return null;
    }

    // Validate event_time (should be within reasonable range)
    const eventTime = parseInt(eventData.event_time);
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60);
    if (isNaN(eventTime) || eventTime < oneWeekAgo || eventTime > now + 300) {
      console.warn(`Invalid event_time: ${eventData.event_time}`);
      return null;
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
      event_time: eventTime,
      action_source: eventData.action_source,
      event_source_url: eventData.event_source_url,
      user_data: hashedUserData,
      custom_data: eventData.custom_data || {},
      event_id: eventData.event_id || crypto.randomUUID()
    };
  } catch (error) {
    console.warn('Error validating event data (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Send event to Facebook Conversions API
async function sendToFacebook(pixelId: string, accessToken: string, eventData: FacebookEventData[]): Promise<any> {
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
  
  // Build payload with better validation
  const payload: FacebookConversionEvent = {
    pixel_id: pixelId,
    data: eventData
  };

  // Only add test_event_code if it's properly configured and valid
  const testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE;
  if (testEventCode && testEventCode.length > 5 && testEventCode !== 'your_test_event_code') {
    payload.test_event_code = testEventCode;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    
    if (!response.ok) {
      const errorMsg = result.error?.message || `HTTP ${response.status}`;
      console.warn(`Facebook API returned error: ${errorMsg}`);
      throw new Error(`Facebook API Error: ${errorMsg}`);
    }

    return result;
  } catch (error: any) {
    // Handle all errors gracefully - don't let them crash the app
    const errorMessage = error.message || error.code || 'Unknown error';
    
    if (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.warn('Facebook API network timeout (non-critical):', errorMessage);
    } else {
      console.warn('Facebook API error (non-critical):', errorMessage);
    }
    
    // Always throw the same type of error to be caught by the main handler
    throw new Error(`Non-critical Facebook API issue: ${errorMessage}`);
  }
}

// POST - Send conversion event to Facebook
export async function POST(request: NextRequest) {
  try {
    // Check if Facebook tracking is disabled
    if (process.env.DISABLE_FACEBOOK_TRACKING === 'true') {
      return NextResponse.json({
        success: true,
        events_received: 0,
        messages: ['Facebook tracking is disabled']
      });
    }

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

    // Don't use fallback values - if credentials are not provided, skip tracking
    if (!pixelId || !accessToken) {
      console.log('Facebook tracking skipped: No valid credentials provided');
      return NextResponse.json({
        success: true,
        events_received: 0,
        messages: ['Facebook tracking not configured']
      });
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
      return NextResponse.json({
        success: true,
        events_received: 0,
        messages: ['No valid events to send']
      });
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
    // Log the error but return success to prevent breaking the application
    console.warn('Facebook Conversions API error (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    
    // Always return success response to prevent app crashes
    return NextResponse.json({
      success: true,
      events_received: 0,
      messages: ['Facebook tracking temporarily unavailable'],
      warning: 'Non-critical tracking error - continuing operation'
    }, { status: 200 });
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