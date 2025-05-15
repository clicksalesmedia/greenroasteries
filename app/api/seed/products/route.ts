import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { checkAuth } from '../../../lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// POST route to seed the products
export async function POST() {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // First check if we have the ARABICA COFFEE category
    let arabicaCategory = await prisma.category.findUnique({
      where: { slug: 'arabica-coffee' }
    });

    // If not found, create it
    if (!arabicaCategory) {
      arabicaCategory = await prisma.category.create({
        data: {
          name: 'ARABICA COFFEE',
          slug: 'arabica-coffee',
          description: 'Premium arabica coffee beans',
          isActive: true
        }
      });
    }

    // Products to add
    const products = [
      {
        name: 'Nicaragua',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 112, // Price for 1KG
        origin: 'Nicaragua',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-NIC-1KG'
      },
      {
        name: 'Colombia',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 72, // Price for 1KG
        origin: 'Colombia',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-COL-1KG'
      },
      {
        name: 'Ethiopia',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 72, // Price for 1KG
        origin: 'Ethiopia',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-ETH-1KG'
      },
      {
        name: 'Sri Lanka',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 72, // Price for 1KG
        origin: 'Sri Lanka',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-SRI-1KG'
      },
      {
        name: 'Kenya',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 80, // Price for 1KG
        origin: 'Kenya',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-KEN-1KG'
      },
      {
        name: 'Brazil',
        description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
        categoryId: arabicaCategory.id,
        price: 60, // Price for 1KG
        origin: 'Brazil',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-BRA-1KG'
      },
      {
        name: 'Al Dhaid Blend',
        description: 'The smell of fresh Arabic coffee wafts through our cafés, inviting you to taste our distinctive blend that we prepare for you. In each of them, we have selected the finest types of coffee beans for a strong flavor and smooth texture.',
        categoryId: arabicaCategory.id,
        price: 115, // Price for 1KG
        origin: 'UAE',
        inStock: true,
        stockQuantity: 100,
        sku: 'ARABICA-ALH-1KG'
      }
    ];
    
    // Create all products
    const createdProducts = [];
    
    for (const product of products) {
      // Check if product already exists by SKU
      const existingProduct = await prisma.product.findUnique({
        where: { sku: product.sku }
      });
      
      if (!existingProduct) {
        const createdProduct = await prisma.product.create({
          data: product
        });
        
        createdProducts.push(createdProduct);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${createdProducts.length} products`,
      products: createdProducts.map(p => p.name)
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to seed products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 