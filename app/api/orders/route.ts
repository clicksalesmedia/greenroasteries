import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Middleware to check authentication and permissions
async function checkAuth(requiredRoles = ['ADMIN', 'MANAGER', 'TEAM']) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    // Check if user has required role
    if (!requiredRoles.includes(decoded.role)) {
      return { authorized: false, error: 'Forbidden', status: 403 };
    }

    return { authorized: true, userId: decoded.id, role: decoded.role };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }
}

// Get all orders (staff members only)
export async function GET(request: Request) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER', 'TEAM']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (userId) {
      filters.userId = userId;
    }
    
    const orders = await prisma.order.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              }
            }
          }
        },
        appliedPromo: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            value: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.userId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'User ID and at least one item are required' },
        { status: 400 }
      );
    }
    
    // Check if products exist and are in stock
    const productIds = body.items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });
    
    // Check if all products exist and are in stock
    for (const item of body.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 400 }
        );
      }
      
      if (!product.inStock) {
        return NextResponse.json(
          { error: `Product "${product.name}" is out of stock` },
          { status: 400 }
        );
      }
      
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for product "${product.name}"` },
          { status: 400 }
        );
      }
    }
    
    // Check if promotion code is valid if provided
    let appliedPromotion = null;
    if (body.promoCode) {
      appliedPromotion = await prisma.promotion.findUnique({
        where: {
          code: body.promoCode,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });
      
      if (!appliedPromotion) {
        return NextResponse.json(
          { error: 'Invalid or expired promotion code' },
          { status: 400 }
        );
      }
      
      if (appliedPromotion.maxUses && appliedPromotion.currentUses >= appliedPromotion.maxUses) {
        return NextResponse.json(
          { error: 'Promotion code has reached its usage limit' },
          { status: 400 }
        );
      }
    }
    
    // Calculate order totals
    const orderItems = body.items.map((item: any) => {
      const product = products.find(p => p.id === item.productId)!;
      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal
      };
    });
    
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const tax = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
    const shippingCost = body.shippingCost || 10; // Default shipping cost
    
    // Calculate discount if promotion is applied
    let discount = 0;
    if (appliedPromotion) {
      if (appliedPromotion.type === 'PERCENTAGE') {
        discount = parseFloat((subtotal * (appliedPromotion.value / 100)).toFixed(2));
      } else if (appliedPromotion.type === 'FIXED_AMOUNT') {
        discount = appliedPromotion.value;
      } else if (appliedPromotion.type === 'FREE_SHIPPING') {
        discount = shippingCost;
      }
      
      // Update promotion usage count
      await prisma.promotion.update({
        where: { id: appliedPromotion.id },
        data: { currentUses: { increment: 1 } }
      });
    }
    
    const total = subtotal + tax + shippingCost - discount;
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: body.userId,
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        status: 'NEW',
        paymentMethod: body.paymentMethod,
        paymentId: body.paymentId,
        shippingAddress: body.shippingAddress,
        notes: body.notes,
        appliedPromoId: appliedPromotion?.id,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        appliedPromo: true
      }
    });
    
    // Update product stock quantities
    for (const item of body.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity
          }
        }
      });
    }
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 