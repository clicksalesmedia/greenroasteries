import { google } from 'googleapis';

// Types for our product data
interface ProductWithRelations {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  price: number;
  imageUrl?: string | null;
  origin?: string | null;
  inStock: boolean;
  stockQuantity: number;
  sku?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  category: {
    id: string;
    name: string;
    nameAr?: string | null;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
  }>;
  variations: Array<{
    id: string;
    productId: string;
    sizeId: string;
    typeId?: string | null;
    beansId?: string | null;
    price: number;
    sku?: string | null;
    stockQuantity: number;
    isActive: boolean;
    imageUrl?: string | null;
    size: {
      id: string;
      name: string;
      value: number;
      displayName: string;
    };
    type?: {
      id: string;
      name: string;
      arabicName?: string | null;
    } | null;
    beans?: {
      id: string;
      name: string;
      arabicName?: string | null;
    } | null;
  }>;
}

// Google Shopping Product format - matches official API spec
interface GoogleShoppingProduct {
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks?: string[];
  contentLanguage: string;
  targetCountry: string;
  channel: 'online' | 'local';
  availability: 'in stock' | 'out of stock' | 'preorder' | 'backorder';
  condition: 'new' | 'refurbished' | 'used';
  price: {
    value: string;
    currency: string;
  };
  brand: string;
  gtin?: string;
  mpn?: string;
  googleProductCategory?: string;
  productTypes?: string[];  // Official API field for product types
  material?: string;
  color?: string;
  size?: string;
  sizeSystem?: string;
  ageGroup?: string;
  gender?: string;
  productWeight?: {
    value: number;
    unit: string;
  };
  shippingWeight?: {
    value: number;
    unit: string;
  };
  customAttributes?: Array<{
    name: string;
    value: string;
  }>;
}

export class GoogleShoppingService {
  private merchantId: string;
  private serviceAccountKey: any;
  private country: string;
  private language: string;
  private currency: string;
  private baseUrl: string;

  constructor() {
    // For Google Shopping, merchant ID should be the numeric ID from Merchant Center
    // You can find this in Google Merchant Center under Settings > Account Information  
    this.merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || '123456789';
    this.country = process.env.GOOGLE_SHOPPING_COUNTRY || 'AE';
    this.language = process.env.GOOGLE_SHOPPING_LANGUAGE || 'en';
    this.currency = process.env.GOOGLE_SHOPPING_CURRENCY || 'AED';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://greenroasteries.com';

    // Parse service account key
    try {
      this.serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : null;
    } catch (error) {
      console.error('Failed to parse Google Service Account Key:', error);
      this.serviceAccountKey = null;
    }
  }

  isConfigured(): boolean {
    return !!(
      this.merchantId &&
      this.serviceAccountKey &&
      this.serviceAccountKey.client_email &&
      this.serviceAccountKey.private_key
    );
  }

  private async getAuthClient() {
    if (!this.isConfigured()) {
      throw new Error('Google Shopping API not configured');
    }

    const auth = new google.auth.JWT({
      email: this.serviceAccountKey.client_email,
      key: this.serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/content']
    });

    return auth;
  }

  async convertProductToGoogleFormat(
    product: ProductWithRelations, 
    includeVariations: boolean = true
  ): Promise<{ mainProduct: GoogleShoppingProduct; variations: GoogleShoppingProduct[] }> {
    // Generate main product
    const mainProduct = await this.convertSingleProduct(product);

    // Generate variation products if requested and available
    const variations: GoogleShoppingProduct[] = [];
    if (includeVariations && product.variations.length > 0) {
      for (const variation of product.variations) {
        const variationProduct = await this.convertVariationToProduct(product, variation);
        variations.push(variationProduct);
      }
    }

    return { mainProduct, variations };
  }

  private async convertSingleProduct(product: ProductWithRelations): Promise<GoogleShoppingProduct> {
    // Generate URLs
    const productUrl = `${this.baseUrl}/product/${this.generateSlug(product.name)}`;
    const imageUrl = product.imageUrl || (product.images.length > 0 ? product.images[0].url : '');

    // Additional images
    const additionalImages = product.images
      .slice(1, 11) // Max 10 additional images
      .map(img => img.url)
      .filter(url => url !== imageUrl);

    // Generate GTIN/MPN from SKU if available
    const gtin = this.generateGTIN(product.sku || undefined);
    const mpn = product.sku || `GR-${product.id}`;

    // Category mapping
    const googleCategory = this.mapCategoryToGoogle(product.category.name);

    return {
      offerId: product.sku || `gr-${product.id}`,
      title: this.cleanTitle(product.name),
      description: this.cleanDescription(product.description || product.name),
      link: productUrl,
      imageLink: imageUrl,
      additionalImageLinks: additionalImages.length > 0 ? additionalImages : undefined,
      contentLanguage: this.language,
      targetCountry: this.country,
      channel: 'online',
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: {
        value: product.price.toFixed(2),
        currency: this.currency
      },
      brand: 'Green Roasteries',
      gtin: gtin,
      mpn: mpn,
      googleProductCategory: googleCategory,
      material: 'Coffee',
      ageGroup: 'adult',
      gender: 'unisex',
      productWeight: product.weight ? {
        value: product.weight,
        unit: 'g'
      } : undefined,
      shippingWeight: product.weight ? {
        value: product.weight,
        unit: 'g'
      } : undefined,
      customAttributes: [
        {
          name: 'origin',
          value: product.origin || 'Premium Coffee Origin'
        },
        {
          name: 'roast_level',
          value: 'Medium'
        }
      ]
    };
  }

  private async convertVariationToProduct(
    baseProduct: ProductWithRelations, 
    variation: any
  ): Promise<GoogleShoppingProduct> {
    const baseGoogleProduct = await this.convertSingleProduct(baseProduct);
    
    // Create variation-specific data
    let variationTitle = `${baseProduct.name} - ${variation.size.displayName}`;
    if (variation.type) {
      variationTitle += ` ${variation.type.name}`;
    }
    if (variation.beans) {
      variationTitle += ` ${variation.beans.name}`;
    }

    const variationSku = variation.sku || `${baseProduct.sku || baseProduct.id}-${variation.size.value}g`;
    const variationSize = `${variation.size.value}g`;

    return {
      ...baseGoogleProduct,
      offerId: variationSku,
      title: this.cleanTitle(variationTitle),
      price: {
        value: variation.price.toFixed(2),
        currency: this.currency
      },
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      mpn: variationSku,
      size: variationSize,
      productWeight: {
        value: variation.size.value,
        unit: 'g'
      },
      shippingWeight: {
        value: variation.size.value,
        unit: 'g'
      },
      imageLink: variation.imageUrl || baseGoogleProduct.imageLink,
      customAttributes: [
        ...baseGoogleProduct.customAttributes || [],
        {
          name: 'variation_type',
          value: variation.type?.name || 'Standard'
        },
        {
          name: 'beans_type',
          value: variation.beans?.name || 'Mixed'
        },
        {
          name: 'size_grams',
          value: variation.size.value.toString()
        }
      ]
    };
  }

  async syncProduct(productData: { mainProduct: GoogleShoppingProduct; variations: GoogleShoppingProduct[] }): Promise<{
    success: boolean;
    googleProductId?: string;
    variationCount?: number;
    error?: string;
  }> {
    try {
      console.log('=== SYNC PRODUCT DEBUG ===');
      console.log('Main product keys:', Object.keys(productData.mainProduct));
      console.log('Main product has productType?', productData.mainProduct.hasOwnProperty('productType'));
      console.log('Main product has variations?', productData.mainProduct.hasOwnProperty('variations'));
      
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });

      // Create a clean product without problematic fields
      const cleanedProduct: any = {};
      
      // Copy only the allowed fields explicitly (NO productType or variations)
      const allowedFields = [
        'offerId', 'title', 'description', 'link', 'imageLink', 'additionalImageLinks',
        'contentLanguage', 'targetCountry', 'channel', 'availability', 'condition',
        'price', 'brand', 'gtin', 'mpn', 'googleProductCategory', 'productTypes', 'material',
        'color', 'size', 'sizeSystem', 'ageGroup', 'gender', 'productWeight',
        'shippingWeight', 'customAttributes'
      ];
      
      // Extra safety check - ensure problematic fields are never included
      console.log('Allowed fields:', allowedFields);
      console.log('productType in allowedFields?', allowedFields.includes('productType'));
      console.log('variations in allowedFields?', allowedFields.includes('variations'));
      
      for (const field of allowedFields) {
        if (productData.mainProduct[field as keyof GoogleShoppingProduct] !== undefined) {
          cleanedProduct[field] = productData.mainProduct[field as keyof GoogleShoppingProduct];
        }
      }

      // Debug: Log what we're sending to Google - with error checking
      console.log('=== GOOGLE SHOPPING PAYLOAD DEBUG ===');
      console.log('Cleaned product keys:', Object.keys(cleanedProduct));
      console.log('Has productType?', cleanedProduct.hasOwnProperty('productType'));
      console.log('Has variations?', cleanedProduct.hasOwnProperty('variations'));
      console.log('Full payload:', JSON.stringify(cleanedProduct, null, 2));
      console.log('=== END DEBUG ===');

      // Final safety check before sending to Google
      if (cleanedProduct.hasOwnProperty('productType')) {
        console.error('ERROR: productType found in final payload!');
        delete cleanedProduct.productType;
      }
      if (cleanedProduct.hasOwnProperty('variations')) {
        console.error('ERROR: variations found in final payload!');
        delete cleanedProduct.variations;
      }

      // Upload main product
      const mainResult = await content.products.insert({
        merchantId: this.merchantId,
        requestBody: cleanedProduct
      });

      let variationCount = 0;

      // Upload variations as separate products
      if (productData.variations && productData.variations.length > 0) {
        for (const variation of productData.variations) {
          try {
            // Create clean variation product with only allowed fields
            const cleanVariation: any = {};
            
            for (const field of allowedFields) {
              if (variation[field as keyof GoogleShoppingProduct] !== undefined) {
                cleanVariation[field] = variation[field as keyof GoogleShoppingProduct];
              }
            }
            
            console.log(`Sending variation ${cleanVariation.offerId} to Google Shopping API:`, JSON.stringify(cleanVariation, null, 2));
            
            await content.products.insert({
              merchantId: this.merchantId,
              requestBody: cleanVariation
            });
            variationCount++;
          } catch (variationError) {
            console.error(`Failed to upload variation ${variation.offerId}:`, variationError);
          }
        }
      }

      return {
        success: true,
        googleProductId: mainResult.data.id || productData.mainProduct.offerId,
        variationCount
      };

    } catch (error) {
      console.error('Failed to sync product to Google Shopping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteProduct(offerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });

      await content.products.delete({
        merchantId: this.merchantId,
        productId: `online:${this.language}:${this.country}:${offerId}`
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete product from Google Shopping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getProduct(offerId: string): Promise<any> {
    try {
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });

      const result = await content.products.get({
        merchantId: this.merchantId,
        productId: `online:${this.language}:${this.country}:${offerId}`
      });

      return result.data;
    } catch (error) {
      console.error('Failed to get product from Google Shopping:', error);
      throw error;
    }
  }

  // Utility methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .substring(0, 150);
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/[^\w\s.,!?-]/g, '')
      .trim()
      .substring(0, 5000);
  }

  private generateGTIN(sku?: string): string | undefined {
    if (!sku) return undefined;
    
    // Generate a 13-digit GTIN based on SKU
    const prefix = '123456'; // Merchant specific prefix
    const skuNum = sku.replace(/\D/g, '').substring(0, 6).padEnd(6, '0');
    const baseCode = prefix + skuNum;
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(baseCode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return baseCode + checkDigit;
  }

  private mapCategoryToGoogle(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      'coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'beverages': 'Food, Beverages & Tobacco > Beverages',
      'accessories': 'Home & Garden > Kitchen & Dining > Barware',
      'equipment': 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines',
      'beans': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'ground': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'instant': 'Food, Beverages & Tobacco > Beverages > Coffee'
    };

    const category = categoryName.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        return value;
      }
    }

    return 'Food, Beverages & Tobacco > Beverages > Coffee';
  }
} 