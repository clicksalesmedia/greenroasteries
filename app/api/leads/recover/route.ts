import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/leads/recover - Recover and process abandoned leads
 * 
 * This endpoint helps recover leads that reached payment step but didn't complete.
 * Useful for webhook failures or payment processing issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, paymentId, action = 'convert' } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the lead
    const lead = await prisma.customerLead.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (action === 'convert' && lead.cartItems) {
      // Create order from lead data for failed webhook scenarios
      console.log('🔄 Recovering order from lead data:', lead.id);
      
      const cartItems = Array.isArray(lead.cartItems) 
        ? lead.cartItems 
        : JSON.parse(lead.cartItems as string);
      
      if (!cartItems || cartItems.length === 0) {
        return NextResponse.json(
          { error: 'No cart items found in lead' },
          { status: 400 }
        );
      }

      // Check if user exists, create if not
      let user = await prisma.user.findUnique({
        where: { email: lead.email }
      });

      if (!user) {
        // Create user from lead data
        const bcrypt = await import('bcryptjs');
        const temporaryPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        user = await prisma.user.create({
          data: {
            email: lead.email,
            name: lead.fullName,
            phone: lead.phone || '',
            city: lead.city || 'Dubai',
            address: lead.address || '',
            password: hashedPassword,
            role: 'CUSTOMER',
            isNewCustomer: true,
            emailVerified: false,
          }
        });
        
        console.log('✅ User created from lead:', user.email);
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.total || item.price * item.quantity), 0);
      const tax = subtotal * 0.05; // 5% tax
      const shippingCost = 0; // Free shipping
      const total = subtotal + tax + shippingCost;

      // Create order in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            userId: user.id,
            customerName: lead.fullName,
            customerEmail: lead.email,
            customerPhone: lead.phone || '',
            city: lead.city || 'Dubai',
            shippingAddress: lead.address || '',
            subtotal: subtotal,
            tax: tax,
            shippingCost: shippingCost,
            discount: 0,
            total: total,
            status: 'PROCESSING',
            paymentMethod: lead.preferredPayment || 'unknown',
            appliedPromoId: null,
            items: {
              create: cartItems.map((item: any) => ({
                productId: item.id || item.productId,
                variationId: item.variationId || null,
                quantity: item.quantity || 1,
                unitPrice: item.price || item.unitPrice || 0,
                subtotal: item.total || (item.price * item.quantity) || 0
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true,
                variation: {
                  include: {
                    size: true,
                    type: true,
                    beans: true
                  }
                }
              }
            }
          }
        });

        // Create payment record if paymentId provided
        if (paymentId) {
          await tx.payment.create({
            data: {
              orderId: order.id,
              userId: user.id,
              tabbyPaymentId: paymentId,
              amount: total,
              currency: 'aed',
              status: 'PROCESSING',
              paymentProvider: 'TABBY',
              paymentMethod: 'tabby',
            }
          });
        }

        // Convert lead
        await tx.customerLead.update({
          where: { id: lead.id },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            convertedUserId: user.id
          }
        });

        return { order, user };
      });

      console.log('✅ Order recovered from lead:', result.order.id);
      
      return NextResponse.json({
        success: true,
        message: 'Order recovered successfully',
        orderId: result.order.id,
        leadId: lead.id,
        cartValue: lead.cartValue,
        recoveredItems: cartItems.length
      });
      
    } else if (action === 'abandon') {
      // Mark lead as abandoned
      await prisma.customerLead.update({
        where: { id: lead.id },
        data: {
          status: 'ABANDONED',
          notes: `Marked as abandoned on ${new Date().toISOString()}`
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Lead marked as abandoned',
        leadId: lead.id
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing cart data' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Lead recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to recover lead' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/recover - Find recoverable leads
 * 
 * Returns leads that reached payment step but haven't converted
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '7');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Find qualified leads that haven't converted
    const recoverableLeads = await prisma.customerLead.findMany({
      where: {
        status: 'QUALIFIED',
        hasPaymentInfo: true,
        cartValue: { gt: 0 },
        createdAt: { gte: cutoffDate }
      },
      orderBy: { cartValue: 'desc' },
      take: limit,
      include: {
        convertedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Calculate potential revenue
    const totalPotentialRevenue = recoverableLeads.reduce(
      (sum, lead) => sum + (lead.cartValue || 0), 
      0
    );
    
    return NextResponse.json({
      success: true,
      leads: recoverableLeads,
      stats: {
        count: recoverableLeads.length,
        totalPotentialRevenue: totalPotentialRevenue,
        averageCartValue: recoverableLeads.length > 0 
          ? totalPotentialRevenue / recoverableLeads.length 
          : 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching recoverable leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recoverable leads' },
      { status: 500 }
    );
  }
}