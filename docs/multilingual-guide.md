# Multilingual System Implementation Guide

This guide explains how to implement and use the multilingual system in the Green Roasteries website.

## Overview

The website has been updated to support both Arabic and English languages. Arabic is set as the default language. The implementation includes:

1. Language context for managing the current language
2. Translation utilities for UI text
3. Database structure for multilingual content
4. Multilingual form components for content management
5. Language switcher in both frontend and backend

## Getting Started

### Language Context

The `LanguageContext` in `app/contexts/LanguageContext.tsx` provides:

- Current language state (`ar` or `en`)
- Language setter function
- Translation function (`t`)

The context automatically:
- Sets the document direction (RTL for Arabic, LTR for English)
- Persists language preference in localStorage
- Provides translation utilities

### Using Translations in Components

Import and use the language context in your components:

```tsx
import { useLanguage } from '@/app/contexts/LanguageContext';

function MyComponent() {
  const { language, t } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome', 'Welcome')}</h1>
      <p>{language === 'ar' ? 'محتوى عربي' : 'English content'}</p>
    </div>
  );
}
```

## Database Structure

The database has been updated to support multilingual content using a translations table approach:

### Example for Products:

- Each product has a base record with default language fields (for backward compatibility)
- Each product has associated translation records in the `ProductTranslation` table
- Each translation is associated with a language code (`ar`, `en`)

See `docs/multilingual-schema.prisma` for the complete schema.

## API Implementation

When fetching data from the API:

1. Fetch the base record with its translations
2. Use the `getTranslatedItem` or `getTranslatedItems` utility functions to get content in the current language

Example API route implementation:

```ts
import { getTranslatedItems } from '@/app/utils/multilingual';

export async function GET(request: Request) {
  // Get language from request or default to Arabic
  const { searchParams } = new URL(request.url);
  const language = (searchParams.get('lang') || 'ar') as 'ar' | 'en';
  
  // Fetch products with translations
  const products = await db.product.findMany({
    include: { translations: true }
  });
  
  // Transform products to include translated content
  const translatedProducts = getTranslatedItems(products, language);
  
  return Response.json(translatedProducts);
}
```

## Form Implementation

For admin forms:

1. Use the `ProductTranslationForm` component as a reference
2. Implement language tabs to toggle between Arabic and English input fields
3. Save both languages when submitting forms

When sending data to API:

```ts
// Format translations for API
const productData = {
  name: defaultName, // Default language (usually Arabic)
  // Other default fields
  
  translations: [
    {
      language: 'ar',
      name: arabicName,
      // Other Arabic fields
    },
    {
      language: 'en',
      name: englishName,
      // Other English fields
    }
  ]
}
```

## RTL Support

The system automatically sets the document direction based on the selected language.

For specific components, you can conditionally apply RTL styles:

```tsx
<div dir={language === 'ar' ? 'rtl' : 'ltr'}>
  {/* Component content */}
</div>
```

## Migration Plan

1. Update the database schema to include translation tables
2. Migrate existing data to populate default language fields
3. Update API endpoints to handle multilingual content
4. Update frontend components to use the language context
5. Update admin forms to support content entry in multiple languages 