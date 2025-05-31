// Cache busting utilities for handling browser cache issues
export class CacheManager {
  private static readonly CACHE_KEYS = {
    SLIDERS: 'sliders',
    BANNERS: 'banners',
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
  };

  // Generate cache-busting URL parameter
  static getCacheBuster(): string {
    return `_cb=${Date.now()}`;
  }

  // Add cache buster to URL
  static addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.getCacheBuster()}`;
  }

  // Force refresh API data by adding cache buster
  static async fetchWithCacheBust(url: string, options?: RequestInit): Promise<Response> {
    const cacheBustedUrl = this.addCacheBuster(url);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options?.headers,
      },
      ...options,
    };

    return fetch(cacheBustedUrl, defaultOptions);
  }

  // Clear browser cache for specific data types
  static async clearCache(type?: keyof typeof CacheManager.CACHE_KEYS): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage cache
        if (type) {
          localStorage.removeItem(`cache_${this.CACHE_KEYS[type]}`);
        } else {
          // Clear all cache
          Object.values(this.CACHE_KEYS).forEach(key => {
            localStorage.removeItem(`cache_${key}`);
          });
        }

        // If service worker is available, clear its cache
        if ('serviceWorker' in navigator && 'caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => {
              if (type) {
                // Clear specific cache
                return caches.open(cacheName).then(cache => {
                  return cache.keys().then(requests => {
                    return Promise.all(
                      requests
                        .filter(request => request.url.includes(this.CACHE_KEYS[type]))
                        .map(request => cache.delete(request))
                    );
                  });
                });
              } else {
                // Clear all caches
                return caches.delete(cacheName);
              }
            })
          );
        }
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    }
  }

  // Force page reload with cache clear
  static forceReload(): void {
    if (typeof window !== 'undefined') {
      // Clear cache first
      this.clearCache();
      
      // Force reload from server
      window.location.reload();
    }
  }

  // Set up cache invalidation headers for fetch requests
  static getNoCacheHeaders(): HeadersInit {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  // Validate if cached data is still fresh
  static isCacheValid(cacheTime: number, maxAgeMinutes: number = 5): boolean {
    const now = Date.now();
    const ageInMinutes = (now - cacheTime) / (1000 * 60);
    return ageInMinutes < maxAgeMinutes;
  }

  // Cached fetch with expiration
  static async cachedFetch(
    url: string, 
    cacheKey: string, 
    maxAgeMinutes: number = 5,
    options?: RequestInit
  ): Promise<any> {
    if (typeof window === 'undefined') {
      // Server-side, just fetch
      const response = await fetch(url, options);
      return response.json();
    }

    try {
      // Check for cached data
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (this.isCacheValid(timestamp, maxAgeMinutes)) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to read cache:', error);
    }

    // Fetch fresh data
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getNoCacheHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the data
    try {
      localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }

    return data;
  }
}

// Hook for React components to force refresh
export function useForceRefresh() {
  const forceRefresh = () => {
    CacheManager.clearCache();
    window.location.reload();
  };

  return forceRefresh;
}

// Utility to check if browser supports cache API
export function supportsCacheAPI(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

// Add meta tags to prevent caching of dynamic pages
export function addNoCacheMetaTags() {
  if (typeof document !== 'undefined') {
    const metaTags = [
      { name: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
      { name: 'Pragma', content: 'no-cache' },
      { name: 'Expires', content: '0' },
    ];

    metaTags.forEach(({ name, content }) => {
      let metaTag = document.querySelector(`meta[http-equiv="${name}"]`) as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.httpEquiv = name;
        document.head.appendChild(metaTag);
      }
      metaTag.content = content;
    });
  }
} 