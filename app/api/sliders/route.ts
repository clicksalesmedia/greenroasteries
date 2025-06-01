import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET /api/sliders - Get all sliders
export async function GET(request: NextRequest) {
  try {
    // Check if this is coming from the admin interface
    const url = new URL(request.url);
    const adminMode = url.searchParams.get('admin') === 'true';
    
    let whereClause = {};
    if (!adminMode) {
      // For frontend, only return active sliders
      whereClause = { isActive: true };
    }
    
    const sliders = await prisma.slider.findMany({
      where: whereClause,
      orderBy: { order: 'asc' }
    });

    const response = NextResponse.json(sliders);
    
    // Set cache headers to prevent stale content for dynamic data
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    response.headers.set('ETag', `"sliders-${Date.now()}"`);
    response.headers.set('Vary', 'Accept-Encoding');
    
    return response;
  } catch (error) {
    console.error('Error fetching sliders:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch sliders' },
      { status: 500 }
    );
    
    // No cache for errors
    errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return errorResponse;
  }
}

// POST /api/sliders - Create a new slider
export async function POST(request: NextRequest) {
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
    // Commenting out for easier development:
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.subtitle || !data.buttonText || !data.buttonLink || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID if not provided
    if (!data.id) {
      data.id = uuidv4();
    }
    
    // Create slider in the database
    const slider = await prisma.slider.create({
      data: {
        id: data.id,
        title: data.title,
        titleAr: data.titleAr || null,
        subtitle: data.subtitle,
        subtitleAr: data.subtitleAr || null,
        buttonText: data.buttonText,
        buttonTextAr: data.buttonTextAr || null,
        buttonLink: data.buttonLink,
        backgroundColor: data.backgroundColor || '#f4f6f8',
        textColor: data.textColor || '#111111',
        buttonColor: data.buttonColor || '#111111',
        overlayColor: data.overlayColor || 'rgba(0,0,0,0)',
        overlayOpacity: data.overlayOpacity || 0,
        overlayImageUrl: data.overlayImageUrl || null,
        imageUrl: data.imageUrl,
        order: data.order || 0,
        isActive: data.isActive === undefined ? true : data.isActive,
        textAnimation: data.textAnimation || 'fade-up',
        imageAnimation: data.imageAnimation || 'fade-in',
        transitionSpeed: data.transitionSpeed || 'medium',
        layout: data.layout || 'default',
        accentColor: data.accentColor || '#c9a961',
      },
    });
    
    return NextResponse.json(slider, { status: 201 });
  } catch (error) {
    console.error('Error creating slider:', error);
    return NextResponse.json(
      { error: 'Failed to create slider' },
      { status: 500 }
    );
  }
} 