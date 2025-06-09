# Google Shopping Merchant Center Integration

A comprehensive integration for syncing your Green Roasteries products to Google Shopping Merchant Center using the Content API for Shopping.

## 🚀 Features

- **Complete Product Sync**: Sync all products or specific products to Google Shopping
- **Product Variations Support**: Each coffee size, type, and bean variation as separate products
- **Automated Field Mapping**: Automatic mapping of product data to Google Shopping requirements
- **Validation Mode**: Test product data without uploading (dry run)
- **Real-time Monitoring**: Admin interface with detailed sync results and error reporting
- **Individual Product Management**: Sync, update, or delete individual products
- **Comprehensive Error Handling**: Detailed error messages and troubleshooting guidance

## 📁 File Structure

```
app/
├── api/google-shopping/
│   ├── sync/route.ts              # Main sync endpoint (all products)
│   ├── product/[id]/route.ts      # Individual product management
│   └── test/route.ts              # Configuration and product testing
├── lib/
│   └── google-shopping.ts         # Core Google Shopping service
├── backend/
│   └── google-shopping/page.tsx   # Admin interface
└── docs/
    └── GOOGLE_SHOPPING_SETUP.md   # Detailed setup instructions
```

## 🛠 Installation

### 1. Install Dependencies

```bash
npm install googleapis react-hot-toast
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Required
GOOGLE_MERCHANT_CENTER_ID=your_merchant_center_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHOPPING_COUNTRY=AE
GOOGLE_SHOPPING_LANGUAGE=en
GOOGLE_SHOPPING_CURRENCY=AED
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🎯 Quick Start

### 1. Test Configuration
```bash
GET /api/google-shopping/test
```

### 2. Validate Products (Dry Run)
```bash
POST /api/google-shopping/sync
{
  "syncAll": true,
  "includeVariations": true,
  "dryRun": true
}
```

### 3. Sync All Products
```bash
POST /api/google-shopping/sync
{
  "syncAll": true,
  "includeVariations": true,
  "dryRun": false
}
```

## 📊 Admin Interface

Access the management interface at `/backend/google-shopping`:

### Overview Tab
- ✅ Configuration status
- 📈 Product counts and statistics
- 🔧 Required environment variables

### Sync Products Tab
- 🔄 Sync all products or specific ones
- ⚙️ Include/exclude variations
- 🧪 Validation mode (dry run)
- 📝 Bulk and individual product sync

### Results Tab
- 📊 Detailed sync statistics
- ✅ Successfully synced products
- ❌ Error details and troubleshooting
- 📈 Variation counts per product

## 🔌 API Endpoints

### Sync Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/google-shopping/sync` | Get configuration status |
| `POST` | `/api/google-shopping/sync` | Sync products (bulk) |
| `POST` | `/api/google-shopping/product/{id}` | Sync individual product |
| `DELETE` | `/api/google-shopping/product/{id}` | Delete product from Google Shopping |
| `GET` | `/api/google-shopping/product/{id}` | Get product from Google Shopping |

### Testing & Validation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/google-shopping/test` | Test configuration and connectivity |
| `POST` | `/api/google-shopping/test` | Test individual product conversion |

## 📋 Product Data Mapping

### Coffee Products → Google Shopping

| Your Data | Google Shopping Field | Notes |
|-----------|----------------------|-------|
| Product Name | `title` | Cleaned, max 150 chars |
| Description | `description` | Cleaned, max 5000 chars |
| Price | `price` | In configured currency |
| SKU | `offerId` | Unique identifier |
| Main Image | `imageLink` | Required |
| Gallery Images | `additionalImageLinks` | Up to 10 images |
| Stock Status | `availability` | in_stock/out_of_stock |
| Category | `googleProductCategory` | Auto-mapped to coffee categories |
| Weight | `productWeight` | In grams |
| Variations | Separate products | Each size/type/bean combo |

### Product Variations

Each variation becomes a separate Google Shopping product:

```
Base Product: "Ethiopian Single Origin"
├── 250g Beans → "Ethiopian Single Origin - 250g Beans"
├── 250g Ground → "Ethiopian Single Origin - 250g Ground"
├── 500g Beans → "Ethiopian Single Origin - 500g Beans"
└── 500g Ground → "Ethiopian Single Origin - 500g Ground"
```

## 🎛 Configuration Options

### Sync Parameters

```javascript
{
  "syncAll": true,              // Sync all products
  "productIds": ["id1", "id2"], // Or specific products
  "includeVariations": true,    // Include product variations
  "dryRun": false              // Validation only (no upload)
}
```

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_SHOPPING_COUNTRY` | `AE` | Target country code |
| `GOOGLE_SHOPPING_LANGUAGE` | `en` | Content language |
| `GOOGLE_SHOPPING_CURRENCY` | `AED` | Price currency |

## 🔍 Validation & Testing

### Pre-Sync Validation

Always start with validation mode:

```bash
# Test configuration
curl -X GET "http://localhost:3000/api/google-shopping/test"

# Validate all products
curl -X POST "http://localhost:3000/api/google-shopping/sync" \
  -H "Content-Type: application/json" \
  -d '{"syncAll": true, "dryRun": true}'
```

### Product-Level Testing

```bash
# Test specific product conversion
curl -X POST "http://localhost:3000/api/google-shopping/test" \
  -H "Content-Type: application/json" \
  -d '{"productId": "your-product-id"}'
```

## 🚨 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|--------|----------|
| "Google Shopping API not configured" | Missing env vars | Check environment variables |
| "Authentication failed" | Invalid service account | Verify service account permissions |
| "Product not found" | Invalid product ID | Check product exists and is in stock |
| "Missing required field" | Incomplete product data | Ensure name, price, images are set |
| "Rate limit exceeded" | Too many requests | Wait and retry, or sync in smaller batches |

### Monitoring & Troubleshooting

1. **Check Admin Interface**: View real-time sync results
2. **Review API Responses**: Detailed error messages in responses
3. **Monitor Server Logs**: Console logs for debugging
4. **Validate Individual Products**: Test problematic products separately

## 📈 Best Practices

### Preparation
1. ✅ Start with validation mode (`dryRun: true`)
2. 🧪 Test with a few products first
3. 📸 Ensure all products have high-quality images
4. 📝 Complete product descriptions and details

### Sync Strategy
1. 🔄 Sync during low-traffic hours
2. 📦 Use batch sync for initial upload
3. 🔁 Set up regular sync for price/stock updates
4. 📊 Monitor results and fix errors promptly

### Maintenance
1. 🔍 Regular monitoring of sync results
2. 🛠 Keep product data complete and accurate
3. 📈 Review Google Merchant Center for performance
4. 🔄 Update product information as needed

## 🔒 Security & Authentication

### Service Account Setup
1. Create Google Cloud project
2. Enable Content API for Shopping
3. Create service account with proper roles
4. Generate and secure JSON key file
5. Link service account to Merchant Center

### Environment Security
- Store service account key as JSON string in env var
- Use secure environment variable management
- Restrict API access to admin users only
- Monitor API usage and authentication

## 📊 Performance & Limits

### Google Shopping API Limits
- **Daily**: 100,000 requests
- **Per 100 seconds**: 1,000 requests  
- **Per second**: 20 requests

### Optimization
- Batch product uploads when possible
- Use validation mode for testing
- Implement exponential backoff for retries
- Monitor API quota usage

## 🔗 Integration Points

### Existing Systems
- **Product Management**: Syncs with existing product database
- **Admin Interface**: Integrated with backend admin panel
- **Authentication**: Uses existing auth system
- **Error Handling**: Consistent with app error patterns

### External Dependencies
- Google Cloud Content API for Shopping
- Google Merchant Center account
- Service account authentication
- Product image hosting

## 📚 Additional Resources

- [Setup Instructions](docs/GOOGLE_SHOPPING_SETUP.md) - Detailed setup guide
- [Google Merchant Center](https://merchants.google.com/) - Manage your account
- [Content API Documentation](https://developers.google.com/shopping-content) - API reference
- [Product Data Specification](https://support.google.com/merchants/answer/7052112) - Field requirements

## 🆘 Support

### Getting Help
1. Check configuration status in admin interface
2. Review error messages in sync results
3. Test individual products for detailed debugging
4. Verify Google Merchant Center account status

### Common Issues
- **Configuration**: Environment variables not set
- **Authentication**: Service account permissions
- **Product Data**: Missing required fields
- **Images**: Invalid or inaccessible image URLs

---

**Ready to sync your coffee products to Google Shopping? Start with the test endpoint and validation mode!** ☕️🚀 