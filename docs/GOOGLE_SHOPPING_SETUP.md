# Google Shopping Merchant Center Integration

This guide explains how to set up and use the Google Shopping Merchant Center integration to sync your products with Google Shopping.

## Prerequisites

1. **Google Merchant Center Account**: You need an active Google Merchant Center account
2. **Google Cloud Project**: A Google Cloud project with the Content API for Shopping enabled
3. **Service Account**: A service account with proper permissions

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Content API for Shopping** (Shopping API)

### 2. Create Service Account

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - Name: `green-roasteries-shopping`
   - Description: `Service account for Google Shopping integration`
4. Click **Create and Continue**
5. Add the following role: **Content API for Shopping Admin**
6. Click **Done**

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Keep this file secure - you'll need it for environment variables

### 4. Link Service Account to Merchant Center

1. Go to [Google Merchant Center](https://merchants.google.com/)
2. Select your account
3. Go to **Settings** > **Account access**
4. Click **Add user**
5. Add the service account email (from the JSON file)
6. Grant **Admin** access
7. Click **Save**

### 5. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Required for Google Shopping integration
GOOGLE_MERCHANT_CENTER_ID=your_merchant_center_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
GOOGLE_SHOPPING_COUNTRY=AE
GOOGLE_SHOPPING_LANGUAGE=en
GOOGLE_SHOPPING_CURRENCY=AED

# Your website URL (required for product links)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### How to get your Merchant Center ID:
1. Go to Google Merchant Center
2. Look at the URL: `https://merchants.google.com/mc/accounts/MERCHANT_ID/`
3. The number after `/accounts/` is your Merchant Center ID

## Using the Integration

### Backend Admin Interface

Access the Google Shopping management interface at `/backend/google-shopping`:

1. **Overview Tab**: Check configuration status and product counts
2. **Sync Products Tab**: Sync all products or specific products
3. **Results Tab**: View sync results and errors

### API Endpoints

#### Sync All Products
```bash
POST /api/google-shopping/sync
{
  "syncAll": true,
  "includeVariations": true,
  "dryRun": false
}
```

#### Sync Specific Products
```bash
POST /api/google-shopping/sync
{
  "productIds": ["product-id-1", "product-id-2"],
  "includeVariations": true,
  "dryRun": false
}
```

#### Get Configuration Status
```bash
GET /api/google-shopping/sync
```

#### Sync Individual Product
```bash
POST /api/google-shopping/product/{product-id}
{
  "includeVariations": true,
  "dryRun": false
}
```

#### Delete Product from Google Shopping
```bash
DELETE /api/google-shopping/product/{product-id}
```

#### Get Product from Google Shopping
```bash
GET /api/google-shopping/product/{product-id}
```

## Product Mapping

The integration automatically maps your product data to Google Shopping requirements:

### Required Fields
- **ID**: Uses product SKU or generates unique ID
- **Title**: Product name (cleaned, max 150 characters)
- **Description**: Product description (cleaned, max 5000 characters)
- **Link**: Product page URL on your website
- **Image Link**: Main product image
- **Price**: Product price in configured currency
- **Availability**: Based on stock status
- **Condition**: Always set to "new"
- **Brand**: Set to "Green Roasteries"

### Additional Fields
- **Additional Images**: Up to 10 additional product images
- **Product Category**: Automatically mapped to Google product taxonomy
- **GTIN**: Generated from SKU if available
- **MPN**: Product SKU or generated ID
- **Weight**: Product weight in grams
- **Custom Attributes**: Origin, roast level, variation details

### Product Variations

When `includeVariations` is enabled, each product variation is uploaded as a separate product:

- **Size Variations**: Different coffee weights (250g, 500g, 1kg)
- **Type Variations**: Coffee types (beans, ground, etc.)
- **Bean Variations**: Different bean types
- **Individual Pricing**: Each variation has its own price
- **Individual Stock**: Each variation has its own availability

## Validation Mode

Use `dryRun: true` to validate your products without actually uploading them to Google Shopping. This helps you:

- Check if all required fields are present
- Validate product data format
- Test the integration without affecting your live products
- Review what would be uploaded

## Error Handling

Common errors and solutions:

### Configuration Errors
- **"Google Shopping API not configured"**: Check environment variables
- **"Invalid service account key"**: Verify JSON format and permissions
- **"Merchant Center ID not found"**: Check your Merchant Center ID

### Product Errors
- **"Missing required field"**: Ensure products have name, price, and images
- **"Invalid image URL"**: Check that image URLs are accessible
- **"Product not in stock"**: Only in-stock products can be synced

### API Errors
- **"Authentication failed"**: Check service account permissions
- **"Rate limit exceeded"**: Google Shopping has API rate limits
- **"Product already exists"**: Use update instead of insert

## Best Practices

1. **Start with Validation**: Always run with `dryRun: true` first
2. **Sync Incrementally**: Start with a few products, then sync all
3. **Regular Updates**: Set up automated syncing for price/stock changes
4. **Monitor Results**: Check the Results tab for any errors
5. **Image Quality**: Use high-quality, properly sized images
6. **Product Information**: Provide complete and accurate product descriptions

## Monitoring and Maintenance

### Regular Tasks
- Monitor sync results for errors
- Update product information when needed
- Check Google Merchant Center for disapprovals
- Review product performance in Google Shopping

### Troubleshooting
1. Check configuration status in the admin interface
2. Review sync results for specific error messages
3. Verify product data completeness
4. Test with individual products first
5. Check Google Merchant Center for additional feedback

## API Rate Limits

Google Shopping API has rate limits:
- **Requests per day**: 100,000
- **Requests per 100 seconds**: 1,000
- **Requests per second**: 20

The integration handles rate limiting automatically by:
- Batching product uploads
- Adding delays between requests
- Retrying failed requests

## Support

For issues with the integration:
1. Check the admin interface for error details
2. Review the API response messages
3. Verify Google Merchant Center account status
4. Check server logs for detailed error information

For Google Shopping specific issues:
- [Google Merchant Center Help](https://support.google.com/merchants)
- [Content API for Shopping Documentation](https://developers.google.com/shopping-content) 