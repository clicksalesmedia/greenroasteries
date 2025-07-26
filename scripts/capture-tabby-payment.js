#!/usr/bin/env node

/**
 * Manual Tabby Payment Capture Script
 * 
 * This script manually captures the specific payment ID mentioned by Tabby team:
 * b166f2b0-373d-4c98-a801-ee062523f664
 */

require('dotenv').config({ path: '.env' });

async function captureTabbyPayment(paymentId) {
  const TABBY_SECRET_KEY = process.env.TABBY_SECRET_KEY;
  const TABBY_MERCHANT_CODE = process.env.TABBY_MERCHANT_CODE || 'GR';
  
  if (!TABBY_SECRET_KEY) {
    console.error('❌ TABBY_SECRET_KEY not found in environment');
    process.exit(1);
  }
  
  console.log('🔍 Capturing Tabby Payment:', paymentId);
  console.log('🔑 Using merchant code:', TABBY_MERCHANT_CODE);
  console.log('🔑 Secret key prefix:', TABBY_SECRET_KEY.substring(0, 10) + '...');
  
  try {
    // Step 1: Retrieve payment details
    console.log('\n📞 Step 1: Retrieving payment details...');
    const getResponse = await fetch(`https://api.tabby.ai/api/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TABBY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const errorData = await getResponse.json().catch(() => null);
      console.error('❌ Failed to retrieve payment:', {
        status: getResponse.status,
        statusText: getResponse.statusText,
        error: errorData
      });
      return;
    }
    
    const paymentDetails = await getResponse.json();
    console.log('✅ Payment retrieved successfully:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      created_at: paymentDetails.created_at,
      expires_at: paymentDetails.expires_at
    });
    
    // Step 2: Check if payment is capturable
    if (paymentDetails.status !== 'AUTHORIZED') {
      console.log(`⚠️ Payment status is "${paymentDetails.status}", not "AUTHORIZED"`);
      console.log('Cannot capture payment that is not in AUTHORIZED state');
      return;
    }
    
    // Step 3: Prepare capture request
    console.log('\n📞 Step 2: Preparing capture request...');
    const capturePayload = {
      amount: paymentDetails.amount,
      reference_id: `manual_capture_${paymentId}_${Date.now()}`,
      tax_amount: paymentDetails.order?.tax_amount || "0.00",
      shipping_amount: paymentDetails.order?.shipping_amount || "0.00",
      discount_amount: paymentDetails.order?.discount_amount || "0.00",
      created_at: new Date().toISOString(),
      items: paymentDetails.order?.items?.map(item => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || "0.00",
        reference_id: item.reference_id,
        image_url: item.image_url,
        product_url: item.product_url,
        ordered: item.quantity,
        captured: item.quantity,
        shipped: 0,
        refunded: 0,
        gender: item.gender || "Other",
        category: item.category,
        color: item.color || "brown",
        product_material: item.product_material || "organic",
        size_type: item.size_type || "weight", 
        size: item.size || "M",
        brand: item.brand || "Green Roasteries"
      })) || []
    };
    
    console.log('📋 Capture payload:', {
      amount: capturePayload.amount,
      reference_id: capturePayload.reference_id,
      itemsCount: capturePayload.items.length
    });
    
    // Step 4: Execute capture
    console.log('\n📞 Step 3: Executing capture...');
    const captureResponse = await fetch(`https://api.tabby.ai/api/v2/payments/${paymentId}/captures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TABBY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(capturePayload)
    });
    
    if (!captureResponse.ok) {
      const errorData = await captureResponse.json().catch(() => null);
      console.error('❌ Capture failed:', {
        status: captureResponse.status,
        statusText: captureResponse.statusText,
        error: errorData
      });
      return;
    }
    
    const captureResult = await captureResponse.json();
    console.log('✅ PAYMENT CAPTURED SUCCESSFULLY!');
    console.log('📄 Capture result:', {
      id: captureResult.id || 'N/A',
      amount: captureResult.amount || capturePayload.amount,
      created_at: captureResult.created_at || new Date().toISOString(),
      reference_id: capturePayload.reference_id
    });
    
    console.log('\n🎉 Payment should now show as CAPTURED in Tabby Merchant Dashboard');
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

// Main execution
async function main() {
  console.log('🔧 Manual Tabby Payment Capture Tool');
  console.log('=====================================\n');
  
  // Payment ID from Tabby team feedback
  const paymentId = 'c34d8d7a-eb03-4785-8c52-837fa59d637b';
  
  console.log('📋 Payment ID to capture:', paymentId);
  console.log('🎯 This is the payment mentioned by Tabby team as stuck in AUTHORIZED state\n');
  
  await captureTabbyPayment(paymentId);
}

if (require.main === module) {
  main();
}

module.exports = { captureTabbyPayment }; 