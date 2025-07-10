'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, CreditCardIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import UAEDirhamSymbol from './UAEDirhamSymbol';

interface TabbyHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderAmount: number;
}

export default function TabbyHowItWorksModal({ 
  isOpen, 
  onClose, 
  orderAmount 
}: TabbyHowItWorksModalProps) {
  const { t, language } = useLanguage();
  
  if (!isOpen) return null;

  const installmentAmount = orderAmount / 4;
  const today = new Date();
  const paymentDates = [
    { label: t('today', 'Today'), date: today, amount: installmentAmount },
    { label: t('after_month', 'After 1 month'), date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: installmentAmount },
    { label: t('after_2_months', 'After 2 months'), date: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), amount: installmentAmount },
    { label: t('after_3_months', 'After 3 months'), date: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), amount: installmentAmount }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <img src="/tabby.png" alt="Tabby" className="h-8 w-auto" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {t('how_tabby_works', 'How Tabby Works')}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {t('tabby_subtitle', 'Split your purchase into 4 interest-free payments')}
                </p>
              </div>

              {/* Payment Schedule */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t('payment_schedule', 'Payment Schedule')}
                </h4>
                <div className="space-y-3">
                  {paymentDates.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{payment.label}</p>
                          <p className="text-xs text-gray-500">
                            {payment.date.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-AE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        {payment.amount.toFixed(2)}
                        <UAEDirhamSymbol size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t('tabby_benefits', 'Why Choose Tabby?')}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{t('zero_interest', '0% interest and no hidden fees')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{t('instant_approval', 'Instant approval in seconds')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{t('flexible_payments', 'Flexible payment schedule')}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">{t('secure_payments', 'Secure and trusted payments')}</span>
                  </div>
                </div>
              </div>

              {/* How it works steps */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t('how_it_works_steps', 'How It Works')}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">1</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{t('step_1_title', 'Choose Tabby at checkout')}</p>
                      <p className="text-xs text-gray-500">{t('step_1_desc', 'Select Tabby as your payment method')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">2</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{t('step_2_title', 'Complete quick verification')}</p>
                      <p className="text-xs text-gray-500">{t('step_2_desc', 'Provide your mobile number and verify with OTP')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">3</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{t('step_3_title', 'Make your first payment')}</p>
                      <p className="text-xs text-gray-500">{t('step_3_desc', 'Pay the first installment and get your order')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">4</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{t('step_4_title', 'Automatic monthly payments')}</p>
                      <p className="text-xs text-gray-500">{t('step_4_desc', 'Remaining payments are automatically deducted')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                  onClick={onClose}
                >
                  {t('got_it', 'Got it!')}
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                  onClick={onClose}
                >
                  {t('close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 