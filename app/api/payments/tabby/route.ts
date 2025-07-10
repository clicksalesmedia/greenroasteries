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

    // Format phone number for Tabby (remove country code if present)
    let formattedPhone = customerInfo.phone;
    if (formattedPhone.startsWith('+971')) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith('971')) {
      formattedPhone = formattedPhone.substring(3);
    }
    // Remove any non-digit characters except the leading +
    formattedPhone = formattedPhone.replace(/[^\d]/g, '');
    
    // Ensure phone is at least 9 digits
    if (formattedPhone.length < 9) {
      formattedPhone = '500000001'; // Default test phone for Tabby
    }

    // Prepare Tabby payment request
    const tabbyPaymentData: TabbyPaymentRequest = {
      amount: amount, // Keep as decimal value
      currency: currency.toUpperCase(),
      description: `Green Roasteries Order - ${items.length} items`,
      buyer: {
        phone: formattedPhone,
        email: customerInfo.email,
        name: customerInfo.fullName,
      },
      shipping_address: {
        city: shippingInfo.city,
        address: shippingInfo.address,
        zip: shippingInfo.zip || '1111',
      },
      order: {
        tax_amount: Math.round((tax || 0) * 100), // Keep as fils for internal processing
        shipping_amount: Math.round(shippingCost * 100),
        discount_amount: Math.round(discount * 100),
        updated_at: new Date().toISOString(),
        reference_id: orderId || `order_${Date.now()}`,
        items: items.map((item: any) => {
          // Limit image URL to 255 characters to avoid Tabby API issues
          const fallbackImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/placeholder.jpg`;
          let imageUrl = item.image || fallbackImage;
          
          // If image URL is too long (Tabby limit), use fallback
          if (imageUrl.length > 255) {
            console.warn(`Image URL too long for item ${item.name}, using fallback`);
            imageUrl = fallbackImage;
          }
          
          return {
            title: item.name,
            description: item.variation ? 
              Object.values(item.variation).filter(Boolean).join(', ') : 
              item.name,
            quantity: item.quantity,
            unit_price: Math.round(item.price * 100), // Keep as fils for internal processing
            discount_amount: 0,
            reference_id: item.id,
            image_url: imageUrl,
            product_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
            category: 'Coffee',
          };
        }),
      },
      merchant_code: process.env.TABBY_MERCHANT_CODE || 'GR',
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
      session_id: tabbyResponse.id, // Session ID from top level
      payment_id: tabbyResponse.payment.id, // Payment ID from payment object
      checkout_url: tabbyResponse.configuration.available_products.installments[0]?.web_url,
      qr_code: tabbyResponse.configuration.available_products.installments[0]?.qr_code,
      expires_at: tabbyResponse.configuration.expires_at, // From configuration object
      payment_expires_at: tabbyResponse.payment.expires_at, // From payment object
      is_available: tabbyResponse.configuration.products.installments.is_available,
      tabbyResponse,
    });

  } catch (error) {
    console.error('Tabby payment creation error:', error);
    
    // Extract more specific error information
    let errorMessage = 'Failed to create Tabby payment';
    let statusCode = 500;
    let errorType = 'GENERAL_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check if this is a Tabby rejection error
      if ((error as any).type === 'TABBY_REJECTION') {
        statusCode = 400;
        errorType = 'TABBY_REJECTION';
        errorMessage = error.message; // Use the specific rejection message
      } else if (error.message.includes('(400)')) {
        statusCode = 400;
        errorMessage = 'Invalid payment information. Please check your details and try again.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: `${errorType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: errorType,
        rejectionReason: (error as any).rejectionReason || null,
        sessionId: (error as any).sessionId || null
      },
      { status: statusCode }
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