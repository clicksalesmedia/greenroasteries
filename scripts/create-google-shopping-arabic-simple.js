#!/usr/bin/env node

/**
 * 🛍️ SIMPLE ARABIC GOOGLE SHOPPING FEED GENERATOR
 * 
 * Creates a Google Shopping CSV feed for Arabic products
 * Uses direct PostgreSQL queries instead of Prisma
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

class SimpleArabicFeedGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'المحامص الخضراء';
    this.country = 'AE';
    this.language = 'ar';
  }

  /**
   * Clean text for CSV
   */
  cleanText(text, maxLength = 5000) {
    if (!text) return '';
    
    return text
      .replace(/"/g, '""')
      .replace(/[\r\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxLength);
  }

  /**
   * Execute PostgreSQL query
   */
  async executeQuery(query) {
    return new Promise((resolve, reject) => {
      const cmd = `sudo -u postgres psql -d greenroasteries -t -c "${query.replace(/"/g, '\\"')}"`;
      
      exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ خطأ في تنفيذ الاستعلام:', error);
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Get products with Arabic names
   */
  async getArabicProducts() {
    console.log('📋 جلب المنتجات العربية من قاعدة البيانات...');
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p."nameAr",
        p.description,
        p."descriptionAr",
        p.price,
        p."imageUrl",
        p."inStock",
        p."stockQuantity",
        p.sku,
        p.origin,
        p.slug,
        c.name as category_name,
        c."nameAr" as category_name_ar
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p."nameAr" IS NOT NULL 
        AND p."inStock" = true
      ORDER BY p."nameAr"
    `;

    const result = await this.executeQuery(query);
    
    if (!result) {
      console.log('⚠️ لا توجد منتجات عربية في قاعدة البيانات');
      return [];
    }

    const rows = result.split('\n').filter(row => row.trim());
    const products = rows.map(row => {
      const columns = row.split('|').map(col => col.trim());
      return {
        id: columns[0],
        name: columns[1],
        nameAr: columns[2],
        description: columns[3],
        descriptionAr: columns[4],
        price: parseFloat(columns[5]) || 0,
        imageUrl: columns[6],
        inStock: columns[7] === 't',
        stockQuantity: parseInt(columns[8]) || 0,
        sku: columns[9],
        origin: columns[10],
        slug: columns[11],
        categoryName: columns[12],
        categoryNameAr: columns[13]
      };
    });

    console.log(`📊 تم العثور على ${products.length} منتج عربي`);
    return products;
  }

  /**
   * Convert product to Google Shopping format
   */
  convertProductToGoogleCSV(product) {
    const productId = product.id;
    const title = this.cleanText(product.nameAr || product.name);
    const description = this.cleanText(product.descriptionAr || product.description || title);
    const categoryName = product.categoryNameAr || product.categoryName || 'قهوة';
    
    // Build product URL
    const productUrl = `${this.baseUrl}/product/${product.slug || productId}`;
    
    // Build image URL
    const imageUrl = product.imageUrl ? 
      (product.imageUrl.startsWith('http') ? product.imageUrl : `${this.baseUrl}${product.imageUrl}`) : 
      `${this.baseUrl}/images/coffee-placeholder.jpg`;

    // Determine availability
    const availability = product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock';

    // Map category to Google category
    const googleCategory = this.mapToGoogleCategory(categoryName);

    return {
      id: productId,
      title: title,
      description: description,
      link: productUrl,
      image_link: imageUrl,
      additional_image_link: '',
      availability: availability,
      price: `${product.price.toFixed(2)} ${this.currency}`,
      sale_price: '',
      condition: 'new',
      brand: this.brand,
      gtin: product.sku || '',
      mpn: product.sku || productId,
      item_group_id: productId,
      google_product_category: googleCategory,
      product_type: categoryName,
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
   * Map category to Google Shopping category
   */
  mapToGoogleCategory(categoryName) {
    const categoryMap = {
      'قهوة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'اسبريسو': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'مقطرة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'خلطات': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'عربية': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'تركية': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'لاتيه': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'كابتشينو': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'موكا': 'Food, Beverages & Tobacco > Beverages > Coffee'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (categoryName.includes(key)) {
        return value;
      }
    }

    return 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  /**
   * Convert to CSV format
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
          return `"${value.replace(/"/g, '""')}"`;
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
    console.log('🚀 بدء إنشاء كتالوج Google Shopping العربي (مبسط)...\n');

    try {
      // Get Arabic products
      const products = await this.getArabicProducts();

      if (products.length === 0) {
        console.log('⚠️ لا توجد منتجات عربية لإنشاء الكتالوج');
        return;
      }

      // Convert to Google Shopping format
      console.log('⚙️ تحويل المنتجات إلى تنسيق Google Shopping...');
      const csvEntries = products.map(product => this.convertProductToGoogleCSV(product));

      // Convert to CSV
      const csvContent = this.convertToCSV(csvEntries);

      // Save to file
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `google-shopping-arabic-feed-${timestamp}.csv`;
      const filePath = path.join(process.cwd(), 'public', filename);

      // Add BOM for proper Arabic text encoding
      const bom = '\uFEFF';
      fs.writeFileSync(filePath, bom + csvContent, 'utf8');

      console.log(`\n✅ تم إنشاء كتالوج Google Shopping العربي بنجاح!`);
      console.log(`📁 الملف: ${filePath}`);
      console.log(`📊 عدد المنتجات: ${products.length}`);
      console.log(`🔗 الرابط: ${this.baseUrl}/${filename}`);

      // Generate summary
      this.generateSummary(products.length);

      return filePath;

    } catch (error) {
      console.error('❌ خطأ في إنشاء الكتالوج:', error);
      throw error;
    }
  }

  /**
   * Generate summary
   */
  generateSummary(totalProducts) {
    console.log('\n📈 ملخص الكتالوج:');
    console.log('================');
    console.log(`📦 إجمالي المنتجات: ${totalProducts}`);
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
  const generator = new SimpleArabicFeedGenerator();
  
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

module.exports = SimpleArabicFeedGenerator; 