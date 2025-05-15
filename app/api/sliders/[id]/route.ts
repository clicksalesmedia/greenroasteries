import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';

// GET /api/sliders/[id] - Get a specific slider
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await context.params.then(p => p.id);
    
    // Find the slider in the database
    const slider = await prisma.slider.findUnique({
      where: { id },
    });
    
    // Check if slider exists
    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(slider);
  } catch (error) {
    console.error('Error fetching slider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider' },
      { status: 500 }
    );
  }
}

// PUT /api/sliders/[id] - Update a slider
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    
    const id = await context.params.then(p => p.id);
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.subtitle || !data.buttonText || !data.buttonLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if slider exists
    const existingSlider = await prisma.slider.findUnique({
      where: { id },
    });
    
    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }
    
    // Update slider in the database
    const updatedSlider = await prisma.slider.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        backgroundColor: data.backgroundColor || existingSlider.backgroundColor,
        imageUrl: data.imageUrl || existingSlider.imageUrl,
        order: data.order !== undefined ? data.order : existingSlider.order,
        isActive: data.isActive !== undefined ? data.isActive : existingSlider.isActive,
      },
    });
    
    return NextResponse.json(updatedSlider);
  } catch (error) {
    console.error('Error updating slider:', error);
    return NextResponse.json(
      { error: 'Failed to update slider' },
      { status: 500 }
    );
  }
}

// DELETE /api/sliders/[id] - Delete a slider
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    
    const id = await context.params.then(p => p.id);
    
    // Check if slider exists
    const existingSlider = await prisma.slider.findUnique({
      where: { id },
    });
    
    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }
    
    // Delete slider from the database
    await prisma.slider.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting slider:', error);
    return NextResponse.json(
      { error: 'Failed to delete slider' },
      { status: 500 }
    );
  }
} 