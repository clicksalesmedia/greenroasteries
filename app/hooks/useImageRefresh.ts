import { useState, useCallback, useEffect } from 'react';
import { addCacheBuster, getOptimizedImageUrl } from '../utils/image-cache';

interface UseImageRefreshOptions {
  enableRefresh?: boolean;
  fallbackSrc?: string;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

interface UseImageRefreshReturn {
  src: string;
  isLoading: boolean;
  hasError: boolean;
  refresh: () => void;
  reset: () => void;
}

export function useImageRefresh(
  originalSrc: string | undefined, 
  options: UseImageRefreshOptions = {}
): UseImageRefreshReturn {
  const { 
    enableRefresh = true, 
    fallbackSrc = '/images/placeholder.svg',
    onError,
    onLoad 
  } = options;

  const [src, setSrc] = useState<string>(() => {
    if (!originalSrc) return fallbackSrc;
    return enableRefresh ? addCacheBuster(originalSrc) : originalSrc;
  });
  
  const [isLoading, setIsLoading] = useState(!!originalSrc);
  const [hasError, setHasError] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Reset state when original src changes
  useEffect(() => {
    if (!originalSrc) {
      setSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(false);
      setRefreshCount(0);
      return;
    }

    const newSrc = enableRefresh ? addCacheBuster(originalSrc) : originalSrc;
    setSrc(newSrc);
    setIsLoading(true);
    setHasError(false);
    setRefreshCount(0);
  }, [originalSrc, enableRefresh, fallbackSrc]);

  // Preload image to detect errors
  useEffect(() => {
    if (!originalSrc || hasError) return;

    const img = new Image();
    let mounted = true;

    img.onload = () => {
      if (!mounted) return;
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      if (!mounted) return;
      setIsLoading(false);
      setHasError(true);
      
      // Only try fallback if we haven't exceeded retry limit
      if (refreshCount < 2) {
        setSrc(fallbackSrc);
      }
      
      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
      console.warn('Image failed to load:', src);
    };

    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src, hasError, refreshCount, fallbackSrc, onError, onLoad, originalSrc]);

  const refresh = useCallback(() => {
    if (!originalSrc || !enableRefresh) return;
    
    setRefreshCount(prev => prev + 1);
    const refreshedSrc = addCacheBuster(originalSrc);
    setSrc(refreshedSrc);
    setIsLoading(true);
    setHasError(false);
  }, [originalSrc, enableRefresh]);

  const reset = useCallback(() => {
    if (!originalSrc) return;
    
    setRefreshCount(0);
    const resetSrc = enableRefresh ? addCacheBuster(originalSrc) : originalSrc;
    setSrc(resetSrc);
    setIsLoading(true);
    setHasError(false);
  }, [originalSrc, enableRefresh]);

  return {
    src: hasError ? fallbackSrc : src,
    isLoading,
    hasError,
    refresh,
    reset
  };
}

// Hook for optimized image loading
export function useOptimizedImage(
  originalSrc: string | undefined,
  width?: number,
  height?: number,
  options: UseImageRefreshOptions = {}
): UseImageRefreshReturn {
  const optimizedSrc = originalSrc ? getOptimizedImageUrl(originalSrc, width, height) : undefined;
  return useImageRefresh(optimizedSrc, options);
}

// Global image refresh utility
export function useGlobalImageRefresh() {
  const refreshAllImages = useCallback(() => {
    const images = document.querySelectorAll('img[src*="/uploads/"]');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement && img.src) {
        const originalSrc = img.src.split('?')[0];
        img.src = addCacheBuster(originalSrc);
      }
    });
  }, []);

  return { refreshAllImages };
}

// Helper function to trigger image refresh events
export function triggerImageRefresh() {
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('imageUploaded'));
}

// Hook for components that upload images
export function useImageUpload() {
  const notifyImageUploaded = useCallback(() => {
    triggerImageRefresh();
  }, []);

  return {
    notifyImageUploaded,
  };
} 