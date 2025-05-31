'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface CacheRefreshButtonProps {
  onRefresh?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CacheRefreshButton({ 
  onRefresh, 
  className = '',
  size = 'md' 
}: CacheRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Clear browser cache
      if (typeof window !== 'undefined') {
        // Clear localStorage cache
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cache_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear service worker cache if available
        if ('serviceWorker' in navigator && 'caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }
      }

      // Call custom refresh function if provided
      if (onRefresh) {
        await onRefresh();
      }

      // Force page reload with cache bypass
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        inline-flex items-center gap-2 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium rounded-md 
        transition-colors duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      title="Clear cache and refresh content"
    >
      <ArrowPathIcon 
        className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh Cache'}
    </button>
  );
} 