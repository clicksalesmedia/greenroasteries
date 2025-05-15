'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../components/BackendLayout';

export default function WebsiteContentPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setIsLoading(false);
  }, []);

  const contentSections = [
    {
      id: 'sliders',
      title: t('hero_sliders', 'Hero Sliders'),
      description: t('sliders_description', 'Manage homepage slider content, images, and buttons'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      href: '/backend/content/sliders'
    },
    // Can add more content sections here (like testimonials, featured products, etc.)
  ];

  if (isLoading) {
    return (
      <BackendLayout activePage="content">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
        </div>
      </BackendLayout>
    );
  }

  return (
    <BackendLayout activePage="content">
      <div>
        <h1 className="text-2xl font-bold mb-6">{t('website_content', 'Website Content')}</h1>
        <p className="mb-6 text-gray-600">{t('website_content_description', 'Manage dynamic content that appears on your website')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentSections.map((section) => (
            <Link 
              key={section.id} 
              href={section.href} 
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition"
            >
              <div className="flex items-start mb-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-800 mr-3">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <p className="text-gray-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </BackendLayout>
  );
} 