import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    // Get query params
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Toggle the product status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { 
        inStock: !product.inStock 
      }
    });
    
    // Add isActive property to match the expected interface
    const responseProduct = {
      ...updatedProduct,
      isActive: updatedProduct.inStock
    };
    
    return NextResponse.json({
      success: true,
      message: `Product ${updatedProduct.name} is now ${updatedProduct.inStock ? 'in stock' : 'out of stock'}`,
      product: responseProduct
    });
  } catch (error) {
    console.error('Error in test-product API:', error);
    return NextResponse.json({ 
      error: 'Failed to toggle product', 
      details: String(error) 
    }, { status: 500 });
  }
} 