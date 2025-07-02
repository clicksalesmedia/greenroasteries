'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { trackInitiateCheckout, trackAddShippingInfo, trackAddPaymentInfo, trackPurchase } from '../lib/tracking-integration';
import ShopErrorBoundary from '../components/ShopErrorBoundary';

// Step components
import CustomerInfoForm from '../components/checkout/CustomerInfoForm';
import ShippingForm from '../components/checkout/ShippingForm';
import PaymentForm from '../components/checkout/PaymentForm';
import OrderSummary from '../components/checkout/OrderSummary';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  
  // Shipping information state
  const [shippingInfo, setShippingInfo] = useState({
    emirate: '',
    city: '',
    address: '',
  });
  
  // Payment processing state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Shipping calculation state
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Payment success state to prevent cart redirect
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if cart is empty (but not during order completion)
  useEffect(() => {
    if (!isClient) return;
    
    if (items.length === 0 && !isCompletingOrder) {
      console.log('Cart is empty, redirecting to cart page');
      router.push('/cart');
    }
  }, [items, router, isCompletingOrder, isClient]);

  // Calculate shipping when items or customer info changes
  useEffect(() => {
    if (!isClient) return;

    const calculateShipping = async () => {
      if (totalPrice <= 0) {
        setShippingCost(0);
        setShippingError(null);
        return;
      }

      setIsCalculatingShipping(true);
      setShippingError(null);
      
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
          setShippingCost(calculation.shippingCost || 0);
        } else {
          // Fallback: free shipping over 200 AED, otherwise 25 AED
          setShippingCost(totalPrice >= 200 ? 0 : 25);
          setShippingError(t('shipping_calc_error', 'Using fallback shipping rates'));
        }
      } catch (error) {
        console.error('Error calculating shipping:', error);
        // Fallback: free shipping over 200 AED, otherwise 25 AED
        setShippingCost(totalPrice >= 200 ? 0 : 25);
        setShippingError(t('shipping_calc_error', 'Using fallback shipping rates'));
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [totalPrice, items, isClient, t]);

  // Calculate final total including shipping
  const finalTotal = totalPrice + shippingCost;

  const handleNextStep = () => {
    try {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error navigating to next step:', error);
      setError(t('navigation_error', 'Error navigating to next step'));
    }
  };

  const handlePrevStep = () => {
    try {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error navigating to previous step:', error);
      setError(t('navigation_error', 'Error navigating to previous step'));
    }
  };

  const handleCustomerInfoSubmit = (data: typeof customerInfo) => {
    try {
      setCustomerInfo(data);
      setError(null);
      
      // Track initiate checkout when customer info is submitted (non-blocking)
      // Don't await this to prevent tracking errors from blocking the checkout flow
      trackInitiateCheckout({
        items: items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: 'Unknown' // Could be enhanced to include category
        })),
        total: finalTotal,
        customer: {
          email: data.email,
          firstName: data.fullName.split(' ')[0],
          lastName: data.fullName.split(' ').slice(1).join(' '),
          phone: data.phone
        }
      }).catch(error => {
        // Silently handle tracking errors to prevent checkout interruption
        console.warn('Tracking error (non-critical):', error);
      });
      
      handleNextStep();
    } catch (error) {
      console.error('Error submitting customer info:', error);
      setError(t('customer_info_error', 'Error processing customer information'));
    }
  };

  const handleShippingInfoSubmit = (data: typeof shippingInfo) => {
    try {
      setShippingInfo(data);
      setError(null);
      
      // Track add shipping info
      trackAddShippingInfo({
        items: items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: 'Unknown'
        })),
        total: finalTotal,
        customer: {
          email: customerInfo.email,
          firstName: customerInfo.fullName.split(' ')[0],
          lastName: customerInfo.fullName.split(' ').slice(1).join(' '),
          phone: customerInfo.phone,
          city: data.city,
          state: data.emirate
        }
      });
      
      handleNextStep();
    } catch (error) {
      console.error('Error submitting shipping info:', error);
      setError(t('shipping_info_error', 'Error processing shipping information'));
    }
  };

  const handlePaymentSuccess = async (orderId: string, isNewCustomer: boolean) => {
    try {
      // Set completing order state to prevent cart redirect
      setIsCompletingOrder(true);
      setError(null);
      
      // Store order info for thank you page
      const orderInfo = {
        orderId,
        isNewCustomer,
        customerInfo,
        shippingInfo,
        items,
        totalAmount: finalTotal,
        orderDate: new Date().toISOString()
      };
      
      localStorage.setItem('lastOrder', JSON.stringify(orderInfo));
      
      // Show success message
      showToast(
        isNewCustomer 
          ? 'Order placed successfully! Check your email for account credentials.'
          : 'Order placed successfully! Thank you for your purchase.',
        'success'
      );
      
      // Clear the cart and redirect to thank you page
      clearCart();
      router.push('/checkout/thank-you');
    } catch (error) {
      console.error('Order completion error:', error);
      showToast('Order completed but there was an issue. Please contact support.', 'error');
      setError(t('order_completion_error', 'Order completed but there was an issue. Please contact support.'));
      setIsCompletingOrder(false);
    }
  };

  // Steps array for the progress indicator
  const steps = [
    { name: t('customer_info', 'Customer Info'), description: t('your_details', 'Your details') },
    { name: t('shipping_info', 'Shipping'), description: t('delivery_information', 'Delivery information') },
    { name: t('payment_info', 'Payment'), description: t('secure_payment', 'Secure payment') }
  ];

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <ShopErrorBoundary>
        <div className="container mx-auto py-16 px-4 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </ShopErrorBoundary>
    );
  }

  if (items.length === 0 && !isCompletingOrder) {
    return (
      <ShopErrorBoundary>
        <div className="container mx-auto py-16 px-4 text-center">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-6">{t('cart_empty_checkout', 'Your cart is empty. Please add items before checkout.')}</p>
            <Link href="/shop" className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
              {t('continue_shopping', 'Continue Shopping')}
            </Link>
          </div>
        </div>
      </ShopErrorBoundary>
    );
  }

  return (
    <ShopErrorBoundary>
      <div className={`container mx-auto py-8 px-4 md:py-16 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className={`text-3xl font-bold mb-8 text-center ${language === 'ar' ? 'text-right' : ''}`}>
        {t('checkout', 'Checkout')}
      </h1>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm font-medium">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Error */}
      {shippingError && (
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-orange-800 text-sm">{shippingError}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="mb-12">
        <nav aria-label="Progress">
          <ol className={`flex items-center justify-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            {steps.map((step, index) => (
              <li key={step.name} className={`relative ${index !== steps.length - 1 ? 'mx-4 sm:mx-8' : ''}`}>
                <div className="flex flex-col items-center min-w-0">
                  <div
                    className={`${
                      currentStep > index + 1
                        ? 'bg-black text-white'
                        : currentStep === index + 1
                        ? 'border-2 border-black text-black'
                        : 'border-2 border-gray-300 text-gray-400'
                    } h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200 mb-3 relative z-10`}
                  >
                    {currentStep > index + 1 ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                    currentStep === index + 1 ? 'text-black' : 'text-gray-500'
                  } ${language === 'ar' ? 'max-w-16 sm:max-w-20' : 'max-w-16 sm:max-w-24'}`}>
                    {step.name}
                  </span>
                </div>
                
                {/* Connecting line */}
                {index !== steps.length - 1 && (
                  <div className={`hidden sm:block absolute top-5 ${language === 'ar' ? '-right-12' : '-right-12'} h-0.5 w-8 bg-gray-200 z-0`}>
                    <div
                      className="h-0.5 bg-black transition-all duration-200"
                      style={{ width: currentStep > index + 1 ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      <div className={`lg:grid lg:grid-cols-12 lg:gap-x-12 ${language === 'ar' ? 'lg:grid-flow-col-dense' : ''}`}>
        {/* Main content - checkout steps */}
        <div className={`lg:col-span-7 ${language === 'ar' ? 'lg:col-start-6' : ''}`}>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {currentStep === 1 && (
              <CustomerInfoForm 
                initialValues={customerInfo} 
                onSubmit={handleCustomerInfoSubmit} 
              />
            )}
            
            {currentStep === 2 && (
              <ShippingForm 
                initialValues={shippingInfo} 
                onSubmit={handleShippingInfoSubmit} 
                onBack={handlePrevStep}
              />
            )}
            
            {currentStep === 3 && (
              <PaymentForm 
                customerInfo={customerInfo}
                shippingInfo={shippingInfo}
                items={items}
                totalAmount={finalTotal}
                subtotal={totalPrice}
                tax={0}
                shippingCost={shippingCost}
                discount={0}
                onSuccess={handlePaymentSuccess}
                onBack={handlePrevStep}
                isSubmitting={paymentProcessing}
              />
            )}
          </div>
        </div>
        
        {/* Order summary sidebar */}
        <div className={`lg:col-span-5 ${language === 'ar' ? 'lg:col-start-1' : ''}`}>
          <OrderSummary />
        </div>
      </div>
    </div>
    </ShopErrorBoundary>
  );
}