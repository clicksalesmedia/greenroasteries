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
    // Check if we have a FOMOSettings table in our schema
    // If not, we'll use a more generic approach with a settings table
    
    // For now, let's try to find an existing FOMO setting
    // We can use a ContentPage model or create a simple JSON storage approach
    
    const settings = await prisma.$queryRaw`
      SELECT * FROM "ContentPage" 
      WHERE "type" = 'fomo_settings' 
      ORDER BY "updatedAt" DESC 
      LIMIT 1
    ` as any[];

    if (settings.length === 0) {
      return NextResponse.json(
        { message: 'No FOMO settings found' },
        { status: 404 }
      );
    }

    const setting = settings[0];
    const content = typeof setting.content === 'string' 
      ? JSON.parse(setting.content) 
      : setting.content;

    return NextResponse.json({
      id: setting.id,
      isActive: content.isActive || false,
      title: content.title || 'Limited Time Offer',
      titleAr: content.titleAr || 'عرض لفترة محدودة',
      hours: content.hours || 18,
      message: content.message || 'Hurry up! Offer ends in',
      messageAr: content.messageAr || 'أسرع! العرض ينتهي خلال',
      endTime: content.endTime || null,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt
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

    // Check if FOMO settings already exist
    const existingSettings = await prisma.$queryRaw`
      SELECT * FROM "ContentPage" 
      WHERE "type" = 'fomo_settings' 
      ORDER BY "updatedAt" DESC 
      LIMIT 1
    ` as any[];

    const settingsContent = {
      isActive: data.isActive,
      title: data.title,
      titleAr: data.titleAr,
      hours: data.hours,
      message: data.message,
      messageAr: data.messageAr,
      endTime: data.endTime || null
    };

    let savedSettings;

    if (existingSettings.length > 0) {
      // Update existing settings
      const existingId = existingSettings[0].id;
      
      savedSettings = await prisma.$executeRaw`
        UPDATE "ContentPage" 
        SET "content" = ${JSON.stringify(settingsContent)}, 
            "updatedAt" = NOW()
        WHERE "id" = ${existingId}
      `;

      // Fetch the updated record
      const updatedRecord = await prisma.$queryRaw`
        SELECT * FROM "ContentPage" WHERE "id" = ${existingId}
      ` as any[];

      savedSettings = updatedRecord[0];
    } else {
      // Create new settings
      savedSettings = await prisma.$queryRaw`
        INSERT INTO "ContentPage" ("type", "title", "content", "createdAt", "updatedAt")
        VALUES ('fomo_settings', 'FOMO Timer Settings', ${JSON.stringify(settingsContent)}, NOW(), NOW())
        RETURNING *
      ` as any[];

      savedSettings = Array.isArray(savedSettings) ? savedSettings[0] : savedSettings;
    }

    const content = typeof savedSettings.content === 'string' 
      ? JSON.parse(savedSettings.content) 
      : savedSettings.content;

    return NextResponse.json({
      id: savedSettings.id,
      isActive: content.isActive,
      title: content.title,
      titleAr: content.titleAr,
      hours: content.hours,
      message: content.message,
      messageAr: content.messageAr,
      endTime: content.endTime,
      createdAt: savedSettings.createdAt,
      updatedAt: savedSettings.updatedAt
    });

  } catch (error) {
    console.error('Error saving FOMO settings:', error);
    return NextResponse.json(
      { error: 'Failed to save FOMO settings' },
      { status: 500 }
    );
  }
} 