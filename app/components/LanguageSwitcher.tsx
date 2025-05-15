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
            onClick={() => {
              setLanguage('ar');
              setIsOpen(false);
            }}
          >
            العربية
          </button>
          <button
            className={`w-full text-left px-4 py-2 text-sm block ${language === 'en' ? 'bg-gray-100 font-bold' : ''}`}
            onClick={() => {
              setLanguage('en');
              setIsOpen(false);
            }}
          >
            English
          </button>
        </div>
      )}
    </div>
  );
} 