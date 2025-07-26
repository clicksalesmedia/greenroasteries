import { NextRequest, NextResponse } from 'next/server';
import { tabbyService } from '@/app/lib/tabby';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * Tabby Payment Capture API Endpoint
 * POST /api/payments/{id}/captures
 * 
 * Implements Tabby's capture payment specification:
 * - Send capture requests for AUTHORIZED payments only
 * - If you capture the full payment amount, the payment will be automatically closed with full capture
 * - If you capture partial amount, the payment will remain AUTHORIZED until the rest is captured or Close request sent
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Parse request body according to Tabby API specification
    const body = await request.json();
    const {
      amount,
      reference_id,
      tax_amount = "0.00",
      shipping_amount = "0.00", 
      discount_amount = "0.00",
      created_at,
      items = []
    } = body;

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required for capture' },
        { status: 400 }
      );
    }

    // Validate amount format (up to 2 decimals for AED and SAR, up to 3 for KWD)
    const amountRegex = /^\d+\.\d{2,3}$/;
    if (!amountRegex.test(amount)) {
      return NextResponse.json(
        { error: 'Amount must be in correct decimal format (e.g., "100.00")' },
        { status: 400 }
      );
    }

    console.log(`🔵 TABBY CAPTURE: Processing capture for payment ${paymentId}`, {
      amount,
      reference_id,
      tax_amount,
      shipping_amount,
      discount_amount
    });

    // Step 1: Verify payment exists and is in AUTHORIZED status
    let paymentDetails;
    try {
      paymentDetails = await tabbyService.getPayment(paymentId);
      
      if (!paymentDetails) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      if (paymentDetails.status !== 'AUTHORIZED') {
        return NextResponse.json(
          { 
            error: `Payment status is "${paymentDetails.status}". Only AUTHORIZED payments can be captured.` 
          },
          { status: 400 }
        );
      }

      console.log(`✅ Payment verification passed: ${paymentId} is AUTHORIZED`);
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 500 }
      );
    }

    // Step 2: Build capture data according to Tabby API specification
    const captureData = {
      amount: amount,
      reference_id: reference_id || `capture_${paymentId}_${Date.now()}`,
      tax_amount: tax_amount,
      shipping_amount: shipping_amount,
      discount_amount: discount_amount,
      created_at: created_at || new Date().toISOString(),
      items: items.length > 0 ? items : paymentDetails.order?.items?.map((item: any) => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || "0.00",
        reference_id: item.reference_id,
        image_url: item.image_url,
        product_url: item.product_url,
        gender: item.gender || "Other",
        category: item.category || "Coffee",
        color: item.color || "brown",
        product_material: item.product_material || "organic",
        size_type: item.size_type || "weight",
        size: item.size || "M",
        brand: item.brand || "Green Roasteries",
        is_refundable: item.is_refundable !== false,
        barcode: item.barcode || `GR${Date.now()}`,
        ppn: item.ppn || `GR-${item.reference_id}`,
        seller: item.seller || "Green Roasteries"
      })) || []
    };

    // Step 3: Execute capture via Tabby API
    let captureResult;
    try {
      captureResult = await tabbyService.capturePayment(paymentId, captureData);
      
      console.log(`✅ TABBY CAPTURE SUCCESS: Payment ${paymentId} captured`, {
        captureId: captureResult.captures?.[0]?.id,
        amount: captureResult.amount,
        status: captureResult.status
      });

    } catch (error) {
      console.error('❌ TABBY CAPTURE FAILED:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to capture payment',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Step 4: Update local payment record
    try {
      await prisma.payment.updateMany({
        where: {
          tabbyPaymentId: paymentId
        },
        data: {
          status: captureResult.status === 'CLOSED' ? 'SUCCEEDED' : 'PROCESSING',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated local payment record for ${paymentId}`);
    } catch (error) {
      console.warn('⚠️ Failed to update local payment record (non-critical):', error);
    }

    // Step 5: Return the complete payment object as per Tabby API specification
    return NextResponse.json({
      id: captureResult.id,
      created_at: captureResult.created_at,
      expires_at: captureResult.expires_at,
      status: captureResult.status,
      is_test: captureResult.is_test,
      amount: captureResult.amount,
      currency: captureResult.currency,
      description: captureResult.description,
      buyer: captureResult.buyer,
      shipping_address: captureResult.shipping_address,
      order: captureResult.order,
      buyer_history: captureResult.buyer_history,
      order_history: captureResult.order_history,
      captures: captureResult.captures,
      refunds: captureResult.refunds || [],
      meta: captureResult.meta,
      attachment: captureResult.attachment
    }, { status: 200 });

  } catch (error) {
    console.error('❌ TABBY CAPTURE ENDPOINT ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during capture',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve capture details (optional, for debugging)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment details including captures
    const paymentDetails = await tabbyService.getPayment(paymentId);
    
    if (!paymentDetails) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment_id: paymentDetails.id,
      status: paymentDetails.status,
      captures: paymentDetails.captures || [],
      total_captured: paymentDetails.captures?.reduce((sum: number, capture: any) => 
        sum + parseFloat(capture.amount || '0'), 0) || 0
    });

  } catch (error) {
    console.error('❌ GET CAPTURE DETAILS ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve capture details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 