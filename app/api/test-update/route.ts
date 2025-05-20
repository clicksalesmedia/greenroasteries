import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET() {
  try {
    // Find the existing ABOUT_US record
    const existingRecord = await prisma.pageContent.findUnique({
      where: { pageType: 'ABOUT_US' },
    });
    
    if (!existingRecord) {
      return NextResponse.json({
        status: 'error',
        message: 'ABOUT_US record not found'
      }, { status: 404 });
    }
    
    // Update the ABOUT_US record
    const updatedRecord = await prisma.pageContent.update({
      where: { id: existingRecord.id },
      data: {
        title: 'About Us - Updated',
        content: 'This is an updated about us content.',
        lastUpdated: new Date(),
        metadata: {
          heroTitle: 'Our Story - Updated',
          heroTagline: 'From bean to cup, our passion fuels every step of the journey - Updated.',
          heroImage: '/images/coffee-beans-bg.jpg'
        },
      }
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'ABOUT_US record updated successfully',
      record: updatedRecord
    });
  } catch (error: any) {
    console.error('Failed to update ABOUT_US record:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to update ABOUT_US record',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 