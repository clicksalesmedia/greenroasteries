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

    // Format phone number per Tabby documentation
    // Accepts: "+971500000001", "971500000001", "500000001", "0500000001"
    let formattedPhone = customerInfo.phone || '';
    
    // Clean and validate phone number
    const cleanPhone = formattedPhone.replace(/[^\d]/g, '');
    
    // Validate and format according to Tabby standards
    if (cleanPhone.startsWith('971') && cleanPhone.length === 12) {
      // Format: 971500000001 -> keep as is (Tabby accepts this)
      formattedPhone = cleanPhone;
    } else if (cleanPhone.startsWith('00971') && cleanPhone.length === 14) {
      // Format: 00971500000001 -> 971500000001
      formattedPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      // Format: 0500000001 -> 971500000001 
      formattedPhone = '971' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
      // Format: 500000001 -> 971500000001
      formattedPhone = '971' + cleanPhone;
    } else {
      // Invalid format - use default test number
      formattedPhone = '971500000001'; // Tabby's preferred format with country code
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