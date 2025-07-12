#!/usr/bin/env node

/**
 * 🛍️ DIRECT ARABIC GOOGLE SHOPPING FEED GENERATOR
 * 
 * Creates a Google Shopping CSV feed for Arabic products
 * Uses direct PostgreSQL export without authentication issues
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DirectArabicFeedGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'المحامص الخضراء';
    this.country = 'AE';
    this.language = 'ar';
  }

  /**
   * Generate Arabic product feed using direct PostgreSQL export
   */
  async generateFeed() {
    console.log('🚀 بدء إنشاء كتالوج Google Shopping العربي (مباشر)...\n');

    try {
      // Create the CSV header
      const csvHeader = [
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
      ].join(',');

      // Create SQL query to export Arabic products
      const sqlQuery = `
        SELECT 
          p.id,
          COALESCE(p."nameAr", p.name) as title,
          COALESCE(p."descriptionAr", p.description, p.name) as description,
          '${this.baseUrl}/product/' || COALESCE(p.slug, p.id) as link,
          CASE 
            WHEN p."imageUrl" IS NOT NULL AND p."imageUrl" LIKE 'http%' THEN p."imageUrl"
            WHEN p."imageUrl" IS NOT NULL THEN '${this.baseUrl}' || p."imageUrl"
            ELSE '${this.baseUrl}/images/coffee-placeholder.jpg'
          END as image_link,
          '' as additional_image_link,
          CASE 
            WHEN p."inStock" = true AND p."stockQuantity" > 0 THEN 'in stock'
            ELSE 'out of stock'
          END as availability,
          p.price::text || ' ${this.currency}' as price,
          '' as sale_price,
          'new' as condition,
          '${this.brand}' as brand,
          COALESCE(p.sku, '') as gtin,
          COALESCE(p.sku, p.id) as mpn,
          p.id as item_group_id,
          'Food, Beverages & Tobacco > Beverages > Coffee' as google_product_category,
          COALESCE(c."nameAr", c.name, 'قهوة') as product_type,
          'بني' as color,
          '' as size,
          'قهوة' as material,
          'unisex' as gender,
          'adult' as age_group,
          '${this.country}' as target_country,
          '${this.language}' as content_language,
          '${this.country}::Standard:0.00 ${this.currency}' as shipping,
          'arabic' as custom_label_0,
          COALESCE(p.origin, 'الإمارات') as custom_label_1,
          COALESCE(c."nameAr", c.name, 'قهوة') as custom_label_2,
          'تحميص متوسط' as custom_label_3,
          'حبوب عربية' as custom_label_4
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."nameAr" IS NOT NULL 
          AND p."inStock" = true
        ORDER BY p."nameAr";
      `;

      // Create the CSV file
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `google-shopping-arabic-feed-${timestamp}.csv`;
      const tempFile = `/tmp/arabic_products_${timestamp}.csv`;
      const finalFile = path.join(process.cwd(), 'public', filename);

      console.log('📋 جلب المنتجات العربية من قاعدة البيانات...');

      // Export to temporary file
      const exportCommand = `sudo -u postgres psql -d greenroasteries -c "\\copy (${sqlQuery.replace(/"/g, '\\"')}) TO '${tempFile}' WITH CSV HEADER"`;
      
      await this.executeCommand(exportCommand);

      // Check if file was created
      if (!fs.existsSync(tempFile)) {
        throw new Error('فشل في إنشاء ملف البيانات المؤقت');
      }

      // Read the temporary file and add BOM for Arabic support
      const csvData = fs.readFileSync(tempFile, 'utf8');
      const lines = csvData.split('\n');
      
      console.log(`📊 تم العثور على ${lines.length - 1} منتج عربي`);

      // Add BOM for proper Arabic encoding
      const bom = '\uFEFF';
      fs.writeFileSync(finalFile, bom + csvData, 'utf8');

      // Clean up temporary file
      fs.unlinkSync(tempFile);

      console.log(`\n✅ تم إنشاء كتالوج Google Shopping العربي بنجاح!`);
      console.log(`📁 الملف: ${finalFile}`);
      console.log(`📊 عدد المنتجات: ${lines.length - 1}`);
      console.log(`🔗 الرابط: ${this.baseUrl}/${filename}`);

      // Generate summary
      this.generateSummary(lines.length - 1);

      return finalFile;

    } catch (error) {
      console.error('❌ خطأ في إنشاء الكتالوج:', error);
      throw error;
    }
  }

  /**
   * Execute command with proper error handling
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ خطأ في تنفيذ الأمر:', error);
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
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
    console.log('\n🔄 للتحديث الدوري:');
    console.log('  - أضف هذا الأمر إلى cron job');
    console.log('  - قم بتشغيله مرة يومياً');
    console.log('  - راقب المنتجات الجديدة والمحدثة');
  }
}

// Main execution
async function main() {
  const generator = new DirectArabicFeedGenerator();
  
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

module.exports = DirectArabicFeedGenerator; 