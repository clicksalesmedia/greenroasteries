import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { stripe } from '@/lib/stripe';
import { emailService } from '@/lib/email';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

    // Validate that all products exist
    const productIds = items.map((item: any) => item.productId || item.id);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: { id: true, name: true }
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

    // Create order
    const order = await prisma.order.create({
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
          create: items.map((item: any) => {
            // Extract variation ID from cart item
            // Cart items have ID format: ${productId}-${variationId}
            let variationId = null;
            
            if (item.id && item.id.includes('-')) {
              const parts = item.id.split('-');
              // If the ID has more than one part and the last part is not just a timestamp
              if (parts.length >= 2 && parts[parts.length - 1].length > 10) {
                variationId = parts.slice(1).join('-'); // Join back in case variation ID has dashes
              }
            }
            
            return {
              productId: item.productId || item.id,
              variationId: variationId,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: item.price * item.quantity
            };
          })
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
        orderId: order.id,
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
          orderId: order.id
        });
      } else {
        await emailService.sendThankYouEmail({
          customerName: customerInfo.fullName,
          email: customerInfo.email,
          orderId: order.id,
          orderTotal: totalAmount,
          items: order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice
          }))
        });
      }

      // Mark email as sent
      await prisma.order.update({
        where: { id: order.id },
        data: { emailSent: true }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      isNewCustomer,
      message: isNewCustomer 
        ? 'Order created successfully! Check your email for account credentials.'
        : 'Order created successfully! Thank you for your purchase.'
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