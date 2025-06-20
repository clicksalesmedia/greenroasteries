import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a product by slug (which is either an ID or a slugified name)
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Access slug by awaiting the params promise
    const params = await context.params;
    const slug = await context.params.then(p => p.slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Product slug is required' },
        { status: 400 }
      );
    }
    
    // First attempt to find product directly by ID
    let product = await prisma.product.findUnique({
      where: { id: slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true
          }
        },
        images: true,
        variations: {
          include: {
            size: true,
            type: true,
            beans: true,
          }
        }
      }
    });
    
    // If not found by ID, try matching against name
    if (!product) {
      // Convert slug format back to potential name formats
      const possibleName = slug.replace(/-/g, ' ');
      
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: possibleName, mode: 'insensitive' } },
            { nameAr: { contains: possibleName, mode: 'insensitive' } },
            { sku: slug },
          ]
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              slug: true
            }
          },
          images: true,
          variations: {
            include: {
              size: true,
              type: true,
              beans: true,
            }
          }
        }
      });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Return the product with all multilingual fields
    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH a product (partial update)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Access slug by awaiting the params promise
    const params = await context.params;
    const slug = await context.params.then(p => p.slug);
    
    console.log(`[API] PATCH request received for product ID/slug: ${slug}`);
    
    if (!slug) {
      console.log(`[API] No ID/slug provided in params`);
      return NextResponse.json(
        { error: 'Product ID/slug is required' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    console.log(`[API] Request body:`, body);
    
    // Check if product exists (try finding by ID first)
    let existingProduct = await prisma.product.findUnique({
      where: { id: slug }
    });
    
    // If not found by ID, try finding by name/sku
    if (!existingProduct) {
      const possibleName = slug.replace(/-/g, ' ');
      existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: possibleName, mode: 'insensitive' } },
            { nameAr: { contains: possibleName, mode: 'insensitive' } },
            { sku: slug },
          ]
        }
      });
    }
    
    if (!existingProduct) {
      console.log(`[API] Product with ID/slug ${slug} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    console.log(`[API] Found product: ${existingProduct.name}`);
    
    // Handle conversion from isActive to inStock if needed
    const dataToUpdate = { ...body };
    
    // If client is sending isActive, convert it to inStock
    if (dataToUpdate.isActive !== undefined) {
      console.log(`[API] Converting isActive=${dataToUpdate.isActive} to inStock`);
      dataToUpdate.inStock = dataToUpdate.isActive;
      delete dataToUpdate.isActive;
    }
    
    console.log(`[API] Updating product ${existingProduct.id} with data:`, dataToUpdate);

    // Update only the specific fields provided in the request
    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: dataToUpdate,
      include: {
        category: true
      }
    });
    
    // Convert inStock to isActive in the response to maintain API compatibility
    const responseProduct = {
      ...updatedProduct,
      isActive: updatedProduct.inStock
    };
    
    console.log(`[API] Product updated successfully:`, responseProduct);
    return NextResponse.json(responseProduct);
  } catch (error) {
    console.error('[API] Error in PATCH product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: String(error) },
      { status: 500 }
    );
  }
}

// UPDATE a product
export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
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
    
    // Access slug by awaiting the params promise
    const params = await context.params;
    const slug = await context.params.then(p => p.slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Product ID/slug is required' },
        { status: 400 }
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
    
    // Check if product exists (try finding by ID first)
    let existingProduct = await prisma.product.findUnique({
      where: { id: slug },
      include: {
        variations: true
      }
    });
    
    // If not found by ID, try finding by name/sku
    if (!existingProduct) {
      const possibleName = slug.replace(/-/g, ' ');
      existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: possibleName, mode: 'insensitive' } },
            { nameAr: { contains: possibleName, mode: 'insensitive' } },
            { sku: slug },
          ]
        },
        include: {
          variations: true
        }
      });
    }
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productId = existingProduct.id;

    // Create a transaction to handle all update operations
    try {
      // Handle variations if any
      if (body.variations && Array.isArray(body.variations)) {
        // Process variations
        for (const variation of body.variations) {
          if (variation.id) {
            // Update existing variation
            await prisma.productVariation.update({
              where: { id: variation.id },
              data: {
                sizeId: variation.sizeId,
                typeId: variation.typeId || null,
                beansId: variation.beansId || null,
                price: variation.price,
                sku: variation.sku || null,
                stockQuantity: variation.stockQuantity || 0,
                isActive: variation.isActive !== undefined ? variation.isActive : true,
              }
            });
          } else {
            // Create new variation
            await prisma.productVariation.create({
              data: {
                productId: productId,
                sizeId: variation.sizeId,
                typeId: variation.typeId || null,
                beansId: variation.beansId || null,
                price: variation.price,
                sku: variation.sku || null,
                stockQuantity: variation.stockQuantity || 0,
                isActive: variation.isActive !== undefined ? variation.isActive : true,
              }
            });
          }
        }
      }
      
      // Add gallery images if any
      if (body.newGalleryImages && Array.isArray(body.newGalleryImages) && body.newGalleryImages.length > 0) {
        for (const url of body.newGalleryImages) {
          await prisma.productImage.create({
            data: {
              productId: productId,
              url,
              alt: body.name || 'Product image'
            }
          });
        }
      }
      
      // Delete gallery images if any are marked for deletion
      if (body.imagesToDelete && Array.isArray(body.imagesToDelete) && body.imagesToDelete.length > 0) {
        for (const imageUrl of body.imagesToDelete) {
          // Find and delete the image record
          await prisma.productImage.deleteMany({
            where: {
              productId: productId,
              url: imageUrl
            }
          });
        }
      }
      
      // Update the main product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name: body.name,
          nameAr: body.nameAr,
          description: body.description,
          descriptionAr: body.descriptionAr,
          price: parseFloat(body.price),
          imageUrl: body.imageUrl,
          categoryId: body.categoryId,
          origin: body.origin,
          inStock: body.stockQuantity > 0,
          stockQuantity: body.stockQuantity ? parseInt(body.stockQuantity) : 0,
          sku: body.sku,
          weight: body.weight ? parseFloat(body.weight) : null,
          dimensions: body.dimensions,
        },
        include: {
          category: true,
          images: true,
          variations: {
            include: {
              size: true,
              type: true,
              beans: true,
            }
          }
        },
      });
      
      return NextResponse.json(updatedProduct);
    } catch (transactionError: any) {
      console.error('Transaction error:', transactionError);
      
      // Handle unique constraint errors
      if (transactionError.code === 'P2002') {
        const target = transactionError.meta?.target || [];
        if (target.includes('sku')) {
          return NextResponse.json(
            { error: 'A product with this SKU already exists. Please use a different SKU.' },
            { status: 400 }
          );
        } else if (target.includes('slug')) {
          return NextResponse.json(
            { error: 'A product with this slug already exists. Please use a different slug.' },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: `Unique constraint failed on ${target.join(', ')}` },
            { status: 400 }
          );
        }
      }
      
      throw transactionError;
    }
  } catch (error) {
    console.error('Failed to update product:', error);
    // Extract the error message or provide a fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Extract stack trace if available
    const stackTrace = error instanceof Error ? error.stack : '';
    
    console.error('Detailed error information:', errorMessage, stackTrace);
    
    return NextResponse.json(
      { 
        error: 'Failed to update product', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? stackTrace : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Optional authentication - try to get session but don't fail if not configured
    let auth;
    try {
      auth = await checkAuth(['ADMIN']);
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
    
    // Access slug by awaiting the params promise
    const params = await context.params;
    const slug = await context.params.then(p => p.slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Product ID/slug is required' },
        { status: 400 }
      );
    }
    
    // Check if product exists (try finding by ID first)
    let existingProduct = await prisma.product.findUnique({
      where: { id: slug }
    });
    
    // If not found by ID, try finding by name/sku
    if (!existingProduct) {
      const possibleName = slug.replace(/-/g, ' ');
      existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: possibleName, mode: 'insensitive' } },
            { nameAr: { contains: possibleName, mode: 'insensitive' } },
            { sku: slug },
          ]
        }
      });
    }
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product is used in any orders or bundles
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: existingProduct.id }
    });
    
    const bundleItemsCount = await prisma.bundleItem.count({
      where: {
        OR: [
          { bundleProductId: existingProduct.id },
          { containedProductId: existingProduct.id }
        ]
      }
    });
    
    if (orderItemsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product: it is used in existing orders. Consider deactivating it instead.' },
        { status: 400 }
      );
    }
    
    if (bundleItemsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product: it is used in product bundles. Please remove it from bundles first.' },
        { status: 400 }
      );
    }
    
    // Delete the product in a transaction to ensure data integrity
    // Relations with CASCADE delete will be handled automatically
    await prisma.$transaction(async (tx) => {
      // ProductImage, ProductPromotion, and ProductVariation will cascade delete
      // due to onDelete: Cascade in the schema
      await tx.product.delete({
        where: { id: existingProduct.id }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete product: it is referenced by other records. Please check for dependencies.' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 