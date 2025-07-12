#!/usr/bin/env node
const { PrismaClient } = require('../app/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createArabicGoogleShoppingFeed() {
  try {
    console.log('📦 Creating Arabic-only Google Shopping feed...\n');
    
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
    
    console.log(`📊 Found ${products.length} products with Arabic content\n`);
    
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
          
          const finalPrice = variation.discount > 0 ? 
            (variation.price - (variation.discountType === 'PERCENTAGE' ? 
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
    
    console.log(`📦 Generated ${feedItems.length} feed items\n`);
    
    // Generate XML feed
    const xmlFeed = generateXMLFeed(feedItems);
    
    // Generate CSV feed
    const csvFeed = generateCSVFeed(feedItems);
    
    // Save feeds
    const xmlPath = path.join(__dirname, '..', 'public', 'google-shopping-arabic-feed.xml');
    const csvPath = path.join(__dirname, '..', 'public', 'google-shopping-arabic-feed.csv');
    
    fs.writeFileSync(xmlPath, xmlFeed);
    fs.writeFileSync(csvPath, csvFeed);
    
    console.log('✅ Arabic-only Google Shopping feeds created successfully!');
    console.log(`📁 XML feed: ${xmlPath}`);
    console.log(`📁 CSV feed: ${csvPath}`);
    console.log(`🌐 XML URL: https://thegreenroasteries.com/google-shopping-arabic-feed.xml`);
    console.log(`🌐 CSV URL: https://thegreenroasteries.com/google-shopping-arabic-feed.csv`);
    
    // Show sample items
    console.log('\n📝 Sample feed items:');
    feedItems.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - ${item.price}`);
    });
    
    console.log(`\n📊 Feed Statistics:`);
    console.log(`   • Total items: ${feedItems.length}`);
    console.log(`   • Products with variations: ${products.filter(p => p.variations.length > 0).length}`);
    console.log(`   • Products without variations: ${products.filter(p => p.variations.length === 0).length}`);
    console.log(`   • All items are in Arabic! 🇦🇪`);
    
    // Note about database
    console.log('\n💡 Note: Your database remains unchanged. Both Arabic and English content are preserved.');
    console.log('   The feed contains only Arabic content for Google Shopping.');
    
  } catch (error) {
    console.error('❌ Error creating Arabic Google Shopping feed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateXMLFeed(items) {
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

function generateCSVFeed(items) {
  const csvHeader = [
    'id', 'title', 'description', 'price', 'availability', 'condition', 'brand',
    'product_type', 'google_product_category', 'image_link', 'link', 'gtin', 'mpn',
    'age_group', 'gender', 'size', 'custom_label_0', 'custom_label_1', 'custom_label_2',
    'custom_label_3', 'custom_label_4'
  ].join(',');

  const csvRows = items.map(item => [
    item.id,
    `"${item.title.replace(/"/g, '""')}"`,
    `"${item.description.replace(/"/g, '""')}"`,
    item.price,
    item.availability,
    item.condition,
    `"${item.brand}"`,
    `"${item.product_category.replace(/"/g, '""')}"`,
    item.google_product_category,
    item.image_link,
    item.link,
    item.gtin,
    item.mpn,
    item.age_group,
    item.gender,
    `"${item.size.replace(/"/g, '""')}"`,
    `"${item.custom_label_0}"`,
    `"${item.custom_label_1.replace(/"/g, '""')}"`,
    `"${item.custom_label_2.replace(/"/g, '""')}"`,
    `"${item.custom_label_3.replace(/"/g, '""')}"`,
    `"${item.custom_label_4}"`
  ].join(','));

  return csvHeader + '\n' + csvRows.join('\n');
}

// Run the script
createArabicGoogleShoppingFeed().catch(console.error); 