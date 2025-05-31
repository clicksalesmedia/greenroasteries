import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/prisma';

// GET /api/offer-banner - Get the active offer banner
export async function GET(request: NextRequest) {
  try {
    // Get the active offer banner from the database
    const banner = await prisma.offerBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!banner) {
      return NextResponse.json(
        { error: 'No active banner found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching offer banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer banner' },
      { status: 500 }
    );
  }
}

// POST /api/offer-banner - Create a new offer banner
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.subtitle || !data.buttonText || !data.buttonLink || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = data.id || uuidv4();
    
    // If creating an active banner, deactivate any existing active banners
    if (data.isActive) {
      await prisma.offerBanner.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }
    
    // Create banner in the database
    const banner = await prisma.offerBanner.create({
      data: {
        id: id,
        title: data.title,
        titleAr: data.titleAr || null,
        subtitle: data.subtitle,
        subtitleAr: data.subtitleAr || null,
        buttonText: data.buttonText,
        buttonTextAr: data.buttonTextAr || null,
        buttonLink: data.buttonLink,
        backgroundColor: data.backgroundColor || '#ffffff',
        textColor: data.textColor || '#000000',
        buttonColor: data.buttonColor || '#000000',
        overlayColor: data.overlayColor || 'rgba(0,0,0,0.3)',
        overlayOpacity: data.overlayOpacity || 30,
        imageUrl: data.imageUrl,
        isActive: data.isActive === undefined ? true : data.isActive,
      },
    });
    
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating offer banner:', error);
    return NextResponse.json(
      { error: 'Failed to create offer banner' },
      { status: 500 }
    );
  }
} 