import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs/promises';
import path from 'path';

const EID_BANNER_FILE = path.join(process.cwd(), 'data', 'eid-banner.json');

interface EidBanner {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// PUT /api/eid-banner/[id] - Update EID banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, isActive = true } = await request.json();

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    await ensureDataDir();

    // Read existing banner or create new one
    let banner: EidBanner;
    try {
      const data = await fs.readFile(EID_BANNER_FILE, 'utf-8');
      banner = JSON.parse(data) as EidBanner;
      // Update existing banner
      banner.imageUrl = imageUrl;
      banner.isActive = isActive;
      banner.updatedAt = new Date().toISOString();
    } catch (error) {
      // Create new banner
      banner = {
        id: params.id,
        imageUrl,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Save banner to file
    await fs.writeFile(EID_BANNER_FILE, JSON.stringify(banner, null, 2));

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating EID banner:', error);
    return NextResponse.json(
      { error: 'Failed to update EID banner' },
      { status: 500 }
    );
  }
} 