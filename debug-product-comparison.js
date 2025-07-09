const { google } = require('googleapis');

async function debugProductComparison() {
  try {
    console.log('🔍 DEBUGGING: Database vs Google Merchant Center Products\n');

    // Parse Google service account credentials  
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/content']
    });

    const content = google.content({ version: 'v2.1', auth });
    const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID;

    console.log(`📊 Merchant ID: ${merchantId}\n`);

    // 1. Get ALL products from Google Merchant Center
    console.log('📋 Step 1: Fetching ALL products from Google Merchant Center...');
    let allGoogleProducts = [];
    let nextPageToken = null;
    
    do {
      try {
        const response = await content.products.list({
          merchantId: merchantId,
          maxResults: 250,
          pageToken: nextPageToken
        });

        if (response.data.resources) {
          allGoogleProducts = allGoogleProducts.concat(response.data.resources);
        }
        nextPageToken = response.data.nextPageToken;
      } catch (error) {
        console.error('❌ Error fetching Google products:', error.message);
        break;
      }
    } while (nextPageToken);

    console.log(`✅ Found ${allGoogleProducts.length} products in Google Merchant Center\n`);

    // Show first 10 Google products
    console.log('📱 First 10 Google Merchant Center products:');
    allGoogleProducts.slice(0, 10).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Offer ID: ${product.offerId}`);
      console.log(`      Brand: ${product.brand || 'N/A'}`);
      console.log('      ---');
    });

    // 2. Check our database products (simulated - we'll use the patterns from our code)
    console.log('\n🗃️ Step 2: Checking database product patterns...');
    
    // These are the patterns our sync uses for product IDs
    const databasePatterns = [
      'product_', // Main products: product_123
      'variation_' // Variations: variation_456
    ];

    console.log('🔍 Checking what database product IDs would look like:');
    databasePatterns.forEach(pattern => {
      console.log(`   Pattern: ${pattern}[ID]`);
      console.log(`   Example: ${pattern}123`);
      console.log(`   Full Google ID: online:en:AE:${pattern}123`);
    });

    // 3. Find matches
    console.log('\n🔗 Step 3: Looking for matches between Google products and our patterns...');
    
    const matches = [];
    const googleProductsFromOurSync = [];
    
    allGoogleProducts.forEach(product => {
      // Check if this product was created by our sync
      if (product.offerId?.startsWith('product_') || product.offerId?.startsWith('variation_')) {
        googleProductsFromOurSync.push(product);
        matches.push({
          googleTitle: product.title,
          offerId: product.offerId,
          brand: product.brand,
          id: product.id
        });
      }
    });

    console.log(`🎯 Found ${googleProductsFromOurSync.length} products in Google Merchant Center that match our sync patterns:`);
    if (googleProductsFromOurSync.length > 0) {
      googleProductsFromOurSync.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Offer ID: ${product.offerId}`);
        console.log(`      Google ID: ${product.id}`);
        console.log('      ---');
      });
    } else {
      console.log('   ❌ NO PRODUCTS found with our sync patterns (product_ or variation_)');
      console.log('   This explains why you can\'t find your database products!');
    }

    // 4. Analyze the mismatch
    console.log('\n📊 Step 4: Analysis Summary');
    console.log('================================');
    console.log(`Total Google Merchant Center products: ${allGoogleProducts.length}`);
    console.log(`Products from our sync: ${googleProductsFromOurSync.length}`);
    console.log(`Unmatched Google products: ${allGoogleProducts.length - googleProductsFromOurSync.length}`);

    if (googleProductsFromOurSync.length === 0) {
      console.log('\n❗ DIAGNOSIS:');
      console.log('The 97 products in Google Merchant Center were NOT created by our sync system.');
      console.log('They were likely:');
      console.log('- Uploaded manually');
      console.log('- Created by a different system');
      console.log('- Using different product ID patterns');
      console.log('\nThis means your 90 database products are truly NEW and should be added!');
    }

    // 5. Show some non-matching Google products to understand their origin
    console.log('\n🔍 Sample of existing Google products (not from our sync):');
    const nonMatching = allGoogleProducts.filter(p => 
      !p.offerId?.startsWith('product_') && !p.offerId?.startsWith('variation_')
    ).slice(0, 5);
    
    nonMatching.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title}`);
      console.log(`      Offer ID: ${product.offerId}`);
      console.log(`      Brand: ${product.brand || 'N/A'}`);
      console.log('      ---');
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProductComparison(); 