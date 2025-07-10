'use client';

import { useState } from 'react';
import { CreditCardIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import UAEDirhamSymbol from './UAEDirhamSymbol';
import TabbyHowItWorksModal from './TabbyHowItWorksModal';

interface PaymentMethodsDisplayProps {
  amount: number;
  currency?: string;
  type?: 'product' | 'cart';
  className?: string;
  compact?: boolean;
}

export default function PaymentMethodsDisplay({ 
  amount, 
  currency = 'AED', 
  type = 'product',
  className = '',
  compact = false
}: PaymentMethodsDisplayProps) {
  const { t, language } = useLanguage();
  const [showTabbyModal, setShowTabbyModal] = useState(false);

  // Check if Tabby is available for this amount (1 AED to 5000 AED)
  const isTabbyAvailable = amount >= 1 && amount <= 5000;
  const installmentAmount = (amount / 4);

  if (compact) {
    // Compact version for smaller spaces
    return (
      <div className={`payment-methods-compact ${className}`}>
        <div className="flex flex-col gap-1.5">
          {/* Tabby Option - Now first */}
          {isTabbyAvailable && (
            <div className="flex items-center justify-between p-1.5 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">
                  {t('pay_in_4', 'Pay in 4 installments')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-green-700">
                  {installmentAmount.toFixed(2)}
                  <UAEDirhamSymbol size={8} className="inline ml-0.5" />
                </span>
                <img 
                  src="/tabby.png" 
                  alt="Tabby" 
                  className="h-2.5 w-auto max-w-[40px]"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            </div>
          )}

          {/* Credit Card Option - Now second */}
          <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">
                {isTabbyAvailable ? t('or_pay_with_card', 'Or pay with Credit/Debit Card') : t('pay_with_card', 'Pay with Credit/Debit Card')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img 
                src="/images/creditvcard.webp" 
                alt="Visa, MasterCard, Amex" 
                className="h-3 w-auto max-w-[50px]"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`payment-methods-display ${className}`}>
      {type === 'product' ? (
        // Product page version - more prominent
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200 mb-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4" />
            {t('payment_options', 'Payment Options')}
          </h3>
          
          <div className="grid gap-2">
            {/* Tabby Payment - Now first */}
            {isTabbyAvailable && (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-green-100 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                    <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('split_into_4', 'Split into 4 payments')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {t('pay_amount_today', 'Pay')} <span className="font-semibold text-green-600">{installmentAmount.toFixed(2)} AED</span> {t('today_then_monthly', 'today, then 3 monthly')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                      {installmentAmount.toFixed(2)}
                      <UAEDirhamSymbol size={10} />
                      <span className="text-gray-500">x4</span>
                    </div>
                    <button
                      onClick={() => setShowTabbyModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {t('how_it_works', 'How it works?')}
                    </button>
                  </div>
                  <img 
                    src="/tabby.png" 
                    alt="Tabby" 
                    className="h-3 w-auto max-w-[60px]"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              </div>
            )}

            {/* Credit Card Payment - Now second */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCardIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('instant_payment', 'Instant Payment')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('credit_debit_cards', 'Credit & Debit Cards')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                  {t('secure', 'Secure')}
                </span>
                <img 
                  src="/images/creditvcard.webp" 
                  alt="Visa, MasterCard, American Express" 
                  className="h-5 w-auto max-w-[80px]"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              ✓ {t('secure_payments', 'Secure payments')}
            </span>
            <span className="flex items-center gap-1">
              ✓ {t('instant_processing', 'Instant processing')}
            </span>
            {isTabbyAvailable && (
              <span className="flex items-center gap-1">
                ✓ {t('zero_interest', '0% interest')}
              </span>
            )}
          </div>
        </div>
      ) : (
        // Cart page version - more compact but informative
        <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-3 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('choose_payment_method', 'Choose Payment Method')}
            </h3>
            <div className="flex items-center gap-2">
              <img 
                src="/images/creditvcard.webp" 
                alt="Cards" 
                className="h-4 w-auto max-w-[60px]"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              {isTabbyAvailable && (
                <img 
                  src="/tabby.png" 
                  alt="Tabby" 
                  className="h-3 w-auto max-w-[50px]"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              )}
            </div>
          </div>
          
          <div className="grid gap-1.5">
            {/* Tabby - Now first */}
            {isTabbyAvailable && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="text-gray-700">{t('pay_in_4_installments', 'Pay in 4 installments of')}</span>
                    <button
                      onClick={() => setShowTabbyModal(true)}
                      className="ml-1 text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      {t('how_it_works', 'How it works?')}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 font-semibold text-green-700">
                    {installmentAmount.toFixed(2)}
                    <UAEDirhamSymbol size={12} />
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('zero_interest', '0% interest')}
                  </div>
                </div>
              </div>
            )}

            {/* Credit Card - Now second */}
            <div className={`flex items-center justify-between text-sm ${isTabbyAvailable ? 'border-t pt-1.5' : ''}`}>
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">{isTabbyAvailable ? t('or_pay_full_amount', 'Or pay full amount') : t('pay_full_amount', 'Pay full amount')}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-gray-900">
                {amount.toFixed(2)}
                <UAEDirhamSymbol size={12} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabby How It Works Modal */}
      <TabbyHowItWorksModal 
        isOpen={showTabbyModal}
        onClose={() => setShowTabbyModal(false)}
        orderAmount={amount}
      />
    </div>
  );
} 