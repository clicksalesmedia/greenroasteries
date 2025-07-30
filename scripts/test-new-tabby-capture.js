/**
 * Test Tabby Payment Capture for New Payment
 * This script tests the capture of payment 69df9fae-137f-4414-be03-8920081a4704
 */

const https = require('https');

const PAYMENT_ID = '69df9fae-137f-4414-be03-8920081a4704';
const CAPTURE_URL = `https://thegreenroasteries.com/api/payments/${PAYMENT_ID}/captures`;

// Capture data according to Tabby specification
const capturePayload = {
  amount: "277.40", // Full amount from the order
  reference_id: `capture_${PAYMENT_ID}_${Date.now()}`,
  tax_amount: "0.00",
  shipping_amount: "0.00", 
  discount_amount: "0.00",
  created_at: new Date().toISOString(),
  items: [
    {
      title: "House Blend Espresso & Small Chocolate Box",
      description: "Premium house blend espresso with small chocolate box from Green Roasteries",
      quantity: 1,
      unit_price: "277.40",
      discount_amount: "0.00",
      reference_id: "2a817084-036a-4e6c-8a30-e8a100a80a80",
      image_url: "https://thegreenroasteries.com/images/coffee-1.jpg",
      product_url: "https://thegreenroasteries.com/shop",
      gender: "Other",
      category: "Coffee",
      color: "brown", 
      product_material: "organic",
      size_type: "weight",
      size: "250g",
      brand: "Green Roasteries",
      is_refundable: true,
      barcode: `GR${Date.now()}`,
      ppn: `GR-2a817084-036a-4e6c-8a30-e8a100a80a80`,
      seller: "Green Roasteries"
    }
  ]
};

console.log('🔵 Testing Tabby Payment Capture for New Payment');
console.log('Payment ID:', PAYMENT_ID);
console.log('Capture URL:', CAPTURE_URL);
console.log('Payload:', JSON.stringify(capturePayload, null, 2));

// Make the capture request
const postData = JSON.stringify(capturePayload);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(CAPTURE_URL, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📋 Response Status:', res.statusCode);
    console.log('📋 Response Headers:', res.headers);
    
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Response Body:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n🎉 CAPTURE SUCCESS!');
        console.log('Payment Status:', response.status);
        console.log('Captured Amount:', response.captures?.[0]?.amount || 'N/A');
      } else {
        console.log('\n❌ CAPTURE FAILED');
        console.log('Error:', response.error || response.message);
      }
    } catch (e) {
      console.log('\n📄 Raw Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.write(postData);
req.end(); 