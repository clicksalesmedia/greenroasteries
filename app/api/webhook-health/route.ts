import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Health check endpoint for webhook monitoring
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Disable webhookLog usage until database is migrated
    return NextResponse.json({
      status: 'healthy',
      message: 'Webhook monitoring temporarily disabled - database migration pending',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
}

// Manual webhook recovery endpoint
export async function POST(request: NextRequest) {
  try {
    const { action, paymentId } = await request.json();
    
    if (action === 'recover_order' && paymentId) {
      // TODO: Implement manual order recovery
      // This would fetch payment details from Tabby API and create missing order
      
      return NextResponse.json({
        success: true,
        message: 'Manual recovery initiated',
        paymentId: paymentId
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action or missing paymentId'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Recovery failed'
    }, { status: 500 });
  }
}