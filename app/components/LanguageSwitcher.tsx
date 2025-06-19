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

  // Helper function to switch languages with URL updates
  const switchLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguage(newLanguage);
    setIsOpen(false);
    
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const pathname = currentUrl.pathname;
      const search = currentUrl.search;
      
      // Remove existing language prefix if present
      const cleanPath = pathname.replace(/^\/ar/, '') || '/';
      
      // Generate new URL based on target language
      let newPath: string;
      if (newLanguage === 'ar') {
        newPath = cleanPath === '/' ? '/ar' : `/ar${cleanPath}`;
      } else {
        newPath = cleanPath;
      }
      
      // Navigate to the new URL
      const newUrl = `${newPath}${search}`;
      window.location.href = newUrl;
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