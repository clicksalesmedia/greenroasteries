'use client';

import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';
import { useState } from 'react';

interface MaintenanceModeProps {
  isAdmin?: boolean;
}

export default function MaintenanceMode({ isAdmin = false }: MaintenanceModeProps) {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 w-full h-full bg-white z-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {/* Logo with fallback */}
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-6 sm:mb-8">
            {!imageError ? (
              <Image
                src="/images/green-roasteries-logo.png"
                alt="Green Roasteries"
                fill
                className="object-contain"
                priority
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 128px, 192px"
              />
            ) : (
              // Fallback SVG logo
              <div className="w-full h-full flex items-center justify-center bg-green-100 rounded-full">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 text-green-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9ZM19 9H14V4H15.8L19 7.2V9ZM7 7H11V9H7V7ZM7 11H17V13H7V11ZM7 15H17V17H7V15Z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              {t('coming_soon', 'Coming Soon')}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed px-4">
              {t('under_maintenance', 'We are currently under maintenance. Please check back soon.')}
            </p>

            {/* Additional info for users */}
            <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">
                {t('maintenance_note', 'We apologize for any inconvenience. Our team is working hard to bring you an improved experience.')}
              </p>
              <p className="text-xs text-gray-400">
                {t('maintenance_contact', 'For urgent inquiries, please contact us directly.')}
              </p>
            </div>

            {/* Admin indicator */}
            {isAdmin && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  {t('admin_view', 'You are viewing this page as an administrator')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {t('admin_maintenance_note', 'Users will see this maintenance page until you disable maintenance mode.')}
                </p>
              </div>
            )}

            {/* Simple animation */}
            <div className="flex justify-center mt-8">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-600 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.5s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 