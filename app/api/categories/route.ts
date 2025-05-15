import { NextRequest, NextResponse } from 'next/server';
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

// Get all categories - PUBLIC ACCESS (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get the language from query params
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    
    const categories = await prisma.category.findMany({
      include: {
        children: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            imageUrl: true,
            isActive: true,
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      where: {
        parentId: null, // Get only top-level categories
        isActive: true  // Only return active categories for public view
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Transform the response based on language
    const localizedCategories = categories.map(category => {
      // For Arabic language, use nameAr if available, otherwise fallback to name
      const displayName = lang === 'ar' && category.nameAr ? category.nameAr : category.name;
      
      // Also transform child categories if present
      const children = category.children.map(child => {
        const childDisplayName = lang === 'ar' && child.nameAr ? child.nameAr : child.name;
        return {
          ...child,
          name: childDisplayName
        };
      });
      
      return {
        ...category,
        name: displayName,
        children
      };
    });
    
    return NextResponse.json(localizedCategories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Create a new category (requires ADMIN or MANAGER role)
export async function POST(request: NextRequest) {
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
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    // Check if slug is unique
    const existingCategory = await prisma.category.findUnique({
      where: { slug: body.slug }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Create the category
    const category = await prisma.category.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || '',
        description: body.description,
        descriptionAr: body.descriptionAr || '',
        slug: body.slug,
        imageUrl: body.imageUrl,
        isActive: body.isActive ?? true,
        parentId: body.parentId || null,
      }
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
} 