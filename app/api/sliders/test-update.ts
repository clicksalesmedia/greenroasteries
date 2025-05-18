import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

// Simple test route to update a slider with Arabic content directly through Prisma
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    }
    
    console.log('Testing slider update with ID:', id);
    
    // First, find the slider
    const existingSlider = await prisma.slider.findUnique({
      where: { id },
    });
    
    if (!existingSlider) {
      console.log('Slider not found');
      return NextResponse.json({ error: 'Slider not found' }, { status: 404 });
    }
    
    console.log('Found slider:', existingSlider);
    
    // Test Arabic content update
    const updatedSlider = await prisma.slider.update({
      where: { id },
      data: {
        titleAr: 'اختبار العنوان العربي',
        subtitleAr: 'هذا هو اختبار للعنوان الفرعي باللغة العربية',
        buttonTextAr: 'تسوق الآن'
      },
    });
    
    console.log('Successfully updated slider with Arabic content:', updatedSlider);
    
    return NextResponse.json({
      success: true,
      slider: updatedSlider
    });
  } catch (error) {
    console.error('Error in test update:', error);
    return NextResponse.json({
      error: 'Test update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 