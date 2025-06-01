'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryBannerProps {
  category: string | null;
}

interface EidBanner {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryBanner({ category }: CategoryBannerProps) {
  const { t, language } = useLanguage();
  const [eidBanner, setEidBanner] = useState<EidBanner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [apiError, setApiError] = useState(false);
  
  // Only show banner for "EID AL ADHA - CATALOG" category
  const showBanner = category === 'EID AL ADHA - CATALOG' || 
                    category === 'EID AL ADHA CATALOG' ||
                    category === 'عيد الأضحى - كتالوج' ||
                    category === 'عيد الأضحى كتالوج';

  // Fetch EID banner data when component mounts and category matches
  useEffect(() => {
    if (showBanner) {
      const fetchEidBanner = async () => {
        try {
          setIsLoading(true);
          setApiError(false);
          console.log('🎯 Fetching EID banner data...');
          
          const response = await fetch('/api/eid-banner');
          if (response.ok) {
            const data = await response.json();
            console.log('✅ EID banner data received:', data);
            setEidBanner(data);
          } else {
            console.error('❌ EID banner API failed:', response.status, response.statusText);
            setApiError(true);
          }
        } catch (error) {
          console.error('❌ Error fetching EID banner:', error);
          setApiError(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchEidBanner();
    }
  }, [showBanner]);

  if (!showBanner) {
    return null;
  }

  // Get the banner image URL - use uploaded image if available, fallback to default
  const bannerImageUrl = eidBanner?.imageUrl || '/images/eidbanner.webp';
  console.log('🖼️ Banner image URL:', bannerImageUrl);

  return (
    <div className="w-full mb-8">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-yellow-100 text-xs text-gray-700 rounded">
          Debug: isLoading={isLoading.toString()}, apiError={apiError.toString()}, imageError={imageError.toString()}, imageUrl={bannerImageUrl}
        </div>
      )}
      
      {/* Responsive banner container with fixed aspect ratio */}
      <div className="relative w-full aspect-[4/1] max-w-[1200px] mx-auto rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-green-600 via-green-700 to-emerald-800">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Always try to show the banner image first */}
        {!imageError && (
          <Image
            src={bannerImageUrl}
            alt={language === 'ar' ? 'بانر عيد الأضحى' : 'Eid Al Adha Banner'}
            fill
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px"
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onLoad={() => {
              console.log('✅ Banner image loaded successfully:', bannerImageUrl);
            }}
            onError={(e) => {
              console.warn('❌ Banner image failed to load:', bannerImageUrl);
              setImageError(true);
            }}
          />
        )}

        {/* Loading state overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Fallback content when image fails to load */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-20">
            <div className="text-center px-4">
              <div className="mb-4">
                {/* Decorative Islamic pattern */}
                <div className="inline-flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="text-2xl">☪</div>
                  <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 tracking-wide">
                {language === 'ar' ? 'عيد الأضحى مبارك' : 'EID AL ADHA MUBARAK'}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 font-medium">
                {language === 'ar' ? 'تسوق مجموعتنا الخاصة بعيد الأضحى' : 'Shop Our Special Eid Al Adha Collection'}
              </p>
              
              {/* Decorative bottom element */}
              <div className="mt-4 flex justify-center">
                <div className="h-1 w-24 bg-white bg-opacity-60 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        /* Custom responsive styles */
        @media (max-width: 640px) {
          .aspect-\\[4\\/1\\] {
            aspect-ratio: 3/1; /* More square on mobile */
          }
        }
        
        @media (max-width: 480px) {
          .aspect-\\[4\\/1\\] {
            aspect-ratio: 2.5/1; /* Even more square on very small screens */
          }
        }
        
        /* Ensure the banner is properly contained */
        .w-full {
          max-width: 100%;
        }
        
        /* Smooth hover effect */
        .relative:hover .absolute img {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
} 