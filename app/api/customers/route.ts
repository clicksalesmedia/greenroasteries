import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'CUSTOMER'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          city: true,
          address: true,
          isActive: true,
          isNewCustomer: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true
            }
          },
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // Last 5 orders
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Calculate customer statistics
    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
      const lastOrderDate = customer.orders.length > 0 ? customer.orders[0].createdAt : null;
      
      return {
        ...customer,
        totalSpent,
        lastOrderDate,
        totalOrders: customer._count.orders
      };
    });

    return NextResponse.json({
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive, emailVerified, name, phone, city, address } = body;

    const updatedCustomer = await prisma.user.update({
      where: { 
        id: customerId,
        role: 'CUSTOMER'
      },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(emailVerified !== undefined && { emailVerified }),
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        city: true,
        address: true,
        isActive: true,
        isNewCustomer: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if customer has orders
    const orderCount = await prisma.order.count({
      where: { userId: customerId }
    });

    if (orderCount > 0) {
      // Don't delete customers with orders, just deactivate them
      await prisma.user.update({
        where: { 
          id: customerId,
          role: 'CUSTOMER'
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deactivated (has existing orders)'
      });
    } else {
      // Delete customer if no orders
      await prisma.user.delete({
        where: { 
          id: customerId,
          role: 'CUSTOMER'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
} 