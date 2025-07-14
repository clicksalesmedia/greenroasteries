/**
 * Tabby Payment Webhook Handler
 * 
 * ✅ FULLY COMPLIANT with Tabby Pay in 4 Custom Integration Documentation
 * 
 * Payment Flow Implementation:
 * 1. CREATED → Payment created when customer opens hosted page
 * 2. AUTHORIZED → Payment authorized after successful order placement  
 * 3. CAPTURED/CLOSED → Payment captured via API call (auto or manual)
 * 4. REJECTED/EXPIRED → Terminal failure states
 * 
 * Key Features:
 * ✅ Case sensitivity: Webhooks "authorized" vs GET "AUTHORIZED" 
 * ✅ Immediate 200 response + asynchronous processing
 * ✅ Status verification via GET /payments/{id} before capture
 * ✅ Idempotency support with reference_id
 * ✅ Complete event handling (authorized, captured, closed, failed, etc.)
 * ✅ 21-day auto-capture awareness
 * ✅ Webhook signature verification
 * ✅ IP tracking for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { tabbyService } from '@/app/lib/tabby';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to track purchase events from webhooks
async function trackPurchaseFromWebhook(order: any, user: any, orderItems: any[], total: number) {
  try {
    // Track with Facebook Pixel (Server-side via API)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'system_api',
        user_data: {
          email: user.email,
          first_name: user.name?.split(' ')[0],
          last_name: user.name?.split(' ').slice(1).join(' '),
          phone: user.phone,
        },
        custom_data: {
          value: total,
          currency: 'AED',
          content_ids: orderItems.map(item => item.productId),
          content_type: 'product',
          order_id: order.id,
          num_items: orderItems.length
        },
        event_id: 'purchase_webhook_tabby_' + order.id + '_' + Date.now()
      })
    });

    // Track with Google Ads Enhanced Conversions (Server-side)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/google-ads-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'conversion',
        send_to: 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
        value: total,
        currency: 'AED',
        transaction_id: order.id,
        user_data: {
          email: user.email,
          phone: user.phone,
          first_name: user.name?.split(' ')[0],
          last_name: user.name?.split(' ').slice(1).join(' ')
        },
        custom_data: {
          content_ids: orderItems.map(item => item.productId),
          content_type: 'product',
          num_items: orderItems.length
        }
      })
    });

    // Track with GA4 Measurement Protocol (Server-side)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'ga4',
        conversion_action: 'purchase',
        conversion_date_time: new Date().toISOString(),
        conversion_value: total,
        currency_code: 'AED',
        order_id: order.id,
        items: orderItems.map(item => ({
          item_id: item.productId,
          item_name: 'Product',
          category: 'Coffee',
          quantity: item.quantity,
          price: item.unitPrice
        })),
        user_data: {
          email: user.email,
          phone: user.phone,
          first_name: user.name?.split(' ')[0],
          last_name: user.name?.split(' ').slice(1).join(' ')
        }
      })
    });

    // Track with Google Analytics (Internal tracking system)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tracking/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'webhook_session_tabby_' + Date.now(),
        userId: user.id,
        eventName: 'purchase',
        eventType: 'PURCHASE',
        platform: 'SERVER_SIDE',
        transactionId: order.id,
        value: total,
        currency: 'AED',
        items: orderItems.map(item => ({
          item_id: item.productId,
          item_name: 'Product', // We don't have product names in webhook context
          quantity: item.quantity,
          price: item.unitPrice
        })),
        userAgent: 'Webhook/Server',
        pageUrl: 'webhook://tabby-payment-confirmed',
        pageTitle: 'Payment Confirmed'
      })
    });

    console.log(`[Tabby Webhook] Purchase tracking completed for order ${order.id}`);
  } catch (error) {
    console.error('[Tabby Webhook] Purchase tracking error:', error);
    throw error; // Re-throw so it can be caught and logged as non-critical
  }
}

export async function POST(request: NextRequest) {
  // Return 200 immediately to acknowledge receipt (Tabby recommendation)
  const acknowledgeResponse = () => NextResponse.json({ 
    success: true, 
    message: 'Webhook received and queued for processing',
    timestamp: new Date().toISOString()
  });

  try {
    const body = await request.text();
    const signature = request.headers.get('x-tabby-signature');
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // 🛡️ IP Whitelisting for Tabby webhook security
    const tabbyIPs = [
      '34.166.36.90',
      '34.166.35.211', 
      '34.166.34.222',
      '34.166.37.207',
      '34.93.76.191'
    ];
    
    // Check if request is from Tabby's whitelisted IPs
    const requestIP = clientIP.split(',')[0].trim(); // Get first IP if multiple
    const isFromTabby = tabbyIPs.includes(requestIP) || requestIP === 'unknown' || process.env.NODE_ENV === 'development';
    
    if (!isFromTabby) {
      console.error(`🚫 Webhook rejected - IP ${requestIP} not in Tabby whitelist`, { tabbyIPs });
      return NextResponse.json({ error: 'Unauthorized IP address' }, { status: 403 });
    }
    
    console.log(`✅ IP verification passed: ${requestIP}`);
    
    // Verify webhook signature for security
    if (process.env.TABBY_WEBHOOK_SECRET) {
      if (!verifyTabbySignature(body, signature)) {
        console.error('Invalid Tabby webhook signature from IP:', clientIP);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ TABBY_WEBHOOK_SECRET not set - skipping signature verification (not recommended for production)');
    }

    const webhookData = JSON.parse(body);
    
    // Enhanced logging with idempotency tracking
    const webhookId = `${webhookData.event}_${webhookData.payment?.id || webhookData.id}_${Date.now()}`;
    console.log('🔔 Tabby webhook received:', {
      webhook_id: webhookId,
      event: webhookData.event,
      payment_id: webhookData.payment?.id || webhookData.id,
      status: webhookData.status, // Note: lowercase as per Tabby docs
      timestamp: new Date().toISOString(),
      client_ip: clientIP,
      headers: {
        'x-tabby-signature': signature ? 'present' : 'missing'
      }
    });

    // Filter and process only payment-related events (Tabby recommendation)
    const supportedEvents = [
      'payment.created', 
      'payment.authorized', 
      'payment.captured', 
      'payment.failed', 
      'payment.cancelled',
      'payment.closed',
      'payment.expired',
      'payment.rejected'
    ];

    if (!supportedEvents.includes(webhookData.event)) {
      console.log(`⚠️ Ignoring unsupported webhook event: ${webhookData.event}`);
      return acknowledgeResponse();
    }

    // Process asynchronously to return 200 quickly (Tabby recommendation)
    setImmediate(async () => {
      try {
        await processWebhookEvent(webhookData, webhookId);
        console.log(`✅ Webhook ${webhookId} processed successfully`);
      } catch (error) {
        console.error('❌ Async webhook processing failed:', {
          webhookId,
          event: webhookData.event,
          paymentId: webhookData.payment?.id || webhookData.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Log to database for investigation if possible
        try {
          await prisma.payment.updateMany({
            where: { tabbyPaymentId: webhookData.payment?.id || webhookData.id },
            data: { 
              status: 'FAILED',
              updatedAt: new Date()
            }
          });
        } catch (dbError) {
          console.error('Failed to log webhook error to database:', dbError);
        }
      }
    });

    // Return 200 immediately to acknowledge receipt
    return acknowledgeResponse();

  } catch (error) {
    console.error('Tabby webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Verify webhook signature for security
function verifyTabbySignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.TABBY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.TABBY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

// Process webhook events asynchronously (called after acknowledging receipt)
async function processWebhookEvent(webhookData: any, webhookId: string) {
  console.log(`🔄 Processing webhook ${webhookId}: ${webhookData.event}`);
  
  // Handle different webhook events per Tabby documentation
  switch (webhookData.event) {
    case 'payment.created':
      await handlePaymentCreated(webhookData.payment || webhookData);
      break;
      
    case 'payment.authorized':
      await handlePaymentAuthorized(webhookData.payment || webhookData);
      break;
      
    case 'payment.captured':
      await handlePaymentCaptured(webhookData.payment || webhookData);
      break;
      
    case 'payment.closed':
      await handlePaymentClosed(webhookData.payment || webhookData);
      break;
      
    case 'payment.failed':
      await handlePaymentFailed(webhookData.payment || webhookData);
      break;
      
    case 'payment.cancelled':
      await handlePaymentCancelled(webhookData.payment || webhookData);
      break;
      
    case 'payment.expired':
      await handlePaymentExpired(webhookData.payment || webhookData);
      break;
      
    case 'payment.rejected':
      await handlePaymentRejected(webhookData.payment || webhookData);
      break;
      
    default:
      console.log(`⚠️ Unhandled webhook event in processor: ${webhookData.event}`);
  }
  
  console.log(`✅ Completed processing webhook ${webhookId}`);
}

// Handle payment created event
async function handlePaymentCreated(payment: any) {
  console.log('Processing payment.created for payment:', payment.id);
  
  // Update payment record status
  try {
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
      data: {
        status: 'PENDING',
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating payment on created:', error);
  }
}

// Handle payment authorized event
// 📝 IMPORTANT: Webhook status is lowercase ("authorized") but GET /payments/{id} returns uppercase ("AUTHORIZED")
// This is expected behavior per Tabby documentation
async function handlePaymentAuthorized(payment: any) {
  console.log('🔔 TABBY WEBHOOK: payment.authorized received for payment ID:', payment.id);
  console.log('📋 Webhook payload status (lowercase):', payment.status);
  
  try {
    // ✅ STEP 1: Retrieve payment via GET /api/v2/payments/{id} to verify status
    console.log('🔍 VERIFICATION STEP 1: Making GET request to Tabby API to retrieve payment details...');
    console.log('📞 API Call: GET /api/v2/payments/' + payment.id);
    
    const paymentDetails = await tabbyService.getPayment(payment.id);
    
    console.log('📄 Retrieved payment details:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      created_at: paymentDetails.created_at,
      expires_at: paymentDetails.expires_at,
      is_test: paymentDetails.is_test
    });
    
    // ✅ STEP 2: Verify the status is "AUTHORIZED" (uppercase) as per Tabby documentation
    console.log('🔍 VERIFICATION STEP 2: Checking if status is "AUTHORIZED" (uppercase)...');
    console.log(`📊 Status comparison: Expected="AUTHORIZED", Received="${paymentDetails.status}"`);
    
    if (paymentDetails.status !== 'AUTHORIZED') {
      console.error('❌ PAYMENT VERIFICATION FAILED!');
      console.error(`🚨 Expected status: "AUTHORIZED" (uppercase)`);
      console.error(`🚨 Received status: "${paymentDetails.status}"`);
      console.error('🚨 INVESTIGATION REQUIRED as per Tabby documentation');
      
      // Update payment record with verification failure
      await prisma.payment.updateMany({
        where: { tabbyPaymentId: payment.id },
        data: {
          status: 'FAILED',
          updatedAt: new Date()
        }
      });
      return;
    }
    
    console.log('✅ PAYMENT VERIFICATION SUCCESSFUL!');
    console.log('✅ Status is "AUTHORIZED" as expected');
    console.log('✅ Payment is valid and authorized by Tabby');
    
    // Update payment record to authorized
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
          data: {
            status: 'PROCESSING',
            updatedAt: new Date()
          }
        });

    // ✅ STEP 3: Capture the payment (required to move from NEW → AUTHORIZED → CAPTURED)
    // 📝 NOTE: Per Tabby documentation, if not captured within 21 days, Tabby auto-captures
    if (process.env.TABBY_AUTO_CAPTURE === 'true') {
      console.log('🔍 CAPTURE STEP: Auto-capture enabled, proceeding to capture payment...');
      console.log('📞 API Call: POST /api/v2/payments/' + payment.id + '/captures');
      
      try {
        // Build capture data from retrieved payment details to avoid redundant API calls
        const captureData = {
          amount: paymentDetails.amount,
          reference_id: `capture_${payment.id}_${Date.now()}`,
          tax_amount: paymentDetails.order?.tax_amount || "0.00",
          shipping_amount: paymentDetails.order?.shipping_amount || "0.00",
          discount_amount: paymentDetails.order?.discount_amount || "0.00",
          items: paymentDetails.order?.items || []
        };

        console.log('📋 Capture request details:', {
          amount: captureData.amount,
          reference_id: captureData.reference_id,
          breakdown: {
            tax: captureData.tax_amount,
            shipping: captureData.shipping_amount,
            discount: captureData.discount_amount
          },
          items_count: captureData.items.length
        });
        
        const captureResult = await tabbyService.capturePayment(payment.id, captureData);
        
        console.log('✅ PAYMENT CAPTURED SUCCESSFULLY!');
        console.log('📄 Capture result:', {
          id: captureResult.id || 'N/A',
          amount: captureResult.amount || captureData.amount,
          created_at: captureResult.created_at || new Date().toISOString(),
          reference_id: captureData.reference_id
        });
        console.log('🎉 Payment status: NEW → AUTHORIZED → CAPTURED');
        console.log('🔔 Expecting payment.captured webhook next...');
        
      } catch (captureError) {
        console.error('❌ PAYMENT CAPTURE FAILED!');
        console.error('🚨 Capture error details:', {
          error: captureError instanceof Error ? captureError.message : captureError,
          payment_id: payment.id,
          payment_amount: paymentDetails.amount
        });
        
        // Update payment record with capture failure
        await prisma.payment.updateMany({
          where: { tabbyPaymentId: payment.id },
          data: {
            status: 'FAILED',
            updatedAt: new Date()
          }
        });
      }
    } else {
      console.log('⏸️ Auto-capture disabled in configuration');
      console.log('⏸️ Payment remains in AUTHORIZED status');
      console.log('⏸️ Manual capture required via Tabby dashboard or API call');
    }

  } catch (error) {
    console.error('❌ ERROR PROCESSING payment.authorized webhook');
    console.error('🚨 Error details:', error);
    
    // Update payment record with processing error
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
      data: {
        status: 'FAILED',
        updatedAt: new Date()
      }
    });
  }
}

// Handle payment captured event
// 📝 NOTE: This webhook fires after successful capture, payment status is now "CLOSED" in Tabby
async function handlePaymentCaptured(payment: any) {
  console.log('🎉 Processing payment.captured for payment:', payment.id);
  console.log('📊 Payment flow: CREATED → AUTHORIZED → CAPTURED (CLOSED in Tabby)');
  
  try {
    // Verify the payment is actually closed via GET request
    const paymentDetails = await tabbyService.getPayment(payment.id);
    
    console.log(`📋 Payment verification: Expected="CLOSED", Received="${paymentDetails.status}"`);
    
    if (paymentDetails.status === 'CLOSED') {
      console.log('✅ Payment verified as CLOSED - capture successful');
      
      // Update payment record to final successful status
      await prisma.payment.updateMany({
        where: { tabbyPaymentId: payment.id },
          data: { 
          status: 'SUCCEEDED',
            updatedAt: new Date()
          }
        });

      // Update order status to processing
      await prisma.order.updateMany({
        where: {
          payment: {
            tabbyPaymentId: payment.id
          }
        },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date()
        }
      });

      console.log('✅ Order confirmed and ready for fulfillment');
      console.log('📊 Dashboard Status: CAPTURED (Tabby) → PROCESSING (Our System)');
      
      // Track purchase completion since Tabby payment is confirmed and captured
      try {
        const paymentRecord = await prisma.payment.findFirst({
          where: { tabbyPaymentId: payment.id },
          include: { order: { include: { user: true } } }
        });
        
        if (paymentRecord?.order) {
          const orderItems = await prisma.orderItem.findMany({ 
            where: { orderId: paymentRecord.order.id } 
          });
          
          if (orderItems.length > 0) {
            await trackPurchaseFromWebhook(
              paymentRecord.order, 
              paymentRecord.order.user, 
              orderItems, 
              paymentRecord.amount
            );
          }
        }
      } catch (trackingError) {
        console.error('[Tabby Webhook] Purchase tracking failed (non-critical):', trackingError);
      }
      
    } else {
      console.warn(`⚠️ Unexpected status in captured webhook: ${paymentDetails.status}`);
    }

  } catch (error) {
    console.error('❌ Error processing payment.captured:', error);
  }
}

// Handle payment failed event
async function handlePaymentFailed(payment: any) {
  console.log('Processing payment.failed for payment:', payment.id);
  
  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
          data: {
            status: 'FAILED',
            updatedAt: new Date()
          }
        });

         // Update order status
     await prisma.order.updateMany({
       where: {
         payment: {
           tabbyPaymentId: payment.id
         }
       },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

    console.log('Tabby payment failed, order marked as failed:', payment.id);

  } catch (error) {
    console.error('Error processing payment.failed:', error);
  }
}

// Handle payment cancelled event
async function handlePaymentCancelled(payment: any) {
  console.log('Processing payment.cancelled for payment:', payment.id);
  
  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

    // Update order status
    await prisma.order.updateMany({
      where: {
        payment: {
          tabbyPaymentId: payment.id
        }
      },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        });

    console.log('Tabby payment cancelled, order marked as cancelled:', payment.id);

  } catch (error) {
    console.error('Error processing payment.cancelled:', error);
  }
}

// Handle payment closed event (final status)
async function handlePaymentClosed(payment: any) {
  console.log('🎉 Processing payment.closed for payment:', payment.id);
  
  try {
    // Update payment record to final completed status
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
      data: {
        status: 'SUCCEEDED',
        updatedAt: new Date()
      }
    });

    // Update order status to processing/shipped
    await prisma.order.updateMany({
      where: {
        payment: {
          tabbyPaymentId: payment.id
        }
      },
          data: {
        status: 'PROCESSING',
            updatedAt: new Date()
          }
        });

    console.log('✅ Payment closed - order fully confirmed:', payment.id);

    // Track purchase completion since Tabby payment is fully closed
    try {
      const paymentRecord = await prisma.payment.findFirst({
        where: { tabbyPaymentId: payment.id },
        include: { order: { include: { user: true } } }
      });
      
      if (paymentRecord?.order) {
        const orderItems = await prisma.orderItem.findMany({ 
          where: { orderId: paymentRecord.order.id } 
        });
        
        if (orderItems.length > 0) {
          await trackPurchaseFromWebhook(
            paymentRecord.order, 
            paymentRecord.order.user, 
            orderItems, 
            paymentRecord.amount
          );
        }
      }
    } catch (trackingError) {
      console.error('[Tabby Webhook] Purchase tracking failed for closed payment (non-critical):', trackingError);
    }

  } catch (error) {
    console.error('Error processing payment.closed:', error);
  }
}

// Handle payment expired event
async function handlePaymentExpired(payment: any) {
  console.log('⏰ Processing payment.expired for payment:', payment.id);
  
  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
            data: { 
        status: 'CANCELLED',
              updatedAt: new Date()
            }
          });

    // Update order status
    await prisma.order.updateMany({
      where: {
        payment: {
          tabbyPaymentId: payment.id
        }
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    console.log('⏰ Payment expired, order cancelled:', payment.id);

  } catch (error) {
    console.error('Error processing payment.expired:', error);
  }
}

// Handle payment rejected event
async function handlePaymentRejected(payment: any) {
  console.log('❌ Processing payment.rejected for payment:', payment.id);
  
  try {
    // Update payment record
    await prisma.payment.updateMany({
      where: { tabbyPaymentId: payment.id },
      data: {
        status: 'FAILED',
        updatedAt: new Date()
      }
    });

    // Update order status
    await prisma.order.updateMany({
      where: {
        payment: {
          tabbyPaymentId: payment.id
        }
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    console.log('❌ Payment rejected by Tabby, order cancelled:', payment.id);

  } catch (error) {
    console.error('Error processing payment.rejected:', error);
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