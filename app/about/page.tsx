'use client';

import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';

export default function AboutPage() {
  const { t, language } = useLanguage();
  const [pageContent, setPageContent] = useState<{
    content: string;
    contentAr: string | null;
    title: string;
    titleAr: string | null;
    metadata: any;
    isLoading: boolean;
  }>({
    content: '',
    contentAr: null,
    title: 'Our Story',
    titleAr: null,
    metadata: {
      heroTitle: 'Our Story',
      heroTagline: 'From bean to cup, our passion fuels every step of the journey.',
      heroImage: '/images/coffee-beans-bg.jpg'
    },
    isLoading: true
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content/about_us');
        if (!response.ok) {
          throw new Error('Failed to fetch about us content');
        }
        
        const data = await response.json();
        setPageContent({
          content: data.content || '',
          contentAr: data.contentAr || null,
          title: data.title || 'Our Story',
          titleAr: data.titleAr || null,
          metadata: data.metadata || {
            heroTitle: 'Our Story',
            heroTagline: 'From bean to cup, our passion fuels every step of the journey.',
            heroImage: '/images/coffee-beans-bg.jpg'
          },
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching about us content:', error);
        setPageContent(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchContent();
  }, []);

  // Get the appropriate content based on language
  const content = language === 'ar' && pageContent.contentAr 
    ? pageContent.contentAr 
    : pageContent.content;
  
  // Get the appropriate title based on language
  const title = language === 'ar' && pageContent.titleAr
    ? pageContent.titleAr
    : pageContent.title;
    
  // Get hero section data from metadata
  const heroTitle = language === 'ar' && pageContent.metadata?.heroTitleAr 
    ? pageContent.metadata.heroTitleAr 
    : (pageContent.metadata?.heroTitle || t('our_story', 'Our Story'));
    
  const heroTagline = language === 'ar' && pageContent.metadata?.heroTaglineAr 
    ? pageContent.metadata.heroTaglineAr 
    : (pageContent.metadata?.heroTagline || t('our_story_tagline', 'From bean to cup, our passion fuels every step of the journey.'));
    
  const heroImage = pageContent.metadata?.heroImage || '/images/coffee-beans-bg.jpg';

  if (pageContent.isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-900">
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <Image 
            src={heroImage}
            alt={t('coffee_beans', 'Coffee Beans')}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{heroTitle}</h1>
            <p className="text-xl text-white max-w-3xl mx-auto">
              {heroTagline}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Content Section */}
      {content && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="prose prose-lg max-w-3xl mx-auto" 
                 dangerouslySetInnerHTML={{ __html: content }} 
                 dir={language === 'ar' ? 'rtl' : 'ltr'} />
          </div>
        </section>
      )}

      {/* Values Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 relative inline-block">
            {t('our_values', 'Our Values')}
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black"></span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('quality', 'Quality')}</h3>
              <p className="text-gray-700">
                {t('quality_desc', 'We never compromise on quality. From sourcing to roasting to brewing, excellence is our standard.')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('passion', 'Passion')}</h3>
              <p className="text-gray-700">
                {t('passion_desc', "Our love for coffee drives everything we do. We're constantly exploring, learning, and perfecting our craft.")}
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('sustainability', 'Sustainability')}</h3>
              <p className="text-gray-700">
                {t('sustainability_desc', "We're committed to ethical sourcing and environmentally friendly practices throughout our supply chain.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-black text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">{t('experience_our_coffee', 'Experience Our Coffee')}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t('experience_our_coffee_desc', 'Visit our locations in Dubai and Abu Dhabi or shop online to experience the Green Roasteries difference.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <a href="/shop" className="bg-white text-black px-8 py-3 rounded-md hover:bg-gray-200 transition">
              {t('shop_now', 'Shop Now')}
            </a>
            <a href="/contact" className="border border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-black transition">
              {t('visit_us', 'Visit Us')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 