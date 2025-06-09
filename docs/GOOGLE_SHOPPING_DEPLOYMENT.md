# Google Shopping Merchant Center - Deployment Documentation

## 🚀 Deployment Completed

**Date**: June 9, 2025  
**Merchant Center ID**: green-roasteries-shopping  
**Project ID**: green-roasteries-shopping  

## ✅ Configuration Status

### Environment Variables (Production)
- ✅ `GOOGLE_MERCHANT_CENTER_ID`: green-roasteries-shopping
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY`: Configured with service account JSON
- ✅ `GOOGLE_SHOPPING_COUNTRY`: AE (United Arab Emirates)
- ✅ `GOOGLE_SHOPPING_LANGUAGE`: en (English)
- ✅ `GOOGLE_SHOPPING_CURRENCY`: AED (UAE Dirham)
- ✅ `NEXT_PUBLIC_APP_URL`: https://thegreenroasteries.com

### Service Account Details
- **Email**: green-roasteries-shopping@green-roasteries-shopping.iam.gserviceaccount.com
- **Client ID**: 112676024645697644045
- **Project**: green-roasteries-shopping
- **Permissions**: Content API for Shopping access configured

## 🔗 Integration Endpoints

### Admin Interface
- **Google Shopping Management**: `/backend/google-shopping`
- **Settings Page**: `/backend/settings/google-shopping`

### API Endpoints
- **Configuration Test**: `GET /api/google-shopping/test`
- **Bulk Product Sync**: `POST /api/google-shopping/sync`
- **Individual Product**: `POST /api/google-shopping/product/[id]`

## 🎯 Features Available

### Product Sync Capabilities
- ✅ Bulk product synchronization
- ✅ Individual product management
- ✅ Product variations support (size, type, beans)
- ✅ Validation mode (dry run)
- ✅ Real-time sync monitoring
- ✅ Error handling and reporting

### Product Mapping
- **Products**: Coffee products with full metadata
- **Variations**: Size (250g, 500g), Type (Beans, Ground), Bean types
- **Categories**: Automatic Google Shopping category mapping
- **Images**: Main product image + gallery images
- **Pricing**: AED currency with tax handling
- **Availability**: Real-time stock status sync

## 🛠 Testing Instructions

### 1. Configuration Test
```bash
curl -X GET "https://thegreenroasteries.com/api/google-shopping/test" \
  -H "Authorization: Bearer <admin-token>"
```

### 2. Validation Run (Dry Run)
```bash
curl -X POST "https://thegreenroasteries.com/api/google-shopping/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "syncAll": true,
    "includeVariations": true,
    "dryRun": true
  }'
```

### 3. Live Product Sync
```bash
curl -X POST "https://thegreenroasteries.com/api/google-shopping/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "syncAll": true,
    "includeVariations": true,
    "dryRun": false
  }'
```

## 📊 Monitoring

### Admin Dashboard Access
1. Login to admin panel: https://thegreenroasteries.com/backend/login
2. Navigate to Google Shopping: https://thegreenroasteries.com/backend/google-shopping
3. Check configuration status and run tests
4. Monitor sync results and error reports

### Key Metrics to Monitor
- Total products synced
- Variation count per product
- Sync success/error rates
- Google Shopping performance metrics

## 🔒 Security Notes

### Service Account Security
- ✅ JSON key stored securely on server
- ✅ Local development key removed
- ✅ Gitignore rules added for service account files
- ✅ Environment variables properly configured

### Access Control
- Admin-only access to Google Shopping management
- API endpoints protected with authentication
- Secure key rotation supported

## 🚀 Next Steps

### Immediate Actions
1. **Test Configuration**: Run configuration test via admin interface
2. **Validation Run**: Perform dry run sync to test product conversion
3. **Initial Sync**: Sync products to Google Shopping Merchant Center
4. **Monitor Results**: Check sync results and fix any errors

### Ongoing Maintenance
1. **Regular Sync**: Set up scheduled product syncs for inventory updates
2. **Performance Monitoring**: Track Google Shopping performance metrics
3. **Error Handling**: Monitor and resolve sync errors promptly
4. **Product Optimization**: Optimize product data for better Google Shopping performance

## 📞 Support

### Documentation
- Main README: `/README_GOOGLE_SHOPPING.md`
- Setup Guide: `/docs/GOOGLE_SHOPPING_SETUP.md`
- API Documentation: Built-in admin interface

### Troubleshooting
- Check configuration via test endpoint
- Review admin interface error logs
- Monitor PM2 application logs
- Verify service account permissions

## 🎉 Deployment Success

The Google Shopping Merchant Center integration has been successfully configured and deployed to the production server. The system is ready for product synchronization with Google Shopping.

**Status**: ✅ READY FOR PRODUCTION USE 