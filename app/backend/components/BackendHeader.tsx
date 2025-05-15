'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext'; // Import the language context
import { GlobeAltIcon } from '@heroicons/react/24/outline'; // Import globe icon for language switcher
import { getDirection } from '@/app/utils/i18n'; // Import direction utility
// Assuming you have a logo component or can use an img tag
// import Logo from './Logo'; 

export default function BackendHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false); // State for language dropdown
  const { language, setLanguage, t } = useLanguage(); // Use the language context

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Close language dropdown if open
    if (isLangDropdownOpen) setIsLangDropdownOpen(false);
  };

  const toggleLangDropdown = () => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
    // Close user dropdown if open
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  // Determine position-related classes based on language direction
  const endAlignClass = language === 'ar' ? 'left-0' : 'right-0';
  const startAlignClass = language === 'ar' ? 'right-0' : 'left-0';
  const spacingClass = language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4';

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      {/* Logo section - position based on language */}
      <div className={`flex items-center ${language === 'ar' ? 'order-2' : 'order-1'}`}>
        {/* Replace with your actual logo component or image */}
        <span className="text-xl font-bold text-green-900">{t('backend_logo', 'Backend Logo')}</span>
      </div>

      {/* Controls section - position based on language */}
      <div className={`flex items-center ${spacingClass} ${language === 'ar' ? 'order-1' : 'order-2'}`}>
        {/* Language switcher */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={toggleLangDropdown}
            aria-expanded={isLangDropdownOpen}
            aria-haspopup="true"
          >
            <GlobeAltIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Language dropdown - position based on language */}
          {isLangDropdownOpen && (
            <div
              className={`origin-top-${language === 'ar' ? 'left' : 'right'} absolute ${endAlignClass} mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
              role="menu"
              aria-orientation="vertical"
              style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
            >
              <button
                className={`block w-full text-${language === 'ar' ? 'right' : 'left'} px-4 py-2 text-sm ${language === 'ar' ? 'bg-gray-100 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => {
                  setLanguage('ar');
                  setIsLangDropdownOpen(false);
                }}
              >
                العربية
              </button>
              <button
                className={`block w-full text-${language === 'ar' ? 'right' : 'left'} px-4 py-2 text-sm ${language === 'en' ? 'bg-gray-100 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => {
                  setLanguage('en');
                  setIsLangDropdownOpen(false);
                }}
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* Profile/Avatar dropdown */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className="sr-only">{t('open_user_menu', 'Open user menu')}</span>
            {/* Replace with user avatar or icon */}
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              U
            </div>
          </button>

          {/* User dropdown - position based on language */}
          {isDropdownOpen && (
            <div
              className={`origin-top-${language === 'ar' ? 'left' : 'right'} absolute ${endAlignClass} mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
            >
              <Link href="/backend/profile" legacyBehavior>
                <a className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-${language === 'ar' ? 'right' : 'left'}`} role="menuitem">
                  {t('profile', 'Profile')}
                </a>
              </Link>
              <Link href="/backend/settings" legacyBehavior>
                <a className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-${language === 'ar' ? 'right' : 'left'}`} role="menuitem">
                  {t('settings', 'Settings')}
                </a>
              </Link>
              {/* Logout would typically be a button or form submission */}
              <button
                className={`block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-${language === 'ar' ? 'right' : 'left'}`}
                role="menuitem"
                onClick={() => { /* Handle logout logic here */ console.log('Logout clicked'); }}
              >
                {t('logout', 'Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 