'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircleIcon, 
  PencilIcon, 
  TrashIcon, 
  TagIcon, 
  ShoppingCartIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  code?: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchPromotions();
  }, [activeFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const url = activeFilter !== null 
        ? `/api/promotions?active=${activeFilter}` 
        : '/api/promotions';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }
      
      const data = await response.json();
      setPromotions(data);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Failed to load promotions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePromotionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update promotion status');
      }
      
      // Update the promotion in the local state
      setPromotions(promotions.map(promo => 
        promo.id === id ? { ...promo, isActive: !currentStatus } : promo
      ));
    } catch (err) {
      console.error('Error updating promotion status:', err);
      alert('Failed to update promotion status');
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete promotion');
      }
      
      // Remove the promotion from the local state
      setPromotions(promotions.filter(promo => promo.id !== id));
    } catch (err) {
      console.error('Error deleting promotion:', err);
      alert('Failed to delete promotion');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPromotionValue = (type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return `${value}%`;
    } else if (type === 'FIXED_AMOUNT') {
      return `${value.toFixed(2)} D`;
    } else if (type === 'FREE_SHIPPING') {
      return 'Free Shipping';
    } else if (type === 'BUY_X_GET_Y') {
      return `Buy X Get Y`;
    } else if (type === 'BUNDLE') {
      return `Bundle Discount`;
    }
    return `${value}`;
  };

  const getPromotionStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (!promotion.isActive) {
      return (
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs">Inactive</span>
      );
    }
    
    if (now < startDate) {
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">Scheduled</span>
      );
    }
    
    if (now > endDate) {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs">Expired</span>
      );
    }
    
    if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
      return (
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs">Max Uses Reached</span>
      );
    }
    
    return (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">Active</span>
    );
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <span className="text-purple-600">%</span>;
      case 'FIXED_AMOUNT':
        return <span className="text-green-600">D</span>;
      case 'FREE_SHIPPING':
        return <span className="text-blue-600">📦</span>;
      case 'BUY_X_GET_Y':
        return <span className="text-orange-600">🎁</span>;
      case 'BUNDLE':
        return <span className="text-pink-600">📦</span>;
      case 'UPSELL':
        return <span className="text-yellow-600">↗️</span>;
      case 'CROSS_SELL':
        return <span className="text-indigo-600">↔️</span>;
      case 'DOWNSELL':
        return <span className="text-red-600">↘️</span>;
      default:
        return <TagIcon className="h-4 w-4" />;
    }
  };

  const filteredPromotions = promotions
    .filter(promo => 
      promo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (promo.code && promo.code.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(promo => !typeFilter || promo.type === typeFilter);

  const renderContent = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('promotions', 'Promotions')}</h1>
          <Link 
            href="/backend/promotions/new" 
            className="bg-green-700 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-800 transition"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            {t('new_promotion', 'New Promotion')}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder={t('search_promotions', 'Search by name or code...')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              value={activeFilter === null ? '' : String(activeFilter)}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setActiveFilter(null);
                } else {
                  setActiveFilter(value === 'true');
                }
              }}
            >
              <option value="">{t('all_status', 'All Status')}</option>
              <option value="true">{t('active_only', 'Active Only')}</option>
              <option value="false">{t('inactive_only', 'Inactive Only')}</option>
            </select>
          </div>
          
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value || null)}
            >
              <option value="">All Types</option>
              <option value="PERCENTAGE">Percentage Discount</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
              <option value="BUY_X_GET_Y">Buy X Get Y</option>
              <option value="BUNDLE">Bundle Discount</option>
              <option value="UPSELL">Upsell</option>
              <option value="CROSS_SELL">Cross-sell</option>
              <option value="DOWNSELL">Downsell</option>
            </select>
          </div>
          
          <button
            onClick={fetchPromotions}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            {t('refresh', 'Refresh')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {filteredPromotions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPromotions.map((promotion) => (
                      <tr key={promotion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{promotion.name}</div>
                          {promotion.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {promotion.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2">{getPromotionTypeIcon(promotion.type)}</span>
                            <span className="text-sm text-gray-900">
                              {promotion.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPromotionValue(promotion.type, promotion.value)}
                          </span>
                          {promotion.minOrderAmount && (
                            <div className="text-xs text-gray-500">
                              Min. order: {promotion.minOrderAmount.toFixed(2)} D
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {promotion.code ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-sm font-medium">
                              {promotion.code}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(promotion.startDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {formatDate(promotion.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {promotion.currentUses}
                            {promotion.maxUses ? ` / ${promotion.maxUses}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPromotionStatusBadge(promotion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {promotion._count?.products || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <Link
                              href={`/backend/promotions/edit/${promotion.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => togglePromotionStatus(promotion.id, promotion.isActive)}
                              className={`${
                                promotion.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                              }`}
                              title={promotion.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {promotion.isActive ? (
                                <XCircleIcon className="h-5 w-5" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => deletePromotion(promotion.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || typeFilter || activeFilter !== null
                    ? 'Try changing your filters'
                    : 'Create your first promotion to get started'}
                </p>
                <Link 
                  href="/backend/promotions/new" 
                  className="bg-green-700 text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-green-800 transition"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  New Promotion
                </Link>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <BackendLayout activePage="promotions">
      {renderContent()}
    </BackendLayout>
  );
}
