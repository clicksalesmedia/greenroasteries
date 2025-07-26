'use client';

import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TagIcon } from '@heroicons/react/24/outline';
import UAEDirhamSymbol from '../UAEDirhamSymbol';

interface CouponInputProps {
  onCouponApplied: (couponData: {
    code: string;
    discountAmount: number;
    discountType: string;
    promotionId: string;
    name: string;
    description?: string;
  }) => void;
  onCouponRemoved: () => void;
  orderAmount: number;
  productIds: string[];
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    discountType: string;
    promotionId: string;
    name: string;
    description?: string;
  } | null;
}

export default function CouponInput({
  onCouponApplied,
  onCouponRemoved,
  orderAmount,
  productIds,
  appliedCoupon
}: CouponInputProps) {
  const { t, language } = useLanguage();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError(t('enter_coupon_code', 'Please enter a coupon code'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount,
          productIds
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        onCouponApplied({
          code: couponCode.trim().toUpperCase(),
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          promotionId: data.promotionId,
          name: data.name,
          description: data.description
        });
        setCouponCode('');
        setError('');
      } else {
        setError(data.error || t('invalid_coupon', 'Invalid coupon code'));
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setError(t('coupon_error', 'Failed to apply coupon. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center mb-3">
        <TagIcon className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className={`text-sm font-medium text-gray-900 ${language === 'ar' ? 'text-right' : ''}`}>
          {t('coupon_code', 'Coupon Code')}
        </h3>
      </div>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.name}
                </p>
                {appliedCoupon.description && (
                  <p className="text-xs text-green-600 mt-1">
                    {appliedCoupon.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-800 flex items-center">
                  -{appliedCoupon.discountAmount.toFixed(2)}
                  <UAEDirhamSymbol size={12} className="ml-1" />
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            {t('remove_coupon', 'Remove Coupon')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder={t('enter_coupon_code', 'Enter coupon code')}
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                language === 'ar' ? 'text-right' : ''
              }`}
              disabled={loading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('applying', 'Applying...') : t('apply', 'Apply')}
            </button>
          </div>

          {error && (
            <p className={`text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 