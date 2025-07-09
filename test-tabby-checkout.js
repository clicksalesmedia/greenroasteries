/**
 * Tabby Integration Testing Script
 * Run this in browser console on your checkout page
 */

// Test data for positive flow (UAE)
const testCustomerInfo = {
  fullName: 'Test Customer',
  email: 'otp.success@tabby.ai',
  phone: '+971500000001'
};

const testShippingInfo = {
  emirate: 'Dubai',
  city: 'Dubai',
  address: 'Test Address, Dubai, UAE'
};

// Test data for rejection flow
const testCustomerInfoReject = {
  fullName: 'Test Customer',
  email: 'otp.success@tabby.ai',
  phone: '+971500000002' // This should trigger rejection
};

// Test data for failure flow
const testCustomerInfoFailure = {
  fullName: 'Test Customer',
  email: 'otp.rejected@tabby.ai',
  phone: '+971500000001'
};

console.log('🧪 Tabby Testing Credentials');
console.log('='.repeat(50));
console.log('✅ POSITIVE FLOW (Should succeed):');
console.log('Email:', testCustomerInfo.email);
console.log('Phone:', testCustomerInfo.phone);
console.log('OTP to use: 8888');
console.log('');
console.log('❌ REJECTION FLOW (Should be hidden):');
console.log('Email:', testCustomerInfoReject.email);
console.log('Phone:', testCustomerInfoReject.phone);
console.log('');
console.log('💥 FAILURE FLOW (Should fail after OTP):');
console.log('Email:', testCustomerInfoFailure.email);
console.log('Phone:', testCustomerInfoFailure.phone);
console.log('OTP to use: 8888');
console.log('='.repeat(50));

// Function to test API directly if needed
async function testTabbyAPI() {
  try {
    const response = await fetch('/api/payments/tabby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 150,
        currency: 'AED',
        customerInfo: testCustomerInfo,
        shippingInfo: testShippingInfo,
        items: [
          {
            id: 'test-item',
            name: 'Test Coffee',
            price: 150,
            quantity: 1,
            category: 'Coffee'
          }
        ],
        subtotal: 150,
        tax: 0,
        shippingCost: 0,
        discount: 0
      }),
    });

    const data = await response.json();
    console.log('🔍 Tabby API Response:', data);
    
    if (data.success) {
      console.log('✅ Tabby session created successfully!');
      console.log('🔗 Checkout URL:', data.checkout_url);
    } else {
      console.log('❌ Tabby API Error:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('💥 API Test Error:', error);
    return null;
  }
}

// Auto-fill forms if they exist
function fillTestData(flow = 'positive') {
  const customerData = flow === 'reject' ? testCustomerInfoReject : 
                      flow === 'failure' ? testCustomerInfoFailure : 
                      testCustomerInfo;
  
  // Try to fill customer info form
  const nameField = document.querySelector('input[name="fullName"], input[name="name"]');
  const emailField = document.querySelector('input[name="email"]');
  const phoneField = document.querySelector('input[name="phone"]');
  
  if (nameField) nameField.value = customerData.fullName;
  if (emailField) emailField.value = customerData.email;
  if (phoneField) phoneField.value = customerData.phone;
  
  // Try to fill shipping info
  const cityField = document.querySelector('input[name="city"]');
  const addressField = document.querySelector('input[name="address"]');
  
  if (cityField) cityField.value = testShippingInfo.city;
  if (addressField) addressField.value = testShippingInfo.address;
  
  console.log(`📝 Auto-filled form with ${flow} flow data`);
}

// Export functions for manual testing
window.testTabbyAPI = testTabbyAPI;
window.fillTestData = fillTestData;

console.log('🚀 Testing tools ready!');
console.log('• Run testTabbyAPI() to test the API directly');
console.log('• Run fillTestData() to auto-fill forms with test data');
console.log('• Run fillTestData("reject") for rejection flow');
console.log('• Run fillTestData("failure") for failure flow'); 