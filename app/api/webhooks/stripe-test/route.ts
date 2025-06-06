import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify webhook is reachable
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
    headers: {
      'stripe-signature': request.headers.get('stripe-signature') || 'not-present'
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  console.log(`[Stripe Webhook Test] Received test webhook at ${new Date().toISOString()}`);
  console.log(`[Stripe Webhook Test] Signature present: ${!!signature}`);
  console.log(`[Stripe Webhook Test] Body length: ${body.length}`);
  
  return NextResponse.json({
    status: 'ok',
    message: 'Test webhook received',
    timestamp: new Date().toISOString(),
    signaturePresent: !!signature,
    bodyLength: body.length
  });
} 