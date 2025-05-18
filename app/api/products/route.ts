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
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const featured = searchParams.get('featured') === 'true';
    
    console.log(`API Request: /api/products with params:`, { 
      categoryId, category, inStock, search, limit, featured 
    });
    
    const filters: any = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    // Filter by category name
    if (category) {
      filters.category = {
        OR: [
          { name: { equals: category, mode: 'insensitive' } },
          { nameAr: { equals: category, mode: 'insensitive' } }
        ]
      };
    }
    
    if (inStock === 'true') {
      filters.inStock = true;
    } else if (inStock === 'false') {
      filters.inStock = false;
    }
    
    if (featured) {
      // Since there's no 'featured' field in the Product model,
      // we'll use a workaround to get featured products
      // For example, we can select products with specific categories or properties
      
      // Option 1: Get products from specific categories that you consider "featured"
      const featuredCategories = ['Coffee Beans', 'Premium', 'Specialty']; // Adjust based on your categories
      filters.OR = filters.OR || [];
      filters.OR.push({
        category: {
          name: {
            in: featuredCategories,
            mode: 'insensitive'
          }
        }
      });
      
      // Option 2: Get products with high stock priority or certain characteristics
      // Example: products that are in stock and have images
      filters.OR.push({
        AND: [
          { inStock: true },
          { images: { some: {} } }, // Has at least one image
          { stockQuantity: { gt: 0 } } // Has stock available
        ]
      });
    }
    
    // Comprehensive search across multiple fields
    if (search && search.trim() !== '') {
      filters.OR = [
        // Search in product name and description (both English and Arabic)
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        
        // Search by category
        { category: { 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }
    
    // Query with filtering, include related data
    console.log('Executing prisma query with filters:', JSON.stringify(filters, null, 2));
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
          },
        },
        images: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      ...(limit ? { take: limit } : {})
    });
    
    console.log(`Found ${products.length} products`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { error: 'Failed to fetch products', details: errorMessage },
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