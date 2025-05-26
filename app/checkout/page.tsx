'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleCustomerInfoSubmit = (data: typeof customerInfo) => {
    setCustomerInfo(data);
    handleNextStep();
  };

  const handleShippingInfoSubmit = (data: typeof shippingInfo) => {
    setShippingInfo(data);
    handleNextStep();
  };

  const handlePaymentSuccess = async (orderId: string, isNewCustomer: boolean) => {
    try {
      // Store order info for thank you page
      const orderInfo = {
        orderId,
        isNewCustomer,
        customerInfo,
        shippingInfo,
        items,
        totalAmount: totalPrice,
        orderDate: new Date().toISOString()
      };
      
      localStorage.setItem('lastOrder', JSON.stringify(orderInfo));
      
      // Clear the cart
      clearCart();
      
      // Show success message
      showToast(
        isNewCustomer 
          ? 'Order placed successfully! Check your email for account credentials.'
          : 'Order placed successfully! Thank you for your purchase.',
        'success'
      );
      
      // Redirect to thank you page
      router.push('/checkout/thank-you');
    } catch (error) {
      console.error('Order completion error:', error);
      showToast('Order completed but there was an issue. Please contact support.', 'error');
    }
  };

  // Steps array for the progress indicator
  const steps = [
    { name: t('customer_info', 'Customer Info'), description: t('your_details', 'Your details') },
    { name: t('shipping_info', 'Shipping'), description: t('delivery_information', 'Delivery information') },
    { name: t('payment_info', 'Payment'), description: t('secure_payment', 'Secure payment') }
  ];

  if (items.length === 0) {
    return <div className="container mx-auto py-16 px-4 text-center">Loading...</div>;
  }

  return (
    <div className={`container mx-auto py-8 px-4 md:py-16 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className={`text-3xl font-bold mb-8 text-center ${language === 'ar' ? 'text-right' : ''}`}>
        {t('checkout', 'Checkout')}
      </h1>
      
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
                totalAmount={totalPrice}
                subtotal={totalPrice * 0.9} // Assuming 10% tax
                tax={totalPrice * 0.1}
                shippingCost={totalPrice > 200 ? 0 : 25}
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
  );
} 