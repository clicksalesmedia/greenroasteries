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

// Get all products or filtered products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const inStock = searchParams.get('inStock');
    const query = searchParams.get('query');
    
    const filters: any = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (inStock === 'true') {
      filters.inStock = true;
    } else if (inStock === 'false') {
      filters.inStock = false;
    }
    
    if (query) {
      filters.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create a new product (requires ADMIN or MANAGER role)
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
    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Name, price and category are required' },
        { status: 400 }
      );
    }
    
    // Create the product with multilingual support
    const product = await prisma.product.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || '',
        description: body.description,
        descriptionAr: body.descriptionAr || '',
        price: parseFloat(body.price),
        imageUrl: body.imageUrl,
        categoryId: body.categoryId,
        origin: body.origin,
        inStock: body.inStock ?? true,
        stockQuantity: body.stockQuantity ?? 0,
        sku: body.sku,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    // Create variations if provided
    if (body.variations && Array.isArray(body.variations) && body.variations.length > 0) {
      for (const variation of body.variations) {
        // Basic validation
        if (!variation.sizeId || !variation.price) {
          console.warn('Skipping invalid variation', variation);
          continue;
        }
        
        // Get size information for SKU generation
        const size = await prisma.variationSize.findUnique({
          where: { id: variation.sizeId }
        });
        
        if (!size) {
          console.warn(`Size ${variation.sizeId} not found, skipping variation`);
          continue;
        }
        
        // Generate SKU if not provided
        let sku = variation.sku;
        if (!sku) {
          const sizeValue = size.value;
          const sizeCode = sizeValue >= 1000 ? `${sizeValue / 1000}KG` : `${sizeValue}G`;
          const productSku = product.sku || product.name.substring(0, 3).toUpperCase();
          const typeCode = variation.typeId ? '-T' : '';
          const beansCode = variation.beansId ? '-B' : '';
          sku = `${productSku}-${sizeCode}${typeCode}${beansCode}`;
        }
        
        // Create the variation
        await prisma.productVariation.create({
          data: {
            productId: product.id,
            sizeId: variation.sizeId,
            typeId: variation.typeId || null,
            beansId: variation.beansId || null,
            price: parseFloat(variation.price),
            sku,
            stockQuantity: variation.stockQuantity || 0,
            isActive: variation.isActive ?? true,
          }
        });
      }
    }
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 