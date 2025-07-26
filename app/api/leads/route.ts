import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@/app/generated/prisma';
import { emailService } from '../../../lib/email';

const prisma = new PrismaClient();

// GET /api/leads - List all leads with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (source) {
      where.source = source;
    }
    
    // Fetch leads with pagination
    const [leads, totalCount] = await Promise.all([
      prisma.customerLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          convertedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.customerLead.count({ where })
    ]);
    
    // Calculate stats
    const stats = await prisma.customerLead.groupBy({
      by: ['status'],
      _count: true
    });
    
    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        byStatus: statusCounts
      }
    });
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fullName,
      email,
      phone,
      city,
      emirate,
      address,
      source = 'unknown',
      cartValue,
      cartItems,
      userAgent,
      ipAddress,
      referrer,
      notes,
      contactInfo // Optional: additional contact details
    } = body;
    
    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
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
    
    // Get IP address from headers if not provided
    const clientIpAddress = ipAddress || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    // Get user agent from headers if not provided
    const clientUserAgent = userAgent || 
      request.headers.get('user-agent') || 
      'unknown';
    
    // Get referrer from headers if not provided
    const clientReferrer = referrer || 
      request.headers.get('referer') || 
      undefined;
    
    // Check if lead already exists
    const existingLead = await prisma.customerLead.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingLead) {
      // Update existing lead if it's not converted
      if (existingLead.status !== LeadStatus.CONVERTED) {
        const updateData: any = {
          fullName: fullName.trim(),
          phone: phone?.trim() || existingLead.phone,
          city: city?.trim() || existingLead.city,
          emirate: emirate?.trim() || existingLead.emirate,
          address: address?.trim() || existingLead.address,
          hasContactInfo: true,
          contactStep: new Date(),
          cartValue: cartValue || existingLead.cartValue,
          cartItems: cartItems || existingLead.cartItems,
          userAgent: clientUserAgent,
          ipAddress: clientIpAddress,
          referrer: clientReferrer,
          updatedAt: new Date()
        };

        // Update source if current source is less specific
        if (existingLead.source === 'unknown' || !existingLead.source) {
          updateData.source = source;
        }

        // Add notes if provided
        if (notes) {
          updateData.notes = existingLead.notes 
            ? `${existingLead.notes}\n\n${new Date().toISOString()}: ${notes}`
            : notes;
        }

        // Update shipping info if address is provided
        if (address || city || emirate) {
          updateData.hasShippingInfo = true;
          updateData.shippingStep = new Date();
          
          // Advance status if providing shipping info
          if (existingLead.status === LeadStatus.LEAD) {
            updateData.status = LeadStatus.PROSPECT;
            updateData.leadScore = (existingLead.leadScore || 0) + 15;
          }
        }

        // Update lead score based on source
        const sourceScores: { [key: string]: number } = {
          'contact_form': 5,
          'newsletter': 3,
          'checkout': 10,
          'unknown': 1
        };
        
        updateData.leadScore = (existingLead.leadScore || 0) + (sourceScores[source] || 1);
        
        const updatedLead = await prisma.customerLead.update({
          where: { email: email.toLowerCase() },
          data: updateData
        });
        
        // Update lead in Brevo automatically (non-blocking)
        try {
          await emailService.addLeadToBrevo({
            email: updatedLead.email,
            fullName: updatedLead.fullName,
            phone: updatedLead.phone || undefined,
            city: updatedLead.city || undefined,
            emirate: updatedLead.emirate || undefined,
            status: updatedLead.status,
            leadScore: updatedLead.leadScore || 0,
            cartValue: updatedLead.cartValue || undefined
          });
          console.log('✅ Lead updated in Brevo:', updatedLead.email);
        } catch (brevoError) {
          // Don't fail the lead update if Brevo fails
          console.error('⚠️ Failed to update lead in Brevo (non-critical):', brevoError);
        }
        
        return NextResponse.json({
          ...updatedLead,
          message: 'Lead updated successfully'
        }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: 'Lead already converted to customer' },
          { status: 409 }
        );
      }
    }
    
    // Determine initial lead score based on source
    const sourceScores: { [key: string]: number } = {
      'contact_form': 5,
      'newsletter': 3,
      'checkout': 10,
      'unknown': 1
    };
    
    const initialScore = sourceScores[source] || 1;
    
    // Determine initial status based on information provided
    let initialStatus: LeadStatus = LeadStatus.LEAD;
    let hasShippingInfo = false;
    let shippingStep: Date | undefined = undefined;
    let finalScore = initialScore;
    
    if (address || city || emirate) {
      hasShippingInfo = true;
      shippingStep = new Date();
      initialStatus = LeadStatus.PROSPECT;
      finalScore += 15;
    }
    
    // Create new lead
    const lead = await prisma.customerLead.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        emirate: emirate?.trim() || null,
        address: address?.trim() || null,
        source,
        status: initialStatus,
        hasContactInfo: true,
        hasShippingInfo,
        contactStep: new Date(),
        shippingStep,
        cartValue,
        cartItems,
        userAgent: clientUserAgent,
        ipAddress: clientIpAddress,
        referrer: clientReferrer,
        leadScore: finalScore,
        notes: notes || undefined
      }
    });

    // Add lead to Brevo automatically (non-blocking)
    try {
      await emailService.addLeadToBrevo({
        email: lead.email,
        fullName: lead.fullName,
        phone: lead.phone || undefined,
        city: lead.city || undefined,
        emirate: lead.emirate || undefined,
        status: lead.status,
        leadScore: lead.leadScore || 0,
        cartValue: lead.cartValue || undefined
      });
      console.log('✅ Lead added to Brevo:', lead.email);
    } catch (brevoError) {
      // Don't fail the lead creation if Brevo fails
      console.error('⚠️ Failed to add lead to Brevo (non-critical):', brevoError);
    }

    return NextResponse.json({
      ...lead,
      message: 'Lead created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads - Update lead status or information
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, status, hasShippingInfo, shippingData, hasPaymentInfo, paymentData } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find existing lead
    const existingLead = await prisma.customerLead.findUnique({
      where: { email }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Update status if provided
    if (status) {
      updateData.status = status;
    }
    
    // Update shipping info if provided
    if (hasShippingInfo && shippingData) {
      updateData.hasShippingInfo = true;
      updateData.shippingStep = new Date();
      updateData.emirate = shippingData.emirate;
      updateData.city = shippingData.city;
      updateData.address = shippingData.address;
      updateData.status = 'PROSPECT'; // Advance to prospect
      updateData.leadScore = (existingLead.leadScore || 0) + 15; // Add score for shipping info
    }
    
    // Update payment info if provided
    if (hasPaymentInfo && paymentData) {
      updateData.hasPaymentInfo = true;
      updateData.paymentStep = new Date();
      updateData.preferredPayment = paymentData.preferredPayment;
      updateData.status = 'QUALIFIED'; // Advance to qualified
      updateData.leadScore = (existingLead.leadScore || 0) + 25; // Add score for payment info
    }
    
    // Update the lead
    const updatedLead = await prisma.customerLead.update({
      where: { email },
      data: updateData
    });

    // Update lead in Brevo automatically (non-blocking)
    try {
      await emailService.addLeadToBrevo({
        email: updatedLead.email,
        fullName: updatedLead.fullName,
        phone: updatedLead.phone || undefined,
        city: updatedLead.city || undefined,
        emirate: updatedLead.emirate || undefined,
        status: updatedLead.status,
        leadScore: updatedLead.leadScore || 0,
        cartValue: updatedLead.cartValue || undefined
      });
      console.log('✅ Lead status updated in Brevo:', updatedLead.email, '- Status:', updatedLead.status);
    } catch (brevoError) {
      // Don't fail the lead update if Brevo fails
      console.error('⚠️ Failed to update lead status in Brevo (non-critical):', brevoError);
    }

    return NextResponse.json(updatedLead);
    
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
} 