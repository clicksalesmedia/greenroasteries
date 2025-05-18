'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to preserve URL parameters when switching languages
  const switchLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguage(newLanguage);
    setIsOpen(false);
    
    // If we're on the shop page with a category parameter, ensure it remains in English
    if (typeof window !== 'undefined' && window.location.pathname.includes('/shop')) {
      const currentUrl = new URL(window.location.href);
      const categoryParam = currentUrl.searchParams.get('category');
      
      // If there's a category parameter, ensure it stays in English format
      if (categoryParam) {
        // Map of Arabic category names to their English equivalents for URL consistency
        const categoryMappings: Record<string, string> = {
          'المكسرات والفواكه المجففة': 'NUTS & DRIED FRUITS',
          'قهوة عربية': 'ARABIC COFFEE',
          'قهوة مختصة': 'SPECIALTY COFFEE',
          'قهوة مطحونة': 'GROUND COFFEE',
          'قهوة اسبريسو': 'ESPRESSO ROAST',
          'قهوة متوسطة التحميص': 'MEDIUM ROAST',
          'قهوة داكنة التحميص': 'DARK ROAST',
          'قهوة فاتحة التحميص': 'LIGHT ROAST',
          'أكسسوارات القهوة': 'COFFEE ACCESSORIES',
        };
        
        // If switching to Arabic and the category is in English, preserve English in URL
        if (newLanguage === 'ar') {
          // No need to change anything - keep English category in URL
        } 
        // If switching to English and the category might be in Arabic, convert to English
        else if (newLanguage === 'en' && categoryMappings[categoryParam]) {
          currentUrl.searchParams.set('category', categoryMappings[categoryParam]);
          window.history.pushState({}, '', currentUrl.toString());
        }
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center text-gray-700 hover:text-green-700 focus:outline-none"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeAltIcon className="h-5 w-5" />
        <span className="sr-only">Switch language</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-10 bg-white rounded-md shadow-lg py-1 min-w-32 border border-gray-200">
          <button
            className={`w-full text-left px-4 py-2 text-sm block ${language === 'ar' ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => switchLanguage('ar')}
          >
            العربية
          </button>
          <button
            className={`w-full text-left px-4 py-2 text-sm block ${language === 'en' ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => switchLanguage('en')}
          >
            English
          </button>
        </div>
      )}
    </div>
  );
} 