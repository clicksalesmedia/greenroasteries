import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface TrackingEventRequest {
  sessionId: string;
  userId?: string;
  eventName: string;
  eventType: string;
  platform?: string;
  eventData?: any;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: any[];
  conversionValue?: number;
  conversionType?: string;
  clientTimestamp?: string;
}

// Get session or create new one
async function getOrCreateSession(sessionId: string, ipAddress?: string, userAgent?: string, userId?: string) {
  let session = await prisma.userSession.findUnique({
    where: { sessionId }
  });

  if (!session) {
    // Extract device/browser info from user agent
    const deviceInfo = parseUserAgent(userAgent || '');
    
    session = await prisma.userSession.create({
      data: {
        sessionId,
        userId,
        ipAddress,
        userAgent,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        pageViews: 0,
        firstSeen: new Date(),
        lastSeen: new Date()
      }
    });
  } else {
    // Update last seen and page views
    await prisma.userSession.update({
      where: { sessionId },
      data: {
        lastSeen: new Date(),
        pageViews: { increment: 1 },
        userId: userId || session.userId // Update userId if provided
      }
    });
  }

  return session;
}

// Parse user agent to extract device info
function parseUserAgent(userAgent: string) {
  const device = userAgent.includes('Mobile') ? 'mobile' : 
                userAgent.includes('Tablet') ? 'tablet' : 'desktop';
  
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'chrome';
  else if (userAgent.includes('Firefox')) browser = 'firefox';
  else if (userAgent.includes('Safari')) browser = 'safari';
  else if (userAgent.includes('Edge')) browser = 'edge';
  
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'windows';
  else if (userAgent.includes('Mac')) os = 'macos';
  else if (userAgent.includes('Linux')) os = 'linux';
  else if (userAgent.includes('Android')) os = 'android';
  else if (userAgent.includes('iOS')) os = 'ios';
  
  return { device, browser, os };
}

// Send to external tracking platforms
async function sendToExternalPlatforms(event: any, config: any) {
  const results: {
    facebook: any;
    google: any;
    errors: string[];
  } = {
    facebook: null,
    google: null,
    errors: []
  };

  try {
    // Send to Facebook if enabled
    if (config.metaEnabled && config.metaPixelId) {
      try {
        const facebookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/facebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: event.eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: event.pageUrl,
            user_data: {
              client_ip_address: event.ipAddress,
              client_user_agent: event.userAgent
            },
            custom_data: {
              value: event.value,
              currency: event.currency,
              content_ids: event.items?.map((item: any) => item.item_id),
              order_id: event.transactionId
            },
            event_id: crypto.randomUUID()
          })
        });
        
        if (facebookResponse.ok) {
          results.facebook = await facebookResponse.json();
        }
      } catch (error) {
        results.errors.push(`Facebook: ${String(error)}`);
      }
    }

    // Send to Google if enabled
    if (config.ga4Enabled && config.ga4MeasurementId) {
      try {
        const googleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'ga4',
            conversion_action: event.eventName,
            conversion_value: event.value,
            currency_code: event.currency,
            order_id: event.transactionId,
            client_id: event.sessionId,
            items: event.items
          })
        });
        
        if (googleResponse.ok) {
          results.google = await googleResponse.json();
        }
      } catch (error) {
        results.errors.push(`Google: ${String(error)}`);
      }
    }
  } catch (error) {
    console.error('Error sending to external platforms:', error);
  }

  return results;
}

// POST - Track new event
export async function POST(request: NextRequest) {
  try {
    const body: TrackingEventRequest = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Get tracking configuration
    const config = await prisma.trackingConfiguration.findFirst();
    if (!config) {
      return NextResponse.json(
        { error: 'Tracking not configured' },
        { status: 400 }
      );
    }

    // Ensure session exists
    await getOrCreateSession(
      body.sessionId,
      ipAddress,
      body.userAgent,
      body.userId
    );

    // Create tracking event
    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        configId: config.id,
        sessionId: body.sessionId,
        userId: body.userId,
        eventName: body.eventName,
        eventType: body.eventType as 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'PURCHASE' | 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'BEGIN_CHECKOUT' | 'ADD_PAYMENT_INFO' | 'SIGN_UP' | 'LOGIN' | 'SEARCH' | 'VIEW_ITEM' | 'VIEW_CATEGORY' | 'ADD_TO_WISHLIST' | 'SHARE' | 'DOWNLOAD' | 'VIDEO_PLAY' | 'VIDEO_COMPLETE' | 'CUSTOM',
        platform: (body.platform || 'SERVER_SIDE') as 'GA4' | 'FACEBOOK_PIXEL' | 'GOOGLE_ADS' | 'GTM' | 'SERVER_SIDE' | 'CUSTOM',
        eventData: body.eventData || {},
        userAgent: body.userAgent,
        ipAddress,
        referrer: body.referrer,
        pageUrl: body.pageUrl,
        pageTitle: body.pageTitle,
        transactionId: body.transactionId,
        value: body.value,
        currency: body.currency || 'AED',
        items: body.items || [],
        conversionValue: body.conversionValue,
        conversionType: body.conversionType,
        clientTimestamp: body.clientTimestamp ? new Date(body.clientTimestamp) : null,
        processed: false
      }
    });

    // Send to external platforms in background
    const externalResults = await sendToExternalPlatforms({
      ...body,
      ipAddress
    }, config);

    // Update event as processed
    await prisma.trackingEvent.update({
      where: { id: trackingEvent.id },
      data: {
        processed: true,
        processingError: externalResults.errors.length > 0 ? 
          externalResults.errors.join('; ') : null
      }
    });

    // Update daily analytics
    await updateDailyAnalytics(config.id, body.eventName, body.value || 0);

    return NextResponse.json({
      success: true,
      eventId: trackingEvent.id,
      sessionId: body.sessionId,
      externalResults,
      timestamp: trackingEvent.timestamp
    });

  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update daily analytics
async function updateDailyAnalytics(configId: string, eventName: string, value: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let analytics = await prisma.analytics.findUnique({
      where: {
        configId_date: {
          configId,
          date: today
        }
      }
    });

    if (!analytics) {
      analytics = await prisma.analytics.create({
        data: {
          configId,
          date: today,
          pageViews: 0,
          uniqueVisitors: 0,
          sessions: 0,
          transactions: 0,
          revenue: 0,
          customEvents: 0,
          addToCarts: 0,
          checkouts: 0,
          organicTraffic: 0,
          paidTraffic: 0,
          socialTraffic: 0,
          directTraffic: 0,
          referralTraffic: 0,
          desktopUsers: 0,
          mobileUsers: 0,
          tabletUsers: 0
        }
      });
    }

    // Update based on event type
    const updateData: any = {};

    switch (eventName.toLowerCase()) {
      case 'page_view':
        updateData.pageViews = { increment: 1 };
        break;
      case 'purchase':
        updateData.transactions = { increment: 1 };
        updateData.revenue = { increment: value };
        break;
      case 'add_to_cart':
        updateData.addToCarts = { increment: 1 };
        break;
      case 'begin_checkout':
        updateData.checkouts = { increment: 1 };
        break;
      default:
        updateData.customEvents = { increment: 1 };
    }

    await prisma.analytics.update({
      where: { id: analytics.id },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

// GET - Retrieve events with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const eventName = searchParams.get('eventName');
    const platform = searchParams.get('platform');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (eventName) where.eventName = eventName;
    if (platform) where.platform = platform;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.trackingEvent.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          session: {
            select: { device: true, browser: true, os: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.trackingEvent.count({ where })
    ]);

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error retrieving events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 