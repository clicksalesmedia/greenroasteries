import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Meta Catalog Required Fields
const META_FIELDS = [
  'id',              // Required: Unique product ID
  'title',           // Required: Product title
  'description',     // Required: Product description  
  'availability',    // Required: in stock/out of stock
  'condition',       // Required: new/refurbished/used
  'price',           // Required: Price with currency
  'link',            // Required: Product page URL
  'image_link',      // Required: Main product image
  'brand',           // Brand name
  'google_product_category', // Google product category
  'product_type',    // Your product category
  'additional_image_link', // Additional images (comma separated)
  'sale_price',      // Sale price if on sale
  'item_group_id',   // For product variations
  'color',           // Product color
  'size',            // Product size
  'material',        // Product material
  'gender',          // Target gender
  'age_group',       // Target age group
  'custom_label_0',  // Custom field for language
  'custom_label_1',  // Custom field for origin
  'custom_label_2',  // Custom field for category AR
  'custom_label_3',  // Custom field for roast type
  'custom_label_4'   // Custom field for beans type
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
    const link = `${this.baseUrl}/product/${slug}${isArabic ? '?lang=ar' : ''}`;

    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));
    const additionalImages = product.images
      .slice(1, 11)
      .map((img: any) => this.makeAbsoluteUrl(img.url))
      .filter((url: string) => url && url !== mainImage)
      .join(',');

    return {
      id: `${product.id}_${language}`,
      title: this.cleanText(title, 150),
      description: this.cleanText(description, 5000),
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: `${product.price.toFixed(2)} ${this.currency}`,
      link: link,
      image_link: mainImage,
      brand: brand,
      google_product_category: this.mapToGoogleCategory(categoryName),
      product_type: categoryName,
      additional_image_link: additionalImages || '',
      sale_price: '',
      item_group_id: product.id,
      color: 'Brown',
      size: '',
      material: isArabic ? 'قهوة' : 'Coffee',
      gender: 'unisex',
      age_group: 'adult',
      custom_label_0: language,
      custom_label_1: product.origin || (isArabic ? 'أصل مميز' : 'Premium Origin'),
      custom_label_2: categoryName,
      custom_label_3: isArabic ? 'تحميص متوسط' : 'Medium Roast',
      custom_label_4: isArabic ? 'حبوب عربية' : 'Arabica Beans'
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
      title: this.cleanText(variationTitle, 150),
      price: `${variation.price.toFixed(2)} ${this.currency}`,
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      size: sizeDisplay,
      image_link: this.makeAbsoluteUrl(variation.imageUrl) || baseProduct.image_link,
      custom_label_3: isArabic && variation.type?.arabicName ? variation.type.arabicName : (variation.type?.name || baseProduct.custom_label_3),
      custom_label_4: isArabic && variation.beans?.arabicName ? variation.beans.arabicName : (variation.beans?.name || baseProduct.custom_label_4)
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