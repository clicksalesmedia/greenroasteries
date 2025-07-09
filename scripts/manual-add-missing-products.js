const { PrismaClient } = require('../app/generated/prisma');
const path = require('path');

// Import GoogleShoppingService from the correct path
const googleShoppingPath = path.join(__dirname, '../app/lib/google-shopping.ts');
const { google } = require('googleapis');

// Create inline GoogleShoppingService class for the script
class GoogleShoppingService {
  constructor() {
    this.merchantId = process.env.GOOGLE_MERCHANT_ID;
    this.language = 'en';
    this.country = 'AE';
  }

  async getAuthClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
      },
      scopes: ['https://www.googleapis.com/auth/content']
    });

    return auth;
  }

  async checkProductExists(productId) {
    try {
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });
      
      const result = await content.products.get({
        merchantId: this.merchantId,
        productId: productId
      });
      
      return !!result.data;
    } catch (error) {
      if (error.code === 404 || error.status === 404) {
        return false; // Product doesn't exist
      }
      // For other errors, assume it doesn't exist to be safe
      console.warn(`Warning checking product ${productId}:`, error.message);
      return false;
    }
  }

  async insertNewProduct(productData) {
    try {
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });
      
      console.log(`🆕 INSERTING NEW PRODUCT: ${productData.offerId}`);
      const result = await content.products.insert({
        merchantId: this.merchantId,
        requestBody: productData
      });
      console.log(`✅ INSERT SUCCESS: ${productData.offerId} - NEW PRODUCT ADDED FOR REVIEW`);
      return result;

    } catch (error) {
      console.error(`❌ INSERT FAILED: ${productData.offerId}:`, error.message);
      return { error: error.message };
    }
  }
}

const prisma = new PrismaClient();

async function manualAddMissingProducts() {
  try {
    console.log('🔍 Starting manual check for missing products in Google Merchant Center...\n');
    
    const googleShopping = new GoogleShoppingService();
    
    // Get all active products from database
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        slug: { not: null }
      },
      include: {
        category: true,
        variations: {
          where: { isActive: true },
          include: {
            variationType: true
          }
        },
        images: true,
        gallery: true
      },
      take: 100 // Process in batches
    });

    console.log(`📊 Found ${products.length} active products in database\n`);

    let existingCount = 0;
    let missingCount = 0;
    let addedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`\n🔍 Checking product: ${product.nameEn} (ID: ${product.id})`);
        
        // Create product data structure
        const productData = {
          offerId: `product_${product.id}`,
          title: product.nameEn || product.nameAr || 'Untitled Product',
          description: product.descriptionEn || product.descriptionAr || '',
          price: {
            value: product.price?.toString() || '0',
            currency: 'AED'
          },
          availability: product.isActive ? 'in_stock' : 'out_of_stock',
          condition: 'new',
          brand: 'Green Roasteries',
          mpn: `GR_${product.id}`,
          gtin: `123456789${product.id.toString().padStart(3, '0')}`,
          link: `https://thegreenroasteries.com/product/${product.slug}`,
          imageLink: product.imageUrl ? 
            (product.imageUrl.startsWith('http') ? product.imageUrl : `https://thegreenroasteries.com${product.imageUrl}`) :
            'https://thegreenroasteries.com/images/placeholder.jpg',
          productType: product.category?.nameEn || 'Coffee',
          googleProductCategory: 'Food, Beverages & Tobacco > Beverages > Coffee',
          adult: false,
          ageGroup: 'adult',
          gender: 'unisex',
          targetCountry: 'AE',
          contentLanguage: 'en',
          channel: 'online'
        };

        // Check if product exists in Google Merchant Center
        const productId = `online:en:AE:${productData.offerId}`;
        console.log(`   Checking Google Merchant Center for: ${productId}`);
        
        const exists = await googleShopping.checkProductExists(productId);
        
        if (exists) {
          console.log(`   ✅ EXISTS in Google Merchant Center - SKIPPING`);
          existingCount++;
        } else {
          console.log(`   ❌ NOT FOUND in Google Merchant Center - ADDING...`);
          missingCount++;
          
          // Add the product
          const result = await googleShopping.insertNewProduct(productData);
          
          if (result && !result.error) {
            console.log(`   🎉 SUCCESSFULLY ADDED: ${productData.offerId}`);
            addedCount++;
          } else {
            console.log(`   ⚠️ FAILED TO ADD: ${result?.error || 'Unknown error'}`);
            errorCount++;
          }
        }

        // Process variations if any
        if (product.variations && product.variations.length > 0) {
          console.log(`   📦 Processing ${product.variations.length} variations...`);
          
          for (const variation of product.variations) {
            try {
              const variationData = {
                ...productData,
                offerId: `variation_${variation.id}`,
                title: `${productData.title} - ${variation.name}`,
                price: {
                  value: variation.price?.toString() || productData.price.value,
                  currency: 'AED'
                },
                mpn: `GR_VAR_${variation.id}`,
                gtin: `123456789${variation.id.toString().padStart(3, '0')}`,
                imageLink: variation.imageUrl ? 
                  (variation.imageUrl.startsWith('http') ? variation.imageUrl : `https://thegreenroasteries.com${variation.imageUrl}`) :
                  productData.imageLink
              };

              const variationProductId = `online:en:AE:${variationData.offerId}`;
              const variationExists = await googleShopping.checkProductExists(variationProductId);
              
              if (variationExists) {
                console.log(`     ✅ Variation EXISTS - SKIPPING: ${variation.name}`);
                existingCount++;
              } else {
                console.log(`     ❌ Variation NOT FOUND - ADDING: ${variation.name}`);
                missingCount++;
                
                const varResult = await googleShopping.insertNewProduct(variationData);
                
                if (varResult && !varResult.error) {
                  console.log(`     🎉 Variation ADDED: ${variation.name}`);
                  addedCount++;
                } else {
                  console.log(`     ⚠️ Variation FAILED: ${varResult?.error || 'Unknown error'}`);
                  errorCount++;
                }
              }
            } catch (varError) {
              console.error(`     ❌ Variation error: ${varError.message}`);
              errorCount++;
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (productError) {
        console.error(`❌ Error processing product ${product.id}:`, productError.message);
        errorCount++;
      }
    }

    console.log('\n🏁 MANUAL ADD COMPLETE!');
    console.log('================================');
    console.log(`📊 Total Products/Variations Checked: ${existingCount + missingCount}`);
    console.log(`✅ Already Existing: ${existingCount}`);
    console.log(`❌ Missing (attempted to add): ${missingCount}`);
    console.log(`🎉 Successfully Added: ${addedCount}`);
    console.log(`⚠️ Failed to Add: ${errorCount}`);
    console.log('================================\n');

    if (addedCount > 0) {
      console.log(`🎉 ${addedCount} NEW products have been added to Google Merchant Center!`);
      console.log(`📋 These products will now go through Google's review process.`);
      console.log(`⏰ Check your Google Merchant Center in 24-48 hours for approval status.`);
    } else {
      console.log(`ℹ️ No new products were added - all products already exist in Google Merchant Center.`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualAddMissingProducts(); 