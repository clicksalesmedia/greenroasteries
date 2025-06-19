#!/usr/bin/env node

/**
 * URL Generator for Arabic Ads Campaigns
 * 
 * This script generates Arabic URLs for your ads campaigns.
 * All Arabic URLs will have the /ar prefix and display Arabic content.
 */

const baseUrl = 'https://thegreenroasteries.com';

// Common pages for ads campaigns
const pages = {
  'Homepage': '/',
  'Shop All Products': '/shop',
  'Coffee Beans': '/shop?category=COFFEE%20BEANS',
  'Coffee Grounds': '/shop?category=COFFEE%20GROUNDS', 
  'Nuts & Dried Fruits': '/shop?category=NUTS%20%26%20DRIED%20FRUITS',
  'Coffee Accessories': '/shop?category=ACCESSORIES',
  'Gift Sets': '/shop?category=GIFT%20SETS',
  'About Us': '/about',
  'Contact Us': '/contact',
  'Cart': '/cart',
  'Checkout': '/checkout'
};

// Product categories for targeted ads
const categories = {
  'Premium Coffee Beans': '/shop?category=COFFEE%20BEANS',
  'Specialty Coffee': '/shop?category=SPECIALTY%20COFFEE',
  'Arabic Coffee': '/shop?category=ARABIC%20COFFEE',
  'Espresso Roast': '/shop?category=ESPRESSO%20ROAST',
  'Medium Roast': '/shop?category=MEDIUM%20ROAST',
  'Dark Roast': '/shop?category=DARK%20ROAST',
  'Light Roast': '/shop?category=LIGHT%20ROAST'
};

function generateArabicUrl(path) {
  if (path === '/') {
    return `${baseUrl}/ar`;
  }
  return `${baseUrl}/ar${path}`;
}

function generateEnglishUrl(path) {
  return `${baseUrl}${path}`;
}

console.log('🌍 Green Roasteries - Arabic URLs for Ads Campaigns');
console.log('=' .repeat(60));
console.log();

console.log('📄 MAIN PAGES:');
console.log('-'.repeat(40));
Object.entries(pages).forEach(([name, path]) => {
  const englishUrl = generateEnglishUrl(path);
  const arabicUrl = generateArabicUrl(path);
  
  console.log(`${name}:`);
  console.log(`  English: ${englishUrl}`);
  console.log(`  Arabic:  ${arabicUrl}`);
  console.log();
});

console.log('🛍️ PRODUCT CATEGORIES:');
console.log('-'.repeat(40));
Object.entries(categories).forEach(([name, path]) => {
  const englishUrl = generateEnglishUrl(path);
  const arabicUrl = generateArabicUrl(path);
  
  console.log(`${name}:`);
  console.log(`  English: ${englishUrl}`);
  console.log(`  Arabic:  ${arabicUrl}`);
  console.log();
});

console.log('📋 QUICK COPY - ARABIC URLS FOR ADS:');
console.log('-'.repeat(40));
console.log('Homepage (Arabic):', generateArabicUrl('/'));
console.log('Shop (Arabic):', generateArabicUrl('/shop'));
console.log('Coffee Beans (Arabic):', generateArabicUrl('/shop?category=COFFEE%20BEANS'));
console.log('About Us (Arabic):', generateArabicUrl('/about'));
console.log('Contact (Arabic):', generateArabicUrl('/contact'));
console.log();

console.log('✅ HOW TO USE:');
console.log('-'.repeat(40));
console.log('1. Copy the Arabic URLs above');
console.log('2. Use them in your Arabic ad campaigns');
console.log('3. Arabic URLs will automatically display Arabic content');
console.log('4. English URLs will display English content');
console.log('5. Users can switch languages using the language switcher');
console.log();

console.log('🎯 BENEFITS:');
console.log('-'.repeat(40));
console.log('• Separate Arabic URLs for targeted ads');
console.log('• Better SEO for Arabic content');
console.log('• Improved user experience for Arabic speakers');
console.log('• Easy campaign tracking and analytics');
console.log('• Maintains existing functionality');

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateArabicUrl,
    generateEnglishUrl,
    pages,
    categories,
    baseUrl
  };
} 