'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, ShoppingBagIcon, TruckIcon, ClockIcon, UserIcon, MapPinIcon, CreditCardIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import UAEDirhamSymbol from '../../components/UAEDirhamSymbol';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ThankYouPage() {
  const { t, language, contentByLang } = useLanguage();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOrderRetrieval = async () => {
      // Check if this is a Tabby redirect
      const paymentType = searchParams.get('payment');
      const sessionId = searchParams.get('session_id');
      
      if (paymentType === 'tabby' && sessionId) {
        // Handle Tabby payment redirect
        try {
          // Retrieve payment details from Tabby
          const response = await fetch(`/api/payments/tabby?payment_id=${sessionId}`);
          const data = await response.json();
          
          if (data.success) {
            // Find the order associated with this payment
            const ordersResponse = await fetch('/api/orders');
            const ordersData = await ordersResponse.json();
            
            // Find order with matching Tabby payment ID
            const matchingOrder = ordersData.orders?.find((order: any) => 
              order.payment?.tabbyPaymentId === sessionId
            );
            
            if (matchingOrder) {
              setOrderDetails({
                orderId: matchingOrder.id,
                isNewCustomer: matchingOrder.user?.isNewCustomer || false,
                paymentProvider: 'TABBY',
                paymentStatus: data.payment?.status || 'PENDING'
              });
            }
          }
        } catch (error) {
          console.error('Failed to retrieve Tabby payment details:', error);
        }
      } else {
        // Standard flow - retrieve from localStorage
        const savedOrder = localStorage.getItem('lastOrder');
        if (savedOrder) {
          try {
            const orderData = JSON.parse(savedOrder);
            setOrderDetails(orderData);
          } catch (error) {
            console.error('Failed to parse order details:', error);
          }
        }
      }
    };

    handleOrderRetrieval();

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
          <p className="text-gray-600 mb-8">
            Your order has been successfully processed.
          </p>
          <Link href="/shop" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price with UAE Dirham symbol
  const formatPrice = (price: number) => {
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                opacity: 1,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: window.innerHeight + 10,
                x: Math.random() * window.innerWidth,
                opacity: 0,
                rotate: 360
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: "easeOut",
                delay: Math.random() * 3
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Success Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-6 shadow-lg"
            >
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              {t('order_confirmed', 'Order Confirmed!')}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-gray-600 mb-6"
            >
              {t('thank_you_message', 'Thank you for your purchase! Your order has been successfully placed.')}
            </motion.p>

            {orderDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md border"
              >
                <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">
                  {t('order_number', 'Order #')}{orderDetails.orderId?.substring(0, 8)}
                </span>
              </motion.div>
            )}

            {orderDetails?.paymentProvider === 'TABBY' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mx-auto max-w-md"
              >
                <p className="text-green-800 font-medium">
                  💳 {t('tabby_payment_confirmed', 'Tabby Payment Confirmed!')}
                </p>
                <p className="text-green-700 text-sm mt-1">
                  {t('tabby_installment_message', 'Your order will be processed and you\'ll pay in 4 easy installments with 0% interest.')}
                </p>
              </motion.div>
            )}

            {orderDetails?.isNewCustomer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mx-auto max-w-md"
              >
                <p className="text-blue-800 font-medium">
                  🎉 {t('welcome_new_customer', 'Welcome to Green Roasteries!')}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  {t('account_created_message', 'We\'ve created an account for you. Check your email for login credentials.')}
                </p>
              </motion.div>
            )}
          </motion.div>

          {!orderDetails ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold mb-4">{t('thank_you_purchase', 'Thank you for your purchase!')}</h2>
              <p className="text-gray-600 mb-8">
                {t('order_processed', 'Your order has been successfully processed.')}
              </p>
              <Link 
                href="/shop" 
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                {t('continue_shopping', 'Continue Shopping')}
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-8">
              {/* Order Status Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <TruckIcon className="w-6 h-6 text-green-600" />
                  {t('order_status', 'Order Status')}
                </h2>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-800">{t('order_placed', 'Order Placed')}</div>
                      <div className="text-sm text-gray-600">{formatDate(orderDetails.orderDate)}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-16 h-1 md:h-0.5 bg-gray-200 rounded"></div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <ClockIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-blue-800">{t('processing', 'Processing')}</div>
                      <div className="text-sm text-gray-600">{t('being_prepared', 'Being prepared')}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-16 h-1 md:h-0.5 bg-gray-200 rounded"></div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <TruckIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">{t('shipped', 'Shipped')}</div>
                      <div className="text-sm text-gray-600">{t('coming_soon', 'Coming soon')}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Order Details and Purchase Summary */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Order Information */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    {t('order_details', 'Order Details')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">{t('order_number', 'Order Number')}:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">{t('order_date', 'Order Date')}:</span>
                      <span className="font-medium">{formatDate(orderDetails.orderDate)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">{t('email', 'Email')}:</span>
                      <span className="font-medium">{orderDetails.customerInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4" />
                        {t('payment_method', 'Payment Method')}:
                      </span>
                      <span className="font-medium">{t('stripe_payment', 'Stripe Payment')}</span>
                    </div>
                  </div>

                  <hr className="my-6" />

                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-green-600" />
                    {t('shipping_information', 'Shipping Information')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">{t('recipient', 'Recipient')}:</span>
                      <div className="font-medium">{orderDetails.customerInfo.fullName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('phone', 'Phone')}:</span>
                      <div className="font-medium">{orderDetails.customerInfo.phone}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('address', 'Address')}:</span>
                      <div className="font-medium">
                        {orderDetails.shippingInfo.address}<br />
                        {orderDetails.shippingInfo.city}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Purchase Summary */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
                >
                  <h3 className="text-xl font-bold mb-6">{t('order_summary', 'Order Summary')}</h3>
                  
                  <div className="space-y-4 mb-6">
                    {orderDetails.items.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl"
                      >
                        {item.image && (
                          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {Object.values(item.variation).filter(Boolean).join(', ')}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">{t('qty', 'Qty')}: {item.quantity}</span>
                            <span className="font-semibold flex items-center">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subtotal', 'Subtotal')}:</span>
                      <span className="flex items-center">{formatPrice(orderDetails.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('shipping', 'Shipping')}:</span>
                      <span className="text-green-600 font-medium">{t('free', 'Free')}</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t('total', 'Total')}:</span>
                      <span className="flex items-center">{formatPrice(orderDetails.totalAmount)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center"
              >
                <p className="text-gray-600 mb-6">
                  {t('email_confirmation', 'You will receive an email confirmation shortly at')} <strong>{orderDetails.customerInfo.email}</strong>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all duration-300"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    {t('print_order', 'Print Order')}
                  </button>
                  
                  <Link 
                    href="/customer/dashboard" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300"
                  >
                    <UserIcon className="w-5 h-5" />
                    {t('track_order', 'Track Order')}
                  </Link>
                  
                  <Link 
                    href="/shop" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    {t('continue_shopping', 'Continue Shopping')}
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .bg-gradient-to-br {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
} 