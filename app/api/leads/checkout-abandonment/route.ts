import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@/app/generated/prisma';
import { emailService } from '../../../../lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/leads/checkout-abandonment - Track checkout abandonment
 * 
 * This endpoint specifically handles checkout abandonment tracking with detailed
 * information about where users dropped off in the checkout process.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      fullName,
      email,
      phone,
      emirate,
      city,
      address,
      cartValue,
      cartItems,
      abandonmentStep, // 'contact_info', 'shipping_info', 'payment_info'
      userAgent,
      ipAddress,
      referrer,
      timeSpentOnPage,
      previousVisits,
      paymentMethod // If they selected a payment method before abandoning
    } = body;
    
    // Validate required fields
    if (!email || !abandonmentStep) {
      return NextResponse.json(
        { error: 'Email and abandonment step are required' },
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
    
    // Determine lead status and score based on abandonment step
    let leadStatus: LeadStatus = LeadStatus.LEAD;
    let leadScore = 10; // Base score for checkout abandonment
    let hasContactInfo = false;
    let hasShippingInfo = false;
    let hasPaymentInfo = false;
    let contactStep: Date | undefined;
    let shippingStep: Date | undefined;
    let paymentStep: Date | undefined;
    
    const now = new Date();
    
    switch (abandonmentStep) {
      case 'contact_info':
        // User abandoned after filling contact info
        leadStatus = LeadStatus.PROSPECT;
        leadScore = 25;
        hasContactInfo = true;
        contactStep = now;
        break;
      case 'shipping_info':
        // User abandoned after filling shipping info
        leadStatus = LeadStatus.PROSPECT;
        leadScore = 40;
        hasContactInfo = true;
        hasShippingInfo = true;
        contactStep = now;
        shippingStep = now;
        break;
      case 'payment_info':
        // User abandoned at payment step (highest value lead)
        leadStatus = LeadStatus.QUALIFIED;
        leadScore = 60;
        hasContactInfo = true;
        hasShippingInfo = true;
        hasPaymentInfo = true;
        contactStep = now;
        shippingStep = now;
        paymentStep = now;
        break;
      default:
        // Unknown abandonment step
        leadStatus = LeadStatus.ABANDONED;
        leadScore = 5;
    }
    
    // Additional scoring based on cart value
    if (cartValue && cartValue > 0) {
      if (cartValue > 200) leadScore += 15;
      else if (cartValue > 100) leadScore += 10;
      else if (cartValue > 50) leadScore += 5;
    }
    
    // Additional scoring based on time spent
    if (timeSpentOnPage && timeSpentOnPage > 300) { // 5+ minutes
      leadScore += 10;
    }
    
    // Additional scoring for returning visitors
    if (previousVisits && previousVisits > 1) {
      leadScore += 5;
    }
    
    try {
      // Check if lead already exists
      const existingLead = await prisma.customerLead.findUnique({
        where: { email }
      });
      
      let lead;
      
      if (existingLead) {
        // Update existing lead if this is a higher-value abandonment
        const shouldUpdate = 
          existingLead.status === LeadStatus.ABANDONED ||
          (existingLead.leadScore ?? 0) < leadScore ||
          !existingLead.cartValue ||
          (cartValue && cartValue > existingLead.cartValue);
        
        if (shouldUpdate) {
          lead = await prisma.customerLead.update({
            where: { id: existingLead.id },
            data: {
              fullName: fullName || existingLead.fullName,
              phone: phone || existingLead.phone,
              status: leadStatus,
              hasContactInfo: hasContactInfo || existingLead.hasContactInfo,
              hasShippingInfo: hasShippingInfo || existingLead.hasShippingInfo,
              hasPaymentInfo: hasPaymentInfo || existingLead.hasPaymentInfo,
              contactStep: contactStep || existingLead.contactStep,
              shippingStep: shippingStep || existingLead.shippingStep,
              paymentStep: paymentStep || existingLead.paymentStep,
              emirate: emirate || existingLead.emirate,
              city: city || existingLead.city,
              address: address || existingLead.address,
              cartValue: cartValue || existingLead.cartValue,
              cartItems: cartItems || existingLead.cartItems,
                             leadScore: Math.max(leadScore, existingLead.leadScore ?? 0),
              preferredPayment: paymentMethod || existingLead.preferredPayment,
              userAgent: userAgent || existingLead.userAgent,
              ipAddress: ipAddress || existingLead.ipAddress,
              referrer: referrer || existingLead.referrer,
              notes: `Updated checkout abandonment at ${abandonmentStep} step`,
              tags: [...(existingLead.tags || []), 'checkout-abandonment', abandonmentStep],
              updatedAt: now
            }
          });
        } else {
          lead = existingLead;
        }
      } else {
        // Create new lead
        lead = await prisma.customerLead.create({
          data: {
            fullName: fullName || 'Unknown',
            email,
            phone,
            status: leadStatus,
            source: 'checkout-abandonment',
            hasContactInfo,
            hasShippingInfo,
            hasPaymentInfo,
            contactStep,
            shippingStep,
            paymentStep,
            emirate,
            city,
            address,
            cartValue,
            cartItems,
            leadScore,
            preferredPayment: paymentMethod,
            userAgent,
            ipAddress,
            referrer,
            notes: `Checkout abandonment at ${abandonmentStep} step`,
            tags: ['checkout-abandonment', abandonmentStep],
            createdAt: now,
            updatedAt: now
          }
        });
      }
      
      // Add to Brevo with specific checkout abandonment list
      try {
        const brevoContact = {
          email: lead.email,
          attributes: {
            FIRSTNAME: lead.fullName?.split(' ')[0] || '',
            LASTNAME: lead.fullName?.split(' ').slice(1).join(' ') || '',
            PHONE: lead.phone || '',
            CITY: lead.city || '',
            EMIRATE: lead.emirate || '',
            LEAD_SOURCE: 'checkout-abandonment',
            LEAD_STATUS: lead.status,
            LEAD_SCORE: lead.leadScore ?? 0,
            CART_VALUE: lead.cartValue,
            ABANDONMENT_STEP: abandonmentStep,
            PREFERRED_PAYMENT: lead.preferredPayment || '',
            HAS_CONTACT_INFO: lead.hasContactInfo,
            HAS_SHIPPING_INFO: lead.hasShippingInfo,
            HAS_PAYMENT_INFO: lead.hasPaymentInfo,
            LAST_UPDATED: now.toISOString()
          }
        };
        
        // Add to main contacts list
        await emailService.createOrUpdateContact(brevoContact);
        
        // Add to specific checkout abandonment list if it exists
        try {
          const lists = await emailService.getAllLists();
          const abandonmentList = lists.find((list: any) => 
            list.name.toLowerCase().includes('checkout') && 
            list.name.toLowerCase().includes('abandon')
          );
          
          if (abandonmentList) {
            await emailService.addContactToList(lead.email, abandonmentList.id);
          }
        } catch (listError) {
          console.warn('Could not add to checkout abandonment list:', listError);
        }
        
      } catch (brevoError) {
        console.error('Brevo integration error (non-critical):', brevoError);
      }
      
      return NextResponse.json({
        success: true,
        lead: {
          id: lead.id,
          email: lead.email,
          status: lead.status,
          leadScore: lead.leadScore,
          abandonmentStep,
          cartValue: lead.cartValue,
          isNew: !existingLead
        },
        message: existingLead ? 'Lead updated successfully' : 'Lead created successfully'
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save lead information' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Checkout abandonment tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/checkout-abandonment - Get checkout abandonment statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [
      totalAbandoned,
      contactInfoAbandoned,
      shippingInfoAbandoned,
      paymentInfoAbandoned,
      averageCartValue,
      topAbandonmentReasons
    ] = await Promise.all([
      // Total checkout abandonment leads
      prisma.customerLead.count({
        where: {
          source: 'checkout-abandonment',
          createdAt: { gte: startDate }
        }
      }),
      
      // Contact info abandonment
      prisma.customerLead.count({
        where: {
          source: 'checkout-abandonment',
          hasContactInfo: true,
          hasShippingInfo: false,
          createdAt: { gte: startDate }
        }
      }),
      
      // Shipping info abandonment
      prisma.customerLead.count({
        where: {
          source: 'checkout-abandonment',
          hasShippingInfo: true,
          hasPaymentInfo: false,
          createdAt: { gte: startDate }
        }
      }),
      
      // Payment info abandonment
      prisma.customerLead.count({
        where: {
          source: 'checkout-abandonment',
          hasPaymentInfo: true,
          status: { in: [LeadStatus.QUALIFIED, LeadStatus.ABANDONED] },
          createdAt: { gte: startDate }
        }
      }),
      
      // Average cart value
      prisma.customerLead.aggregate({
        where: {
          source: 'checkout-abandonment',
          cartValue: { not: null },
          createdAt: { gte: startDate }
        },
        _avg: { cartValue: true }
      }),
      
      // Top abandonment reasons by tags
      prisma.customerLead.groupBy({
        by: ['tags'],
        where: {
          source: 'checkout-abandonment',
          createdAt: { gte: startDate }
        },
        _count: true,
        orderBy: { _count: { tags: 'desc' } },
        take: 5
      })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        totalAbandoned,
        abandonmentByStep: {
          contactInfo: contactInfoAbandoned,
          shippingInfo: shippingInfoAbandoned,
          paymentInfo: paymentInfoAbandoned
        },
        averageCartValue: averageCartValue._avg.cartValue || 0,
        topAbandonmentReasons: topAbandonmentReasons.map(reason => ({
          tags: reason.tags,
          count: reason._count
        })),
        period: `${days} days`
      }
    });
    
  } catch (error) {
    console.error('Error fetching checkout abandonment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 