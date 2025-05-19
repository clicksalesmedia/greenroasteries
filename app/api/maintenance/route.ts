import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory state since we don't have a database yet
let maintenanceMode = false;

export async function GET() {
  return NextResponse.json({ maintenanceMode });
}

export async function POST(request: Request) {
  try {
    // For now, skip authentication check since we're using in-memory state
    // In production, you should implement proper authentication
    const { enabled } = await request.json();
    maintenanceMode = enabled;
    return NextResponse.json({ maintenanceMode });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 