import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';
import { getServerSession } from 'next-auth';
import { emailService } from '../../../lib/email';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GET - Fetch all email subscribers (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Optional authentication - try to get session but don't fail if not configured
    let session;
    try {
      session = await getServerSession();
    } catch (authError) {
      console.log('Auth not configured or error getting session:', authError);
      // Continue without authentication for development
    }
    
    // In production, you would want to check authentication
    // For now, allow access for development purposes
    // if (!session || !session.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Fetch subscribers with pagination
    const [subscribers, total] = await Promise.all([
      prisma.emailSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailSubscriber.count({ where })
    ]);

    // Get subscription stats
    const stats = await prisma.emailSubscriber.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: stats.reduce((acc: any, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, city, emirate } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Check if email already exists
    const existingSubscriber = await prisma.emailSubscriber.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingSubscriber) {
      if (existingSubscriber.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'Email is already subscribed to our newsletter' },
          { status: 409 }
        );
      } else {
        // Reactivate subscription
        await prisma.emailSubscriber.update({
          where: { email: email.toLowerCase() },
          data: {
            status: 'ACTIVE',
            ipAddress,
            userAgent,
            unsubscribeToken,
            confirmedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create or update lead from newsletter signup (non-blocking)
        const createLeadFromNewsletter = async () => {
          try {
            // Check if lead already exists
            const existingLead = await prisma.customerLead.findUnique({
              where: { email: email.toLowerCase() }
            });

            if (existingLead) {
              // Update existing lead with newsletter info
              const updatedLead = await prisma.customerLead.update({
                where: { email: email.toLowerCase() },
                data: {
                  fullName: name?.trim() || existingLead.fullName,
                  phone: phone?.trim() || existingLead.phone,
                  city: city?.trim() || existingLead.city,
                  emirate: emirate?.trim() || existingLead.emirate,
                  source: existingLead.source || 'newsletter',
                  leadScore: (existingLead.leadScore || 0) + 3, // Add score for newsletter subscription
                  updatedAt: new Date()
                }
              });

              // Update lead in Brevo
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

              console.log('✅ Lead updated from newsletter resubscription:', updatedLead.email);
            } else if (name) {
              // Create new lead only if name is provided
              const newLead = await prisma.customerLead.create({
                data: {
                  fullName: name.trim(),
                  email: email.toLowerCase(),
                  phone: phone?.trim() || null,
                  city: city?.trim() || null,
                  emirate: emirate?.trim() || null,
                  source: 'newsletter',
                  status: 'LEAD',
                  hasContactInfo: true,
                  contactStep: new Date(),
                  leadScore: 3, // Initial score for newsletter subscription
                  notes: 'Newsletter subscription',
                  userAgent,
                  ipAddress,
                  referrer: request.headers.get('referer') || undefined
                }
              });

              // Add lead to Brevo
              await emailService.addLeadToBrevo({
                email: newLead.email,
                fullName: newLead.fullName,
                phone: newLead.phone || undefined,
                city: newLead.city || undefined,
                emirate: newLead.emirate || undefined,
                status: newLead.status,
                leadScore: newLead.leadScore || 0,
                cartValue: newLead.cartValue || undefined
              });

              console.log('✅ Lead created from newsletter resubscription:', newLead.email);
            }
          } catch (error) {
            console.error('⚠️ Failed to create/update lead from newsletter (non-critical):', error);
          }
        };

        // Create lead (non-blocking)
        createLeadFromNewsletter();

        return NextResponse.json({
          message: 'Successfully resubscribed to newsletter!',
          subscriber: { email: email.toLowerCase() }
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await prisma.emailSubscriber.create({
      data: {
        email: email.toLowerCase(),
        status: 'ACTIVE',
        source: 'website',
        ipAddress,
        userAgent,
        unsubscribeToken,
        confirmedAt: new Date()
      }
    });

    // Create or update lead from newsletter signup (non-blocking)
    const createLeadFromNewsletter = async () => {
      try {
        // Check if lead already exists
        const existingLead = await prisma.customerLead.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (existingLead) {
          // Update existing lead with newsletter info
          const updatedLead = await prisma.customerLead.update({
            where: { email: email.toLowerCase() },
            data: {
              fullName: name?.trim() || existingLead.fullName,
              phone: phone?.trim() || existingLead.phone,
              city: city?.trim() || existingLead.city,
              emirate: emirate?.trim() || existingLead.emirate,
              source: existingLead.source || 'newsletter',
              leadScore: (existingLead.leadScore || 0) + 3, // Add score for newsletter subscription
              updatedAt: new Date()
            }
          });

          // Update lead in Brevo
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

          console.log('✅ Lead updated from newsletter signup:', updatedLead.email);
        } else if (name) {
          // Create new lead only if name is provided
          const newLead = await prisma.customerLead.create({
            data: {
              fullName: name.trim(),
              email: email.toLowerCase(),
              phone: phone?.trim() || null,
              city: city?.trim() || null,
              emirate: emirate?.trim() || null,
              source: 'newsletter',
              status: 'LEAD',
              hasContactInfo: true,
              contactStep: new Date(),
              leadScore: 3, // Initial score for newsletter subscription
              notes: 'Newsletter subscription',
              userAgent,
              ipAddress,
              referrer: request.headers.get('referer') || undefined
            }
          });

          // Add lead to Brevo
          await emailService.addLeadToBrevo({
            email: newLead.email,
            fullName: newLead.fullName,
            phone: newLead.phone || undefined,
            city: newLead.city || undefined,
            emirate: newLead.emirate || undefined,
            status: newLead.status,
            leadScore: newLead.leadScore || 0,
            cartValue: newLead.cartValue || undefined
          });

          console.log('✅ Lead created from newsletter signup:', newLead.email);
        }
      } catch (error) {
        console.error('⚠️ Failed to create/update lead from newsletter (non-critical):', error);
      }
    };

    // Create lead (non-blocking)
    createLeadFromNewsletter();

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email
      }
    });

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 