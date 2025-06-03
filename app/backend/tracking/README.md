# E-commerce Tracking System Documentation

## Overview

This comprehensive tracking system provides complete e-commerce analytics integration for your website, including:

- **Google Tag Manager (GTM)** - Centralized tag management
- **Google Analytics 4 (GA4)** - Advanced analytics and reporting
- **Meta Ads (Facebook Pixel)** - Facebook advertising and retargeting
- **Google Ads** - Google advertising conversions
- **Server-Side APIs** - Enhanced tracking for better data accuracy and privacy compliance

## Quick Setup Guide

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_ga4_api_secret

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_TEST_EVENT_CODE=TEST12345  # Optional for testing

# Google Ads
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123456789
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=abcdefghijk
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
GOOGLE_ADS_ACCESS_TOKEN=your_google_ads_token
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token

# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 2. Basic Implementation

#### Install the tracking utilities:

```typescript
import { trackEcommerceEvent, GA4, FacebookPixel, GoogleAds } from '@/app/lib/tracking';
```

#### Track a purchase:

```typescript
await trackEcommerceEvent('purchase', {
  items: [
    {
      item_id: 'PROD123',
      item_name: 'Coffee Beans',
      category: 'Coffee',
      quantity: 2,
      price: 25.99
    }
  ],
  value: 51.98,
  currency: 'AED',
  transaction_id: 'ORDER_12345',
  user_data: {
    email: 'customer@example.com',
    phone: '+971501234567',
    first_name: 'John',
    last_name: 'Doe'
  },
  enableServerSide: true
});
```

## Detailed Setup Instructions

### Google Tag Manager Setup

1. **Create GTM Account**
   - Go to https://tagmanager.google.com
   - Create a new account and container
   - Choose "Web" as the target platform

2. **Install GTM Code**
   - Copy the Container ID (GTM-XXXXXXX)
   - Add to your environment variables
   - The tracking system will automatically include the code

3. **Configure Tags in GTM**
   - Add Google Analytics 4 Configuration tag
   - Add Facebook Pixel tag
   - Add Google Ads Conversion Tracking tag
   - Set up triggers for page views, purchases, etc.

### Google Analytics 4 Setup

1. **Create GA4 Property**
   - Go to https://analytics.google.com
   - Create a new GA4 property
   - Copy the Measurement ID (G-XXXXXXXXXX)

2. **Enable Enhanced E-commerce**
   - In GA4, go to Admin → Data Streams
   - Configure enhanced measurement
   - Enable all e-commerce events

3. **Set up Conversions**
   - Mark 'purchase' as a conversion event
   - Set up custom audiences for retargeting

4. **API Secret (for server-side tracking)**
   - Go to Admin → Data Streams → choose your stream
   - Click "Measurement Protocol API secrets"
   - Create a new secret

### Meta Ads (Facebook Pixel) Setup

1. **Create Facebook Pixel**
   - Go to Facebook Business Manager
   - Navigate to Events Manager
   - Create a new pixel
   - Copy the Pixel ID

2. **Set up Conversions API**
   - Generate an access token in Business Manager
   - Set up server-side events for better tracking
   - Configure event matching quality

3. **Test Your Pixel**
   - Use Facebook Pixel Helper browser extension
   - Test events in Events Manager

### Google Ads Setup

1. **Create Conversion Action**
   - In Google Ads, go to Tools & Settings → Conversions
   - Click "+" to create new conversion
   - Choose "Website" as the source
   - Copy Conversion ID and Label

2. **Enhanced Conversions**
   - Enable Enhanced Conversions in your conversion action
   - This allows for better attribution with hashed customer data

3. **Link with Google Analytics**
   - Import GA4 conversions to Google Ads
   - Set up Smart Bidding strategies

### Server-Side API Configuration

The server-side APIs are automatically configured when you access:

- **Facebook Conversions API**: `/api/tracking/facebook`
- **Google Conversions API**: `/api/tracking/google`
- **Configuration Management**: `/api/tracking/config`

## Usage Examples

### Basic Page View Tracking

```typescript
import { GA4, FacebookPixel } from '@/app/lib/tracking';

// Track page view
GA4.pageView('Home Page');
FacebookPixel.pageView();
```

### Add to Cart Event

```typescript
import { trackEcommerceEvent } from '@/app/lib/tracking';

const handleAddToCart = async (product) => {
  await trackEcommerceEvent('add_to_cart', {
    items: [{
      item_id: product.id,
      item_name: product.name,
      category: product.category,
      quantity: 1,
      price: product.price
    }],
    value: product.price,
    user_data: {
      email: user.email // if user is logged in
    },
    enableServerSide: true
  });
};
```

### Checkout Process

```typescript
// Begin checkout
await trackEcommerceEvent('begin_checkout', {
  items: cartItems,
  value: cartTotal,
  user_data: {
    email: user.email,
    phone: user.phone
  },
  enableServerSide: true
});

// Purchase completion
await trackEcommerceEvent('purchase', {
  items: orderItems,
  value: orderTotal,
  currency: 'AED',
  transaction_id: order.id,
  user_data: {
    email: user.email,
    phone: user.phone,
    first_name: user.firstName,
    last_name: user.lastName
  },
  enableServerSide: true
});
```

### Custom Events

```typescript
import { GA4, FacebookPixel } from '@/app/lib/tracking';

// Track newsletter signup
GA4.customEvent('sign_up', {
  method: 'newsletter'
});

FacebookPixel.lead(0, 'AED');

// Track search
GA4.customEvent('search', {
  search_term: 'coffee beans'
});
```

## API Reference

### trackEcommerceEvent()

Main function for tracking e-commerce events across all platforms.

```typescript
trackEcommerceEvent(
  eventType: 'page_view' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  data: {
    items?: EcommerceItem[];
    value?: number;
    currency?: string;
    transaction_id?: string;
    user_data?: UserData;
    page_title?: string;
    enableServerSide?: boolean;
  }
)
```

### Server-Side API Endpoints

#### POST `/api/tracking/facebook`
Send events to Facebook Conversions API

```json
{
  "event_name": "Purchase",
  "event_time": 1640995200,
  "action_source": "website",
  "user_data": {
    "email": "customer@example.com",
    "phone": "+971501234567"
  },
  "custom_data": {
    "value": 99.99,
    "currency": "AED",
    "order_id": "ORDER_123"
  }
}
```

#### POST `/api/tracking/google`
Send conversions to Google APIs

```json
{
  "method": "ga4",
  "conversion_action": "purchase",
  "conversion_value": 99.99,
  "currency_code": "AED",
  "order_id": "ORDER_123",
  "user_data": {
    "email": "customer@example.com"
  }
}
```

## Privacy & Compliance

### GDPR Compliance
- All PII data is hashed before sending to APIs
- User consent should be obtained before tracking
- Provide opt-out mechanisms

### Data Protection
- Server-side APIs hash email and phone numbers
- No sensitive data is stored in local tracking
- All API communications are encrypted

## Testing & Debugging

### Facebook Pixel Testing
- Use Facebook Pixel Helper browser extension
- Check Events Manager for real-time events
- Use Test Event Code for development

### Google Analytics Testing
- Use GA4 DebugView for real-time testing
- Check Real-time reports
- Validate events in the GA4 interface

### Google Ads Testing
- Check conversion tracking in Google Ads
- Use Google Tag Assistant for validation
- Monitor conversion reports

## Troubleshooting

### Common Issues

1. **Events not firing**
   - Check console for JavaScript errors
   - Verify tracking IDs are correct
   - Ensure proper initialization

2. **Server-side events failing**
   - Check API endpoint responses
   - Verify environment variables
   - Check network connectivity

3. **Data discrepancies**
   - Account for different attribution models
   - Check timezone settings
   - Verify currency settings

### Debug Mode

Enable debug mode by setting:

```javascript
// For GA4
gtag('config', 'GA_MEASUREMENT_ID', {
  debug_mode: true
});

// For Facebook Pixel
fbq('init', 'PIXEL_ID', {}, {
  debug: true
});
```

## Performance Optimization

### Loading Strategy
- Scripts load asynchronously
- Critical tracking loads first
- Non-critical events can be deferred

### Data Layer Management
- Use GTM data layer for consistent data
- Minimize direct API calls
- Batch events when possible

## Support & Maintenance

### Regular Maintenance Tasks
- Monitor API response rates
- Check for tracking discrepancies
- Update conversion goals
- Review and clean up unused tags

### Monitoring
- Set up alerts for tracking failures
- Monitor conversion rates
- Track API quota usage

For technical support or questions, please refer to the official documentation of each platform or contact your development team. 