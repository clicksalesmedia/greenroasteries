// Simple in-memory cache for API responses
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create a global cache instance
const cache = new MemoryCache();

// Clean up expired items every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache wrapper function for API responses
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  cache.set(key, data, ttlSeconds);
  
  return data;
}

// Specific cache functions for common operations
export const cacheKeys = {
  products: (category?: string) => `products${category ? `-${category}` : ''}`,
  product: (id: string) => `product-${id}`,
  categories: () => 'categories',
  sliders: () => 'sliders',
  variations: (type: string) => `variations-${type}`,
};

// Cache invalidation functions
export const invalidateCache = {
  products: () => {
    const keys = Array.from((cache as any).cache.keys()) as string[];
    keys.forEach((key: string) => {
      if (key.includes('products')) {
        cache.delete(key);
      }
    });
  },
  product: (id: string) => {
    cache.delete(cacheKeys.product(id));
    // Also invalidate products list
    invalidateCache.products();
  },
  categories: () => {
    cache.delete(cacheKeys.categories());
  },
  all: () => {
    cache.clear();
  },
};

export default cache; 