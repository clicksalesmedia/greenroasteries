'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TabbyOfficialSnippetProps {
  price: number;
  currency?: string;
  source?: 'product' | 'cart';
  className?: string;
}

// Declare global TabbyPromo for TypeScript
declare global {
  interface Window {
    TabbyPromo: any;
  }
}

export default function TabbyOfficialSnippet({ 
  price, 
  currency = 'AED', 
  source = 'product',
  className = ''
}: TabbyOfficialSnippetProps) {
  const { language } = useLanguage();
  
  useEffect(() => {
    // Only proceed if we have a valid price and currency
    if (!price || price <= 0 || price < 1 || price > 5000) return;
    
    // Check if script is already loaded
    if (document.querySelector('script[src="https://checkout.tabby.ai/tabby-promo.js"]')) {
      // Clear existing content first
      const element = document.getElementById(tabbyId);
      if (element) {
        element.innerHTML = '';
      }
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeTabby();
      }, 100);
      return;
    }
    
    // Load Tabby script
    const script = document.createElement('script');
    script.src = 'https://checkout.tabby.ai/tabby-promo.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        initializeTabby();
      }, 100);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup the div content when component unmounts or price changes
      const element = document.getElementById(tabbyId);
      if (element) {
        element.innerHTML = '';
      }
    };
  }, [price, currency, language, source]);

  const tabbyId = `TabbyPromo-${source}`;

  const initializeTabby = () => {
    if (window.TabbyPromo) {
      try {
        const config = {
          selector: `#${tabbyId}`,
          currency: currency.toUpperCase(),
          price: price.toFixed(2),
          lang: language === 'ar' ? 'ar' : 'en',
          source: source,
          publicKey: process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || '',
          merchantCode: process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || 'GR'
        };
        
        console.log('Initializing Tabby with config:', config);
        
        new window.TabbyPromo(config);
      } catch (error) {
        console.error('Error initializing Tabby promo:', error);
        console.log('Tabby config:', {
          selector: `#${tabbyId}`,
          currency: currency.toUpperCase(),
          price: price.toFixed(2),
          lang: language === 'ar' ? 'ar' : 'en',
          source: source,
          publicKey: process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY ? 'SET' : 'NOT_SET',
          merchantCode: process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || 'GR'
        });
      }
    } else {
      console.warn('TabbyPromo not available on window object');
    }
  };

  // Don't render if price is invalid or Tabby is not available for this amount
  if (!price || price <= 0 || price < 1 || price > 5000) {
    return null;
  }

  return (
    <div className={className}>
      <div id={tabbyId}></div>
    </div>
  );
} 