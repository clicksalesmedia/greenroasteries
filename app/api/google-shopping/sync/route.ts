import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { checkAuth } from '@/app/lib/auth';
import { GoogleShoppingService } from '@/app/lib/google-shopping';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { 
      productIds = [], 
      syncAll = false, 
      dryRun = false,
      includeVariations = true,
      batchSize = 50,  // Reduced for better performance with multi-language
      languages = ['en'], // New: Support multiple languages
      syncMode = 'single' // New: 'single' or 'multi' language mode
    } = body;

    console.log(`=== Google Shopping Sync Started ===`);
    console.log(`Mode: ${syncMode}, Languages: ${languages.join(', ')}, Dry Run: ${dryRun}`);

    // Validate languages
    const supportedLanguages = GoogleShoppingService.getSupportedLanguages();
    const validLanguages = languages.filter((lang: string) => supportedLanguages[lang]);
    
    if (validLanguages.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid languages specified. Supported: ' + Object.keys(supportedLanguages).join(', '),
          supportedLanguages: Object.keys(supportedLanguages)
        },
        { status: 400 }
      );
    }

    // For single language mode, validate Google Shopping configuration
    if (syncMode === 'single') {
      const googleShopping = new GoogleShoppingService(validLanguages[0]);
      if (!googleShopping.isConfigured()) {
        return NextResponse.json(
          { 
            error: 'Google Shopping API not configured. Please add required environment variables.',
            required: [
              'GOOGLE_MERCHANT_CENTER_ID',
              'GOOGLE_SERVICE_ACCOUNT_KEY'
            ]
          },
          { status: 400 }
        );
      }
    }

    let products;
    
    if (syncAll) {
      // Get ALL products with Arabic fields
      products = await prisma.product.findMany({
        where: {
          // Only exclude explicitly deleted products
        },
        include: {
          category: true,
          images: true,
          variations: {
            where: { isActive: true },
            include: {
              size: true,
              type: true,
              beans: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (productIds.length > 0) {
      // Get specific products with Arabic fields
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        include: {
          category: true,
          images: true,
          variations: {
            where: { isActive: true },
            include: {
              size: true,
              type: true,
              beans: true,
            }
          }
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either specify productIds or set syncAll to true' },
        { status: 400 }
      );
    }

    console.log(`Found ${products.length} products to process`);
    
    if (products.length === 0) {
      return NextResponse.json(
        { 
          message: 'No products found to sync',
          debug: {
            syncAll,
            productIds: productIds.length,
            totalProductsInDB: await prisma.product.count()
          }
        },
        { status: 200 }
      );
    }

    // Prepare sync results with multi-language support
    const results = {
      totalProducts: products.length,
      totalLanguages: validLanguages.length,
      syncMode,
      languages: validLanguages,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [] as any[],
      syncedProducts: [] as any[],
      dryRun,
      message: '' as string,
      languageResults: {} as Record<string, any>
    };

    // Initialize language-specific results
    validLanguages.forEach((lang: string) => {
      results.languageResults[lang] = {
        successCount: 0,
        errorCount: 0,
        syncedProducts: [],
        errors: []
      };
    });

    // Process products in batches
    const totalProducts = products.length;
    const processBatch = Math.min(batchSize, totalProducts);
    const processedProducts = products.slice(0, processBatch);
    
    console.log(`Processing batch of ${processedProducts.length} products in ${validLanguages.length} language(s)`);
    
    const startTime = Date.now();
    const maxProcessingTime = 180000; // 3 minutes for multi-language

    // Process each product
    for (const product of processedProducts) {
      // Check timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('Approaching timeout, stopping batch processing');
        break;
      }
      
      try {
        console.log(`\n📦 Processing: ${product.name} (${product.category?.name})`);
        console.log(`   Stock: ${product.stockQuantity}, InStock: ${product.inStock}`);
        console.log(`   Has Arabic name: ${!!product.nameAr}`);
        console.log(`   Has Arabic description: ${!!product.descriptionAr}`);

        if (syncMode === 'multi') {
          // Multi-language sync: Process all languages for this product
          const multiLangResult = await syncProductMultiLanguage(
            product, 
            includeVariations, 
            validLanguages,
            dryRun
          );
          
          // Aggregate results
          for (const langResult of multiLangResult.results) {
            const langStats = results.languageResults[langResult.language];
            
            if (langResult.success) {
              langStats.successCount++;
              langStats.syncedProducts.push({
                productId: product.id,
                productName: product.name,
                googleProductId: langResult.googleProductId,
                variations: langResult.variationCount || 0,
                status: dryRun ? 'validated' : 'synced',
                language: langResult.language,
                category: product.category?.name
              });
              results.successCount++;
            } else {
              langStats.errorCount++;
              langStats.errors.push({
                productId: product.id,
                productName: product.name,
                error: langResult.error,
                language: langResult.language,
                category: product.category?.name
              });
              results.errorCount++;
            }
          }
          
        } else {
          // Single language sync: Process with primary language only
          const primaryLanguage = validLanguages[0];
          const singleLangResult = await syncProductSingleLanguage(
            product,
            includeVariations,
            primaryLanguage,
            dryRun
          );
          
          const langStats = results.languageResults[primaryLanguage];
          
          if (singleLangResult.success) {
            langStats.successCount++;
            langStats.syncedProducts.push({
              productId: product.id,
              productName: product.name,
              googleProductId: singleLangResult.googleProductId,
              variations: singleLangResult.variationCount || 0,
              status: dryRun ? 'validated' : 'synced',
              language: primaryLanguage,
              category: product.category?.name
            });
            results.successCount++;
          } else {
            langStats.errorCount++;
            langStats.errors.push({
              productId: product.id,
              productName: product.name,
              error: singleLangResult.error,
              language: primaryLanguage,
              category: product.category?.name
            });
            results.errorCount++;
          }
        }

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
                 // Add error to all language results
         validLanguages.forEach((lang: string) => {
           results.languageResults[lang].errors.push({
            productId: product.id,
            productName: product.name,
            error: errorMessage,
            language: lang,
            category: product.category?.name
          });
        });
        
        results.errorCount += validLanguages.length;
      }
    }

    // Aggregate all language-specific results for backward compatibility
    results.syncedProducts = [];
    results.errors = [];
    
    Object.entries(results.languageResults).forEach(([lang, langResult]: [string, any]) => {
      results.syncedProducts.push(...langResult.syncedProducts);
      results.errors.push(...langResult.errors);
    });

    // Generate summary message
    const remainingProducts = totalProducts - processedProducts.length;
    if (remainingProducts > 0) {
      results.message = `Processed ${processedProducts.length} of ${totalProducts} products in ${validLanguages.length} language(s). ${remainingProducts} products remaining.`;
    } else {
      const langSummary = validLanguages.map((lang: string) => {
        const langStats = results.languageResults[lang];
        return `${lang.toUpperCase()}: ${langStats.successCount} synced, ${langStats.errorCount} errors`;
      }).join(' | ');
      
      results.message = `✅ Completed processing ${totalProducts} products. ${langSummary}`;
    }

    console.log(`\n=== Google Shopping Sync Completed ===`);
    console.log(`Total Success: ${results.successCount}, Total Errors: ${results.errorCount}`);
    console.log(`Languages processed: ${validLanguages.join(', ')}`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Google Shopping sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync products to Google Shopping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function for multi-language sync
async function syncProductMultiLanguage(
  product: any,
  includeVariations: boolean,
  languages: string[],
  dryRun: boolean
) {
  const googleShopping = new GoogleShoppingService();
  
  if (!googleShopping.isConfigured()) {
    throw new Error('Google Shopping not configured');
  }
  
  return await googleShopping.syncProductMultiLanguage(
    product,
    includeVariations,
    languages
  );
}

// Helper function for single language sync
async function syncProductSingleLanguage(
  product: any,
  includeVariations: boolean,
  language: string,
  dryRun: boolean
) {
  const googleShopping = new GoogleShoppingService(language);
  
  if (!googleShopping.isConfigured()) {
    throw new Error('Google Shopping not configured');
  }
  
  try {
    const productData = await googleShopping.convertProductToGoogleFormat(
      product, 
      includeVariations, 
      language
    );
    
    if (dryRun) {
      return {
        success: true,
        googleProductId: productData.mainProduct.offerId,
        variationCount: productData.variations.length,
        language
      };
    }
    
    return await googleShopping.syncProduct(productData, language);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      language
    };
  }
}

// Enhanced GET endpoint with language support
export async function GET(_request: NextRequest) {
  try {
    // Check admin authentication - ADMIN only
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    // Get configuration for all supported languages
    const supportedLanguages = GoogleShoppingService.getSupportedLanguages();
    const languageConfigs: Record<string, any> = {};
    
    for (const [langCode, langConfig] of Object.entries(supportedLanguages)) {
      const googleShopping = new GoogleShoppingService(langCode);
      languageConfigs[langCode] = {
        ...langConfig,
        configured: googleShopping.isConfigured()
      };
    }
    
    // Get product counts with Arabic content analysis
    const totalProducts = await prisma.product.count();
    const inStockProducts = await prisma.product.count({
      where: { inStock: true }
    });
    
    const productsWithArabicNames = await prisma.product.count({
      where: { 
        nameAr: { not: null },
        nameAr: { not: '' }
      }
    });
    
    const productsWithArabicDescriptions = await prisma.product.count({
      where: { 
        descriptionAr: { not: null },
        descriptionAr: { not: '' }
      }
    });
    
    const productsWithVariations = await prisma.product.count({
      where: {
        inStock: true,
        variations: {
          some: { isActive: true }
        }
      }
    });

    // Check overall configuration status
    const isAnyLanguageConfigured = Object.values(languageConfigs).some(
      (config: any) => config.configured
    );

    return NextResponse.json({
      configured: isAnyLanguageConfigured,
      totalProducts,
      inStockProducts,
      productsWithVariations,
      arabicContent: {
        productsWithArabicNames,
        productsWithArabicDescriptions,
        arabicReadiness: Math.round((productsWithArabicNames / Math.max(totalProducts, 1)) * 100)
      },
      supportedLanguages: languageConfigs,
      configuration: isAnyLanguageConfigured ? {
        merchantId: process.env.GOOGLE_MERCHANT_CENTER_ID ? 'configured' : 'missing',
        serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'configured' : 'missing',
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://thegreenroasteries.com'
      } : null,
      features: {
        multiLanguageSupport: true,
        availableLanguages: Object.keys(supportedLanguages),
        arabicSupport: true
      }
    });

  } catch (error) {
    console.error('Error getting Google Shopping status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
} 