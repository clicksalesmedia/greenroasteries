import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

interface FOMOData {
  isActive: boolean;
  title: string;
  titleAr: string;
  hours: number;
  message: string;
  messageAr: string;
  endTime?: string | null;
}

// Get FOMO settings
export async function GET() {
  try {
    // Find FOMO settings in PageContent table
    const fomoPage = await prisma.pageContent.findUnique({
      where: {
        pageType: 'FOMO_SETTINGS'
      }
    });

    if (!fomoPage) {
      // Return default settings if none exist
      return NextResponse.json({
        id: null,
        isActive: false,
        title: 'Limited Time Offers',
        titleAr: 'عروض محدودة الوقت',
        hours: 24,
        message: 'Hurry up! Offer ends in',
        messageAr: 'أسرع! العرض ينتهي خلال',
        endTime: null,
        createdAt: null,
        updatedAt: null
      });
    }

    // Parse the metadata which contains our FOMO settings
    const metadata = fomoPage.metadata as any;
    
    return NextResponse.json({
      id: fomoPage.id,
      isActive: metadata?.isActive || false,
      title: fomoPage.title,
      titleAr: fomoPage.titleAr || fomoPage.title,
      hours: metadata?.hours || 24,
      message: fomoPage.content,
      messageAr: fomoPage.contentAr || fomoPage.content,
      endTime: metadata?.endTime || null,
      createdAt: fomoPage.createdAt,
      updatedAt: fomoPage.updatedAt
    });

  } catch (error) {
    console.error('Error fetching FOMO settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FOMO settings' },
      { status: 500 }
    );
  }
}

// Create or update FOMO settings
export async function POST(request: NextRequest) {
  try {
    const data: FOMOData = await request.json();

    // Validate required fields
    if (!data.title || !data.titleAr || !data.message || !data.messageAr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (data.hours < 1 || data.hours > 168) {
      return NextResponse.json(
        { error: 'Hours must be between 1 and 168' },
        { status: 400 }
      );
    }

    // Calculate end time if FOMO is being activated
    const endTime = data.isActive ? 
      new Date(Date.now() + data.hours * 60 * 60 * 1000).toISOString() : 
      null;

    // Prepare metadata
    const metadata = {
      isActive: data.isActive,
      hours: data.hours,
      endTime: endTime
    };

    // Use upsert to create or update
    const savedSettings = await prisma.pageContent.upsert({
      where: {
        pageType: 'FOMO_SETTINGS'
      },
      update: {
        title: data.title,
        titleAr: data.titleAr,
        content: data.message,
        contentAr: data.messageAr,
        metadata: metadata,
        lastUpdated: new Date()
      },
      create: {
        pageType: 'FOMO_SETTINGS',
        title: data.title,
        titleAr: data.titleAr,
        content: data.message,
        contentAr: data.messageAr,
        metadata: metadata
      }
    });

    // Return the formatted response
    const savedMetadata = savedSettings.metadata as any;
    
    return NextResponse.json({
      id: savedSettings.id,
      isActive: savedMetadata?.isActive || false,
      title: savedSettings.title,
      titleAr: savedSettings.titleAr || savedSettings.title,
      hours: savedMetadata?.hours || data.hours,
      message: savedSettings.content,
      messageAr: savedSettings.contentAr || savedSettings.content,
      endTime: savedMetadata?.endTime || null,
      createdAt: savedSettings.createdAt,
      updatedAt: savedSettings.updatedAt
    });

  } catch (error) {
    console.error('Error saving FOMO settings:', error);
    return NextResponse.json(
      { error: 'Failed to save FOMO settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 