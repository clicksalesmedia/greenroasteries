import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to check authentication
async function checkAuth(requiredRoles = ['ADMIN', 'MANAGER']) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    try {
      // Verify token using jose
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secretKey);
      
      // Check if user has required role
      if (!requiredRoles.includes(payload.role as string)) {
        return { authorized: false, error: 'Forbidden', status: 403 };
      }

      return { authorized: true, userId: payload.id, role: payload.role };
    } catch (error) {
      console.error('Token verification error:', error);
      return { authorized: false, error: 'Unauthorized', status: 401 };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await context.params.then(p => p.id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            isActive: true,
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await context.params.then(p => p.id);
    const body = await request.json();
    
    // Check if the category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if slug is unique if it's being changed
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        slug: body.slug,
        imageUrl: body.imageUrl,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        parentId: body.parentId,
      }
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await checkAuth(['ADMIN', 'MANAGER']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await context.params.then(p => p.id);
    const body = await request.json();
    
    // Check if the category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if slug is unique if it's being changed
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        slug: body.slug,
        imageUrl: body.imageUrl,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        parentId: body.parentId,
      }
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    const id = await context.params.then(p => p.id);
    
    // Check if the category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if category has children or products
    if (existingCategory.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }
    
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      );
    }
    
    // Delete the category
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 