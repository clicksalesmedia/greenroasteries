'use client';

import { useState } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';

// Define proper types for the form data
interface Translation {
  name: string;
  description: string;
  shortDescription: string;
}

interface ProductTranslations {
  ar: Translation;
  en: Translation;
}

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  translations: ProductTranslations;
  price: number;
  sku: string;
}

interface TranslationItem {
  language: string;
  name: string;
  description: string;
  shortDescription: string;
}

interface ProductInitialData {
  name?: string;
  description?: string;
  shortDescription?: string;
  translations?: TranslationItem[];
  price?: number;
  sku?: string;
}

// This component is a sample of how to implement a multilingual form
// It should be integrated with your existing product forms

export default function ProductTranslationForm({ initialData = {} as ProductInitialData }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar'); // Default to Arabic
  
  const [formData, setFormData] = useState<ProductFormData>({
    // Default language content (for backward compatibility)
    name: initialData.name || '',
    description: initialData.description || '',
    shortDescription: initialData.shortDescription || '',
    
    // Translations
    translations: {
      ar: {
        name: (initialData.translations?.find(t => t.language === 'ar')?.name) || initialData.name || '',
        description: (initialData.translations?.find(t => t.language === 'ar')?.description) || initialData.description || '',
        shortDescription: (initialData.translations?.find(t => t.language === 'ar')?.shortDescription) || initialData.shortDescription || '',
      },
      en: {
        name: (initialData.translations?.find(t => t.language === 'en')?.name) || initialData.name || '',
        description: (initialData.translations?.find(t => t.language === 'en')?.description) || initialData.description || '',
        shortDescription: (initialData.translations?.find(t => t.language === 'en')?.shortDescription) || initialData.shortDescription || '',
      }
    },
    
    // Other non-translatable fields
    price: initialData.price || 0,
    sku: initialData.sku || '',
    // Add other fields as needed
  });
  
  const handleChange = (lang: 'ar' | 'en', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value
        }
      },
      // Also update default language field if it's the current language
      ...(language === lang ? { [field]: value } : {})
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for API submission
    const productData = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription,
      price: formData.price,
      sku: formData.sku,
      // other fields
      
      // Format translations for API
      translations: [
        {
          language: 'ar',
          name: formData.translations.ar.name,
          description: formData.translations.ar.description,
          shortDescription: formData.translations.ar.shortDescription,
        },
        {
          language: 'en',
          name: formData.translations.en.name,
          description: formData.translations.en.description,
          shortDescription: formData.translations.en.shortDescription,
        }
      ]
    };
    
    console.log('Product data to submit:', productData);
    // Call your API to save the product
    // apiClient.saveProduct(productData)
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('ar')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'ar'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'en'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            English
          </button>
        </nav>
      </div>
      
      {/* Form fields for Arabic */}
      <div className={activeTab === 'ar' ? 'block' : 'hidden'}>
        <div className="space-y-4" dir="rtl">
          <div>
            <label htmlFor="name-ar" className="block text-sm font-medium text-gray-700">
              اسم المنتج
            </label>
            <input
              type="text"
              id="name-ar"
              value={formData.translations.ar.name}
              onChange={(e) => handleChange('ar', 'name', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="shortDescription-ar" className="block text-sm font-medium text-gray-700">
              وصف قصير
            </label>
            <input
              type="text"
              id="shortDescription-ar"
              value={formData.translations.ar.shortDescription}
              onChange={(e) => handleChange('ar', 'shortDescription', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="description-ar" className="block text-sm font-medium text-gray-700">
              وصف مفصل
            </label>
            <textarea
              id="description-ar"
              rows={4}
              value={formData.translations.ar.description}
              onChange={(e) => handleChange('ar', 'description', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Form fields for English */}
      <div className={activeTab === 'en' ? 'block' : 'hidden'}>
        <div className="space-y-4" dir="ltr">
          <div>
            <label htmlFor="name-en" className="block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              id="name-en"
              value={formData.translations.en.name}
              onChange={(e) => handleChange('en', 'name', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="shortDescription-en" className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription-en"
              value={formData.translations.en.shortDescription}
              onChange={(e) => handleChange('en', 'shortDescription', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="description-en" className="block text-sm font-medium text-gray-700">
              Full Description
            </label>
            <textarea
              id="description-en"
              rows={4}
              value={formData.translations.en.description}
              onChange={(e) => handleChange('en', 'description', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Common non-translatable fields */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium">{activeTab === 'ar' ? 'معلومات أخرى' : 'Other Information'}</h3>
        
        <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              {activeTab === 'ar' ? 'السعر' : 'Price'}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              type="text"
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {activeTab === 'ar' ? 'حفظ المنتج' : 'Save Product'}
        </button>
      </div>
    </form>
  );
} 