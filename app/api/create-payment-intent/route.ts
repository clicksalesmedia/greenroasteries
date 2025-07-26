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
      discount = 0,
      appliedCoupon
    } = await request.json();

    // DEBUG: Log the received payment data
    console.log('💰 Payment Intent Creation - Received Data:', {
      amount,
      subtotal,
      tax,
      shippingCost,
      discount,
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountAmount: appliedCoupon.discountAmount,
        discountType: appliedCoupon.discountType
      } : null
    });

    // Calculate the final amount after discount
    const finalAmount = Math.max(0, amount);

    // DEBUG: Log the calculated amounts
    console.log('🧮 Payment Intent - Amount Calculation:', {
      originalAmount: amount,
      finalAmount: finalAmount,
      discountApplied: discount,
      stripeAmount: formatAmountForStripe(finalAmount)
    });

    if (!finalAmount || finalAmount <= 0) {
      console.error('❌ Invalid final amount:', finalAmount);
      return NextResponse.json(
        { error: 'Invalid amount after discount' },
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

    // DEBUG: Log payment intent creation details
    console.log('🏦 Creating Stripe Payment Intent:', {
      amount: formatAmountForStripe(finalAmount),
      currency: currency.toLowerCase(),
      couponCode: appliedCoupon?.code || 'None'
    });

    // Create payment intent with Stripe using the final discounted amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(finalAmount),
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
        subtotal: String(subtotal || 0),
        tax: String(tax || 0),
        shippingCost: String(shippingCost || 0),
        discount: String(discount || 0),
        originalAmount: String(subtotal + shippingCost + tax), // Store original amount before discount
        finalAmount: String(finalAmount), // Store final amount after discount
        appliedCouponCode: appliedCoupon?.code || '',
        appliedCouponDiscount: String(appliedCoupon?.discountAmount || 0),
        appliedCouponType: appliedCoupon?.discountType || '',
        appliedCouponPromotionId: appliedCoupon?.promotionId || ''
      },
    });

    console.log('✅ Payment Intent Created Successfully:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 