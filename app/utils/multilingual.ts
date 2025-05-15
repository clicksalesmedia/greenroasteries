'use client';

export type Language = 'ar' | 'en';

/**
 * Utility functions for handling multilingual content
 */

/**
 * Gets the translated value for a field, falling back to default language if not available
 * 
 * @param item The object containing translations
 * @param field The field name to get translation for
 * @param language The language to get translation for
 * @returns The translated value or the default value
 */
export function getTranslatedField<T extends { translations?: any[] }>(
  item: T,
  field: string,
  language: Language
): any {
  // If the item has translations
  if (item.translations && Array.isArray(item.translations)) {
    // Find the translation for the requested language
    const translation = item.translations.find(t => t.language === language);
    
    if (translation && translation[field] !== undefined && translation[field] !== null) {
      return translation[field];
    }
  }
  
  // If no translation found, return the default field value
  return (item as any)[field];
}

/**
 * Transforms an object with translations into a single object with translated fields
 * 
 * @param item The object containing translations
 * @param language The language to get translations for
 * @returns A new object with translated fields
 */
export function getTranslatedItem<T extends { translations?: any[] }>(
  item: T,
  language: Language
): T {
  if (!item) return item;
  
  // Create a shallow copy of the item
  const result = { ...item };
  
  // If there are no translations, return the original item
  if (!item.translations || !Array.isArray(item.translations)) {
    return result;
  }
  
  // Find the translation for the requested language
  const translation = item.translations.find(t => t.language === language);
  
  if (translation) {
    // Merge the translation fields with the result
    Object.keys(translation).forEach(key => {
      if (key !== 'id' && key !== 'language' && key !== 'productId' && key !== 'categoryId') {
        if (translation[key] !== undefined && translation[key] !== null) {
          (result as any)[key] = translation[key];
        }
      }
    });
  }
  
  return result;
}

/**
 * Transforms an array of items with translations into an array of items with translated fields
 * 
 * @param items Array of objects containing translations
 * @param language The language to get translations for
 * @returns A new array with translated items
 */
export function getTranslatedItems<T extends { translations?: any[] }>(
  items: T[],
  language: Language
): T[] {
  if (!items || !Array.isArray(items)) return items;
  
  return items.map(item => getTranslatedItem(item, language));
} 