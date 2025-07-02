// Utility functions for handling image caching and loading

export function addCacheBuster(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Don't add cache buster to external URLs
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // For uploaded images, add a timestamp to bust cache
  if (imageUrl.startsWith('/uploads/')) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  }
  
  return imageUrl;
}

export function getOptimizedImageUrl(imageUrl: string, width?: number, height?: number): string {
  if (!imageUrl) return '';
  
  // For uploaded images, use our custom serve-image API
  if (imageUrl.startsWith('/uploads/')) {
    return addCacheBuster(imageUrl);
  }
  
  // For other images, use as-is
  return imageUrl;
}

export function handleImageError(imageUrl: string): string {
  console.warn('Image failed to load:', imageUrl);
  
  // Return a placeholder or fallback image
  return '/images/placeholder.svg';
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Custom image component props for cache busting
export interface CacheBustedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

// Image refresh function to force reload
export function refreshImage(imageElement: HTMLImageElement) {
  if (imageElement && imageElement.src) {
    const originalSrc = imageElement.src.split('?')[0]; // Remove existing query params
    imageElement.src = addCacheBuster(originalSrc);
  }
}

// Global image refresh function for the entire page
export function refreshAllImages() {
  const images = document.querySelectorAll('img[src*="/uploads/"]');
  images.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      refreshImage(img);
    }
  });
} 