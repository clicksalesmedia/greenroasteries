import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all products with Arabic content
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { inStock: true },
          { 
            OR: [
              { nameAr: { not: null } },
              { descriptionAr: { not: null } }
            ]
          }
        ]
      },
      include: {
        category: true,
        variations: {
          where: { isActive: true },
          include: {
            size: true,
            type: true,
            beans: true
          }
        },
        images: true
      }
    });

    // Create feed data
    const feedItems = [];
    
    for (const product of products) {
      // Use Arabic name if available, otherwise skip
      const arabicName = product.nameAr;
      if (!arabicName) continue;
      
      const arabicDescription = product.descriptionAr || '';
      
      // Use Arabic category name if available
      const categoryName = product.category.nameAr || product.category.name;
      
      if (product.variations.length > 0) {
        // Product has variations
        for (const variation of product.variations) {
          const size = variation.size;
          const type = variation.type;
          const beans = variation.beans;
          
          // Build variation title in Arabic
          let variationTitle = arabicName;
          if (size) {
            variationTitle += ` - ${size.displayName}`;
          }
          if (type && type.arabicName) {
            variationTitle += ` - ${type.arabicName}`;
          } else if (type && type.name) {
            variationTitle += ` - ${type.name}`;
          }
          if (beans && beans.arabicName) {
            variationTitle += ` - ${beans.arabicName}`;
          } else if (beans && beans.name) {
            variationTitle += ` - ${beans.name}`;
          }
          
          const finalPrice = variation.discount && variation.discount > 0 ? 
            (variation.price - ((variation.discountType === 'PERCENTAGE' || !variation.discountType) ? 
              variation.price * (variation.discount / 100) : 
              variation.discount)) : 
            variation.price;
          
          feedItems.push({
            id: variation.id,
            title: variationTitle,
            description: arabicDescription,
            price: `${finalPrice.toFixed(2)} AED`,
            availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
            condition: 'new',
            brand: 'المحامص الخضراء',
            product_category: categoryName,
            image_link: variation.imageUrl || product.imageUrl || '',
            link: `https://thegreenroasteries.com/product/${product.slug}`,
            gtin: variation.sku || product.sku || '',
            mpn: variation.sku || product.sku || '',
            google_product_category: 'Food, Beverages & Tobacco > Beverages > Coffee',
            age_group: 'adult',
            gender: 'unisex',
            size: size ? size.displayName : '',
            custom_label_0: 'Arabic Coffee',
            custom_label_1: categoryName,
            custom_label_2: type ? (type.arabicName || type.name) : '',
            custom_label_3: beans ? (beans.arabicName || beans.name) : '',
            custom_label_4: 'UAE'
          });
        }
      } else {
        // Product without variations
        feedItems.push({
          id: product.id,
          title: arabicName,
          description: arabicDescription,
          price: `${product.price.toFixed(2)} AED`,
          availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
          condition: 'new',
          brand: 'المحامص الخضراء',
          product_category: categoryName,
          image_link: product.imageUrl || '',
          link: `https://thegreenroasteries.com/product/${product.slug}`,
          gtin: product.sku || '',
          mpn: product.sku || '',
          google_product_category: 'Food, Beverages & Tobacco > Beverages > Coffee',
          age_group: 'adult',
          gender: 'unisex',
          size: '',
          custom_label_0: 'Arabic Coffee',
          custom_label_1: categoryName,
          custom_label_2: '',
          custom_label_3: '',
          custom_label_4: 'UAE'
        });
      }
    }

    // Generate CSV feed
    const csvFeed = generateCSVFeed(feedItems);
    
    return new NextResponse(csvFeed, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('Error generating Arabic Google Shopping CSV feed:', error);
    return NextResponse.json({ error: 'Failed to generate CSV feed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function generateCSVFeed(items: any[]) {
  const csvHeader = [
    'id', 'title', 'description', 'price', 'availability', 'condition', 'brand',
    'product_type', 'google_product_category', 'image_link', 'link', 'gtin', 'mpn',
    'age_group', 'gender', 'size', 'custom_label_0', 'custom_label_1', 'custom_label_2',
    'custom_label_3', 'custom_label_4'
  ].join('\t');

  const csvRows = items.map(item => [
    item.id,
    item.title.replace(/\t/g, ' ').replace(/\n/g, ' '),
    item.description.replace(/\t/g, ' ').replace(/\n/g, ' '),
    item.price,
    item.availability,
    item.condition,
    item.brand.replace(/\t/g, ' '),
    item.product_category.replace(/\t/g, ' ').replace(/\n/g, ' '),
    item.google_product_category,
    item.image_link,
    item.link,
    item.gtin,
    item.mpn,
    item.age_group,
    item.gender,
    item.size.replace(/\t/g, ' '),
    item.custom_label_0,
    item.custom_label_1.replace(/\t/g, ' '),
    item.custom_label_2.replace(/\t/g, ' '),
    item.custom_label_3.replace(/\t/g, ' '),
    item.custom_label_4
  ].join('\t'));

  return csvHeader + '\n' + csvRows.join('\n');
} 