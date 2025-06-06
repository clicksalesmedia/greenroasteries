import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch incomplete payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        // Check payments from the last 7 days
        gte: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000),
      },
    });

    // Filter for incomplete payments
    const incompletePayments = paymentIntents.data.filter(
      pi => ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'canceled'].includes(pi.status)
    );

    // Check which ones have orders in our database
    const paymentIntentIds = incompletePayments.map(pi => pi.id);
    const existingOrders = await prisma.order.findMany({
      where: {
        stripePaymentIntentId: {
          in: paymentIntentIds
        }
      },
      select: {
        stripePaymentIntentId: true
      }
    });

    const existingOrderIds = new Set(existingOrders.map(o => o.stripePaymentIntentId));

    // Format the response
    const formattedPayments = incompletePayments.map(pi => ({
      id: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: pi.status,
      created: new Date(pi.created * 1000),
      metadata: pi.metadata,
      hasOrder: existingOrderIds.has(pi.id),
      customer: {
        email: pi.metadata?.customerEmail || pi.receipt_email || 'Unknown',
        name: pi.metadata?.customerName || 'Unknown',
        phone: pi.metadata?.customerPhone || 'Unknown'
      }
    }));

    return NextResponse.json({
      success: true,
      incompletePayments: formattedPayments,
      total: formattedPayments.length,
      summary: {
        total: formattedPayments.length,
        withoutOrders: formattedPayments.filter(p => !p.hasOrder).length,
        byStatus: formattedPayments.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error checking incomplete payments:', error);
    return NextResponse.json(
      { error: 'Failed to check incomplete payments' },
      { status: 500 }
    );
  }
}

// POST endpoint to attempt to recover an incomplete payment
export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if it's actually incomplete
    if (paymentIntent.status === 'succeeded') {
      // Payment actually succeeded, trigger the webhook handler manually
      const { handlePaymentIntentSucceeded } = await import('../../webhooks/stripe/route');
      await handlePaymentIntentSucceeded(paymentIntent);
      
      return NextResponse.json({
        success: true,
        message: 'Payment already succeeded, order created',
        status: paymentIntent.status
      });
    }

    // Return the current status
    return NextResponse.json({
      success: false,
      message: `Payment is ${paymentIntent.status}`,
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata
      }
    });

  } catch (error) {
    console.error('Error recovering payment:', error);
    return NextResponse.json(
      { error: 'Failed to recover payment' },
      { status: 500 }
    );
  }
} 