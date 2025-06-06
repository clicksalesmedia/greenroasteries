'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getDirection } from '@/app/utils/i18n';
import BackendHeader from './BackendHeader';

interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions?: Permission[];
}

interface BackendLayoutProps {
  children: ReactNode;
  activePage?: 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'users' | 'promotions' | 'settings' | 'variation' | 'content' | 'shipping' | 'payments' | 'contacts' | 'subscribers' | 'tracking' | 'logs';
}

export default function BackendLayout({ children, activePage = 'dashboard' }: BackendLayoutProps) {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch the current user and their permissions
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.user) {
          // Fetch user permissions if they exist
          if (data.user.role !== 'ADMIN') {
            const permissionsResponse = await fetch(`/api/users/${data.user.id}`);
            if (permissionsResponse.ok) {
              const userData = await permissionsResponse.json();
              setUser(userData);
            } else {
              setUser(data.user);
            }
          } else {
            // Admin has all permissions by default
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserSession();
  }, []);
  
  // Check if a user has permission to view a specific module
  const hasPermission = (module: string): boolean => {
    // Admins always have permission
    if (user?.role === 'ADMIN') return true;
    
    // Check user permissions
    if (user?.permissions) {
      const permission = user.permissions.find(p => p.module === module);
      return permission ? permission.canView : false;
    }
    
    return false;
  };
  
  // Menu items configuration
  const menuItems = [
    { id: 'dashboard', label: t('dashboard', 'Dashboard'), href: '/backend', requirePermission: false },
    { id: 'products', label: t('products', 'Products'), href: '/backend/products', requirePermission: true },
    { id: 'categories', label: t('categories', 'Categories'), href: '/backend/categories', requirePermission: true },
    { id: 'variation', label: t('variations', 'Variations'), href: '/backend/variation', requirePermission: true },
    { id: 'orders', label: t('orders', 'Orders'), href: '/backend/orders', requirePermission: true },
    { id: 'customers', label: t('customers', 'Customers'), href: '/backend/customers', requirePermission: true },
    { id: 'contacts', label: t('contacts', 'Contact Messages'), href: '/backend/contacts', requirePermission: true },
    { id: 'subscribers', label: t('email_subscribers', 'Email Subscribers'), href: '/backend/subscribers', requirePermission: true },
    { id: 'payments', label: t('payments', 'Payments'), href: '/backend/payments', requirePermission: true },
    { id: 'users', label: t('users', 'Users'), href: '/backend/users', requirePermission: true },
    { id: 'promotions', label: t('promotions', 'Promotions'), href: '/backend/promotions', requirePermission: true },
    { id: 'shipping', label: t('shipping', 'Shipping'), href: '/backend/shipping', requirePermission: true },
    { id: 'content', label: t('website_content', 'Website Content'), href: '/backend/content', requirePermission: true },
    { id: 'tracking', label: t('tracking_system', 'Tracking System'), href: '/backend/tracking', requirePermission: true },
    { id: 'logs', label: t('logs', 'System Logs'), href: '/backend/logs', requirePermission: true },
    { id: 'settings', label: t('settings', 'Settings'), href: '/backend/settings', requirePermission: true },
  ];

  return (
    <div className="min-h-screen bg-gray-100" dir={getDirection(language)}>
      <div className="flex">
        {/* Sidebar - positioned based on language direction */}
        <div className={`w-64 bg-green-900 text-white h-screen fixed ${language === 'ar' ? 'right-0' : 'left-0'}`}>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Green Roasteries</h1>
            <p className="text-sm">{t('admin_dashboard', 'Admin Dashboard')}</p>
          </div>
          <nav className="mt-8">
            <ul className="space-y-2 px-4">
              {menuItems.map(item => {
                // Skip items that require permission if user doesn't have it
                if (item.requirePermission && !hasPermission(item.id)) {
                  return null;
                }
                
                return (
                  <li key={item.id}>
                    <a 
                      href={item.href} 
                      className={`block py-2 px-4 rounded ${activePage === item.id ? 'bg-green-800' : 'hover:bg-green-800'}`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main content - positioned based on language direction */}
        <div className={`w-full p-8 ${language === 'ar' ? 'ml-0 mr-64' : 'ml-64 mr-0'}`}>
          <BackendHeader />
          <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 