'use client';

import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface LanguageLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  forceLanguage?: 'ar' | 'en';
  [key: string]: any;
}

export default function LanguageLink({ 
  href, 
  children, 
  className, 
  forceLanguage,
  ...props 
}: LanguageLinkProps) {
  const { language } = useLanguage();
  
  // Use forced language or current language
  const targetLanguage = forceLanguage || language;
  
  // Generate language-specific URL
  const getLanguageUrl = (path: string, lang: string) => {
    // Don't add language prefix for English (default)
    if (lang === 'en') {
      return path;
    }
    
    // Add Arabic prefix for Arabic URLs
    if (lang === 'ar') {
      // Handle root path
      if (path === '/') {
        return '/ar';
      }
      
      // Handle other paths
      return `/ar${path}`;
    }
    
    return path;
  };
  
  const finalHref = getLanguageUrl(href, targetLanguage);
  
  return (
    <Link href={finalHref} className={className} {...props}>
      {children}
    </Link>
  );
}

// Helper function to generate URLs for ads campaigns
export function generateLanguageUrls(basePath: string): { en: string; ar: string } {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com';
  
  return {
    en: `${baseUrl}${basePath}`,
    ar: `${baseUrl}/ar${basePath === '/' ? '' : basePath}`
  };
}

// Export individual URL generators for convenience
export const getEnglishUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com';
  return `${baseUrl}${path}`;
};

export const getArabicUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com';
  return `${baseUrl}/ar${path === '/' ? '' : path}`;
}; 