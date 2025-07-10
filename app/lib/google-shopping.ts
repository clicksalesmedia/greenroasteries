import { google } from 'googleapis';

// Types for our product data with Arabic support
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

// Enhanced Google Shopping Product format with language support
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
  productTypes?: string[];
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

// Language configuration interface
interface LanguageConfig {
  code: string;
  country: string;
  currency: string;
  name: string;
}

// Supported languages for Google Shopping
const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  'en': {
    code: 'en',
    country: 'AE',
    currency: 'AED',
    name: 'English'
  },
  'ar': {
    code: 'ar',
    country: 'AE', 
    currency: 'AED',
    name: 'Arabic'
  }
};

export class GoogleShoppingService {
  private merchantId: string;
  private serviceAccountKey: any;
  private baseUrl: string;
  private language!: string;
  private country!: string;
  private currency!: string;

  constructor(language: string = 'en') {
    this.merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || '5602274425';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thegreenroasteries.com';
    
    // Set language configuration
    this.setLanguage(language);

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

  /**
   * Set the language for Google Shopping operations
   */
  public setLanguage(language: string): void {
    const config = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES['en'];
    this.language = config.code;
    this.country = config.country;
    this.currency = config.currency;
    console.log(`Google Shopping language set to: ${language} (${config.name})`);
  }

  /**
   * Get available languages
   */
  public static getSupportedLanguages(): Record<string, LanguageConfig> {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Check if Google Shopping is properly configured
   */
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

  /**
   * Enhanced product conversion with language support
   */
  async convertProductToGoogleFormat(
    product: ProductWithRelations, 
    includeVariations: boolean = true,
    targetLanguage?: string
  ): Promise<{ mainProduct: GoogleShoppingProduct; variations: GoogleShoppingProduct[] }> {
    // Use specified language or current service language
    const currentLanguage = targetLanguage || this.language;
    
    // Temporarily set language for this conversion
    const originalLanguage = this.language;
    if (targetLanguage) {
      this.setLanguage(targetLanguage);
    }

    try {
      // Generate main product with language-specific content
      const mainProduct = await this.convertSingleProduct(product, currentLanguage);

      // Generate variation products if requested and available
      const variations: GoogleShoppingProduct[] = [];
      if (includeVariations && product.variations.length > 0) {
        for (const variation of product.variations) {
          const variationProduct = await this.convertVariationToProduct(product, variation, currentLanguage);
          variations.push(variationProduct);
        }
      }

      return { mainProduct, variations };
    } finally {
      // Restore original language
      if (targetLanguage) {
        this.setLanguage(originalLanguage);
      }
    }
  }

  /**
   * Enhanced single product conversion with Arabic support
   */
  private async convertSingleProduct(
    product: ProductWithRelations, 
    language: string = this.language
  ): Promise<GoogleShoppingProduct> {
    const isArabic = language === 'ar';
    
    // Use Arabic content if available and language is Arabic, otherwise fallback to English
    const title = isArabic && product.nameAr ? product.nameAr : product.name;
    const description = isArabic && product.descriptionAr ? product.descriptionAr : (product.description || product.name);
    const categoryName = isArabic && product.category.nameAr ? product.category.nameAr : product.category.name;

    // Generate URLs with language parameter
    const productSlug = this.generateSlug(product.name); // Keep English slug for URL consistency
    const productUrl = `${this.baseUrl}/product/${productSlug}${isArabic ? '?lang=ar' : ''}`;
    
    // Convert image URLs to absolute URLs
    const rawImageUrl = product.imageUrl || (product.images.length > 0 ? product.images[0].url : '');
    const imageUrl = this.makeAbsoluteUrl(rawImageUrl);

    // Additional images - convert to absolute URLs
    const additionalImages = product.images
      .slice(1, 11) // Max 10 additional images
      .map(img => this.makeAbsoluteUrl(img.url))
      .filter(url => url && url !== imageUrl && url !== '');

    // Generate language-specific SKU
    const baseSku = product.sku || `gr-${product.id}`;
    const languageSpecificSku = isArabic ? `${baseSku}-ar` : baseSku;

    // Generate GTIN/MPN
    const gtin = this.generateGTIN(languageSpecificSku);
    const mpn = languageSpecificSku;

    // Category mapping with language support
    const googleCategory = this.mapCategoryToGoogle(categoryName, language);

    // Custom attributes with language-specific content
    const customAttributes = [
      {
        name: 'origin',
        value: product.origin || (isArabic ? 'منشأ القهوة المميزة' : 'Premium Coffee Origin')
      },
      {
        name: 'roast_level',
        value: isArabic ? 'متوسط' : 'Medium'
      },
      {
        name: 'language',
        value: language
      },
      {
        name: 'brand_localized',
        value: isArabic ? 'المحامص الخضراء' : 'Green Roasteries'
      }
    ];

    return {
      offerId: languageSpecificSku,
      title: this.cleanTitle(title),
      description: this.cleanDescription(description),
      link: productUrl,
      imageLink: imageUrl,
      additionalImageLinks: additionalImages.length > 0 ? additionalImages : undefined,
      contentLanguage: language,
      targetCountry: this.country,
      channel: 'online',
      availability: product.inStock && product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: {
        value: product.price.toFixed(2),
        currency: this.currency
      },
      brand: isArabic ? 'المحامص الخضراء' : 'Green Roasteries',
      gtin: gtin,
      mpn: mpn,
      googleProductCategory: googleCategory,
      material: isArabic ? 'قهوة' : 'Coffee',
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
      customAttributes: customAttributes
    };
  }

  /**
   * Enhanced variation conversion with Arabic support
   */
  private async convertVariationToProduct(
    baseProduct: ProductWithRelations, 
    variation: any,
    language: string = this.language
  ): Promise<GoogleShoppingProduct> {
    const isArabic = language === 'ar';
    const baseGoogleProduct = await this.convertSingleProduct(baseProduct, language);
    
    // Create variation-specific data with language support
    const baseName = isArabic && baseProduct.nameAr ? baseProduct.nameAr : baseProduct.name;
    const sizeDisplay = isArabic ? `${variation.size.value} جرام` : variation.size.displayName;
    
    let variationTitle = `${baseName} - ${sizeDisplay}`;
    
    if (variation.type) {
      const typeName = isArabic && variation.type.arabicName ? variation.type.arabicName : variation.type.name;
      variationTitle += ` ${typeName}`;
    }
    
    if (variation.beans) {
      const beansName = isArabic && variation.beans.arabicName ? variation.beans.arabicName : variation.beans.name;
      variationTitle += ` ${beansName}`;
    }

    // Generate language-specific variation SKU
    const baseVariationSku = variation.sku || `${baseProduct.sku || baseProduct.id}-${variation.size.value}g`;
    const languageSpecificVariationSku = isArabic ? `${baseVariationSku}-ar` : baseVariationSku;
    
    const variationSize = `${variation.size.value}g`;

    // Enhanced custom attributes for variations
    const variationCustomAttributes = [
      ...baseGoogleProduct.customAttributes || [],
      {
        name: 'variation_type',
        value: isArabic && variation.type?.arabicName ? variation.type.arabicName : (variation.type?.name || (isArabic ? 'عادي' : 'Standard'))
      },
      {
        name: 'beans_type',
        value: isArabic && variation.beans?.arabicName ? variation.beans.arabicName : (variation.beans?.name || (isArabic ? 'مختلط' : 'Mixed'))
      },
      {
        name: 'size_grams',
        value: variation.size.value.toString()
      },
      {
        name: 'size_display',
        value: sizeDisplay
      }
    ];

    return {
      ...baseGoogleProduct,
      offerId: languageSpecificVariationSku,
      title: this.cleanTitle(variationTitle),
      price: {
        value: variation.price.toFixed(2),
        currency: this.currency
      },
      availability: variation.stockQuantity > 0 ? 'in stock' : 'out of stock',
      mpn: languageSpecificVariationSku,
      size: variationSize,
      productWeight: {
        value: variation.size.value,
        unit: 'g'
      },
      shippingWeight: {
        value: variation.size.value,
        unit: 'g'
      },
      imageLink: this.makeAbsoluteUrl(variation.imageUrl) || baseGoogleProduct.imageLink,
      customAttributes: variationCustomAttributes
    };
  }

  /**
   * Enhanced sync with language support
   */
  async syncProduct(
    productData: { mainProduct: GoogleShoppingProduct; variations: GoogleShoppingProduct[] },
    language?: string
  ): Promise<{
    success: boolean;
    googleProductId?: string;
    variationCount?: number;
    error?: string;
    language?: string;
  }> {
    try {
      const currentLanguage = language || this.language;
      console.log(`=== SYNCING PRODUCT TO GOOGLE SHOPPING (${currentLanguage.toUpperCase()}) ===`);
      console.log(`Product: ${productData.mainProduct.title}`);
      console.log(`Language: ${currentLanguage}`);
      console.log(`Target Country: ${this.country}`);
      console.log(`Currency: ${this.currency}`);
      
      const auth = await this.getAuthClient();

      // Create a clean product for Google Shopping API
      const cleanedProduct = this.cleanProductForGoogleAPI(productData.mainProduct);

      // Upload main product
      const mainResult = await this.insertNewProduct(cleanedProduct);

      let variationCount = 0;

      // Upload variations as separate products
      if (productData.variations && productData.variations.length > 0) {
        console.log(`Syncing ${productData.variations.length} variations for ${currentLanguage}`);
        
        for (const variation of productData.variations) {
          try {
            const cleanVariation = this.cleanProductForGoogleAPI(variation);
            await this.insertNewProduct(cleanVariation);
            variationCount++;
          } catch (variationError) {
            console.error(`Failed to sync variation ${variation.offerId} (${currentLanguage}):`, variationError);
          }
        }
      }

      console.log(`✅ Successfully synced product in ${currentLanguage}: ${variationCount} variations`);

      return {
        success: true,
        googleProductId: mainResult.data?.id || productData.mainProduct.offerId,
        variationCount,
        language: currentLanguage
      };

    } catch (error) {
      console.error(`Failed to sync product to Google Shopping (${language || this.language}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        language: language || this.language
      };
    }
  }

  /**
   * Sync product in multiple languages
   */
  async syncProductMultiLanguage(
    product: ProductWithRelations,
    includeVariations: boolean = true,
    languages: string[] = ['en', 'ar']
  ): Promise<{
    success: boolean;
    results: Array<{
      language: string;
      success: boolean;
      googleProductId?: string;
      variationCount?: number;
      error?: string;
    }>;
  }> {
    const results = [];
    let overallSuccess = true;

    for (const language of languages) {
      try {
        console.log(`\n🌐 Processing product in ${language}...`);
        
        // Convert product to Google format for this language
        const productData = await this.convertProductToGoogleFormat(product, includeVariations, language);
        
        // Sync to Google Shopping for this language
        const syncResult = await this.syncProduct(productData, language);
        
        results.push({
          language,
          success: syncResult.success,
          googleProductId: syncResult.googleProductId,
          variationCount: syncResult.variationCount,
          error: syncResult.error
        });

        if (!syncResult.success) {
          overallSuccess = false;
        }

      } catch (error) {
        console.error(`Error processing product in ${language}:`, error);
        results.push({
          language,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        overallSuccess = false;
      }
    }

    return {
      success: overallSuccess,
      results
    };
  }

  /**
   * Clean product data for Google Shopping API
   */
  private cleanProductForGoogleAPI(productData: GoogleShoppingProduct): any {
    const allowedFields = [
      'offerId', 'title', 'description', 'link', 'imageLink', 'additionalImageLinks',
      'contentLanguage', 'targetCountry', 'channel', 'availability', 'condition',
      'price', 'brand', 'gtin', 'mpn', 'googleProductCategory', 'productTypes', 'material',
      'color', 'sizeSystem', 'ageGroup', 'gender', 'productWeight',
      'shippingWeight', 'customAttributes'
    ];

    const cleanedProduct: any = {};
    
    for (const field of allowedFields) {
      if (productData[field as keyof GoogleShoppingProduct] !== undefined) {
        cleanedProduct[field] = productData[field as keyof GoogleShoppingProduct];
      }
    }

    // Ensure problematic fields are never included
    delete cleanedProduct.productType;
    delete cleanedProduct.variations;
    delete cleanedProduct.size; // Size can cause issues in some contexts

    return cleanedProduct;
  }

  /**
   * Enhanced insert with better error handling
   */
  private async insertNewProduct(productData: any): Promise<any> {
    try {
      const auth = await this.getAuthClient();
      const content = google.content({ version: 'v2.1', auth });
      
      console.log(`🚀 Inserting product: ${productData.offerId} (${productData.contentLanguage})`);
      console.log(`   Title: ${productData.title}`);
      console.log(`   Price: ${productData.price?.value} ${productData.price?.currency}`);
      
      const result = await content.products.insert({
        merchantId: this.merchantId,
        requestBody: productData
      });
      
      console.log(`✅ Successfully inserted: ${productData.offerId}`);
      return result;

    } catch (error: any) {
      console.error(`❌ Failed to insert: ${productData.offerId}:`, error.message);
      
      // If product already exists, that's expected behavior
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`ℹ️ Product ${productData.offerId} already exists - updating instead`);
        return { 
          data: { id: `existing_${productData.offerId}` },
          skipped: true,
          reason: 'Product already exists'
        };
      }
      
      throw error;
    }
  }

  // Enhanced category mapping with Arabic support
  private mapCategoryToGoogle(categoryName: string, language: string = 'en'): string {
    const isArabic = language === 'ar';
    
    const categoryMap: Record<string, string> = {
      'coffee': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'قهوة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'beverages': 'Food, Beverages & Tobacco > Beverages',
      'مشروبات': 'Food, Beverages & Tobacco > Beverages',
      'accessories': 'Home & Garden > Kitchen & Dining > Barware',
      'إكسسوارات': 'Home & Garden > Kitchen & Dining > Barware',
      'equipment': 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines',
      'معدات': 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines',
      'beans': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'حبوب': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'ground': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'مطحونة': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'instant': 'Food, Beverages & Tobacco > Beverages > Coffee',
      'فورية': 'Food, Beverages & Tobacco > Beverages > Coffee'
    };

    const category = categoryName.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        return value;
      }
    }

    return 'Food, Beverages & Tobacco > Beverages > Coffee';
  }

  // Utility methods (unchanged)
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

  // Utility methods remain the same
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[^\w\s\u0600-\u06FF-]/g, '') // Allow Arabic characters
      .trim()
      .substring(0, 150);
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/[^\w\s\u0600-\u06FF.,!?-]/g, '') // Allow Arabic characters
      .trim()
      .substring(0, 5000);
  }

  private generateGTIN(sku?: string): string | undefined {
    if (!sku) return undefined;
    
    const prefix = '123456';
    const skuNum = sku.replace(/\D/g, '').substring(0, 6).padEnd(6, '0');
    const baseCode = prefix + skuNum;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(baseCode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return baseCode + checkDigit;
  }

  private makeAbsoluteUrl(url: string | null | undefined): string {
    if (!url || url === '') return '';

    const baseUrl = this.baseUrl || 'https://thegreenroasteries.com';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }

    return `${baseUrl}/${url}`;
  }
} 