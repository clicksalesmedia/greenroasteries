import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/prisma';

// GET /api/sliders - Get all sliders
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    // Build the query
    const query: any = {};
    
    // Filter by active status if specified
    if (active === 'true') {
      query.where = { isActive: true };
    }
    
    // Add ordering
    query.orderBy = { order: 'asc' };
    
    // Get sliders from the database
    const sliders = await prisma.slider.findMany(query);
    
    return NextResponse.json(sliders);
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sliders' },
      { status: 500 }
    );
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
        imageUrl: data.imageUrl,
        order: data.order || 0,
        isActive: data.isActive === undefined ? true : data.isActive,
        textAnimation: data.textAnimation || 'fade-up',
        imageAnimation: data.imageAnimation || 'fade-in',
        transitionSpeed: data.transitionSpeed || 'medium',
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