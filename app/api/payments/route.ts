import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { stripe } from '@/lib/stripe';
import { tabbyService } from '@/app/lib/tabby';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { stripePaymentIntentId: { contains: search, mode: 'insensitive' } },
        { stripeChargeId: { contains: search, mode: 'insensitive' } },
        { order: { 
          OR: [
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              customerEmail: true,
              status: true,
              total: true,
              createdAt: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, paymentId, amount } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'refund':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Valid refund amount is required' },
            { status: 400 }
          );
        }

        if (amount > (payment.amount - (payment.refundedAmount || 0))) {
          return NextResponse.json(
            { error: 'Refund amount exceeds available amount' },
            { status: 400 }
          );
        }

        try {
          let refundResult;
          
          // Handle refund based on payment provider
          if (payment.paymentProvider === 'STRIPE' && payment.stripePaymentIntentId) {
            // Create refund in Stripe
            refundResult = await stripe.refunds.create({
              payment_intent: payment.stripePaymentIntentId,
              amount: Math.round(amount * 100), // Convert to cents
              reason: 'requested_by_customer'
            });
          } else if (payment.paymentProvider === 'TABBY' && payment.tabbyPaymentId) {
            // Create refund in Tabby
            refundResult = await tabbyService.refundPayment(
              payment.tabbyPaymentId, 
              amount,
              'requested_by_customer'
            );
          } else {
            return NextResponse.json(
              { error: 'Invalid payment provider or missing payment ID' },
              { status: 400 }
            );
          }

          // Update payment record
          const newRefundedAmount = (payment.refundedAmount || 0) + amount;
          const newStatus = newRefundedAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              refundedAmount: newRefundedAmount,
              status: newStatus,
              updatedAt: new Date()
            }
          });

          // Update order status if fully refunded
          if (newStatus === 'REFUNDED') {
            await prisma.order.update({
              where: { id: payment.orderId },
              data: { status: 'REFUNDED' }
            });
          }

          return NextResponse.json({
            success: true,
            refund: {
              id: refundResult.id,
              amount: amount,
              status: refundResult.status || 'processed'
            },
            message: `Refund of ${amount} AED processed successfully via ${payment.paymentProvider}`
          });

        } catch (providerError: any) {
          console.error(`${payment.paymentProvider} refund error:`, providerError);
          return NextResponse.json(
            { error: `Refund failed: ${providerError.message}` },
            { status: 400 }
          );
        }

      case 'capture':
        // For payments that were authorized but not captured
        try {
          const paymentIntent = await stripe.paymentIntents.capture(
            payment.stripePaymentIntentId
          );

          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'SUCCEEDED',
              updatedAt: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Payment captured successfully'
          });

        } catch (stripeError: any) {
          console.error('Stripe capture error:', stripeError);
          return NextResponse.json(
            { error: `Capture failed: ${stripeError.message}` },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing payment action:', error);
    return NextResponse.json(
      { error: 'Failed to process payment action' },
      { status: 500 }
    );
  }
}

// Get payment statistics
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        refundedPayments,
        totalRevenue,
        totalRefunded
      ] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.payment.count({ where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
        prisma.payment.aggregate({
          where: { status: 'SUCCEEDED' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
          _sum: { refundedAmount: true }
        })
      ]);

      // Get monthly revenue for the last 12 months
      const monthlyRevenueRaw = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM "Payment"
        WHERE status = 'SUCCEEDED'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `;

      // Convert BigInt values to numbers
      const monthlyRevenue = (monthlyRevenueRaw as any[]).map(row => ({
        month: row.month,
        revenue: Number(row.revenue) || 0,
        transactions: Number(row.transactions) || 0
      }));

      // Convert BigInt values to numbers for stats
      const revenueSum = totalRevenue._sum.amount;
      const refundedSum = totalRefunded._sum.refundedAmount;

      return NextResponse.json({
        stats: {
          totalPayments: Number(totalPayments),
          successfulPayments: Number(successfulPayments),
          failedPayments: Number(failedPayments),
          refundedPayments: Number(refundedPayments),
          totalRevenue: revenueSum ? Number(revenueSum) : 0,
          totalRefunded: refundedSum ? Number(refundedSum) : 0,
          successRate: totalPayments > 0 ? (successfulPayments / totalPayments * 100).toFixed(2) : 0
        },
        monthlyRevenue
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
} 