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
async function checkAuth(requiredRoles = ['ADMIN', 'MANAGER']) {
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

// Get all promotions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const filters: any = {};
    
    if (activeOnly) {
      filters.isActive = true;
      filters.startDate = { lte: new Date() };
      filters.endDate = { gte: new Date() };
    }
    
    const promotions = await prisma.promotion.findMany({
      where: filters,
      include: {
        _count: {
          select: { 
            products: true,
            orders: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      }
    });
    
    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

// Create a new promotion (requires ADMIN or MANAGER role)
export async function POST(request: Request) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Name, type, start date, and end date are required' },
        { status: 400 }
      );
    }
    
    // Check if code is unique if provided
    if (body.code) {
      const existingPromotion = await prisma.promotion.findUnique({
        where: { code: body.code }
      });
      
      if (existingPromotion) {
        return NextResponse.json(
          { error: 'A promotion with this code already exists' },
          { status: 400 }
        );
      }
    }
    
    // Create the promotion
    const promotion = await prisma.promotion.create({
      data: {
        name: body.name,
        description: body.description,
        code: body.code,
        type: body.type,
        value: parseFloat(body.value) || 0,
        minOrderAmount: body.minOrderAmount ? parseFloat(body.minOrderAmount) : null,
        maxUses: body.maxUses ? parseInt(body.maxUses) : null,
        currentUses: 0,
        isActive: body.isActive ?? true,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        products: body.productIds ? {
          create: body.productIds.map((productId: string) => ({
            product: {
              connect: { id: productId }
            }
          }))
        } : undefined
      }
    });
    
    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Failed to create promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  }
} 