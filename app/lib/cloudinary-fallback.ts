// Cloudinary fallback image configuration
export const CLOUDINARY_FALLBACK_IMAGE = 'https://res.cloudinary.com/dgcexgq5g/image/upload/v1751638020/greenroasteries/fallback/greenroasteries/fallback/coffee-placeholder.webp';

// Helper function to get a fallback image URL
export const getCloudinaryFallback = () => CLOUDINARY_FALLBACK_IMAGE;

// Helper function to get image URL with fallback
export const getImageUrlWithFallback = (imageUrl?: string | null): string => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  return CLOUDINARY_FALLBACK_IMAGE;
}; 