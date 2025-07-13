# Google Ads Enhanced Conversions Setup Guide

## Overview
This guide explains how to configure Google Ads Enhanced Conversions and Remarketing for your e-commerce tracking system.

## Prerequisites
- Google Ads account with conversion tracking enabled
- Website verification in Google Ads
- Admin access to Google Ads account

## Step 1: Enable Enhanced Conversions

### 1.1 Access Conversions
1. Log into your Google Ads account
2. Go to **Tools & Settings** → **Conversions**
3. Find your existing conversion action or create a new one

### 1.2 Configure Enhanced Conversions
1. Click on your conversion action
2. Click **Edit settings**
3. Scroll to **Enhanced conversions**
4. Toggle **Turn on enhanced conversions**
5. Select **Use the Google tag or Google Tag Manager**
6. Click **Save**

## Step 2: Configure Conversion Settings

### 2.1 Current Configuration
- **Conversion ID**: `AW-17214709280`
- **Conversion Label**: `rRb1CIv4r-waEKC8zpBA`
- **Currency**: AED
- **Enhanced Conversions**: Enabled with user data hashing

### 2.2 Conversion Actions Setup
Create separate conversion actions for:

#### Add to Cart Conversion
- **Name**: "Green Roasteries - Add to Cart"
- **Category**: "Add to cart"
- **Value**: Variable (actual cart value)
- **Count**: "Every"
- **Conversion window**: 30 days

#### Begin Checkout Conversion  
- **Name**: "Green Roasteries - Begin Checkout"
- **Category**: "Begin checkout"
- **Value**: Variable (checkout value)
- **Count**: "Every"
- **Conversion window**: 30 days

#### Purchase Conversion
- **Name**: "Green Roasteries - Purchase"
- **Category**: "Purchase"
- **Value**: Variable (order total)
- **Count**: "One"
- **Conversion window**: 30 days

## Step 3: Set Up Remarketing Audiences

### 3.1 Access Audience Manager
1. Go to **Tools & Settings** → **Audience Manager**
2. Click **Audience segments**
3. Click the **+** button to create new audiences

### 3.2 Create Key Audiences

#### All Visitors
- **Name**: "Green Roasteries - All Visitors"
- **Type**: Website visitors
- **Rule**: Visitors of a page with URL containing `thegreenroasteries.com`
- **Membership duration**: 540 days

#### Product Viewers
- **Name**: "Green Roasteries - Product Viewers"  
- **Type**: Website visitors
- **Rule**: Visitors of a page with URL containing `/product/`
- **Membership duration**: 30 days

#### Cart Abandoners
- **Name**: "Green Roasteries - Cart Abandoners"
- **Type**: Website visitors
- **Rule**: 
  - Visitors of a page with URL containing `/cart`
  - AND who haven't visited URL containing `/checkout/thank-you`
- **Membership duration**: 7 days

#### Checkout Abandoners
- **Name**: "Green Roasteries - Checkout Abandoners"
- **Type**: Website visitors  
- **Rule**:
  - Visitors of a page with URL containing `/checkout`
  - AND who haven't visited URL containing `/checkout/thank-you`
- **Membership duration**: 7 days

#### Purchasers
- **Name**: "Green Roasteries - Purchasers"
- **Type**: Website visitors
- **Rule**: Visitors of a page with URL containing `/checkout/thank-you`
- **Membership duration**: 540 days

#### Coffee Category Viewers
- **Name**: "Green Roasteries - Coffee Viewers"
- **Type**: Website visitors
- **Rule**: Custom parameters contain `ecomm_pagetype` equals `product` AND `category` equals `Coffee`
- **Membership duration**: 30 days

## Step 4: Verify Implementation

### 4.1 Test Enhanced Conversions
1. Use Google Ads **Conversion tracking** tool
2. Test the following events:
   - Add to cart on product pages
   - Begin checkout on cart page  
   - Complete purchase on checkout
3. Verify user data is being sent (email, phone hashes)

### 4.2 Check Remarketing
1. Go to **Audience Manager** → **Audience segments**
2. Check that audiences are collecting users
3. Verify custom parameters are being received

### 4.3 Google Tag Assistant
1. Install Google Tag Assistant Chrome extension
2. Visit your website and trigger events
3. Verify Google Ads tags are firing correctly

## Step 5: Current Implementation

### 5.1 User Data Collection
The system automatically collects and hashes:
- Email addresses (SHA-256)
- Phone numbers (SHA-256)  
- First names (SHA-256)
- Last names (SHA-256)

### 5.2 Events Tracked
- **Page View**: All page visits with page type classification
- **View Content**: Product page views with product details
- **Add to Cart**: Cart additions with product and user data
- **Begin Checkout**: Checkout initiation with cart contents
- **Purchase**: Completed orders with transaction details

### 5.3 Remarketing Parameters
- `ecomm_pagetype`: Page classification (home, product, category, cart, checkout)
- `ecomm_prodid`: Product IDs for targeted remarketing
- `ecomm_totalvalue`: Transaction/cart values
- `product_id`: Individual product tracking
- `category`: Product categories for segmentation

## Step 6: Testing Checklist

- [ ] Enhanced conversions enabled in Google Ads
- [ ] Conversion actions created and properly labeled
- [ ] Remarketing audiences created and collecting data
- [ ] Add to cart tracking working with user data
- [ ] Begin checkout tracking working with user data  
- [ ] Purchase tracking working with transaction data
- [ ] Page view remarketing working with page types
- [ ] Product view remarketing working with product data

## Troubleshooting

### Enhanced Conversions Not Working
1. Check that `allow_enhanced_conversions: true` is set
2. Verify user data is being hashed properly
3. Check console for any JavaScript errors
4. Ensure HTTPS is enabled on your website

### Remarketing Not Collecting Data
1. Verify Google Ads tag is loading properly
2. Check that custom parameters are being sent
3. Ensure audience rules match your URL structure
4. Wait 24-48 hours for data to populate

### Testing Events
Use browser console to manually trigger events:
```javascript
// Test Enhanced Add to Cart
await trackGoogleAdsAddToCart(
  {id: 'test-product', name: 'Test Coffee', category: 'Coffee'}, 
  25.99, 
  'AED', 
  'test@example.com', 
  '+971501234567', 
  'John', 
  'Doe'
);

// Test Enhanced Begin Checkout  
await trackGoogleAdsBeginCheckout(
  [{id: 'test-product', name: 'Test Coffee', category: 'Coffee'}],
  25.99,
  'AED',
  'test@example.com',
  '+971501234567', 
  'John',
  'Doe'
);
```

## Support
For issues with this implementation, check:
1. Browser console for JavaScript errors
2. Google Ads conversion tracking reports
3. Google Tag Assistant for tag firing verification
4. Network tab for tracking requests 