import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@/app/generated/prisma';
import { handlePaymentIntentSucceeded } from '../../webhooks/stripe/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    console.log(`[Manual Recovery] Attempting to recover payment ${paymentIntentId}`);

    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId }
    });

    if (existingOrder) {
      return NextResponse.json({
        success: false,
        message: 'Order already exists for this payment',
        orderId: existingOrder.id
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        success: false,
        message: `Payment status is ${paymentIntent.status}, not succeeded`,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });
    }

    // Payment succeeded but no order exists - manually trigger the webhook handler
    console.log(`[Manual Recovery] Payment ${paymentIntentId} is succeeded, creating order...`);
    
    // Log metadata for debugging
    console.log(`[Manual Recovery] Payment metadata:`, paymentIntent.metadata);
    
    await handlePaymentIntentSucceeded(paymentIntent);

    // Verify order was created
    const newOrder = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (newOrder) {
      console.log(`[Manual Recovery] Successfully created order ${newOrder.id} for payment ${paymentIntentId}`);
      return NextResponse.json({
        success: true,
        message: 'Order successfully recovered',
        order: {
          id: newOrder.id,
          customerEmail: newOrder.customerEmail,
          total: newOrder.total,
          status: newOrder.status,
          createdAt: newOrder.createdAt
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create order after recovery attempt'
      });
    }

  } catch (error) {
    console.error('[Manual Recovery] Error:', error);
    return NextResponse.json(
      { error: 'Failed to recover payment: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET endpoint to check a specific payment intent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    // Retrieve from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check database
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId }
    });

    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId }
    });

    return NextResponse.json({
      stripe: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
        customer: paymentIntent.customer,
        receipt_email: paymentIntent.receipt_email
      },
      database: {
        orderExists: !!order,
        paymentExists: !!payment,
        order: order ? {
          id: order.id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt
        } : null,
        payment: payment ? {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          createdAt: payment.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('Error checking payment:', error);
    return NextResponse.json(
      { error: 'Failed to check payment' },
      { status: 500 }
    );
  }
} 