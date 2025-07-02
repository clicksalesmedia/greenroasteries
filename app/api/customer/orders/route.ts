import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch customer orders with items and product details
    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      include: {
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
        payment: {
          select: {
            status: true,
            paymentMethod: true,
            last4: true,
            brand: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Customer orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 