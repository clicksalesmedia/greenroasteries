#!/usr/bin/env node

/**
 * 📱 META CATALOG FEED GENERATOR
 * 
 * Creates a comprehensive product catalog for Meta Commerce Manager
 * Includes both English and Arabic products with all variations
 * Generates CSV format compatible with Meta's requirements
 */

const { PrismaClient } = require('../app/generated/prisma');
const fs = require('fs');
const path = require('path');

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

class MetaCatalogGenerator {
  constructor() {
    this.baseUrl = 'https://thegreenroasteries.com';
    this.currency = 'AED';
    this.brand = 'Green Roasteries';
    this.brandAr = 'المحامص الخضراء';
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
   * Clean and limit text for Meta
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
      'مكسرات': 'Food, Beverages & Tobacco > Food Items > Snack Foods > Nuts & Seeds'
    };

    const key = categoryName.toLowerCase();
    return categoryMap[key] || 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  /**
   * Convert product to Meta format (English)
   */
  convertProductToMeta(product, language = 'en') {
    const isArabic = language === 'ar';
    
    // Use appropriate language content
    const title = isArabic && product.nameAr ? product.nameAr : product.name;
    const description = isArabic && product.descriptionAr ? product.descriptionAr : (product.description || product.name);
    const categoryName = isArabic && product.category.nameAr ? product.category.nameAr : product.category.name;
    const brand = isArabic ? this.brandAr : this.brand;

    // Generate URLs
    const slug = this.generateSlug(product.name); // Keep English slug for consistency
    const link = `${this.baseUrl}/product/${slug}${isArabic ? '?lang=ar' : ''}`;

    // Process images
    const mainImage = this.makeAbsoluteUrl(product.imageUrl || (product.images[0]?.url || ''));
    const additionalImages = product.images
      .slice(1, 11) // Max 10 additional images
      .map(img => this.makeAbsoluteUrl(img.url))
      .filter(url => url && url !== mainImage)
      .join(',');

    // Create base product entry
    const baseProduct = {
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
      sale_price: '', // Add if product has discount
      item_group_id: product.id, // Same for all variations
      color: 'Brown',
      size: '', // Will be filled for variations
      material: isArabic ? 'قهوة' : 'Coffee',
      gender: 'unisex',
      age_group: 'adult',
      custom_label_0: language, // Language
      custom_label_1: product.origin || (isArabic ? 'أصل مميز' : 'Premium Origin'), // Origin
      custom_label_2: categoryName, // Category in local language
      custom_label_3: isArabic ? 'تحميص متوسط' : 'Medium Roast', // Roast type
      custom_label_4: isArabic ? 'حبوب عربية' : 'Arabica Beans' // Beans type
    };

    return baseProduct;
  }

  /**
   * Convert product variation to Meta format
   */
  convertVariationToMeta(baseProduct, product, variation, language = 'en') {
    const isArabic = language === 'ar';
    
    // Create variation-specific title
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

    // Create variation entry
    const variationProduct = {
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

    return variationProduct;
  }

  /**
   * Generate complete catalog
   */
  async generateCatalog() {
    console.log('🚀 Starting Meta Catalog Generation...\n');

    try {
      // Fetch all active products with relations
      console.log('📋 Fetching products from database...');
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
      let processedCount = 0;

      for (const product of products) {
        console.log(`   Processing: ${product.name}...`);

        // Generate entries for both languages
        const languages = ['en', 'ar'];
        
        for (const language of languages) {
          // Skip Arabic if no Arabic content
          if (language === 'ar' && !product.nameAr) {
            continue;
          }

          const baseMetaProduct = this.convertProductToMeta(product, language);

          // If product has variations, create entries for each variation
          if (product.variations && product.variations.length > 0) {
            for (const variation of product.variations) {
              const variationEntry = this.convertVariationToMeta(baseMetaProduct, product, variation, language);
              catalogEntries.push(variationEntry);
            }
          } else {
            // No variations, add base product
            catalogEntries.push(baseMetaProduct);
          }
        }

        processedCount++;
      }

      console.log(`\n✅ Processed ${processedCount} products`);
      console.log(`📦 Generated ${catalogEntries.length} catalog entries`);

      return catalogEntries;

    } catch (error) {
      console.error('❌ Error generating catalog:', error);
      throw error;
    }
  }

  /**
   * Convert catalog entries to CSV
   */
  convertToCSV(catalogEntries) {
    console.log('\n📄 Converting to CSV format...');

    // Create CSV header
    const header = META_FIELDS.join(',');
    
    // Create CSV rows
    const rows = catalogEntries.map(entry => {
      return META_FIELDS.map(field => {
        const value = entry[field] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Save CSV to file
   */
  async saveCatalog(csvContent) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `meta-catalog-feed-${timestamp}.csv`;
    const filePath = path.join(process.cwd(), 'public', fileName);

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    const fileUrl = `${this.baseUrl}/${fileName}`;
    
    console.log(`\n✅ Catalog saved to: ${filePath}`);
    console.log(`🌐 Public URL: ${fileUrl}`);
    console.log(`📊 File size: ${(csvContent.length / 1024).toFixed(2)} KB`);

    return { filePath, fileUrl, fileName };
  }

  /**
   * Generate summary report
   */
  generateSummary(catalogEntries) {
    const summary = {
      totalProducts: catalogEntries.length,
      englishProducts: catalogEntries.filter(e => e.custom_label_0 === 'en').length,
      arabicProducts: catalogEntries.filter(e => e.custom_label_0 === 'ar').length,
      inStockProducts: catalogEntries.filter(e => e.availability === 'in stock').length,
      outOfStockProducts: catalogEntries.filter(e => e.availability === 'out of stock').length,
      categories: [...new Set(catalogEntries.map(e => e.product_type))],
      avgPrice: catalogEntries.reduce((sum, e) => sum + parseFloat(e.price.split(' ')[0]), 0) / catalogEntries.length
    };

    console.log('\n📊 CATALOG SUMMARY');
    console.log('==================');
    console.log(`📦 Total Products: ${summary.totalProducts}`);
    console.log(`🇺🇸 English Products: ${summary.englishProducts}`);
    console.log(`🇦🇪 Arabic Products: ${summary.arabicProducts}`);
    console.log(`✅ In Stock: ${summary.inStockProducts}`);
    console.log(`❌ Out of Stock: ${summary.outOfStockProducts}`);
    console.log(`💰 Average Price: ${summary.avgPrice.toFixed(2)} AED`);
    console.log(`📂 Categories: ${summary.categories.length}`);
    console.log('\n📂 Categories Found:');
    summary.categories.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat}`);
    });

    return summary;
  }
}

async function main() {
  console.log(`
📱 META CATALOG FEED GENERATOR
===============================

Creating comprehensive product catalog for Meta Commerce Manager
Including English and Arabic products with all variations
`);

  const generator = new MetaCatalogGenerator();

  try {
    // Generate catalog entries
    const catalogEntries = await generator.generateCatalog();
    
    // Convert to CSV
    const csvContent = generator.convertToCSV(catalogEntries);
    
    // Save file
    const fileInfo = await generator.saveCatalog(csvContent);
    
    // Generate summary
    const summary = generator.generateSummary(catalogEntries);

    console.log(`
🎉 META CATALOG GENERATION COMPLETE!
====================================

📁 File Details:
   • Name: ${fileInfo.fileName}
   • Location: ./public/${fileInfo.fileName}
   • Public URL: ${fileInfo.fileUrl}
   • Size: ${(csvContent.length / 1024).toFixed(2)} KB

📱 Next Steps for Meta Commerce Manager:
   1. Copy this URL: ${fileInfo.fileUrl}
   2. Go to Meta Commerce Manager
   3. Choose "Use a URL" upload method
   4. Paste the URL above
   5. Upload and review your catalog

🔄 The feed includes:
   ✅ ${summary.englishProducts} English products
   ✅ ${summary.arabicProducts} Arabic products  
   ✅ All product variations with sizes/types
   ✅ Multiple product images
   ✅ Proper categorization
   ✅ Stock status and pricing

🌐 Your Meta catalog is ready! 🚀
`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MetaCatalogGenerator; 