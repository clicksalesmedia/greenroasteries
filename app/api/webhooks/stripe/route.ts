import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'SUCCEEDED',
        updatedAt: new Date()
      }
    });

    // Update associated order status
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true }
    });

    if (payment && payment.order) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date()
        }
      });
    }

    console.log(`Payment intent ${paymentIntent.id} succeeded`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: new Date()
      }
    });

    // Update associated order status
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true }
    });

    if (payment && payment.order) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });
    }

    console.log(`Payment intent ${paymentIntent.id} failed`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    // Update associated order status
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true }
    });

    if (payment && payment.order) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });
    }

    console.log(`Payment intent ${paymentIntent.id} canceled`);
  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

async function handleChargeDisputeCreated(dispute: any) {
  try {
    // Find the payment associated with this charge
    const payment = await prisma.payment.findFirst({
      where: { stripeChargeId: dispute.charge },
      include: { order: true }
    });

    if (payment) {
      // Update payment status - using 'FAILED' since 'DISPUTED' is not in the enum
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: 'Payment disputed',
          updatedAt: new Date()
        }
      });

      // Update order status
      if (payment.order) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });
      }
    }

    console.log(`Dispute created for charge ${dispute.charge}`);
  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
  }
} 