import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory state since we don't have a database yet
let maintenanceMode = false;

export async function GET() {
  try {
    const response = NextResponse.json({ 
      maintenanceMode,
      timestamp: Date.now()
    });

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch maintenance status',
        maintenanceMode: false // Default to not in maintenance if error
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body with validation
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate enabled field
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Field "enabled" must be a boolean' },
        { status: 400 }
      );
    }

    // Update maintenance mode
    const previousState = maintenanceMode;
    maintenanceMode = body.enabled;

    console.log(`Maintenance mode changed from ${previousState} to ${maintenanceMode}`);

    const response = NextResponse.json({ 
      maintenanceMode,
      previousState,
      timestamp: Date.now()
    });

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update maintenance status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 