'use client';

import { useLanguage } from '../contexts/LanguageContext';
import UAEDirhamSymbol from './UAEDirhamSymbol';

interface TabbySnippetProps {
  amount: number;
  currency?: string;
  type?: 'product' | 'cart';
  className?: string;
}

export default function TabbySnippet({ 
  amount, 
  currency = 'AED', 
  type = 'product',
  className = ''
}: TabbySnippetProps) {
  const { t, language } = useLanguage();

  // Check if Tabby is available for this amount (1 AED to 5000 AED)
  const isTabbyAvailable = amount >= 1 && amount <= 5000;

  if (!isTabbyAvailable) {
    return null;
  }

  const installmentAmount = (amount / 4);

  return (
    <div className={`tabby-snippet ${className}`}>
      {type === 'product' ? (
        // Product page snippet
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src="/tabby.png" 
                  alt="Tabby" 
                  className="h-4 w-auto max-w-[40px]"
                  style={{ height: '16px', maxWidth: '40px' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-sm font-medium text-blue-800">
                  {language === 'ar' ? 'أو قسّم على 4 دفعات' : 'Or split into 4 payments'}
                </span>
              </div>
              <div className="text-xs text-blue-700">
                {language === 'ar' ? (
                  <>
                    4 دفعات من {installmentAmount.toFixed(2)} درهم بدون فوائد
                  </>
                ) : (
                  <>
                    4 payments of {installmentAmount.toFixed(2)} <UAEDirhamSymbol size={10} /> with 0% interest
                  </>
                )}
              </div>
            </div>
            <div className="text-xs text-blue-600 underline cursor-pointer">
              {language === 'ar' ? 'اعرف أكثر' : 'Learn more'}
            </div>
          </div>
        </div>
      ) : (
        // Cart page snippet
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="/tabby.png" 
                  alt="Tabby" 
                  className="h-5 w-auto max-w-[50px]"
                  style={{ height: '20px', maxWidth: '50px' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-base font-semibold text-green-800">
                  {language === 'ar' ? 'قسّم فاتورتك على 4 دفعات' : 'Split your total into 4 payments'}
                </span>
              </div>
              <div className="text-sm text-green-700 mb-2">
                {language === 'ar' ? (
                  <>
                    ادفع {installmentAmount.toFixed(2)} درهم اليوم والباقي على 3 دفعات شهرية
                  </>
                ) : (
                  <>
                    Pay {installmentAmount.toFixed(2)} <UAEDirhamSymbol size={12} /> today, then 3 monthly payments
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-green-600">
                <span>✓ {language === 'ar' ? 'بدون فوائد' : '0% Interest'}</span>
                <span>✓ {language === 'ar' ? 'بدون رسوم إضافية' : 'No hidden fees'}</span>
                <span>✓ {language === 'ar' ? 'موافقة فورية' : 'Instant approval'}</span>
              </div>
            </div>
            <div className="text-sm text-green-600 underline cursor-pointer ml-4">
              {language === 'ar' ? 'كيف يعمل؟' : 'How it works?'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 