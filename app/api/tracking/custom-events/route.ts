import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

interface CustomEventRequest {
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  triggers: any;
  parameters: any;
  conversionValue?: number;
  trackGA4?: boolean;
  trackFacebook?: boolean;
  trackGoogleAds?: boolean;
}

// GET - Retrieve custom events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Get tracking configuration
    const config = await prisma.trackingConfiguration.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Tracking not configured' }, { status: 400 });
    }

    const where: any = { configId: config.id };
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const customEvents = await prisma.customEvent.findMany({
      where,
      include: {
        instances: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: {
            user: { select: { email: true, name: true } }
          }
        },
        _count: {
          select: { instances: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      customEvents,
      total: customEvents.length
    });

  } catch (error) {
    console.error('Error retrieving custom events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve custom events' },
      { status: 500 }
    );
  }
}

// POST - Create new custom event
export async function POST(request: NextRequest) {
  try {
    const body: CustomEventRequest = await request.json();

    // Get tracking configuration
    const config = await prisma.trackingConfiguration.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Tracking not configured' }, { status: 400 });
    }

    // Validate required fields
    if (!body.name || !body.displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if event with same name already exists
    const existing = await prisma.customEvent.findUnique({
      where: {
        configId_name: {
          configId: config.id,
          name: body.name
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Custom event with this name already exists' },
        { status: 400 }
      );
    }

    // Create the custom event
    const customEvent = await prisma.customEvent.create({
      data: {
        configId: config.id,
        name: body.name,
        displayName: body.displayName,
        description: body.description,
        category: body.category || 'General',
        triggers: body.triggers || {},
        parameters: body.parameters || {},
        conversionValue: body.conversionValue,
        trackGA4: body.trackGA4 ?? true,
        trackFacebook: body.trackFacebook ?? true,
        trackGoogleAds: body.trackGoogleAds ?? false,
        isActive: true
      }
    });

    return NextResponse.json(customEvent);

  } catch (error) {
    console.error('Error creating custom event:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create custom event'
      },
      { status: 500 }
    );
  }
}

// PUT - Update custom event
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const body: Partial<CustomEventRequest> & { isActive?: boolean } = await request.json();

    // Update the custom event
    const updatedEvent = await prisma.customEvent.update({
      where: { id: eventId },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedEvent);

  } catch (error) {
    console.error('Error updating custom event:', error);
    return NextResponse.json(
      { error: 'Failed to update custom event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete custom event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    await prisma.customEvent.delete({
      where: { id: eventId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting custom event:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom event' },
      { status: 500 }
    );
  }
} 