// This file contains all internationalization (i18n) related functionality for the application
// It's an enhancement to the core LanguageContext

import { Language } from '@/app/contexts/LanguageContext';

/**
 * Format date according to the current language
 * 
 * @param date The date to format
 * @param language The current language
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  language: Language,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use Intl.DateTimeFormat for proper localization
  const formatter = new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-SA' : 'en-US',
    options
  );
  
  return formatter.format(dateObj);
}

/**
 * Format number according to the current language
 * 
 * @param num The number to format
 * @param language The current language
 * @param options Optional Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(
  num: number,
  language: Language,
  options: Intl.NumberFormatOptions = {}
): string {
  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat(
    language === 'ar' ? 'ar-SA' : 'en-US',
    options
  );
  
  return formatter.format(num);
}

/**
 * Format currency according to the current language
 * 
 * @param amount The amount to format
 * @param language The current language
 * @param currency The currency code (default: 'AED')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  language: Language,
  currency: string = 'AED'
): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  // In Arabic, we typically place the currency symbol after the amount
  if (language === 'ar') {
    const formatted = formatNumber(amount, language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // For AED in Arabic, we typically use "د.إ"
    if (currency === 'AED') {
      return `${formatted} د.إ`;
    }
    
    // For other currencies, still use the formatter but with adaptation
    return `${formatted} ${currency}`;
  }
  
  // For English, use the standard Intl formatter
  return formatNumber(amount, language, options);
}

/**
 * Get correct text direction based on language
 * 
 * @param language The current language
 * @returns 'rtl' for Arabic, 'ltr' for English
 */
export function getDirection(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Get font family based on language
 * 
 * @param language The current language
 * @returns Font family string appropriate for the language
 */
export function getFontFamily(language: Language): string {
  return language === 'ar' 
    ? "'Cairo', 'Poppins', sans-serif"
    : "'Poppins', 'Cairo', sans-serif";
}

/**
 * Get text align based on language
 * 
 * @param language The current language
 * @returns 'right' for Arabic, 'left' for English
 */
export function getTextAlign(language: Language): 'right' | 'left' {
  return language === 'ar' ? 'right' : 'left';
}

/**
 * Enhanced translation helper for pluralization
 * 
 * @param key The translation key
 * @param count Number for pluralization
 * @param translations The translations object
 * @param language Current language
 * @param fallback Optional fallback
 * @returns Translated string with proper pluralization
 */
export function translatePlural(
  key: string,
  count: number,
  translations: Record<Language, Record<string, string>>,
  language: Language,
  fallback?: string
): string {
  // Check for plural keys
  const pluralKey = count === 1 ? `${key}_one` : `${key}_many`;
  
  // Try to get the pluralized version first
  if (translations[language][pluralKey]) {
    return translations[language][pluralKey].replace('{count}', count.toString());
  }
  
  // Fallback to regular key
  if (translations[language][key]) {
    return translations[language][key].replace('{count}', count.toString());
  }
  
  // Final fallback
  return fallback || key;
} 