#!/usr/bin/env node

/**
 * Tabby Webhook Registration Script
 * 
 * Addresses QA feedback: "webhooks should be registered once for each store (merchant_code)"
 * 
 * This script registers the webhook URL with Tabby API to enable the payment verification flow:
 * 1. Customer completes payment → Tabby sends webhook with "authorized" status
 * 2. Our system receives webhook → triggers verification via GET /payments/{id}
 * 3. Our system verifies "AUTHORIZED" status → triggers capture
 * 4. Payment moves from NEW → AUTHORIZED → CAPTURED status
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function registerTabbyWebhook() {
  console.log('🔔 Registering Tabby Webhook...');
  
  // Validate environment variables
  const secretKey = process.env.TABBY_SECRET_KEY;
  const merchantCode = process.env.TABBY_MERCHANT_CODE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!secretKey) {
    console.error('❌ TABBY_SECRET_KEY not found in .env.local');
    process.exit(1);
  }
  
  if (!merchantCode) {
    console.error('❌ TABBY_MERCHANT_CODE not found in .env.local');
    process.exit(1);
  }
  
  if (!siteUrl) {
    console.error('❌ NEXT_PUBLIC_SITE_URL not found in .env.local');
    process.exit(1);
  }
  
  // Determine API environment
  const isTest = secretKey.includes('test') || secretKey.startsWith('sk_test_');
  const baseUrl = 'https://api.tabby.ai'; // Tabby uses same URL for test/prod
  
  console.log('📋 Registration Details:');
  console.log('  Environment:', isTest ? 'TEST' : 'LIVE');
  console.log('  Merchant Code:', merchantCode);
  console.log('  Site URL:', siteUrl);
  console.log('  Secret Key:', `${secretKey.substring(0, 10)}...`);
  
  // Webhook URL
  const webhookUrl = `${siteUrl}/api/webhooks/tabby`;
  console.log('  Webhook URL:', webhookUrl);
  
  // Webhook registration payload per Tabby API docs
  const webhookPayload = {
    url: webhookUrl,
    is_test: isTest,
    header: {
      title: "x-tabby-source",
      value: "greenroasteries-webhook"
    }
  };
  
  try {
    console.log('\n🔄 Sending registration request to Tabby API...');
    
    const response = await fetch(`${baseUrl}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'X-Merchant-Code': merchantCode
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook registered successfully!');
      console.log('📄 Response:', {
        id: responseData.id,
        url: responseData.url,
        is_test: responseData.is_test,
        header: responseData.header
      });
      
      console.log('\n🎉 Setup Complete!');
      console.log('Your Tabby integration is now ready to receive webhooks.');
      console.log('Payments will now move from NEW → AUTHORIZED → CAPTURED status.');
      
      // Save webhook ID to environment file if possible
      console.log('\n💡 Next Steps:');
      console.log('1. Add this to your .env.local file:');
      console.log(`   TABBY_WEBHOOK_ID=${responseData.id}`);
      console.log('2. Test a payment to verify the webhook flow works');
      console.log('3. Monitor Tabby Merchant Dashboard for payment status changes');
      
    } else {
      console.error('❌ Webhook registration failed:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response:', responseData);
      
      // Handle specific error cases
      if (response.status === 400) {
        console.error('\n🔍 Possible issues:');
        console.error('- URL must be HTTPS');
        console.error('- URL must be publicly accessible');
        console.error('- Check TABBY_MERCHANT_CODE is correct');
      } else if (response.status === 401) {
        console.error('\n🔍 Authentication issue:');
        console.error('- Check TABBY_SECRET_KEY is correct');
        console.error('- Ensure secret key matches the environment (test/live)');
      } else if (response.status === 403) {
        console.error('\n🔍 Permission issue:');
        console.error('- Check TABBY_MERCHANT_CODE has webhook permissions');
        console.error('- Contact Tabby support if needed');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Network error during webhook registration:', error.message);
    console.error('\n🔍 Check:');
    console.error('- Internet connection');
    console.error('- Tabby API is accessible');
    console.error('- No firewall blocking outbound requests');
    process.exit(1);
  }
}

// Check for existing webhooks first
async function checkExistingWebhooks() {
  console.log('🔍 Checking for existing webhooks...');
  
  const secretKey = process.env.TABBY_SECRET_KEY;
  const merchantCode = process.env.TABBY_MERCHANT_CODE;
  const baseUrl = 'https://api.tabby.ai';
  
  try {
    const response = await fetch(`${baseUrl}/api/v1/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'X-Merchant-Code': merchantCode
      }
    });
    
    if (response.ok) {
      const webhooks = await response.json();
      console.log(`📋 Found ${webhooks.length} existing webhook(s):`);
      
      webhooks.forEach((webhook, index) => {
        console.log(`  ${index + 1}. ID: ${webhook.id}`);
        console.log(`     URL: ${webhook.url}`);
        console.log(`     Test: ${webhook.is_test}`);
        console.log(`     Header: ${JSON.stringify(webhook.header || {})}`);
      });
      
      return webhooks;
    } else {
      console.log('⚠️ Could not fetch existing webhooks (this is normal for new setups)');
      return [];
    }
  } catch (error) {
    console.log('⚠️ Could not check existing webhooks:', error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log('🔔 Tabby Webhook Registration Tool');
  console.log('=====================================\n');
  
  // Check existing webhooks first
  const existingWebhooks = await checkExistingWebhooks();
  
  // Check if webhook already exists for this URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const webhookUrl = `${siteUrl}/api/webhooks/tabby`;
  
  const existingWebhook = existingWebhooks.find(wh => wh.url === webhookUrl);
  
  if (existingWebhook) {
    console.log(`\n✅ Webhook already registered!`);
    console.log(`   ID: ${existingWebhook.id}`);
    console.log(`   URL: ${existingWebhook.url}`);
    console.log(`   Test: ${existingWebhook.is_test}`);
    console.log('\n🎉 Your Tabby integration is ready!');
    console.log('No further action needed.');
    return;
  }
  
  // Register new webhook
  console.log('\n📝 No matching webhook found. Registering new webhook...');
  await registerTabbyWebhook();
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 