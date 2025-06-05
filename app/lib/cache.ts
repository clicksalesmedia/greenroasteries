// Enhanced caching system for better performance
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of cache entries
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 300): void {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Global cache instance
const globalCache = new MemoryCache();

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache HIT for key: ${key}`);
    return cached;
  }

  console.log(`Cache MISS for key: ${key}`);
  
  try {
    // Execute the function and cache the result
    const result = await fn();
    globalCache.set(key, result, ttl);
    return result;
  } catch (error) {
    console.error(`Error executing function for cache key ${key}:`, error);
    throw error;
  }
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    globalCache.clear();
    console.log('All cache entries cleared');
    return;
  }

  // Clear entries matching pattern
  let cleared = 0;
  for (const key of Array.from(globalCache['cache'].keys())) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
      cleared++;
    }
  }
  console.log(`Cleared ${cleared} cache entries matching pattern: ${pattern}`);
}

export function getCacheStats() {
  return globalCache.getStats();
}

export { globalCache }; 