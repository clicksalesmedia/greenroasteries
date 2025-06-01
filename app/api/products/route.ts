import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { withCache, invalidateCache } from '@/app/lib/cache';

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
    const discounted = searchParams.get('discounted') === 'true';
    
    console.log(`API Request: /api/products with params:`, { 
      categoryId, category, inStock, search, limit, featured, discounted 
    });
    
    // Create cache key based on parameters
    const cacheKey = `products-${JSON.stringify({ categoryId, category, inStock, search, limit, featured, discounted })}`;
    
    // Use cache for non-search queries (search results should be fresh)
    const shouldCache = !search || search.trim() === '';
    const cacheTTL = shouldCache ? 300 : 60; // 5 minutes for regular queries, 1 minute for search
    
    const result = await withCache(cacheKey, async () => {
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
      
      // Filter for discounted products with active promotions
      if (discounted) {
        // Get active promotions
        const now = new Date();
        const activePromotions = await prisma.promotion.findMany({
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            type: {
              in: ['PERCENTAGE', 'FIXED_AMOUNT'] // Only include discount types
            }
          },
          include: {
            products: {
              select: {
                productId: true
              }
            }
          }
        });
        
        if (activePromotions.length > 0) {
          // Get all product IDs that have active promotions
          const discountedProductIds = activePromotions.flatMap(promo => 
            promo.products.map(p => p.productId)
          );
          
          // Add to filters
          if (discountedProductIds.length > 0) {
            filters.id = { in: discountedProductIds };
          } else {
            // No discounted products found, return empty array early
            return [];
          }
        } else {
          // No active promotions, return empty array early
          return [];
        }
      }
      
      // Comprehensive search across multiple fields
      if (search && search.trim() !== '') {
        filters.OR = filters.OR || [];
        filters.OR.push(
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
        );
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
          variations: {
            where: {
              isActive: true
            },
            include: {
              size: true,
              type: true,
              beans: true,
            }
          },
          promotions: {
            where: {
              promotion: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
              }
            },
            include: {
              promotion: {
                select: {
                  id: true,
                  type: true,
                  value: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc',
        },
        ...(limit ? { take: limit } : {})
      });
      
      // Process promotion data to include discount information
      const processedProducts = products.map(product => {
        // Find the highest percentage discount or fixed amount discount from promotions
        let highestPercentageDiscount = 0;
        let highestFixedDiscount = 0;
        let discountType = 'PERCENTAGE';
        
        if (product.promotions && product.promotions.length > 0) {
          for (const promoLink of product.promotions) {
            const promo = promoLink.promotion;
            
            if (promo.type === 'PERCENTAGE' && promo.value > highestPercentageDiscount) {
              highestPercentageDiscount = promo.value;
            } else if (promo.type === 'FIXED_AMOUNT' && promo.value > highestFixedDiscount) {
              highestFixedDiscount = promo.value;
            }
          }
          
          // Determine which discount type to use (prefer percentage if both exist)
          if (highestPercentageDiscount > 0) {
            discountType = 'PERCENTAGE';
          } else if (highestFixedDiscount > 0) {
            discountType = 'FIXED_AMOUNT';
          }
        }
        
        // Check variations for discounts and find the lowest price
        let lowestVariationPrice = product.price;
        let highestVariationDiscount = 0;
        let hasVariationDiscount = false;
        
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach((variation: any) => {
            // Calculate effective price for this variation
            let effectivePrice = variation.price;
            if (variation.discount && variation.discount > 0) {
              hasVariationDiscount = true;
              if (variation.discountType === 'PERCENTAGE') {
                effectivePrice = variation.price * (1 - variation.discount);
                if (variation.discount > highestVariationDiscount) {
                  highestVariationDiscount = variation.discount;
                }
              } else if (variation.discountType === 'FIXED_AMOUNT') {
                effectivePrice = Math.max(0, variation.price - variation.discount);
              }
            }
            
            // Update lowest price
            if (effectivePrice < lowestVariationPrice) {
              lowestVariationPrice = effectivePrice;
            }
          });
        }
        
        // Use the higher of promotion discount or variation discount
        const finalDiscount = hasVariationDiscount && highestVariationDiscount > 0 
          ? highestVariationDiscount * 100  // Convert to percentage
          : (highestPercentageDiscount > 0 ? highestPercentageDiscount : highestFixedDiscount);
        
        const finalDiscountType = hasVariationDiscount && highestVariationDiscount > 0
          ? 'PERCENTAGE'
          : discountType;
        
        // Add discount properties to the product
        return {
          ...product,
          price: lowestVariationPrice, // Use the lowest variation price as the display price
          discount: finalDiscount,
          discountType: finalDiscountType,
          hasVariationDiscount: hasVariationDiscount
        };
      });
      
      console.log(`Found ${processedProducts.length} products`);
      return processedProducts;
    }, cacheTTL);
    
    return NextResponse.json(result);
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
    // Optional authentication - try to get session but don't fail if not configured
    let auth;
    try {
      auth = await checkAuth(['ADMIN', 'MANAGER']);
    } catch (authError) {
      console.log('Auth not configured or error getting auth:', authError);
      // Continue without authentication for development
    }
    
    // In production, you would want to check authentication
    // Commenting out for easier development:
    // if (!auth || !auth.authorized) {
    //   return NextResponse.json(
    //     { error: auth?.error || 'Unauthorized' },
    //     { status: auth?.status || 401 }
    //   );
    // }
    
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
    
    // Invalidate products cache after creating new product
    invalidateCache.products();
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 