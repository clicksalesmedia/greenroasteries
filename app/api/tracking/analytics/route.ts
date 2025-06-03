import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET - Retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    const type = searchParams.get('type') || 'overview'; // overview, events, sessions, conversions

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    let startDateObj: Date;

    if (startDate) {
      startDateObj = new Date(startDate);
    } else {
      switch (period) {
        case '1d':
          startDateObj = new Date(endDateObj.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDateObj = new Date(endDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDateObj = new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDateObj = new Date(endDateObj.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDateObj = new Date(endDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Get tracking configuration
    const config = await prisma.trackingConfiguration.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Tracking not configured' }, { status: 400 });
    }

    let result: any = {};

    switch (type) {
      case 'overview':
        result = await getOverviewAnalytics(config.id, startDateObj, endDateObj);
        break;
      case 'events':
        result = await getEventAnalytics(config.id, startDateObj, endDateObj);
        break;
      case 'sessions':
        result = await getSessionAnalytics(startDateObj, endDateObj);
        break;
      case 'conversions':
        result = await getConversionAnalytics(config.id, startDateObj, endDateObj);
        break;
      case 'realtime':
        result = await getRealtimeAnalytics(config.id);
        break;
      default:
        result = await getOverviewAnalytics(config.id, startDateObj, endDateObj);
    }

    return NextResponse.json({
      ...result,
      period: { startDate: startDateObj, endDate: endDateObj, type: period }
    });

  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Overview analytics
async function getOverviewAnalytics(configId: string, startDate: Date, endDate: Date) {
  const [analytics, events, sessions] = await Promise.all([
    // Get daily analytics
    prisma.analytics.findMany({
      where: {
        configId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    }),
    
    // Get event counts
    prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        configId,
        timestamp: { gte: startDate, lte: endDate }
      },
      _count: { _all: true }
    }),

    // Get session data
    prisma.userSession.findMany({
      where: {
        firstSeen: { gte: startDate, lte: endDate }
      },
      select: {
        id: true,
        device: true,
        browser: true,
        os: true,
        pageViews: true,
        duration: true,
        purchased: true,
        cartValue: true
      }
    })
  ]);

  // Calculate totals
  const totals = analytics.reduce((acc, day) => ({
    pageViews: acc.pageViews + day.pageViews,
    uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
    sessions: acc.sessions + day.sessions,
    transactions: acc.transactions + day.transactions,
    revenue: acc.revenue + day.revenue,
    addToCarts: acc.addToCarts + day.addToCarts,
    checkouts: acc.checkouts + day.checkouts
  }), {
    pageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    transactions: 0,
    revenue: 0,
    addToCarts: 0,
    checkouts: 0
  });

  // Calculate conversion rates
  const conversionRate = totals.sessions > 0 ? (totals.transactions / totals.sessions) * 100 : 0;
  const averageOrderValue = totals.transactions > 0 ? totals.revenue / totals.transactions : 0;
  const cartConversionRate = totals.addToCarts > 0 ? (totals.transactions / totals.addToCarts) * 100 : 0;

  // Device breakdown
  const deviceBreakdown = sessions.reduce((acc: any, session) => {
    const device = session.device || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  return {
    overview: {
      totals,
      metrics: {
        conversionRate: Number(conversionRate.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        cartConversionRate: Number(cartConversionRate.toFixed(2)),
        averagePageViews: sessions.length > 0 ? 
          Number((sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length).toFixed(1)) : 0
      },
      deviceBreakdown,
      dailyData: analytics,
      topEvents: events.slice(0, 10)
    }
  };
}

// Event analytics
async function getEventAnalytics(configId: string, startDate: Date, endDate: Date) {
  const [eventsByName, eventsByPlatform, recentEvents, eventTrends] = await Promise.all([
    // Events by name
    prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        configId,
        timestamp: { gte: startDate, lte: endDate }
      },
      _count: { _all: true },
      _sum: { value: true },
      orderBy: { _count: { _all: 'desc' } }
    }),

    // Events by platform
    prisma.trackingEvent.groupBy({
      by: ['platform'],
      where: {
        configId,
        timestamp: { gte: startDate, lte: endDate }
      },
      _count: { _all: true }
    }),

    // Recent events
    prisma.trackingEvent.findMany({
      where: {
        configId,
        timestamp: { gte: startDate, lte: endDate }
      },
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    }),

    // Event trends (daily)
    prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        event_name,
        COUNT(*) as count,
        SUM(COALESCE(value, 0)) as total_value
      FROM "TrackingEvent" 
      WHERE config_id = ${configId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY DATE(timestamp), event_name
      ORDER BY DATE(timestamp) ASC
    `
  ]);

  return {
    events: {
      byName: eventsByName,
      byPlatform: eventsByPlatform,
      recent: recentEvents,
      trends: eventTrends
    }
  };
}

// Session analytics
async function getSessionAnalytics(startDate: Date, endDate: Date) {
  const sessions = await prisma.userSession.findMany({
    where: {
      firstSeen: { gte: startDate, lte: endDate }
    },
    include: {
      events: {
        select: { eventName: true, timestamp: true, value: true }
      }
    }
  });

  // Calculate session metrics
  const sessionMetrics = {
    totalSessions: sessions.length,
    avgDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length,
    avgPageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length,
    bounceRate: sessions.filter(s => s.pageViews <= 1).length / sessions.length * 100,
    conversionRate: sessions.filter(s => s.purchased).length / sessions.length * 100
  };

  // Device/Browser breakdown
  const deviceStats = sessions.reduce((acc: any, session) => {
    const device = session.device || 'unknown';
    const browser = session.browser || 'unknown';
    const os = session.os || 'unknown';
    
    acc.devices[device] = (acc.devices[device] || 0) + 1;
    acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
    acc.os[os] = (acc.os[os] || 0) + 1;
    
    return acc;
  }, { devices: {}, browsers: {}, os: {} });

  return {
    sessions: {
      metrics: sessionMetrics,
      breakdown: deviceStats,
      topSessions: sessions
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 20)
    }
  };
}

// Conversion analytics
async function getConversionAnalytics(configId: string, startDate: Date, endDate: Date) {
  const [purchases, carts, checkouts, funnelData] = await Promise.all([
    // Purchase events
    prisma.trackingEvent.findMany({
      where: {
        configId,
        eventName: 'purchase',
        timestamp: { gte: startDate, lte: endDate }
      },
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { timestamp: 'desc' }
    }),

    // Add to cart events
    prisma.trackingEvent.count({
      where: {
        configId,
        eventName: 'add_to_cart',
        timestamp: { gte: startDate, lte: endDate }
      }
    }),

    // Checkout events
    prisma.trackingEvent.count({
      where: {
        configId,
        eventName: 'begin_checkout',
        timestamp: { gte: startDate, lte: endDate }
      }
    }),

    // Funnel data
    prisma.$queryRaw`
      SELECT 
        session_id,
        ARRAY_AGG(event_name ORDER BY timestamp) as event_sequence,
        COUNT(*) as event_count,
        MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) as converted
      FROM "TrackingEvent"
      WHERE config_id = ${configId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
        AND event_name IN ('page_view', 'add_to_cart', 'begin_checkout', 'purchase')
      GROUP BY session_id
    `
  ]);

  // Calculate conversion funnel
  const totalSessions = await prisma.userSession.count({
    where: { firstSeen: { gte: startDate, lte: endDate } }
  });

  const funnelSteps = {
    visitors: totalSessions,
    addToCarts: carts,
    checkouts: checkouts,
    purchases: purchases.length
  };

  return {
    conversions: {
      funnel: funnelSteps,
      conversionRates: {
        cartToCheckout: carts > 0 ? (checkouts / carts * 100) : 0,
        checkoutToPurchase: checkouts > 0 ? (purchases.length / checkouts * 100) : 0,
        overall: totalSessions > 0 ? (purchases.length / totalSessions * 100) : 0
      },
      recentPurchases: purchases.slice(0, 20),
      revenue: purchases.reduce((sum, p) => sum + (p.value || 0), 0),
      averageOrderValue: purchases.length > 0 ? 
        purchases.reduce((sum, p) => sum + (p.value || 0), 0) / purchases.length : 0
    }
  };
}

// Realtime analytics (last 30 minutes)
async function getRealtimeAnalytics(configId: string) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const [recentEvents, activeSessions, realtimeMetrics] = await Promise.all([
    // Recent events
    prisma.trackingEvent.findMany({
      where: {
        configId,
        timestamp: { gte: thirtyMinutesAgo }
      },
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    }),

    // Active sessions
    prisma.userSession.count({
      where: {
        lastSeen: { gte: thirtyMinutesAgo }
      }
    }),

    // Realtime metrics
    prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        configId,
        timestamp: { gte: thirtyMinutesAgo }
      },
      _count: { _all: true }
    })
  ]);

  return {
    realtime: {
      activeSessions,
      recentEvents: recentEvents.slice(0, 20),
      eventCounts: realtimeMetrics,
      lastUpdated: new Date()
    }
  };
} 