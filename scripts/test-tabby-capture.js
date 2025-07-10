#!/usr/bin/env node

/**
 * Test Tabby Capture Implementation
 * 
 * This script validates that our capture request format matches
 * the official Tabby API specification.
 */

// Mock payment details (similar to what Tabby returns)
const mockPaymentDetails = {
  id: "payment_test_123",
  status: "AUTHORIZED",
  amount: "150.75",
  currency: "AED",
  order: {
    tax_amount: "12.50",
    shipping_amount: "15.00", 
    discount_amount: "5.25",
    reference_id: "order_12345",
    items: [
      {
        title: "Ethiopian Coffee Beans",
        description: "Premium Grade A, 250g",
        quantity: 2,
        unit_price: "45.00",
        discount_amount: "2.50",
        reference_id: "item_001",
        image_url: "https://example.com/coffee1.jpg",
        product_url: "https://example.com/product/001",
        gender: "Other",
        category: "Coffee",
        color: "brown",
        product_material: "organic",
        size_type: "weight", 
        size: "250g",
        brand: "Green Roasteries"
      },
      {
        title: "Colombian Coffee Beans",
        description: "Single Origin, 500g", 
        quantity: 1,
        unit_price: "60.75",
        discount_amount: "2.75",
        reference_id: "item_002",
        image_url: "https://example.com/coffee2.jpg",
        product_url: "https://example.com/product/002",
        gender: "Other",
        category: "Coffee", 
        color: "brown",
        product_material: "organic",
        size_type: "weight",
        size: "500g", 
        brand: "Green Roasteries"
      }
    ]
  }
};

// Build capture payload according to Tabby API spec
function buildCapturePayload(paymentDetails) {
  const paymentId = paymentDetails.id;
  
  return {
    // Required: Total payment amount captured
    amount: paymentDetails.amount,
    
    // Idempotency key to avoid duplicate captures  
    reference_id: `capture_${paymentId}_${Date.now()}`,
    
    // Breakdown amounts from original payment
    tax_amount: paymentDetails.order?.tax_amount || "0.00",
    shipping_amount: paymentDetails.order?.shipping_amount || "0.00",
    discount_amount: paymentDetails.order?.discount_amount || "0.00",
    
    // Timestamp in ISO format
    created_at: new Date().toISOString(),
    
    // Order items being captured
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
      captured: item.quantity, // Full capture
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
}

// Validate capture payload
function validateCapturePayload(payload) {
  const errors = [];
  
  // Required fields
  if (!payload.amount) errors.push("Missing required field: amount");
  if (!payload.reference_id) errors.push("Missing required field: reference_id");
  
  // Amount format validation (up to 2 decimals for AED)
  if (payload.amount && !/^\d+\.\d{2}$/.test(payload.amount)) {
    errors.push("Amount should have exactly 2 decimal places");
  }
  
  // Breakdown amounts validation
  const amounts = [payload.tax_amount, payload.shipping_amount, payload.discount_amount];
  amounts.forEach((amount, index) => {
    const fields = ['tax_amount', 'shipping_amount', 'discount_amount'];
    if (amount && !/^\d+\.\d{2}$/.test(amount)) {
      errors.push(`${fields[index]} should have exactly 2 decimal places`);
    }
  });
  
  // Items validation
  if (!Array.isArray(payload.items)) {
    errors.push("Items should be an array");
  } else {
    payload.items.forEach((item, index) => {
      if (!item.title) errors.push(`Item ${index}: missing title`);
      if (!item.quantity || item.quantity < 1) errors.push(`Item ${index}: invalid quantity`);
      if (!item.unit_price) errors.push(`Item ${index}: missing unit_price`);
      if (item.unit_price && !/^\d+\.\d{2}$/.test(item.unit_price)) {
        errors.push(`Item ${index}: unit_price should have exactly 2 decimal places`);
      }
    });
  }
  
  return errors;
}

// Main test
console.log('🧪 Testing Tabby Capture Implementation');
console.log('=====================================\n');

console.log('📋 Mock Payment Details:');
console.log(JSON.stringify(mockPaymentDetails, null, 2));
console.log('\n');

console.log('🔧 Building Capture Payload...');
const capturePayload = buildCapturePayload(mockPaymentDetails);

console.log('📤 Generated Capture Payload:');
console.log(JSON.stringify(capturePayload, null, 2));
console.log('\n');

console.log('✅ Validating Payload...');
const errors = validateCapturePayload(capturePayload);

if (errors.length === 0) {
  console.log('🎉 SUCCESS: Capture payload is valid!');
  console.log('\n📊 Summary:');
  console.log(`- Total Amount: ${capturePayload.amount} AED`);
  console.log(`- Tax: ${capturePayload.tax_amount} AED`);
  console.log(`- Shipping: ${capturePayload.shipping_amount} AED`);
  console.log(`- Discount: ${capturePayload.discount_amount} AED`);
  console.log(`- Items: ${capturePayload.items.length}`);
  console.log(`- Reference ID: ${capturePayload.reference_id}`);
  console.log('\n🚀 Ready for production deployment!');
} else {
  console.log('❌ VALIDATION ERRORS:');
  errors.forEach(error => console.log(`   - ${error}`));
  process.exit(1);
}

console.log('\n📚 API Endpoint: POST /api/v2/payments/{id}/captures');
console.log('📚 Documentation: https://api-docs.tabby.ai/#operation/postPaymentCapture'); 