const { google } = require('googleapis');

async function testGoogleShoppingAPI() {
  try {
    console.log('🔍 Testing Google Shopping API connection...\n');

    // Parse Google service account credentials  
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/content']
    });

    const content = google.content({ version: 'v2.1', auth });
    const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID;

    console.log(`📊 Merchant ID: ${merchantId}`);
    console.log(`🔑 Client Email: ${credentials.client_email}\n`);

    // Get ALL products from Google Merchant Center  
    console.log('📋 Fetching ALL products from Google Merchant Center...');
    let allProducts = [];
    let nextPageToken = null;
    
    do {
      try {
        const response = await content.products.list({
          merchantId: merchantId,
          maxResults: 250,
          pageToken: nextPageToken
        });

        if (response.data.resources) {
          allProducts = allProducts.concat(response.data.resources);
        }
        nextPageToken = response.data.nextPageToken;
      } catch (error) {
        console.error('❌ Error fetching products:', error.message);
        break;
      }
    } while (nextPageToken);

    console.log(`✅ Found ${allProducts.length} total products in Google Merchant Center\n`);

    // Analyze product patterns
    const productPatterns = {
      'product_': 0,
      'variation_': 0,
      'other': 0
    };

    console.log('📱 ALL Google Merchant Center products:');
    allProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Offer ID: ${product.offerId}`);
      console.log(`      Brand: ${product.brand || 'N/A'}`);
      
      // Count patterns
      if (product.offerId?.startsWith('product_')) {
        productPatterns['product_']++;
      } else if (product.offerId?.startsWith('variation_')) {
        productPatterns['variation_']++;
      } else {
        productPatterns['other']++;
      }
      
      console.log('      ---');
    });

    console.log('\n📊 Product Pattern Analysis:');
    console.log(`   Products with "product_" prefix: ${productPatterns['product_']}`);
    console.log(`   Products with "variation_" prefix: ${productPatterns['variation_']}`);
    console.log(`   Products with other patterns: ${productPatterns['other']}`);
    
    if (productPatterns['product_'] === 0 && productPatterns['variation_'] === 0) {
      console.log('\n❗ DIAGNOSIS: None of your 97 Google products were created by our sync system!');
      console.log('This means your 90 database products are completely NEW and should be added.');
      console.log('The existing 97 products were likely uploaded manually or by a different system.');
    } else {
      console.log('\n✅ Some products were created by our sync system.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testGoogleShoppingAPI(); 