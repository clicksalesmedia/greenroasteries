#!/usr/bin/env node

/**
 * 🛍️ GOOGLE SHOPPING FEED GENERATOR (Based on Meta System)
 * 
 * Creates a Google Shopping CSV feed using the same proven approach as Meta catalog
 * Includes Arabic products with all variations
 * Generates CSV format compatible with Google Merchant Center
 */

const { PrismaClient } = require('../app/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Google Shopping Required Fields
const GOOGLE_SHOPPING_FIELDS = [
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
  'target_country',  // Target country
  'content_language', // Content language
  'shipping',        // Shipping info
  'gtin',            // Global Trade Item Number
  'mpn',             // Manufacturer Part Number
  'custom_label_0',  // Custom field for language
  'custom_label_1',  // Custom field for origin
  'custom_label_2',  // Custom field for category AR
  'custom_label_3',  // Custom field for roast type
  'custom_label_4'   // Custom field for beans type
];

class GoogleShoppingGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'المحامص الخضراء'; // Arabic brand for Google Shopping
    this.country = 'AE';
    this.language = 'ar';
  }

  /**
   * Generate slug from name
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
   * Clean and limit text for Google Shopping
   */
  cleanText(text, maxLength = 5000) {
    if (!text) return '';
    return text
      .replace(/"/g, '""')  // Escape quotes for CSV
      .replace(/\n/g, ' ')  // Replace newlines
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
   * Map category to Google product category
   */
  mapToGoogleCategory(categoryName) {
    const categoryMap = {
      'arabic coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'espresso roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'medium roast': 'Food, Beverages & Tobacco > Beverages > Coffee', 
      'turkish roast': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'nuts & dried fruits': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds',
      'coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة عربية': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'اسبريسو': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'مكسرات': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds'
    };

    const key = categoryName.toLowerCase();
    return categoryMap[key] || 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  /**
   * Convert product to Google Shopping format (Arabic)
   */
  convertProductToGoogleShopping(product) {
    // Use Arabic content (same as Meta system)
    const title = product.nameAr || product.name;
    const description = product.descriptionAr || product.description || product.name;
    const categoryName = product.category.nameAr || product.category.name;

    // Generate URLs
    const slug = this.generateSlug(product.name); // Keep English slug for consistency
    const link = `${this.baseUrl}/product/${slug}`;

    // Process images
    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));
    const additionalImages = product.images
      .slice(1, 11) // Max 10 additional images
      .map(img => this.makeAbsoluteUrl(img.url))
      .filter(url => url && url !== mainImage)
      .join(',');

    // Create base product entry
    const baseProduct = {
      id: product.id,
      title: this.cleanText(title, 150),
      description: this.cleanText(description, 5000),
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: `${product.price.toFixed(2)} ${this.currency}`,
      link: link,
      image_link: mainImage,
      brand: this.brand,
      google_product_category: this.mapToGoogleCategory(categoryName),
      product_type: categoryName,
      additional_image_link: additionalImages || '',
      sale_price: '', // Add if product has discount
      item_group_id: product.id, // Same for all variations
      color: 'بني', // Brown in Arabic
      size: '', // Will be filled for variations
      material: 'قهوة', // Coffee in Arabic
      gender: 'unisex',
      age_group: 'adult',
      target_country: this.country,
      content_language: this.language,
      shipping: `${this.country}::Standard:0.00 ${this.currency}`,
      gtin: product.sku || '',
      mpn: product.sku || product.id,
      custom_label_0: 'arabic', // Language
      custom_label_1: product.origin || 'الإمارات', // Origin
      custom_label_2: categoryName, // Category in Arabic
      custom_label_3: 'تحميص متوسط', // Roast type
      custom_label_4: 'حبوب عربية' // Beans type
    };

    return baseProduct;
  }

  /**
   * Convert product variation to Google Shopping format
   */
  convertVariationToGoogleShopping(baseProduct, product, variation) {
    // Create variation-specific title
    let variationTitle = baseProduct.title;
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

    // Create variation entry
    const variationProduct = {
      ...baseProduct,
      id: variation.id,
      title: this.cleanText(variationTitle, 150),
      price: `${variation.price.toFixed(2)} ${this.currency}`,
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      size: sizeDisplay,
      image_link: this.makeAbsoluteUrl(variation.imageUrl) || baseProduct.image_link,
      custom_label_3: variation.type?.arabicName || variation.type?.name || baseProduct.custom_label_3,
      custom_label_4: variation.beans?.arabicName || variation.beans?.name || baseProduct.custom_label_4
    };

    return variationProduct;
  }

  /**
   * Generate complete Google Shopping catalog
   */
  async generateCatalog() {
    console.log('🚀 بدء إنشاء كتالوج Google Shopping العربي...\n');

    try {
      // Fetch all products with Arabic names (same query as Meta system)
      console.log('📋 جلب المنتجات من قاعدة البيانات...');
      const products = await prisma.product.findMany({
        where: {
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

      // Generate catalog entries
      const catalogEntries = [];
      let processedCount = 0;

      for (const product of products) {
        // Convert base product
        const baseProduct = this.convertProductToGoogleShopping(product);
        
        // If product has variations, add them
        if (product.variations && product.variations.length > 0) {
          for (const variation of product.variations) {
            const variationProduct = this.convertVariationToGoogleShopping(baseProduct, product, variation);
            catalogEntries.push(variationProduct);
          }
        } else {
          // Add base product if no variations
          catalogEntries.push(baseProduct);
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`⚡ تم معالجة ${processedCount}/${products.length} منتج...`);
        }
      }

      console.log(`\n✅ تم إنشاء ${catalogEntries.length} إدخال في الكتالوج`);

      // Convert to CSV
      const csvContent = this.convertToCSV(catalogEntries);

      // Save catalog
      const filePath = await this.saveCatalog(csvContent);
      
      // Generate summary
      this.generateSummary(catalogEntries);

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
   * Convert catalog entries to CSV format
   */
  convertToCSV(catalogEntries) {
    if (catalogEntries.length === 0) return '';

    // Create header
    const header = GOOGLE_SHOPPING_FIELDS.join(',');
    
    // Create rows
    const rows = catalogEntries.map(entry => {
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
   * Save catalog to file
   */
  async saveCatalog(csvContent) {
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
  generateSummary(catalogEntries) {
    console.log('\n📈 ملخص الكتالوج:');
    console.log('================');
    console.log(`📦 إجمالي الإدخالات: ${catalogEntries.length}`);
    console.log(`🌐 اللغة: العربية`);
    console.log(`💰 العملة: ${this.currency}`);
    console.log(`🏪 العلامة التجارية: ${this.brand}`);
    console.log(`🎯 الدولة المستهدفة: ${this.country}`);
    console.log('\n📋 الفئات المدعومة:');
    console.log('  • القهوة العربية');
    console.log('  • تحميص الإسبريسو');
    console.log('  • قهوة مقطرة');
    console.log('  • خلطات مخصصة');
    console.log('\n📝 تعليمات الاستخدام:');
    console.log('  1. ارفع الملف إلى Google Merchant Center');
    console.log('  2. حدد اللغة العربية والدولة الإمارات');
    console.log('  3. تأكد من تفعيل الشحن المجاني');
    console.log('  4. راجع المنتجات المرفوضة وأصلحها');
  }
}

// Main execution
async function main() {
  const generator = new GoogleShoppingGenerator();
  
  try {
    await generator.generateCatalog();
  } catch (error) {
    console.error('فشل في إنشاء الكتالوج:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = GoogleShoppingGenerator; 