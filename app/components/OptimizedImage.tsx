'use client';

import { useState, forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { useOptimizedImage } from '../hooks/useImageRefresh';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'onError' | 'onLoad'> {
  src?: string;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  enableRefresh?: boolean;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  className?: string;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    fallbackSrc = '/images/placeholder.svg',
    showLoadingSpinner = true,
    enableRefresh = true,
    onError,
    onLoad,
    className = '',
    priority = false,
    loading = 'lazy',
    ...props
  }, ref) => {
    const {
      src: optimizedSrc,
      isLoading,
      hasError,
      refresh
    } = useOptimizedImage(
      src,
      typeof width === 'number' ? width : undefined,
      typeof height === 'number' ? height : undefined,
      {
        enableRefresh,
        fallbackSrc,
        onError,
        onLoad
      }
    );

    // If no src provided, show placeholder
    if (!src) {
      return (
        <div 
          className={`bg-gray-100 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
        {/* Loading Spinner */}
        {isLoading && showLoadingSpinner && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State with Retry */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            {enableRefresh && (
              <button
                onClick={refresh}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Actual Image */}
        <Image
          ref={ref}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
          priority={priority}
          loading={loading}
          onLoad={() => {
            // Image loaded successfully handled by hook
          }}
          onError={() => {
            // Error handled by hook
          }}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage; 