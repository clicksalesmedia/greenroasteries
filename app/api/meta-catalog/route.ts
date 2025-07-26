import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Meta Catalog Fields (exact Meta Commerce format)
const META_FIELDS = [
  'id',                           // Required: Unique content ID
  'title',                        // Required: Product title
  'description',                  // Required: Product description
  'availability',                 // Required: in stock/out of stock
  'condition',                    // Required: new/used
  'price',                        // Required: Price with currency
  'link',                         // Required: Product page URL
  'image_link',                   // Required: Main product image
  'brand',                        // Required: Brand name
  'google_product_category',      // Optional: Google product category
  'fb_product_category',          // Optional: Facebook product category
  'quantity_to_sell_on_facebook', // Optional: Quantity available
  'sale_price',                   // Optional: Sale price if on sale
  'sale_price_effective_date',    // Optional: Sale period
  'item_group_id',                // Optional: Group ID for variants
  'gender',                       // Optional: Target gender
  'color',                        // Optional: Product color
  'size',                         // Optional: Product size
  'age_group',                    // Optional: Target age group
  'material',                     // Optional: Product material
  'pattern',                      // Optional: Pattern/design
  'shipping',                     // Optional: Shipping details
  'shipping_weight',              // Optional: Shipping weight
  'gtin',                         // Optional: Global Trade Item Number
  'video[0].url',                 // Optional: Video URL
  'video[0].tag[0]',              // Optional: Video tag
  'product_tags[0]',              // Optional: Product tag 1
  'product_tags[1]',              // Optional: Product tag 2
  'style[0]'                      // Optional: Style/fashion
];

class MetaCatalogAPI {
  private baseUrl: string;
  private currency: string;
  private brand: string;
  private brandAr: string;

  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'Green Roasteries';
    this.brandAr = 'المحامص الخضراء';
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  cleanText(text: string, maxLength = 5000): string {
    if (!text) return '';
    return text
      .replace(/"/g, '""')  // Escape quotes for CSV
      .replace(/\n/g, ' ')  // Replace newlines
      .substring(0, maxLength)
      .trim();
  }

  makeAbsoluteUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  }

  mapToGoogleCategory(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'arabic coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'espresso roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'medium roast': 'Food, Beverages & Tobacco > Beverages > Coffee', 
      'turkish roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'nuts & dried fruits': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds',
      'coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'مكسرات': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds'
    };

    const key = categoryName.toLowerCase();
    return categoryMap[key] || 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  convertProductToMeta(product: any, language = 'en'): any {
    const isArabic = language === 'ar';
    
    const title = isArabic && product.nameAr ? product.nameAr : product.name;
    const description = isArabic && product.descriptionAr ? product.descriptionAr : (product.description || product.name);
    const categoryName = isArabic && product.category.nameAr ? product.category.nameAr : product.category.name;
    const brand = isArabic ? this.brandAr : this.brand;

    const slug = this.generateSlug(product.name);
    // Updated to use /ar/product/... format for Arabic links
    const link = isArabic ? `${this.baseUrl}/ar/product/${slug}` : `${this.baseUrl}/product/${slug}`;

    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));

    return {
      id: `${product.id}_${language}`,
      title: this.cleanText(title, 200),
      description: this.cleanText(description, 9999),
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: `${product.price.toFixed(2)} ${this.currency}`,
      link: link,
      image_link: mainImage,
      brand: brand,
      google_product_category: this.mapToGoogleCategory(categoryName),
      fb_product_category: 'Food, Beverages & Tobacco > Beverages > Coffee',
      quantity_to_sell_on_facebook: product.stockQuantity || 0,
      sale_price: '',
      sale_price_effective_date: '',
      item_group_id: product.id,
      gender: 'unisex',
      color: 'Brown',
      size: '',
      age_group: 'adult',
      material: isArabic ? 'قهوة' : 'Coffee',
      pattern: '',
      shipping: 'AE::Standard:0.00 AED',
      shipping_weight: '1000g',
      gtin: '',
      'video[0].url': '',
      'video[0].tag[0]': '',
      'product_tags[0]': isArabic ? 'قهوة عربية' : 'Arabic Coffee',
      'product_tags[1]': categoryName,
      'style[0]': ''
    };
  }

  convertVariationToMeta(baseProduct: any, product: any, variation: any, language = 'en'): any {
    const isArabic = language === 'ar';
    
    let variationTitle = baseProduct.title;
    const sizeDisplay = `${variation.size.value}g`;
    variationTitle += ` - ${sizeDisplay}`;
    
    if (variation.type) {
      const typeName = isArabic && variation.type.arabicName ? variation.type.arabicName : variation.type.name;
      variationTitle += ` ${typeName}`;
    }
    
    if (variation.beans) {
      const beansName = isArabic && variation.beans.arabicName ? variation.beans.arabicName : variation.beans.name;
      variationTitle += ` ${beansName}`;
    }

    return {
      ...baseProduct,
      id: `${variation.id}_${language}`,
      title: this.cleanText(variationTitle, 200),
      price: `${variation.price.toFixed(2)} ${this.currency}`,
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      quantity_to_sell_on_facebook: variation.stockQuantity || 0,
      size: sizeDisplay,
      image_link: this.makeAbsoluteUrl(variation.imageUrl) || baseProduct.image_link,
      shipping_weight: sizeDisplay,
      'product_tags[0]': isArabic && variation.type?.arabicName ? variation.type.arabicName : (variation.type?.name || baseProduct['product_tags[0]']),
      'product_tags[1]': isArabic && variation.beans?.arabicName ? variation.beans.arabicName : (variation.beans?.name || baseProduct['product_tags[1]'])
    };
  }

  convertToCSV(catalogEntries: any[]): string {
    const header = META_FIELDS.join(',');
    
    const rows = catalogEntries.map(entry => {
      return META_FIELDS.map(field => {
        const value = entry[field] || '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Generating Meta Catalog Feed...');
    
    const api = new MetaCatalogAPI();
    
    // Fetch all active products
    const products = await prisma.product.findMany({
      where: {
        inStock: true
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
        images: {
          select: {
            id: true,
            url: true,
            alt: true
          }
        },
        variations: {
          where: {
            isActive: true
          },
          include: {
            size: true,
            type: true,
            beans: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Found ${products.length} active products`);

    const catalogEntries = [];

    for (const product of products) {
      const languages = ['en', 'ar'];
      
      for (const language of languages) {
        // Skip Arabic if no Arabic content
        if (language === 'ar' && !product.nameAr) {
          continue;
        }

        const baseMetaProduct = api.convertProductToMeta(product, language);

        // If product has variations, create entries for each variation
        if (product.variations && product.variations.length > 0) {
          for (const variation of product.variations) {
            const variationEntry = api.convertVariationToMeta(baseMetaProduct, product, variation, language);
            catalogEntries.push(variationEntry);
          }
        } else {
          catalogEntries.push(baseMetaProduct);
        }
      }
    }

    console.log(`📦 Generated ${catalogEntries.length} catalog entries`);

    // Convert to CSV
    const csvContent = api.convertToCSV(catalogEntries);
    
    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="meta-catalog-feed.csv"',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('❌ Error generating Meta catalog:', error);
    return NextResponse.json(
      { error: 'Failed to generate Meta catalog' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 