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

    // Generate XML feed
    const xmlFeed = generateXMLFeed(feedItems);
    
    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('Error generating Arabic Google Shopping XML feed:', error);
    return NextResponse.json({ error: 'Failed to generate XML feed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function generateXMLFeed(items: any[]) {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>المحامص الخضراء - Arabic Coffee Products</title>
    <link>https://thegreenroasteries.com</link>
    <description>منتجات القهوة العربية من المحامص الخضراء</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

  const xmlFooter = `  </channel>
</rss>`;

  const xmlItems = items.map(item => `    <item>
      <g:id>${item.id}</g:id>
      <g:title><![CDATA[${item.title}]]></g:title>
      <g:description><![CDATA[${item.description}]]></g:description>
      <g:price>${item.price}</g:price>
      <g:availability>${item.availability}</g:availability>
      <g:condition>${item.condition}</g:condition>
      <g:brand><![CDATA[${item.brand}]]></g:brand>
      <g:product_type><![CDATA[${item.product_category}]]></g:product_type>
      <g:google_product_category>${item.google_product_category}</g:google_product_category>
      <g:image_link>${item.image_link}</g:image_link>
      <g:link>${item.link}</g:link>
      <g:gtin>${item.gtin}</g:gtin>
      <g:mpn>${item.mpn}</g:mpn>
      <g:age_group>${item.age_group}</g:age_group>
      <g:gender>${item.gender}</g:gender>
      <g:size><![CDATA[${item.size}]]></g:size>
      <g:custom_label_0><![CDATA[${item.custom_label_0}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${item.custom_label_1}]]></g:custom_label_1>
      <g:custom_label_2><![CDATA[${item.custom_label_2}]]></g:custom_label_2>
      <g:custom_label_3><![CDATA[${item.custom_label_3}]]></g:custom_label_3>
      <g:custom_label_4><![CDATA[${item.custom_label_4}]]></g:custom_label_4>
    </item>`).join('\n');

  return xmlHeader + xmlItems + '\n' + xmlFooter;
} 