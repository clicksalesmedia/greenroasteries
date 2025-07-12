#!/usr/bin/env node

/**
 * 🛍️ GOOGLE SHOPPING ARABIC FEED GENERATOR
 * 
 * Creates a Google Shopping feed specifically for Arabic products
 * Complements the existing Meta catalog system
 * Generates XML format compatible with Google Merchant Center
 */

const { PrismaClient } = require('../app/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class GoogleShoppingArabicFeedGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'المحامص الخضراء'; // Arabic brand name
    this.country = 'AE';
    this.language = 'ar';
    this.merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || '5602274425';
  }

  /**
   * Clean and escape text for XML
   */
  cleanText(text, maxLength = 5000) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\n/g, ' ')
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
   * Convert product to Google Shopping XML format
   */
  convertProductToGoogleXML(product) {
    // Skip if no Arabic name
    if (!product.nameAr) return [];

    const slug = this.generateSlug(product.name);
    const link = `${this.baseUrl}/product/${slug}?lang=ar`;
    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));
    
    // Additional images (up to 10)
    const additionalImages = product.images
      .slice(1, 11)
      .map(img => this.makeAbsoluteUrl(img.url))
      .filter(url => url && url !== mainImage);

    const categoryName = product.category.nameAr || product.category.name;
    
    const entries = [];

    // If product has variations, create entries for each variation
    if (product.variations && product.variations.length > 0) {
      product.variations.forEach(variation => {
        if (variation.isActive && variation.stockQuantity > 0) {
          const variationEntry = this.createVariationXMLEntry(product, variation, {
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
      const productEntry = this.createProductXMLEntry(product, {
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
   * Create XML entry for product variation
   */
  createVariationXMLEntry(product, variation, options) {
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
      (variation.price * (1 - variation.discount / 100)).toFixed(2) : 
      null;

    return `
    <item>
      <g:id>ar_${variation.id}</g:id>
      <g:title>${this.cleanText(variationTitle, 150)}</g:title>
      <g:description>${this.cleanText(product.descriptionAr || product.description || product.nameAr, 5000)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${variationImage}</g:image_link>
      ${additionalImages.map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${variation.stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${variation.price.toFixed(2)} ${this.currency}</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} ${this.currency}</g:sale_price>` : ''}
      <g:condition>new</g:condition>
      <g:brand>${this.brand}</g:brand>
      <g:gtin>${variation.sku || ''}</g:gtin>
      <g:mpn>${variation.sku || variation.id}</g:mpn>
      <g:item_group_id>${product.id}</g:item_group_id>
      <g:google_product_category>${this.mapToGoogleCategory(categoryName)}</g:google_product_category>
      <g:product_type>${this.cleanText(categoryName)}</g:product_type>
      <g:color>بني</g:color>
      <g:size>${sizeDisplay}</g:size>
      <g:material>قهوة</g:material>
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:target_country>${this.country}</g:target_country>
      <g:content_language>${this.language}</g:content_language>
      <g:shipping>
        <g:country>${this.country}</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 ${this.currency}</g:price>
      </g:shipping>
      <g:custom_label_0>arabic</g:custom_label_0>
      <g:custom_label_1>${product.origin || 'الإمارات'}</g:custom_label_1>
      <g:custom_label_2>${categoryName}</g:custom_label_2>
      <g:custom_label_3>${variation.type?.arabicName || 'تحميص متوسط'}</g:custom_label_3>
      <g:custom_label_4>${variation.beans?.arabicName || 'حبوب عربية'}</g:custom_label_4>
    </item>`;
  }

  /**
   * Create XML entry for single product
   */
  createProductXMLEntry(product, options) {
    const { slug, link, mainImage, additionalImages, categoryName } = options;
    
    // Calculate sale price if discount exists
    const salePrice = product.discount > 0 ? 
      (product.price * (1 - product.discount / 100)).toFixed(2) : 
      null;

    return `
    <item>
      <g:id>ar_${product.id}</g:id>
      <g:title>${this.cleanText(product.nameAr, 150)}</g:title>
      <g:description>${this.cleanText(product.descriptionAr || product.description || product.nameAr, 5000)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${mainImage}</g:image_link>
      ${additionalImages.map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price.toFixed(2)} ${this.currency}</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} ${this.currency}</g:sale_price>` : ''}
      <g:condition>new</g:condition>
      <g:brand>${this.brand}</g:brand>
      <g:gtin>${product.sku || ''}</g:gtin>
      <g:mpn>${product.sku || product.id}</g:mpn>
      <g:google_product_category>${this.mapToGoogleCategory(categoryName)}</g:google_product_category>
      <g:product_type>${this.cleanText(categoryName)}</g:product_type>
      <g:color>بني</g:color>
      <g:material>قهوة</g:material>
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:target_country>${this.country}</g:target_country>
      <g:content_language>${this.language}</g:content_language>
      <g:shipping>
        <g:country>${this.country}</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 ${this.currency}</g:price>
      </g:shipping>
      <g:custom_label_0>arabic</g:custom_label_0>
      <g:custom_label_1>${product.origin || 'الإمارات'}</g:custom_label_1>
      <g:custom_label_2>${categoryName}</g:custom_label_2>
      <g:custom_label_3>تحميص متوسط</g:custom_label_3>
      <g:custom_label_4>حبوب عربية</g:custom_label_4>
    </item>`;
  }

  /**
   * Generate XML header
   */
  generateXMLHeader() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>المحامص الخضراء - منتجات القهوة العربية</title>
    <description>منتجات القهوة العربية عالية الجودة من المحامص الخضراء</description>
    <link>${this.baseUrl}</link>`;
  }

  /**
   * Generate XML footer
   */
  generateXMLFooter() {
    return `
  </channel>
</rss>`;
  }

  /**
   * Generate complete feed
   */
  async generateFeed() {
    console.log('🚀 بدء إنشاء كتالوج القهوة العربية لـ Google Shopping...\n');

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

      // Generate XML entries
      const xmlEntries = [];
      let processedCount = 0;

      for (const product of products) {
        const entries = this.convertProductToGoogleXML(product);
        xmlEntries.push(...entries);
        processedCount++;
        
        if (processedCount % 10 === 0) {
          console.log(`⚡ تم معالجة ${processedCount}/${products.length} منتج...`);
        }
      }

      console.log(`\n✅ تم إنشاء ${xmlEntries.length} إدخال في الكتالوج`);

      // Generate complete XML
      const xmlContent = this.generateXMLHeader() + '\n' + xmlEntries.join('\n') + this.generateXMLFooter();

      // Save to file
      const filePath = await this.saveFeed(xmlContent);
      
      // Generate summary
      this.generateSummary(xmlEntries.length, products.length);

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
  async saveFeed(xmlContent) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `google-shopping-arabic-feed-${timestamp}.xml`;
    const filePath = path.join(process.cwd(), 'public', filename);

    await fs.promises.writeFile(filePath, xmlContent, 'utf8');
    
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
    console.log(`  ${this.baseUrl}/google-shopping-arabic-feed-${new Date().toISOString().slice(0, 10)}.xml`);
  }
}

// Main execution
async function main() {
  const generator = new GoogleShoppingArabicFeedGenerator();
  
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

module.exports = GoogleShoppingArabicFeedGenerator; 