import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET() {
  try {
    // Create a test ABOUT_US record
    const aboutUsContent = await prisma.pageContent.create({
      data: {
        pageType: 'ABOUT_US',
        title: 'About Us',
        content: 'This is a test about us content.',
        lastUpdated: new Date(),
        metadata: {
          heroTitle: 'Our Story',
          heroTagline: 'From bean to cup, our passion fuels every step of the journey.',
          heroImage: '/images/coffee-beans-bg.jpg'
        },
      }
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'ABOUT_US record created successfully',
      record: aboutUsContent
    });
  } catch (error: any) {
    console.error('Failed to create ABOUT_US record:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create ABOUT_US record',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 