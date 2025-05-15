import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';
import { hash } from 'bcrypt';

// Get all users (admin only)
export async function GET() {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create a new user (admin only)
export async function POST(request: Request) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const body = await request.json();
    
    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(body.password, 10);
    
    // Create the user and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
          role: body.role || 'TEAM',
          isActive: body.isActive ?? true,
          address: body.address,
          phone: body.phone
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          address: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Create permissions if provided
      if (body.permissions && Array.isArray(body.permissions)) {
        const permissions = await Promise.all(
          body.permissions.map((permission: any) => 
            tx.permission.create({
              data: {
                userId: user.id,
                module: permission.module,
                canView: permission.canView,
                canCreate: permission.canCreate,
                canEdit: permission.canEdit,
                canDelete: permission.canDelete
              }
            })
          )
        );
        
        return { user, permissions };
      }
      
      return { user, permissions: [] };
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 