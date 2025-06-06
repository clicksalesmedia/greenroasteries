#!/usr/bin/env node

const https = require('https');

console.log('Testing Stripe webhook endpoints...\n');

// Test the main webhook endpoint
const testMainWebhook = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'thegreenroasteries.com',
      path: '/api/webhooks/stripe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Main webhook endpoint status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('Error testing main webhook:', error);
      reject(error);
    });

    req.write(JSON.stringify({ test: true }));
    req.end();
  });
};

// Test the test webhook endpoint
const testTestWebhook = () => {
  return new Promise((resolve, reject) => {
    https.get('https://thegreenroasteries.com/api/webhooks/stripe-test', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\nTest webhook endpoint status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve(res.statusCode);
      });
    }).on('error', (error) => {
      console.error('Error testing test webhook:', error);
      reject(error);
    });
  });
};

// Run tests
async function runTests() {
  try {
    await testTestWebhook();
    console.log('\n---\n');
    await testMainWebhook();
    
    console.log('\n✅ Webhook endpoints are accessible');
    console.log('\nNOTE: The 400 error from main webhook is expected - it means the endpoint is reachable but signature verification failed (which is correct for a test request)');
  } catch (error) {
    console.error('\n❌ Webhook test failed:', error);
  }
}

runTests(); 