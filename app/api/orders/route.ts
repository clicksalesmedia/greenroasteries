import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { stripe } from '@/lib/stripe';
import { emailService } from '@/lib/email';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Type definitions for stock management
interface OrderItemData {
  productId: string;
  variationId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface StockUpdate {
  type: 'variation' | 'product';
  id: string;
  currentStock: number;
  reduceBy: number;
}

// Generate random password
function generatePassword(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const {
      customerInfo,
      shippingInfo,
      items,
      totalAmount,
      paymentIntentId,
      subtotal,
      tax,
      shippingCost,
      discount = 0
    } = await request.json();

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: customerInfo.email }
    });

    let isNewCustomer = false;
    let temporaryPassword = '';

    // Create user if doesn't exist
    if (!user) {
      isNewCustomer = true;
      temporaryPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      user = await prisma.user.create({
        data: {
          email: customerInfo.email,
          name: customerInfo.fullName,
          phone: customerInfo.phone,
          city: shippingInfo.city,
          address: shippingInfo.address,
          password: hashedPassword,
          role: 'CUSTOMER',
          isNewCustomer: true,
          emailVerified: false,
        }
      });
    } else {
      // Update existing user's new customer status
      await prisma.user.update({
        where: { id: user.id },
        data: { isNewCustomer: false }
      });
    }

    // Validate that all products exist and check stock availability
    const productIds = items.map((item: any) => item.productId || item.id);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        variations: {
          include: {
            size: true,
            type: true,
            beans: true
          }
        }
      }
    });

    if (existingProducts.length !== productIds.length) {
      const missingIds = productIds.filter((id: string) => !existingProducts.find(p => p.id === id));
      console.error('Missing product IDs:', missingIds);
      console.error('Cart items:', items);
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare order items and check stock
    const orderItems: OrderItemData[] = [];
    const stockUpdates: StockUpdate[] = [];

    for (const item of items) {
      const productId = item.productId || item.id;
      const product = existingProducts.find(p => p.id === productId);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 400 }
        );
      }

      // Extract variation ID from cart item - FIXED VERSION
      let variationId: string | null = null;
      if (item.id && item.id.includes('-')) {
        const parts = item.id.split('-');
        
        // New logic: Check if this is a properly formatted variation ID
        // Cart items should be in format: productId-variationId
        // Where variationId is a UUID (36 characters with dashes)
        if (parts.length >= 2) {
          // Join all parts except the first (product ID)
          const possibleVariationId = parts.slice(1).join('-');
          
          // Check if it looks like a UUID (8-4-4-4-12 format)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (uuidRegex.test(possibleVariationId)) {
            variationId = possibleVariationId;
          } else {
            // If it doesn't look like a UUID, it might be a timestamp-based ID
            // In this case, we need to find the variation by matching other criteria
            console.warn(`Malformed variation ID detected: ${possibleVariationId}. Attempting to find matching variation.`);
            
            // Try to find the variation by checking if the item has variation data
            if (item.variation) {
              // Find variation by matching size (weight), beans, type (additions)
              const matchingVariation = product.variations.find(v => {
                const size = v.size?.displayName || v.size?.name;
                const beans = v.beans?.name;
                const type = v.type?.name;
                
                return (
                  (!item.variation.weight || size === item.variation.weight) &&
                  (!item.variation.beans || beans === item.variation.beans) &&
                  (!item.variation.additions || type === item.variation.additions)
                );
              });
              
              if (matchingVariation) {
                variationId = matchingVariation.id;
                console.log(`Found matching variation: ${variationId} for malformed ID: ${possibleVariationId}`);
              }
            }
          }
        }
      }

      // Check if variation exists if variationId is provided
      let variation = null;
      if (variationId) {
        variation = product.variations.find(v => v.id === variationId);
        if (!variation) {
          // CRITICAL FIX: Instead of failing the order, log the error and continue without variation
          console.error(`Variation ${variationId} not found for product ${product.name}. Processing order without variation to prevent payment loss.`);
          
          // Log detailed info for debugging
          console.error('Available variations:', product.variations.map(v => ({ id: v.id, size: v.size?.displayName, beans: v.beans?.name, type: v.type?.name })));
          console.error('Cart item:', { id: item.id, variation: item.variation });
          
          // Clear variationId to process as regular product
          variationId = null;
        }
      }

      // Check stock availability
      const requestedQuantity = item.quantity;
      let availableStock = 0;
      
      if (variation) {
        // Check variation stock
        availableStock = variation.stockQuantity || 0;
        
        if (availableStock < requestedQuantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedQuantity}` },
            { status: 400 }
          );
        }

        // Prepare variation stock update
        stockUpdates.push({
          type: 'variation',
          id: variation.id,
          currentStock: availableStock,
          reduceBy: requestedQuantity
        });
      } else {
        // Check main product stock
        availableStock = product.stockQuantity || 0;
        
        if (availableStock < requestedQuantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedQuantity}` },
            { status: 400 }
          );
        }

        // Prepare product stock update
        stockUpdates.push({
          type: 'product',
          id: product.id,
          currentStock: availableStock,
          reduceBy: requestedQuantity
        });
      }

      orderItems.push({
        productId: productId,
        variationId: variationId,
        quantity: requestedQuantity,
        unitPrice: item.price,
        subtotal: item.price * requestedQuantity
      });
    }

    // Create order and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          customerName: customerInfo.fullName,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          city: shippingInfo.city,
          shippingAddress: shippingInfo.address,
          subtotal,
          tax,
          shippingCost,
          discount,
          total: totalAmount,
          status: 'PROCESSING',
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntentId,
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update stock quantities
      for (const stockUpdate of stockUpdates) {
        const newStock = stockUpdate.currentStock - stockUpdate.reduceBy;
        
        if (stockUpdate.type === 'variation') {
          await tx.productVariation.update({
            where: { id: stockUpdate.id },
            data: { stockQuantity: newStock }
          });
        } else {
          await tx.product.update({
            where: { id: stockUpdate.id },
            data: { stockQuantity: newStock }
          });
        }
      }

      return order;
    });

    // Create payment record
    const charge = paymentIntent.latest_charge;
    let paymentMethodDetails = null;
    
    if (typeof charge === 'string') {
      const chargeObj = await stripe.charges.retrieve(charge);
      paymentMethodDetails = chargeObj.payment_method_details;
    } else if (charge && typeof charge === 'object') {
      paymentMethodDetails = charge.payment_method_details;
    }

    await prisma.payment.create({
      data: {
        orderId: result.id,
        userId: user.id,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: typeof charge === 'string' ? charge : charge?.id,
        amount: totalAmount,
        currency: 'aed',
        status: 'SUCCEEDED',
        paymentMethod: paymentMethodDetails?.card?.brand || 'card',
        last4: paymentMethodDetails?.card?.last4,
        brand: paymentMethodDetails?.card?.brand,
        receiptUrl: typeof charge === 'string' ? undefined : charge?.receipt_url,
      }
    });

    // Send appropriate email
    try {
      if (isNewCustomer) {
        await emailService.sendWelcomeEmail({
          customerName: customerInfo.fullName,
          email: customerInfo.email,
          password: temporaryPassword,
          orderId: result.id
        });
      } else {
        await emailService.sendThankYouEmail({
          customerName: customerInfo.fullName,
          email: customerInfo.email,
          orderId: result.id,
          orderTotal: totalAmount,
          items: result.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice
          }))
        });
      }

      // Mark email as sent
      await prisma.order.update({
        where: { id: result.id },
        data: { emailSent: true }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: result.id,
      isNewCustomer,
      message: isNewCustomer 
        ? 'Order created successfully! Check your email for account credentials.'
        : 'Order created successfully! Thank you for your purchase.',
      stockUpdated: stockUpdates.length
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid product reference. Please refresh your cart and try again.' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate order detected. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              city: true,
              address: true,
              isNewCustomer: true,
              emailVerified: true,
              lastLoginAt: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  imageUrl: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      nameAr: true
                    }
                  },
                  variations: {
                    include: {
                      size: true,
                      type: true,
                      beans: true
                    },
                    where: {
                      isActive: true
                    },
                    take: 1 // Get the first active variation as fallback
                  }
                }
              },
              variation: {
                include: {
                  size: true,
                  type: true,
                  beans: true
                }
              }
            }
          },
          payment: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    // Enhance orders with fallback variation data
    const enhancedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        // If no variation is linked but product has variations, use the first one as fallback
        variation: item.variation || (item.product.variations && item.product.variations.length > 0 ? {
          id: item.product.variations[0].id,
          size: item.product.variations[0].size,
          type: item.product.variations[0].type,
          beans: item.product.variations[0].beans,
          price: item.product.variations[0].price,
          stockQuantity: item.product.variations[0].stockQuantity
        } : null),
        product: {
          ...item.product,
          variations: undefined // Remove variations from product to avoid redundancy
        }
      }))
    }));

    return NextResponse.json({
      orders: enhancedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 