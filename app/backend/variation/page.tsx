'use client';

import Link from 'next/link';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function VariationPage() {
  const { t } = useLanguage();

  const variationContent = (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('product_variations', 'Product Variations')}</h1>
        <p className="text-gray-600">{t('manage_variations_desc', 'Manage product variations for weight, additions, and beans')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weight Variations Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('weight_variations', 'Weight Variations')}</h2>
              <p className="text-gray-600">{t('weight_variations_desc', 'Manage product weights (250g, 500g, 1kg, etc.)')}</p>
            </div>
            <Link
              href="/backend/variation/weights"
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
            >
              {t('manage_weights', 'Manage Weights')}
            </Link>
          </div>
          <p className="text-gray-700">
            {t('weight_variations_help', 'Define standard weight options for your products, such as different weight amounts for coffee beans.')}
          </p>
        </div>
        
        {/* Additions Variations Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('additions_variations', 'Additions Variations')}</h2>
              <p className="text-gray-600">{t('additions_variations_desc', 'Manage product additions (whole beans, ground, etc.)')}</p>
            </div>
            <Link
              href="/backend/variation/additions"
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
            >
              {t('manage_additions', 'Manage Additions')}
            </Link>
          </div>
          <p className="text-gray-700">
            {t('additions_variations_help', 'Define standard additions options for your products, such as whole beans or ground coffee.')}
          </p>
        </div>
        
        {/* Bean Variations Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('bean_variations', 'Bean Variations')}</h2>
              <p className="text-gray-600">{t('bean_variations_desc', 'Manage coffee bean Additions (Arabica, Robusta, etc.)')}</p>
            </div>
            <Link
              href="/backend/variation/beans"
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
            >
              {t('manage_beans', 'Manage Beans')}
            </Link>
          </div>
          <p className="text-gray-700">
            {t('bean_variations_help', 'Define different bean Additions used in your coffee products, such as Arabica or Robusta varieties.')}
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">{t('how_to_use_variations', 'How to Use Variations')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">{t('step1_variations', '1. Define Your Variation Options')}</h3>
            <p>{t('step1_variations_desc', 'First, create all the weight options (250g, 500g, 1kg), additions options (whole beans, ground), and bean Additions (Arabica, Robusta) you need for your products.')}</p>
          </div>
          <div>
            <h3 className="font-medium text-lg">{t('step2_variations', '2. Add Variations to Products')}</h3>
            <p>{t('step2_variations_desc', 'When creating or editing a product, you can assign variations with specific prices and inventory levels.')}</p>
          </div>
          <div>
            <h3 className="font-medium text-lg">{t('step3_variations', '3. Customer Experience')}</h3>
            <p>{t('step3_variations_desc', 'Customers will be able to select weight, additions, and bean options when viewing products on your store.')}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <BackendLayout activePage="variation">
      {variationContent}
    </BackendLayout>
  );
}
