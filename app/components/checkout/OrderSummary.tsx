'use client';

import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Image from 'next/image';
import UAEDirhamSymbol from '../UAEDirhamSymbol';
import { useState, useEffect } from 'react';

interface ShippingCalculation {
  shippingCost: number;
  shippingRule: {
    id: string;
    name: string;
    nameAr?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    type: 'STANDARD' | 'EXPRESS' | 'FREE' | 'PICKUP';
    cost: number;
    freeShippingThreshold?: number | null;
    isActive: boolean;
    estimatedDays?: number | null;
    cities: string[];
  } | null;
  freeShippingThreshold?: number;
  amountToFreeShipping?: number;
}

export default function OrderSummary() {
  const { items, totalItems, totalPrice } = useCart();
  const { t, language } = useLanguage();
  const [shippingCalculation, setShippingCalculation] = useState<ShippingCalculation>({
    shippingCost: 0,
    shippingRule: null
  });
  const [loading, setLoading] = useState(false);

  // Format price to 2 decimal places with UAE Dirham symbol
  const formatPrice = (price: number) => {
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
  };

  // Calculate shipping when total price changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (totalPrice <= 0) {
        setShippingCalculation({
          shippingCost: 0,
          shippingRule: null
        });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderTotal: totalPrice,
            items: items
          }),
        });

        if (response.ok) {
          const calculation = await response.json();
          setShippingCalculation(calculation);
        } else {
          // Fallback to default shipping calculation
          setShippingCalculation({
            shippingCost: totalPrice >= 200 ? 0 : 25,
            shippingRule: {
              id: 'fallback',
              name: totalPrice >= 200 ? 'Free Shipping' : 'Standard Shipping',
              nameAr: totalPrice >= 200 ? 'شحن مجاني' : 'شحن عادي',
              type: totalPrice >= 200 ? 'FREE' : 'STANDARD',
              description: totalPrice >= 200 ? 'Free shipping for orders over 200 AED' : 'Standard shipping rate',
              descriptionAr: totalPrice >= 200 ? 'شحن مجاني للطلبات التي تزيد عن 200 درهم' : 'سعر الشحن العادي',
              cost: totalPrice >= 200 ? 0 : 25,
              freeShippingThreshold: totalPrice >= 200 ? null : 200,
              isActive: true,
              estimatedDays: null,
              cities: []
            },
            freeShippingThreshold: totalPrice < 200 ? 200 : undefined,
            amountToFreeShipping: totalPrice < 200 ? 200 - totalPrice : undefined
          });
        }
      } catch (error) {
        console.error('Error calculating shipping:', error);
        // Fallback to default shipping calculation
        setShippingCalculation({
          shippingCost: totalPrice >= 200 ? 0 : 25,
          shippingRule: {
            id: 'fallback',
            name: totalPrice >= 200 ? 'Free Shipping' : 'Standard Shipping',
            nameAr: totalPrice >= 200 ? 'شحن مجاني' : 'شحن عادي',
            type: totalPrice >= 200 ? 'FREE' : 'STANDARD',
            description: totalPrice >= 200 ? 'Free shipping for orders over 200 AED' : 'Standard shipping rate',
            descriptionAr: totalPrice >= 200 ? 'شحن مجاني للطلبات التي تزيد عن 200 درهم' : 'سعر الشحن العادي',
            cost: totalPrice >= 200 ? 0 : 25,
            freeShippingThreshold: totalPrice >= 200 ? null : 200,
            isActive: true,
            estimatedDays: null,
            cities: []
          },
          freeShippingThreshold: totalPrice < 200 ? 200 : undefined,
          amountToFreeShipping: totalPrice < 200 ? 200 - totalPrice : undefined
        });
      } finally {
        setLoading(false);
      }
    };

    calculateShipping();
  }, [totalPrice, items]);

  const finalTotal = totalPrice + shippingCalculation.shippingCost;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 sticky top-24 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={`text-xl font-bold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>{t('order_summary', 'Order Summary')}</h2>

      {/* Item list */}
      <div className="max-h-80 overflow-y-auto mb-6 pr-1">
        {items.map(item => (
          <div key={item.id} className={`flex items-start py-3 border-b last:border-b-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            {/* Item image */}
            <div className={`w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative ${language === 'ar' ? 'mr-4' : ''}`}>
              {item.image ? (
                <Image 
                  src={item.image} 
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 64px, 64px"
                  className="object-contain rounded"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {item.quantity > 1 && (
                <span className={`absolute -top-2 ${language === 'ar' ? '-left-2' : '-right-2'} bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
                  {item.quantity}
                </span>
              )}
            </div>
            
            {/* Item details */}
            <div className={`${language === 'ar' ? 'mr-4' : 'ml-4'} flex-1`}>
              <h4 className={`font-medium text-gray-900 text-sm ${language === 'ar' ? 'text-right' : ''}`}>{item.name}</h4>
              <p className={`text-xs text-gray-500 mt-0.5 ${language === 'ar' ? 'text-right' : ''}`}>
                {Object.values(item.variation).filter(Boolean).join(', ')}
              </p>
              <div className={`mt-1 text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{formatPrice(item.price)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Price summary */}
      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <span className="text-gray-600">{t('subtotal', 'Subtotal')} ({totalItems} {t('items', 'items')})</span>
          <span className="font-medium">{formatPrice(totalPrice)}</span>
        </div>
        <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <span className="text-gray-600">{t('shipping', 'Shipping')}</span>
          <span className="font-medium">
            {loading ? (
              <span className="text-gray-400">{t('calculating', 'Calculating...')}</span>
            ) : shippingCalculation.shippingCost === 0 ? (
              <span className="text-green-600">{t('free', 'Free')}</span>
            ) : (
              formatPrice(shippingCalculation.shippingCost)
            )}
          </span>
        </div>
        
        {/* Shipping rule description */}
        {shippingCalculation.shippingRule && (
          <div className={`text-xs text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' && shippingCalculation.shippingRule.descriptionAr 
              ? shippingCalculation.shippingRule.descriptionAr 
              : shippingCalculation.shippingRule.description}
            {shippingCalculation.shippingRule.estimatedDays && (
              <span className="block mt-1">
                {t('estimated_delivery', 'Estimated delivery')}: {shippingCalculation.shippingRule.estimatedDays} {t('days', 'days')}
              </span>
            )}
          </div>
        )}
        
        {/* Free shipping progress */}
        {shippingCalculation.amountToFreeShipping && shippingCalculation.amountToFreeShipping > 0 && (
          <div className={`text-xs text-blue-600 italic flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            {t('add', 'Add')} {formatPrice(shippingCalculation.amountToFreeShipping)} {t('for_free_shipping', 'for free shipping')}
          </div>
        )}
        
        {/* Tax would go here */}
      </div>

      {/* Total */}
      <div className={`flex justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <span className="text-lg font-bold">{t('total', 'Total')}</span>
        <span className="text-lg font-bold">{formatPrice(finalTotal)}</span>
      </div>

      {/* Payment methods icons */}
      <div className="border-t pt-4">
        <div className="flex justify-center space-x-2 mb-2">
          <img 
            src="/images/creditvcard.webp" 
            alt="Accepted payment methods: Visa, MasterCard, American Express, Apple Pay, Google Pay" 
            className="h-6 w-auto" 
          />
        </div>
        <p className={`text-xs text-center text-gray-500 ${language === 'ar' ? 'text-center' : ''}`}>
          {t('all_transactions_encrypted', 'All transactions are secure and encrypted.')}
        </p>
      </div>
    </div>
  );
} 