import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      currency = 'aed', 
      customerInfo, 
      shippingInfo, 
      items,
      subtotal,
      tax,
      shippingCost,
      discount = 0
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Prepare items for metadata (Stripe has a 500 character limit per metadata value)
    const itemsData = items?.map((item: any) => ({
      id: item.productId || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variationId: item.variationId || null
    })) || [];

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        customerName: customerInfo?.fullName || '',
        customerEmail: customerInfo?.email || '',
        customerPhone: customerInfo?.phone || '',
        shippingCity: shippingInfo?.city || '',
        shippingAddress: shippingInfo?.address || '',
        itemsCount: items?.length || 0,
        // Store order details as JSON strings (Stripe metadata values must be strings)
        orderItems: JSON.stringify(itemsData).substring(0, 500), // Limit to 500 chars
        subtotal: String(subtotal || amount * 0.9),
        tax: String(tax || amount * 0.05),
        shippingCost: String(shippingCost || 0),
        discount: String(discount || 0),
        total: String(amount)
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 