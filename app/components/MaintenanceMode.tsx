'use client';

import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageContext';

interface MaintenanceModeProps {
  isAdmin?: boolean;
}

export default function MaintenanceMode({ isAdmin = false }: MaintenanceModeProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 w-full h-full bg-white z-50">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <Image
              src="/images/green-roasteries-logo.png"
              alt="Green Roasteries"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('coming_soon', 'Coming Soon')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('under_maintenance', 'We are currently under maintenance. Please check back soon.')}
          </p>
          {isAdmin && (
            <p className="text-sm text-green-600 mt-4">
              {t('admin_view', 'You are viewing this page as an administrator')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 