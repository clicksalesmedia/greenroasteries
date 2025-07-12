#!/usr/bin/env node

/**
 * 🛍️ GOOGLE SHOPPING ARABIC CSV FEED GENERATOR
 * 
 * Creates a Google Shopping CSV feed specifically for Arabic products
 * Complements the existing Meta catalog system
 * Generates CSV format compatible with Google Merchant Center
 */

const { PrismaClient } = require('../app/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/greenroasteries"
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal'
});

// Google Shopping required fields
const GOOGLE_SHOPPING_FIELDS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'additional_image_link',
  'availability',
  'price',
  'sale_price',
  'condition',
  'brand',
  'gtin',
  'mpn',
  'item_group_id',
  'google_product_category',
  'product_type',
  'color',
  'size',
  'material',
  'gender',
  'age_group',
  'target_country',
  'content_language',
  'shipping',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4'
];

class GoogleShoppingArabicCSVGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'المحامص الخضراء'; // Arabic brand name
    this.country = 'AE';
    this.language = 'ar';
    this.merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || '5602274425';
  }

  /**
   * Clean text for CSV
   */
  cleanText(text, maxLength = 5000) {
    if (!text) return '';
    return text
      .replace(/"/g, '""')  // Escape quotes for CSV
      .replace(/\n/g, ' ')  // Replace newlines
      .replace(/\r/g, ' ')  // Replace carriage returns
      .substring(0, maxLength)
      .trim();
  }

  /**
   * Make URL absolute
   */
  makeAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Generate product slug from name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Map category to Google product category
   */
  mapToGoogleCategory(categoryName) {
    const categoryMap = {
      'arabic coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'espresso roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'medium roast': 'Food, Beverages & Tobacco > Beverages > Coffee', 
      'turkish roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'filter coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة عربية': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'تحميص الإسبريسو': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة مقطرة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'مكسرات': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds'
    };

    const key = categoryName.toLowerCase();
    return categoryMap[key] || 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  /**
   * Convert product to Google Shopping CSV format
   */
  convertProductToGoogleCSV(product) {
    // Skip if no Arabic name
    if (!product.nameAr) return [];

    const slug = this.generateSlug(product.name);
    const link = `${this.baseUrl}/product/${slug}?lang=ar`;
    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));
    
    // Additional images (up to 10)
    const additionalImages = product.images
      .slice(1, 11)
      .map(img => this.makeAbsoluteUrl(img.url))
      .filter(url => url && url !== mainImage)
      .join(',');

    const categoryName = product.category.nameAr || product.category.name;
    
    const entries = [];

    // If product has variations, create entries for each variation
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach(variation => {
        if (variation.isActive && variation.stockQuantity > 0) {
          const variationEntry = this.createVariationCSVEntry(product, variation, {
            slug,
            link,
            mainImage,
            additionalImages,
            categoryName
          });
          entries.push(variationEntry);
        }
      });
    } else {
      // Create single product entry
      const productEntry = this.createProductCSVEntry(product, {
        slug,
        link,
        mainImage,
        additionalImages,
        categoryName
      });
      entries.push(productEntry);
    }

    return entries;
  }

  /**
   * Create CSV entry for product variation
   */
  createVariationCSVEntry(product, variation, options) {
    const { slug, link, mainImage, additionalImages, categoryName } = options;
    
    // Create variation-specific title
    let variationTitle = product.nameAr;
    const sizeDisplay = `${variation.size.value}g`;
    variationTitle += ` - ${sizeDisplay}`;
    
    if (variation.type) {
      const typeName = variation.type.arabicName || variation.type.name;
      variationTitle += ` ${typeName}`;
    }
    
    if (variation.beans) {
      const beansName = variation.beans.arabicName || variation.beans.name;
      variationTitle += ` ${beansName}`;
    }

    const variationImage = this.makeAbsoluteUrl(variation.imageUrl) || mainImage;
    
    // Calculate sale price if discount exists
    const salePrice = variation.discount > 0 ? 
      `${(variation.price * (1 - variation.discount / 100)).toFixed(2)} ${this.currency}` : 
      '';

    return {
      id: `ar_${variation.id}`,
      title: this.cleanText(variationTitle, 150),
      description: this.cleanText(product.descriptionAr || product.description || product.nameAr, 5000),
      link: link,
      image_link: variationImage,
      additional_image_link: additionalImages,
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      price: `${variation.price.toFixed(2)} ${this.currency}`,
      sale_price: salePrice,
      condition: 'new',
      brand: this.brand,
      gtin: variation.sku || '',
      mpn: variation.sku || variation.id,
      item_group_id: product.id,
      google_product_category: this.mapToGoogleCategory(categoryName),
      product_type: this.cleanText(categoryName),
      color: 'بني',
      size: sizeDisplay,
      material: 'قهوة',
      gender: 'unisex',
      age_group: 'adult',
      target_country: this.country,
      content_language: this.language,
      shipping: `${this.country}::Standard:0.00 ${this.currency}`,
      custom_label_0: 'arabic',
      custom_label_1: product.origin || 'الإمارات',
      custom_label_2: categoryName,
      custom_label_3: variation.type?.arabicName || 'تحميص متوسط',
      custom_label_4: variation.beans?.arabicName || 'حبوب عربية'
    };
  }

  /**
   * Create CSV entry for single product
   */
  createProductCSVEntry(product, options) {
    const { slug, link, mainImage, additionalImages, categoryName } = options;
    
    // Calculate sale price if discount exists
    const salePrice = product.discount > 0 ? 
      `${(product.price * (1 - product.discount / 100)).toFixed(2)} ${this.currency}` : 
      '';

    return {
      id: `ar_${product.id}`,
      title: this.cleanText(product.nameAr, 150),
      description: this.cleanText(product.descriptionAr || product.description || product.nameAr, 5000),
      link: link,
      image_link: mainImage,
      additional_image_link: additionalImages,
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      price: `${product.price.toFixed(2)} ${this.currency}`,
      sale_price: salePrice,
      condition: 'new',
      brand: this.brand,
      gtin: product.sku || '',
      mpn: product.sku || product.id,
      item_group_id: product.id,
      google_product_category: this.mapToGoogleCategory(categoryName),
      product_type: this.cleanText(categoryName),
      color: 'بني',
      size: '',
      material: 'قهوة',
      gender: 'unisex',
      age_group: 'adult',
      target_country: this.country,
      content_language: this.language,
      shipping: `${this.country}::Standard:0.00 ${this.currency}`,
      custom_label_0: 'arabic',
      custom_label_1: product.origin || 'الإمارات',
      custom_label_2: categoryName,
      custom_label_3: 'تحميص متوسط',
      custom_label_4: 'حبوب عربية'
    };
  }

  /**
   * Convert entries to CSV format
   */
  convertToCSV(entries) {
    if (entries.length === 0) return '';

    // Create header
    const header = GOOGLE_SHOPPING_FIELDS.join(',');
    
    // Create rows
    const rows = entries.map(entry => {
      return GOOGLE_SHOPPING_FIELDS.map(field => {
        const value = entry[field] || '';
        // Wrap in quotes if contains comma or quote
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Generate complete feed
   */
  async generateFeed() {
    console.log('🚀 بدء إنشاء كتالوج Google Shopping العربي (CSV)...\n');

    try {
      // Fetch all active products with Arabic names
      console.log('📋 جلب المنتجات من قاعدة البيانات...');
      const products = await prisma.product.findMany({
        where: {
          inStock: true,
          nameAr: {
            not: null
          }
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
          nameAr: 'asc'
        }
      });

      console.log(`📊 تم العثور على ${products.length} منتج باللغة العربية`);

      // Generate CSV entries
      const csvEntries = [];
      let processedCount = 0;

      for (const product of products) {
        const entries = this.convertProductToGoogleCSV(product);
        csvEntries.push(...entries);
        processedCount++;
        
        if (processedCount % 10 === 0) {
          console.log(`⚡ تم معالجة ${processedCount}/${products.length} منتج...`);
        }
      }

      console.log(`\n✅ تم إنشاء ${csvEntries.length} إدخال في الكتالوج`);

      // Convert to CSV
      const csvContent = this.convertToCSV(csvEntries);

      // Save to file
      const filePath = await this.saveFeed(csvContent);
      
      // Generate summary
      this.generateSummary(csvEntries.length, products.length);

      console.log(`\n🎉 تم إنشاء كتالوج Google Shopping العربي بنجاح!`);
      console.log(`📁 الملف: ${filePath}`);
      
      return filePath;

    } catch (error) {
      console.error('❌ خطأ في إنشاء الكتالوج:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Save feed to file
   */
  async saveFeed(csvContent) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `google-shopping-arabic-feed-${timestamp}.csv`;
    const filePath = path.join(process.cwd(), 'public', filename);

    // Add BOM for proper Arabic text encoding
    const bom = '\uFEFF';
    await fs.promises.writeFile(filePath, bom + csvContent, 'utf8');
    
    return filePath;
  }

  /**
   * Generate summary
   */
  generateSummary(totalEntries, totalProducts) {
    console.log('\n📈 ملخص الكتالوج:');
    console.log('================');
    console.log(`📦 إجمالي المنتجات: ${totalProducts}`);
    console.log(`🔢 إجمالي الإدخالات: ${totalEntries}`);
    console.log(`🌐 اللغة: العربية`);
    console.log(`💰 العملة: ${this.currency}`);
    console.log(`🏪 العلامة التجارية: ${this.brand}`);
    console.log(`🎯 الدولة المستهدفة: ${this.country}`);
    console.log('\n📋 الفئات المدعومة:');
    console.log('  • القهوة العربية');
    console.log('  • تحميص الإسبريسو');
    console.log('  • قهوة مقطرة');
    console.log('  • خلطات مخصصة');
    console.log('\n🔗 رابط الكتالوج:');
    console.log(`  ${this.baseUrl}/google-shopping-arabic-feed-${new Date().toISOString().slice(0, 10)}.csv`);
    console.log('\n📝 تعليمات الاستخدام:');
    console.log('  1. ارفع الملف إلى Google Merchant Center');
    console.log('  2. حدد اللغة العربية والدولة الإمارات');
    console.log('  3. تأكد من تفعيل الشحن المجاني');
    console.log('  4. راجع المنتجات المرفوضة وأصلحها');
  }
}

// Main execution
async function main() {
  const generator = new GoogleShoppingArabicCSVGenerator();
  
  try {
    await generator.generateFeed();
  } catch (error) {
    console.error('فشل في إنشاء الكتالوج:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = GoogleShoppingArabicCSVGenerator; 