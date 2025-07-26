import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@/app/generated/prisma';
import { emailService } from '../../../../lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/leads/collect - Simplified lead collection endpoint
 * 
 * This endpoint provides a simple interface for collecting leads from various sources.
 * It automatically handles lead creation/updating and Brevo integration.
 * 
 * Usage examples:
 * - Contact form: { name: "John Doe", email: "john@example.com", phone: "+971501234567", source: "contact_form" }
 * - Newsletter: { name: "Jane Smith", email: "jane@example.com", source: "newsletter", city: "Dubai" }
 * - Abandoned cart: { name: "Bob Johnson", email: "bob@example.com", source: "abandoned_cart", cartValue: 250.00 }
 * - Landing page: { name: "Sarah Wilson", email: "sarah@example.com", source: "landing_page", city: "Abu Dhabi", emirate: "Abu Dhabi" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      city,
      emirate,
      address,
      source = 'website',
      cartValue,
      message,
      subject,
      additionalData = {}
    } = body;
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Prepare lead data
    const leadData = {
      fullName: name,
      email,
      phone,
      city,
      emirate,
      address,
      source,
      cartValue,
      userAgent,
      ipAddress,
      referrer,
      notes: message || subject || undefined,
      contactInfo: additionalData
    };

    // Create lead using the main leads API
    const leadResponse = await fetch(`${request.nextUrl.origin}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ipAddress,
        'user-agent': userAgent,
        'referer': referrer || ''
      },
      body: JSON.stringify(leadData)
    });

    const leadResult = await leadResponse.json();

    if (!leadResponse.ok) {
      return NextResponse.json(
        { error: leadResult.error || 'Failed to create lead' },
        { status: leadResponse.status }
      );
    }

    // Return simplified response
    return NextResponse.json({
      success: true,
      lead: {
        id: leadResult.id,
        email: leadResult.email,
        status: leadResult.status,
        source: leadResult.source,
        leadScore: leadResult.leadScore
      },
      message: 'Lead collected successfully'
    });

  } catch (error) {
    console.error('Error collecting lead:', error);
    return NextResponse.json(
      { error: 'Failed to collect lead' },
      { status: 500 }
    );
  }
}

// GET /api/leads/collect - Get lead collection statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate
      }
    };

    if (source) {
      where.source = source;
    }

    // Get lead statistics
    const [totalLeads, leadsBySource, leadsByStatus] = await Promise.all([
      prisma.customerLead.count({ where }),
      prisma.customerLead.groupBy({
        by: ['source'],
        where,
        _count: true
      }),
      prisma.customerLead.groupBy({
        by: ['status'],
        where,
        _count: true
      })
    ]);

    // Calculate conversion rates
    const conversionData = await prisma.customerLead.findMany({
      where: {
        ...where,
        status: {
          in: [LeadStatus.CONVERTED, LeadStatus.QUALIFIED, LeadStatus.PROSPECT, LeadStatus.LEAD]
        }
      },
      select: {
        status: true,
        leadScore: true,
        cartValue: true,
        source: true
      }
    });

    const avgLeadScore = conversionData.length > 0 
      ? conversionData.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / conversionData.length
      : 0;

    const avgCartValue = conversionData.filter(lead => lead.cartValue).length > 0
      ? conversionData.filter(lead => lead.cartValue).reduce((sum, lead) => sum + (lead.cartValue || 0), 0) / conversionData.filter(lead => lead.cartValue).length
      : 0;

    return NextResponse.json({
      period: `${days} days`,
      totalLeads,
      avgLeadScore: Math.round(avgLeadScore * 100) / 100,
      avgCartValue: Math.round(avgCartValue * 100) / 100,
      leadsBySource: leadsBySource.map(item => ({
        source: item.source || 'unknown',
        count: item._count
      })),
      leadsByStatus: leadsByStatus.map(item => ({
        status: item.status,
        count: item._count
      }))
    });

  } catch (error) {
    console.error('Error getting lead statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get lead statistics' },
      { status: 500 }
    );
  }
} 