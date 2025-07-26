import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { emailService } from '../../../lib/email';

const prisma = new PrismaClient();

// Get all contact messages (for backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contact.count({ where })
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// Create new contact message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
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

    // Create contact message
    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || 'General Inquiry',
        message: message.trim(),
        status: 'NEW'
      }
    });

    // Create or update lead from contact form (non-blocking)
    const createLeadFromContact = async () => {
      try {
        // Check if lead already exists
        const existingLead = await prisma.customerLead.findUnique({
          where: { email: email.trim().toLowerCase() }
        });

        if (existingLead) {
          // Update existing lead with contact info
          const updatedLead = await prisma.customerLead.update({
            where: { email: email.trim().toLowerCase() },
            data: {
              fullName: name.trim(),
              phone: phone?.trim() || existingLead.phone,
              hasContactInfo: true,
              contactStep: new Date(),
              source: existingLead.source || 'contact_form',
              leadScore: (existingLead.leadScore || 0) + 5, // Add score for contact form submission
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

          console.log('✅ Lead updated from contact form:', updatedLead.email);
        } else {
          // Create new lead
          const newLead = await prisma.customerLead.create({
            data: {
              fullName: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone?.trim() || null,
              source: 'contact_form',
              status: 'LEAD',
              hasContactInfo: true,
              contactStep: new Date(),
              leadScore: 5, // Initial score for contact form submission
              notes: `Contact form inquiry: ${subject || 'General Inquiry'}`,
              userAgent: request.headers.get('user-agent') || undefined,
              ipAddress: request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown',
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

          console.log('✅ Lead created from contact form:', newLead.email);
        }
      } catch (error) {
        console.error('⚠️ Failed to create/update lead from contact form (non-critical):', error);
      }
    };

    // Create lead (non-blocking)
    createLeadFromContact();

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contact message sent successfully'
    });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 