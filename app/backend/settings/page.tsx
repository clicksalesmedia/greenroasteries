'use client';

import { useState } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../components/BackendLayout';
import Link from 'next/link';

interface SettingsModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  status?: 'active' | 'inactive' | 'warning';
}

export default function SettingsPage() {
  const { t, language } = useLanguage();

  const settingsModules: SettingsModule[] = [
    {
      id: 'google-shopping',
      title: 'Google Shopping',
      description: 'Manage Google Shopping Merchant Center integration and product sync',
      href: '/backend/settings/google-shopping',
      icon: '🛒',
      status: 'active'
    },
    {
      id: 'payment-gateways',
      title: 'Payment Gateways',
      description: 'Configure payment methods and gateway settings',
      href: '/backend/settings/payment-gateways',
      icon: '💳',
      status: 'inactive'
    },
    {
      id: 'email-settings',
      title: 'Email Configuration',
      description: 'SMTP settings and email template management',
      href: '/backend/settings/email',
      icon: '📧',
      status: 'inactive'
    },
    {
      id: 'seo-settings',
      title: 'SEO Settings',
      description: 'Meta tags, sitemap, and search engine optimization',
      href: '/backend/settings/seo',
      icon: '🔍',
      status: 'inactive'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'General system configuration and maintenance mode',
      href: '/backend/settings/system',
      icon: '⚙️',
      status: 'inactive'
    }
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'warning':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Warning</span>;
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
      default:
        return null;
    }
  };

  return (
    <BackendLayout activePage="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your system configuration and integrations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <Link href={module.href} className="block p-6 h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{module.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-5">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {getStatusBadge(module.status)}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-500">
                  Configure →
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Settings Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Configure various aspects of your Green Roasteries system. Each module handles different aspects of your online store configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackendLayout>
  );
} 