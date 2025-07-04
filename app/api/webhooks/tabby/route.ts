import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { tabbyService } from '@/app/lib/tabby';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Tabby webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature if needed (Tabby provides webhook signatures)
    // const signature = request.headers.get('tabby-signature');
    // if (!verifyTabbySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { event_type, payment } = body;

    if (!payment || !payment.id) {
      console.error('Invalid webhook payload: missing payment data');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find the payment in our database
    const dbPayment = await prisma.payment.findUnique({
      where: { tabbyPaymentId: payment.id },
      include: { order: true }
    });

    if (!dbPayment) {
      console.error(`Payment not found for Tabby payment ID: ${payment.id}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    console.log(`Processing Tabby webhook for payment ${dbPayment.id}, event: ${event_type}`);

    switch (event_type) {
      case 'payment.authorized':
        // Payment has been authorized but not yet captured
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: 'PROCESSING',
            updatedAt: new Date()
          }
        });

        await prisma.order.update({
          where: { id: dbPayment.orderId },
          data: { status: 'PROCESSING' }
        });

        console.log(`Payment ${dbPayment.id} marked as PROCESSING (authorized)`);
        break;

      case 'payment.captured':
      case 'payment.completed':
        // Payment has been successfully completed
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: 'SUCCEEDED',
            updatedAt: new Date()
          }
        });

        await prisma.order.update({
          where: { id: dbPayment.orderId },
          data: { 
            status: 'PROCESSING', // Order is now being processed
            updatedAt: new Date()
          }
        });

        console.log(`Payment ${dbPayment.id} marked as SUCCEEDED`);
        break;

      case 'payment.failed':
      case 'payment.rejected':
        // Payment has failed
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: 'FAILED',
            failureReason: payment.failure_reason || 'Payment failed',
            updatedAt: new Date()
          }
        });

        await prisma.order.update({
          where: { id: dbPayment.orderId },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        console.log(`Payment ${dbPayment.id} marked as FAILED`);
        break;

      case 'payment.cancelled':
        // Payment was cancelled by customer
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        await prisma.order.update({
          where: { id: dbPayment.orderId },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

        console.log(`Payment ${dbPayment.id} marked as CANCELLED`);
        break;

      case 'payment.refunded':
        // Payment has been refunded
        const refundAmount = payment.refund_amount || payment.amount;
        
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: refundAmount >= dbPayment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            refundedAmount: (dbPayment.refundedAmount || 0) + refundAmount,
            updatedAt: new Date()
          }
        });

        // Update order status if fully refunded
        if (refundAmount >= dbPayment.amount) {
          await prisma.order.update({
            where: { id: dbPayment.orderId },
            data: { 
              status: 'REFUNDED',
              updatedAt: new Date()
            }
          });
        }

        console.log(`Payment ${dbPayment.id} refund processed: ${refundAmount} AED`);
        break;

      default:
        console.log(`Unhandled Tabby webhook event: ${event_type}`);
        break;
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing Tabby webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for webhook
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Tabby webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

// Helper function to verify Tabby webhook signature (if implemented)
// function verifyTabbySignature(payload: any, signature: string | null): boolean {
//   if (!signature) return false;
//   
//   // Implement signature verification based on Tabby's documentation
//   // This typically involves computing HMAC with secret key
//   
//   return true; // Placeholder - implement actual verification
// } 