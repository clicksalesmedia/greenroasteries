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

// Get a specific promotion by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true
          }
        },
        orders: true,
        _count: {
          select: { 
            products: true,
            orders: true
          }
        }
      }
    });
    
    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Failed to fetch promotion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion' },
      { status: 500 }
    );
  }
}

// Update a promotion (requires ADMIN or MANAGER role)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Check if promotion exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id }
    });
    
    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    // Check if code is unique if provided and different from current
    if (body.code && body.code !== existingPromotion.code) {
      const codeExists = await prisma.promotion.findUnique({
        where: { code: body.code }
      });
      
      if (codeExists) {
        return NextResponse.json(
          { error: 'A promotion with this code already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = parseFloat(body.value) || 0;
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount ? parseFloat(body.minOrderAmount) : null;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
    if (body.currentUses !== undefined) updateData.currentUses = parseInt(body.currentUses) || 0;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    
    // Update the promotion
    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: {
            product: true
          }
        },
        _count: {
          select: { 
            products: true,
            orders: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedPromotion);
  } catch (error) {
    console.error('Failed to update promotion:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion' },
      { status: 500 }
    );
  }
}

// Delete a promotion (requires ADMIN or MANAGER role)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const { id } = params;
    
    // Check if promotion exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            orders: true
          }
        }
      }
    });
    
    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    // Check if promotion has been used in orders
    if (existingPromotion._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete promotion that has been used in orders. Consider deactivating it instead.' },
        { status: 400 }
      );
    }
    
    // Delete related product promotions first
    await prisma.productPromotion.deleteMany({
      where: { promotionId: id }
    });
    
    // Delete the promotion
    await prisma.promotion.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Failed to delete promotion:', error);
    return NextResponse.json(
      { error: 'Failed to delete promotion' },
      { status: 500 }
    );
  }
} 