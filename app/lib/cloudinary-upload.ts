// Cloudinary upload utility for direct image uploads - Version 2.0 - Updated at 2025-01-04T16:50:00Z
import { CLOUDINARY_FALLBACK_IMAGE } from './cloudinary-fallback';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dgcexgq5g';
const CLOUDINARY_API_KEY = '263832946349343';
const CLOUDINARY_API_SECRET = 'Hsq4Z_l8Yij5Z52Qd9lhFQ-cpi0';
const CLOUDINARY_UPLOAD_PRESET = 'greenroasteries_preset';

// Upload result interface
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
  resource_type: string;
  type: string;
  version: number;
  folder?: string;
}

// Upload options interface - only allowed parameters for unsigned uploads
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
}

// Default upload options for different image types
const DEFAULT_OPTIONS: Record<string, CloudinaryUploadOptions> = {
  'products': {
    folder: 'greenroasteries/products',
  },
  'products/gallery': {
    folder: 'greenroasteries/products/gallery',
  },
  'products/variations': {
    folder: 'greenroasteries/products/variations',
  },
  'categories': {
    folder: 'greenroasteries/categories',
  },
  'sliders': {
    folder: 'greenroasteries/sliders',
  },
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Please use JPG, PNG, WEBP, or AVIF.`
    };
  }

  // Check file size (10MB max for high quality images)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { isValid: true };
};

// Upload single image to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  uploadType: string = 'products',
  customOptions?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> => {
  console.log('🚀 NEW CLOUDINARY UPLOAD - VERSION 2.0');
  
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Get default options for the upload type
  const defaultOptions = DEFAULT_OPTIONS[uploadType] || DEFAULT_OPTIONS['products'];
  
  // Merge options
  const options = { ...defaultOptions, ...customOptions };

  // Create form data with ONLY allowed parameters
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  // Add folder if specified
  if (options.folder) {
    formData.append('folder', options.folder);
  }

  // Add public_id if specified
  if (options.public_id) {
    formData.append('public_id', options.public_id);
  }

  // Add tags for organization
  if (options.folder) {
    formData.append('tags', `${options.folder.replace(/\//g, '_')}`);
  }

  console.log('📤 Uploading to Cloudinary with parameters:', {
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
    folder: options.folder,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type
  });

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudinary API Error:', errorData);
      
      if (errorData.error) {
        const errorMessage = errorData.error.message || 'Unknown Cloudinary error';
        throw new Error(`Cloudinary Error: ${errorMessage}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: CloudinaryUploadResult = await response.json();
    
    console.log('✅ Cloudinary upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    });

    return result;
  } catch (error) {
    console.error('💥 Cloudinary upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Please check your internet connection');
      }
      
      if (error.message.includes('Cloudinary Error')) {
        throw new Error(error.message);
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred during upload');
  }
};

// Upload multiple images to Cloudinary
export const uploadMultipleToCloudinary = async (
  files: File[],
  uploadType: string = 'products',
  customOptions?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult[]> => {
  console.log(`🚀 Uploading ${files.length} images to Cloudinary`);
  
  const uploadPromises = files.map(file => uploadToCloudinary(file, uploadType, customOptions));
  
  try {
    const results = await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${results.length} images`);
    return results;
  } catch (error) {
    console.error('💥 Multiple upload error:', error);
    throw error;
  }
};

// Get optimized image URL from Cloudinary
export const getOptimizedImageUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
    gravity?: string;
  }
): string => {
  if (!publicId) return CLOUDINARY_FALLBACK_IMAGE;

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  let transformations = [];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.gravity) transformations.push(`g_${options.gravity}`);
  
  const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
  
  return `${baseUrl}/${transformationString}${publicId}`;
};

// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}; 