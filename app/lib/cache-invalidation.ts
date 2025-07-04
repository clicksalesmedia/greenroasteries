// Specialized cache invalidation for product updates
import { invalidateCache } from './cache';

export function invalidateAllProductCaches() {
  // Clear all product-related caches
  invalidateCache('products');
  
  // Clear specific product cache patterns
  const cachePatterns = [
    'products-',
    'featured-products',
    'discounted-products',
    'category-products',
    'search-products'
  ];
  
  cachePatterns.forEach(pattern => {
    invalidateCache(pattern);
  });
  
  console.log('🔄 All product caches invalidated for immediate updates');
}

export function invalidateProductCache(productId: string) {
  // Clear specific product caches
  invalidateCache(`product-${productId}`);
  invalidateCache('products');
  
  console.log(`🔄 Product cache invalidated for product: ${productId}`);
}

export function invalidateCategoryCache(categoryId: string) {
  // Clear category-related caches
  invalidateCache(`category-${categoryId}`);
  invalidateCache('categories');
  invalidateCache('products'); // Products cache depends on categories
  
  console.log(`🔄 Category cache invalidated for category: ${categoryId}`);
} 