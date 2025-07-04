#!/usr/bin/env node

const https = require('https');
const crypto = require('crypto');

const API_KEY = '263832946349343';
const API_SECRET = 'Hsq4Z_l8Yij5Z52Qd9lhFQ-cpi0';

// Function to generate auth signature
function generateSignature(timestamp) {
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  return crypto.createHash('sha256').update(stringToSign).digest('hex');
}

// Function to check if credentials work with a specific cloud name
async function testCloudName(cloudName) {
  return new Promise((resolve) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(timestamp);
    
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/resources/image`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Testing cloud name "${cloudName}": ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        resolve({ success: true, cloudName });
      } else if (res.statusCode === 401) {
        resolve({ success: false, error: 'Invalid credentials' });
      } else if (res.statusCode === 404) {
        resolve({ success: false, error: 'Cloud name not found' });
      } else {
        resolve({ success: false, error: `HTTP ${res.statusCode}` });
      }
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Try to find the correct cloud name
async function findCloudName() {
  console.log('🔍 Searching for your Cloudinary cloud name...\n');
  
  // Common patterns to try
  const patterns = [
    'greenroasteries',
    'green-roasteries', 
    'thegreenroasteries',
    'the-green-roasteries',
    'dgreenroast',
    'dg-roast',
    'roasteries',
    'coffee',
    'dgreenroasteries',
    'dqlfwjlyf' // Original attempt
  ];

  for (const pattern of patterns) {
    console.log(`Testing: ${pattern}`);
    const result = await testCloudName(pattern);
    
    if (result.success) {
      console.log(`\n✅ Found your cloud name: ${result.cloudName}\n`);
      console.log('To update your configuration:');
      console.log(`1. Edit .env.local`);
      console.log(`2. Replace: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME_HERE`);
      console.log(`3. With: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${result.cloudName}\n`);
      return result.cloudName;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n❌ Could not find your cloud name automatically.\n');
  console.log('Please find your cloud name manually:');
  console.log('1. Go to https://console.cloudinary.com/');
  console.log('2. Login with your account');
  console.log('3. Look for "Cloud name" in the dashboard');
  console.log('4. Update NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local\n');
  
  return null;
}

// Check if we can make a direct API call to get account info
async function getAccountInfo() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: '/v1_1/usage',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, data: parsed });
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Main execution
async function main() {
  console.log('🚀 Cloudinary Cloud Name Finder\n');
  console.log(`Using API Key: ${API_KEY}\n`);
  
  // Try to find cloud name
  const cloudName = await findCloudName();
  
  if (!cloudName) {
    console.log('💡 Alternative: Use the Cloudinary CLI to find your cloud name:');
    console.log('   npm install -g cloudinary-cli');
    console.log('   cld config');
  }
}

main().catch(console.error); 