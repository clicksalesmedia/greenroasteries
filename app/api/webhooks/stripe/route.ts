import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@/app/generated/prisma';
import { emailService } from '@/lib/email';
import FacebookCapiService, { 
  type FacebookCapiUserData, 
  type FacebookCapiOrderData, 
  type FacebookCapiProduct 
} from '@/app/lib/facebook-capi';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to track purchase events from webhooks using enhanced Facebook CAPI
async function trackPurchaseFromWebhook(order: any, user: any, orderItems: any[], total: number) {
  try {
    console.log(`[Stripe Webhook] Starting enhanced Facebook CAPI tracking for order ${order.id}, total: ${total}`);
    
    // Get actual product data for better tracking
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: orderItems.map(item => item.productId)
        }
      },
      include: {
        category: true // Include category data
      }
    });

    // Convert to FacebookCapiUserData format
    const userData: FacebookCapiUserData = {
      email: user.email,
      phone: user.phone,
      firstName: user.name?.split(' ')[0] || undefined,
      lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
      city: order.city || undefined,
      country: 'AE',
      externalId: user.id,
      // Add server-side data
      clientIpAddress: '127.0.0.1', // Would be better to get from request
      clientUserAgent: 'Server-Side-Webhook'
    };

    // Convert to FacebookCapiProduct format with real product data
    const productData: FacebookCapiProduct[] = orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Coffee Product',
        price: item.unitPrice,
        quantity: item.quantity,
        category: product?.category?.name || 'Coffee',
        brand: 'Green Roasteries',
        description: product?.description || product?.name || 'Coffee Product'
      };
    });

    // Convert to FacebookCapiOrderData format
    const orderData: FacebookCapiOrderData = {
      orderId: order.id,
      total: total,
      subtotal: order.subtotal || total * 0.85,
      tax: order.tax || total * 0.05,
      shippingCost: order.shippingCost || 0,
      discount: order.discount || 0,
      currency: 'AED',
      items: productData,
      paymentMethod: 'stripe',
      isNewCustomer: user.isNewCustomer || false
    };

    // Track purchase with enhanced Facebook CAPI
    await FacebookCapiService.trackPurchase(orderData, userData, 'stripe');

    // Also track with Google Analytics (existing implementation)
    const ga4MeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const ga4ApiSecret = process.env.GA4_API_SECRET;
    
    if (ga4MeasurementId && ga4ApiSecret) {
      try {
        const ga4Response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4ApiSecret}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: 'webhook_stripe_' + Date.now(),
            events: [{
              name: 'purchase',
              params: {
                transaction_id: order.id,
                value: total,
                currency: 'AED',
                items: orderItems.map(item => ({
                  item_id: item.productId,
                  item_name: 'Coffee Product',
                  item_category: 'Coffee',
                  quantity: item.quantity,
                  price: item.unitPrice
                }))
              }
            }]
          })
        });
        
        if (ga4Response.ok) {
          console.log(`[Stripe Webhook] GA4 tracking successful`);
        } else {
          console.error(`[Stripe Webhook] GA4 tracking failed:`, ga4Response.status);
        }
      } catch (gaError) {
        console.error(`[Stripe Webhook] Google Analytics tracking error:`, gaError);
      }
    }

    console.log(`[Stripe Webhook] Enhanced purchase tracking completed for order ${order.id}`);
  } catch (error) {
    console.error('[Stripe Webhook] Enhanced purchase tracking error:', error);
    // Don't re-throw - this is non-critical and shouldn't break webhook processing
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Log webhook receipt
  console.log(`[Stripe Webhook] Received webhook at ${new Date().toISOString()}`);

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
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
    console.error('[Stripe Webhook] Signature verification failed:', error.message);
    console.error('[Stripe Webhook] Webhook secret might be misconfigured');
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} - ID: ${event.id}`);
  
  // Log payment intent details for succeeded events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    console.log(`[Stripe Webhook] Payment succeeded - ID: ${paymentIntent.id}, Amount: ${paymentIntent.amount/100} ${paymentIntent.currency}, Customer: ${paymentIntent.metadata?.customerEmail || 'unknown'}`);
  }

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

      case 'payment_intent.created':
        console.log(`[Stripe Webhook] Payment intent created: ${event.data.object.id} - Amount: ${event.data.object.amount/100} ${event.data.object.currency}`);
        break;

      case 'payment_intent.processing':
        console.log(`[Stripe Webhook] Payment intent processing: ${event.data.object.id}`);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

export async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    console.log(`[Stripe Webhook] Processing payment_intent.succeeded for ${paymentIntent.id}`);
    console.log(`[Stripe Webhook] Payment details - Amount: ${paymentIntent.amount/100} ${paymentIntent.currency}, Customer: ${paymentIntent.metadata?.customerEmail || 'unknown'}`);
    
    // First, check if payment record already exists
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true }
    });

    if (payment && payment.order) {
      // Order already exists, just update status
      console.log(`Order already exists for payment ${paymentIntent.id}, updating status`);
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          updatedAt: new Date()
        }
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date()
        }
      });

      // Track purchase completion for existing order since payment is now confirmed
      try {
        const user = await prisma.user.findUnique({ where: { id: payment.order.userId } });
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: payment.order.id } });
        if (user && orderItems.length > 0) {
          await trackPurchaseFromWebhook(payment.order, user, orderItems, payment.amount);
        }
      } catch (trackingError) {
        console.error('[Stripe Webhook] Purchase tracking failed for existing order (non-critical):', trackingError);
      }
    } else {
      // Payment/Order doesn't exist - this is the race condition case
      // We need to create the order from the payment intent metadata
      console.log(`No order found for payment ${paymentIntent.id}, creating from webhook...`);
      
      const metadata = paymentIntent.metadata;
      const customerEmail = metadata.customerEmail;
      const customerName = metadata.customerName;
      const customerPhone = metadata.customerPhone || '';
      const shippingCity = metadata.shippingCity || 'Dubai';
      const shippingAddress = metadata.shippingAddress || '';
      
      // Parse order details from metadata
      const subtotal = parseFloat(metadata.subtotal || '0');
      const tax = parseFloat(metadata.tax || '0');
      const shippingCost = parseFloat(metadata.shippingCost || '0');
      const discount = parseFloat(metadata.discount || '0');
      const total = parseFloat(metadata.total || String(paymentIntent.amount / 100));

      if (!customerEmail || !customerName) {
        console.error(`Missing customer data in payment intent ${paymentIntent.id}`);
        return;
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: customerEmail }
      });

      // Create user if doesn't exist
      if (!user) {
        console.log(`Creating new user for ${customerEmail}`);
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
            city: shippingCity,
            address: shippingAddress,
            password: hashedPassword,
            role: 'CUSTOMER',
            isNewCustomer: true,
            emailVerified: false,
          }
        });

        // Add new customer to Brevo automatically (non-blocking)
        try {
          await emailService.addCustomerToBrevo({
            email: user.email,
            name: user.name || 'Customer',
            phone: user.phone ? user.phone : undefined,
            city: user.city ? user.city : undefined,
            emirate: undefined, // Not available in webhook metadata
            totalSpent: 0,
            orderCount: 0,
            lastPurchaseDate: new Date()
          });
          console.log('✅ New customer from webhook added to Brevo:', user.email);
        } catch (brevoError) {
          // Don't fail the webhook if Brevo fails
          console.error('⚠️ Failed to add new webhook customer to Brevo (non-critical):', brevoError);
        }
      }

      // Parse order items from metadata
      const orderItems: Array<{
        productId: string;
        variationId: string | null;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];
      try {
        const itemsData = metadata.orderItems ? JSON.parse(metadata.orderItems) : [];
        console.log(`[Stripe Webhook] Parsed ${itemsData.length} items from metadata`);
        
        // Validate and prepare order items
        for (const item of itemsData) {
          // Check if product exists
          const product = await prisma.product.findUnique({
            where: { id: item.id }
          });
          
          if (product) {
            orderItems.push({
              productId: item.id,
              variationId: item.variationId || null,
              quantity: item.quantity || 1,
              unitPrice: item.price || 0,
              subtotal: (item.price || 0) * (item.quantity || 1)
            });
          } else {
            console.warn(`[Stripe Webhook] Product ${item.id} not found, skipping`);
          }
        }
      } catch (parseError) {
        console.error(`[Stripe Webhook] Error parsing order items:`, parseError);
        console.log(`[Stripe Webhook] Raw orderItems metadata:`, metadata.orderItems);
      }

      // If no valid items found, create a fallback order item
      if (orderItems.length === 0) {
        console.warn(`[Stripe Webhook] No valid items found, creating fallback order`);
      const defaultProduct = await prisma.product.findFirst({
        where: { inStock: true }
      });

      if (!defaultProduct) {
        console.error('No products available to create webhook order');
        return;
        }

        orderItems.push({
          productId: defaultProduct.id,
          variationId: null,
          quantity: 1,
          unitPrice: total,
          subtotal: total
        });
      }

      // Create order and payment in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the order
        const order = await tx.order.create({
          data: {
            userId: user.id,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            city: shippingCity,
            shippingAddress: shippingAddress,
            subtotal: subtotal || total * 0.9,
            tax: tax || total * 0.05,
            shippingCost: shippingCost || 0,
            discount: discount || 0,
            total: total,
            status: 'PROCESSING',
            paymentMethod: 'stripe',
            stripePaymentIntentId: paymentIntent.id,
            emailSent: false,
            items: {
              create: orderItems
            }
          }
        });

        // Get charge information
        const charges = await stripe.charges.list({
          payment_intent: paymentIntent.id,
          limit: 1
        });

        const charge = charges.data[0];
        const paymentMethodDetails = charge?.payment_method_details;

        // Create payment record
        const paymentRecord = await tx.payment.create({
          data: {
            orderId: order.id,
            userId: user.id,
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: charge?.id,
            amount: total,
            currency: 'aed',
            status: 'SUCCEEDED',
            paymentMethod: paymentMethodDetails?.card?.brand || 'card',
            last4: paymentMethodDetails?.card?.last4,
            brand: paymentMethodDetails?.card?.brand,
          }
        });

        return { order, payment: paymentRecord };
      });

      console.log(`✅ Created order ${result.order.id} from webhook for ${customerEmail}`);
      console.log(`[Stripe Webhook] Order details - Items: ${orderItems.length}, Subtotal: ${subtotal}, Tax: ${tax}, Shipping: ${shippingCost}, Total: ${total}`);
      
      // Track purchase completion since payment is confirmed
      try {
        await trackPurchaseFromWebhook(result.order, user, orderItems, total);
      } catch (trackingError) {
        // Don't fail webhook processing if tracking fails
        console.error('[Stripe Webhook] Purchase tracking failed (non-critical):', trackingError);
      }
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