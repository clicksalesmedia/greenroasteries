const https = require('https');
const fs = require('fs');

async function makeAPIRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Green-Roasteries-Sync/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function syncTargetedCategories() {
  try {
    console.log('🎯 TARGETED GOOGLE MERCHANT CENTER SYNC');
    console.log('=====================================\n');
    
    // Target product IDs for Chocolate and Green Roaster's Picks
    const chocolateProductIds = [
      '16fc9826-e7f0-4bc5-83da-c33c4f9c5d9b', // Choco Moments 26 Pieces
      '1e673775-1db8-414e-bd1e-1ebea2763ecb', // Choco Touch 18 Pieces
      'a096c26d-3ecb-4c0b-bd29-0adddd7c25b5', // Choco Harmony 34 Pieces
      '41627eaa-9012-4591-9166-2976a86a8302', // Choco Delight 36 Pieces
      'e8acb690-7728-4b29-a126-f8f3110d6ed5', // Choco Elegance 16 Pieces
      'f0ffb6d1-4bd0-4ec5-aa7f-06adf09d2816', // Choco Balance 54 Pieces
      'd344d945-5294-416b-b54b-1bbf597a1591', // Choco Prestige 50 Pieces
      'beec3382-5996-49b3-9965-2aaf231146dc', // Choco Magic 46 Pieces
      '906331a8-34c3-4421-8af3-d9986d8c3cc9'  // Taste Collection 27 Pieces
    ];

    const greenRoasterProductIds = [
      '1a92fce3-6401-4e59-81b0-770b4a7743bd', // Nicaragua Coffee & Salted Nut Mix
      '3403c6ed-57f8-460f-8f31-7f1fc50cdfa8', // Al Dhaid Arabic Coffee & BBQ Mix Nuts
      '180d6028-16c7-4786-96e2-2c9182583cbd', // Espresso & Fine Chocolates
      'c20597c1-6e8e-469f-964b-55f9027ba381', // Ethiopia Espresso Harar & Chocolate Box
      '2a817084-036a-4e6c-8a30-e8a100a800d5', // House Blend Espresso & Small Chocolate Box
      '2934430b-a1eb-4f9c-9b6b-c3e8069f3e59', // Colombia Filter Coffee & Big Chocolate Box
      '896c66ba-bf58-4680-9034-ad1ccd10207f', // Kenya Coffee & Roasted Nuts
      'aaae1286-7927-4536-8af5-4879be3ceb62'  // Nicaragua Filter Coffee & Premium Chocolates
    ];

    const allTargetProductIds = [...chocolateProductIds, ...greenRoasterProductIds];
    
    console.log(`📦 Total products to sync: ${allTargetProductIds.length}`);
    console.log(`   - Chocolate products: ${chocolateProductIds.length}`);
    console.log(`   - Green Roaster's Picks: ${greenRoasterProductIds.length}\n`);

    // First, let's test with a dry run
    console.log('🔍 Running dry run validation first...\n');
    
    const dryRunPayload = {
      productIds: allTargetProductIds,
      includeVariations: true,
      dryRun: true,
      batchSize: 50
    };

    console.log('Making API request to: https://thegreenroasteries.com/api/google-shopping/sync');
    const dryRunResponse = await makeAPIRequest(
      'https://thegreenroasteries.com/api/google-shopping/sync',
      'POST',
      dryRunPayload
    );

    if (dryRunResponse.status !== 200) {
      console.error(`❌ Dry run failed with status ${dryRunResponse.status}:`, dryRunResponse.data);
      return;
    }

    const dryRunResults = dryRunResponse.data;
    console.log('✅ Dry run completed successfully!');
    console.log(`   - Products validated: ${dryRunResults.successCount}`);
    console.log(`   - Validation errors: ${dryRunResults.errorCount}\n`);

    if (dryRunResults.errorCount > 0) {
      console.log('⚠️ Validation errors found:');
      dryRunResults.errors?.forEach(error => {
        console.log(`   - ${error.productName}: ${error.error}`);
      });
      console.log('');
    }

    if (dryRunResults.successCount === 0) {
      console.log('❌ No products validated successfully. Aborting actual sync.');
      return;
    }

    // Now perform actual sync
    console.log('🚀 Starting actual sync to Google Merchant Center...\n');
    
    const syncPayload = {
      productIds: allTargetProductIds,
      includeVariations: true,
      dryRun: false,
      batchSize: 20 // Smaller batch for actual sync
    };

    const syncResponse = await makeAPIRequest(
      'https://thegreenroasteries.com/api/google-shopping/sync',
      'POST',
      syncPayload
    );

    if (syncResponse.status !== 200) {
      console.error(`❌ Sync failed with status ${syncResponse.status}:`, syncResponse.data);
      return;
    }

    const syncResults = syncResponse.data;

    // Summary
    console.log('\n📊 SYNC SUMMARY');
    console.log('===============');
    console.log(`✅ Successfully synced: ${syncResults.successCount} products`);
    console.log(`❌ Failed: ${syncResults.errorCount} products`);
    console.log(`📦 Total processed: ${syncResults.totalProducts} products\n`);

    if (syncResults.syncedProducts && syncResults.syncedProducts.length > 0) {
      console.log('🎉 SUCCESSFULLY SYNCED PRODUCTS:');
      syncResults.syncedProducts.forEach(p => {
        console.log(`   - ${p.productName} (${p.category}) → ${p.googleProductId}`);
        if (p.variations > 0) {
          console.log(`     └─ ${p.variations} variations synced`);
        }
      });
      console.log('');
    }

    if (syncResults.errors && syncResults.errors.length > 0) {
      console.log('⚠️ ERRORS:');
      syncResults.errors.forEach(e => {
        console.log(`   - ${e.productName} (${e.category}): ${e.error}`);
      });
      console.log('');
    }

    console.log('🏁 Sync completed! Check Google Merchant Center to verify products are uploaded.');
    console.log('📱 Login to: https://merchants.google.com/mc/overview\n');

    // Save results to file for reference
    const resultsFile = `sync-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(syncResults, null, 2));
    console.log(`📁 Results saved to: ${resultsFile}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the sync
syncTargetedCategories().catch(console.error); 