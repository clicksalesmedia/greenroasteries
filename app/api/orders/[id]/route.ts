import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const orderId = params.id;

    // Validate status
    const validStatuses = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete in transaction to maintain data integrity
    await prisma.$transaction(async (tx) => {
      // Delete order items first (due to foreign key constraints)
      await tx.orderItem.deleteMany({
        where: { orderId }
      });

      // Delete payment records
      await tx.payment.deleteMany({
        where: { orderId }
      });

      // Finally delete the order
      await tx.order.delete({
        where: { id: orderId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting order:', error);
    
    // Check for foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete order due to related records. Please contact administrator.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// Get individual order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                imageUrl: true
              }
            }
          }
        },
        payment: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
} 