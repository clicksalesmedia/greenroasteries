import { NextRequest, NextResponse } from 'next/server';
import { tabbyService, TabbyPaymentRequest } from '@/app/lib/tabby';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'AED',
      customerInfo,
      shippingInfo,
      items,
      subtotal,
      tax,
      shippingCost,
      discount = 0,
      orderId
    } = body;

    // Validate required fields
    if (!amount || !customerInfo || !shippingInfo || !items) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Check if Tabby is available for this amount
    if (!tabbyService.isAvailable(amount, currency)) {
      return NextResponse.json(
        { error: 'Tabby is not available for this order amount' },
        { status: 400 }
      );
    }

    // Prepare Tabby payment request
    const tabbyPaymentData: TabbyPaymentRequest = {
      amount: Math.round(amount * 100), // Convert to fils (smallest currency unit)
      currency: currency.toUpperCase(),
      description: `Green Roasteries Order - ${items.length} items`,
      buyer: {
        phone: customerInfo.phone,
        email: customerInfo.email,
        name: customerInfo.fullName,
      },
      shipping_address: {
        city: shippingInfo.city,
        address: shippingInfo.address,
        zip: shippingInfo.zip || '',
      },
      order: {
        tax_amount: Math.round((tax || 0) * 100),
        shipping_amount: Math.round(shippingCost * 100),
        discount_amount: Math.round(discount * 100),
        updated_at: new Date().toISOString(),
        reference_id: orderId || `order_${Date.now()}`,
        items: items.map((item: any) => ({
          title: item.name,
          description: item.variation ? 
            `${item.name} - ${JSON.stringify(item.variation)}` : 
            item.name,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100),
          discount_amount: 0,
          reference_id: item.id,
          image_url: item.imageUrl || '',
          product_url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${item.id}`,
          category: item.category || 'Coffee',
        })),
      },
      merchant_code: process.env.TABBY_MERCHANT_CODE || 'GREEN ROASTERIES',
      lang: 'en',
      merchant_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/thank-you?payment=tabby&session_id={payment.id}`,
        cancel: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?payment=cancelled`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?payment=failed`,
      },
    };

    // Create Tabby payment session
    const tabbyResponse = await tabbyService.createPayment(tabbyPaymentData);

    return NextResponse.json({
      success: true,
      payment_id: tabbyResponse.id,
      checkout_url: tabbyResponse.configuration.available_products.installments[0]?.web_url,
      expires_at: tabbyResponse.payment.expires_at,
      tabbyResponse,
    });

  } catch (error) {
    console.error('Tabby payment creation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create Tabby payment',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment details from Tabby
    const paymentDetails = await tabbyService.getPayment(paymentId);

    return NextResponse.json({
      success: true,
      payment: paymentDetails,
    });

  } catch (error) {
    console.error('Tabby payment retrieval error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to retrieve Tabby payment',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, paymentId, amount, reason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'capture':
        const captureResult = await tabbyService.capturePayment(paymentId, amount);
        return NextResponse.json({
          success: true,
          message: 'Payment captured successfully',
          result: captureResult,
        });

      case 'refund':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Valid refund amount is required' },
            { status: 400 }
          );
        }

        const refundResult = await tabbyService.refundPayment(
          paymentId, 
          Math.round(amount * 100), // Convert to fils
          reason
        );
        
        return NextResponse.json({
          success: true,
          message: `Refund of ${amount} AED processed successfully`,
          result: refundResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Tabby payment action error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process Tabby payment action',
      },
      { status: 500 }
    );
  }
} 