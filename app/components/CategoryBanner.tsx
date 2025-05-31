'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryBannerProps {
  category: string | null;
}

export default function CategoryBanner({ category }: CategoryBannerProps) {
  const { t, language } = useLanguage();
  
  // Only show banner for "EID AL ADHA - CATALOG" category
  const showBanner = category === 'EID AL ADHA - CATALOG' || 
                    category === 'EID AL ADHA CATALOG' ||
                    category === 'عيد الأضحى - كتالوج' ||
                    category === 'عيد الأضحى كتالوج';

  if (!showBanner) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      {/* Responsive banner container with fixed aspect ratio */}
      <div className="relative w-full aspect-[4/1] max-w-[1200px] mx-auto rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-green-600 via-green-700 to-emerald-800">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Try to load the banner image, fallback to styled banner */}
        <Image
          src="/images/eid-al-adha-banner.jpg"
          alt={language === 'ar' ? 'بانر عيد الأضحى' : 'Eid Al Adha Banner'}
          fill
          className="object-cover object-center transition-transform duration-500 hover:scale-105"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px"
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={(e) => {
            console.warn('Eid Al Adha banner image not found, using fallback design');
            // Hide the image and show the fallback design
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* Fallback content when image is not available */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
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
        
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-2xl"></div>
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