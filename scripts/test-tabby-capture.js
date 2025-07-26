/**
 * Tabby Payment Capture Test Script
 * 
 * This script tests the Tabby payment capture functionality
 * according to the API specification provided.
 * 
 * Usage:
 *   node scripts/test-tabby-capture.js <payment_id> [amount] [partial]
 * 
 * Examples:
 *   node scripts/test-tabby-capture.js payment_123456789 100.00
 *   node scripts/test-tabby-capture.js payment_123456789 50.00 partial
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com';
const API_ENDPOINT = `${BASE_URL}/api/payments`;

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Usage: node test-tabby-capture.js <payment_id> [amount] [partial]');
  console.error('   Examples:');
  console.error('     node test-tabby-capture.js payment_123456789 100.00');
  console.error('     node test-tabby-capture.js payment_123456789 50.00 partial');
  process.exit(1);
}

const paymentId = args[0];
const amount = args[1] || '100.00';
const isPartial = args[2] === 'partial';

console.log('🧪 TABBY CAPTURE TEST');
console.log('=====================');
console.log(`Payment ID: ${paymentId}`);
console.log(`Amount: ${amount} AED`);
console.log(`Type: ${isPartial ? 'Partial' : 'Full'} capture`);
console.log('');

// Test payload according to Tabby API specification
const testPayload = {
  amount: amount,
  reference_id: `test_capture_${paymentId}_${Date.now()}`,
  tax_amount: "5.00",
  shipping_amount: "0.00", 
  discount_amount: "0.00",
  created_at: new Date().toISOString(),
  items: [
    {
      title: "Green Roasteries Premium Coffee",
      description: "Premium Arabica coffee blend",
      quantity: 1,
      unit_price: amount,
      discount_amount: "0.00",
      reference_id: "GR-COFFEE-001",
      image_url: `${BASE_URL}/images/coffee-premium.jpg`,
      product_url: `${BASE_URL}/shop`,
      gender: "Other",
      category: "Coffee",
      color: "brown",
      product_material: "organic",
      size_type: "weight",
      size: "250g",
      brand: "Green Roasteries",
      is_refundable: true,
      barcode: `GR${Date.now()}`,
      ppn: "GR-COFFEE-001",
      seller: "Green Roasteries"
    }
  ]
};

// Test function
async function testCapture() {
  try {
    console.log('📞 Step 1: Testing capture API endpoint...');
    console.log(`POST ${API_ENDPOINT}/${paymentId}/captures`);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    const response = await makeRequest('POST', `${API_ENDPOINT}/${paymentId}/captures`, testPayload);
    
    if (response.error) {
      console.error('❌ CAPTURE FAILED:');
      console.error('Status:', response.status);
      console.error('Error:', response.error);
      console.error('Details:', response.details || 'No additional details');
      
      if (response.status === 400) {
        console.log('');
        console.log('💡 Common issues:');
        console.log('   - Payment must be in AUTHORIZED status');
        console.log('   - Amount format must be correct (e.g., "100.00")');
        console.log('   - Payment ID must exist in Tabby system');
      }
      
      return;
    }

    console.log('✅ CAPTURE SUCCESSFUL!');
    console.log('');
    console.log('📋 RESPONSE DETAILS:');
    console.log('====================');
    console.log(`Payment ID: ${response.id}`);
    console.log(`Status: ${response.status}`);
    console.log(`Amount: ${response.amount} ${response.currency}`);
    console.log(`Created: ${response.created_at}`);
    console.log(`Expires: ${response.expires_at}`);
    console.log(`Test Mode: ${response.is_test}`);
    console.log('');

    if (response.captures && response.captures.length > 0) {
      console.log('📦 CAPTURES:');
      response.captures.forEach((capture, index) => {
        console.log(`  Capture ${index + 1}:`);
        console.log(`    ID: ${capture.id}`);
        console.log(`    Amount: ${capture.amount}`);
        console.log(`    Reference: ${capture.reference_id}`);
        console.log(`    Created: ${capture.created_at}`);
      });
      console.log('');
    }

    console.log('🔍 Step 2: Verifying capture details...');
    const verifyResponse = await makeRequest('GET', `${API_ENDPOINT}/${paymentId}/captures`);
    
    if (verifyResponse.error) {
      console.warn('⚠️ Could not verify capture details:', verifyResponse.error);
    } else {
      console.log('✅ VERIFICATION SUCCESSFUL:');
      console.log(`Total Captured: ${verifyResponse.total_captured} AED`);
      console.log(`Number of Captures: ${verifyResponse.captures.length}`);
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Helper function to make HTTP requests
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tabby-Capture-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (res.statusCode >= 400) {
            response.status = res.statusCode;
          }
          
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
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

// Run the test
console.log('🚀 Starting Tabby capture test...');
console.log('');
testCapture().catch(console.error); 