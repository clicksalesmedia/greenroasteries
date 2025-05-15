'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
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
    city: '',
    address: '',
  });
  
  // Payment state (mock)
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

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

  const handlePaymentSubmit = async (data: typeof paymentInfo) => {
    setIsSubmitting(true);
    setPaymentInfo(data);
    
    try {
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create the order object
      const order = {
        customerInfo,
        shippingInfo,
        paymentInfo: {
          last4: data.cardNumber.slice(-4) // Only store last 4 digits for security
        },
        items,
        totalAmount: totalPrice,
        orderId: `ORD-${Date.now()}`,
        orderDate: new Date().toISOString()
      };
      
      // Store the order in localStorage for the thank you page
      localStorage.setItem('lastOrder', JSON.stringify(order));
      
      // Clear the cart
      clearCart();
      
      // Redirect to thank you page
      router.push('/checkout/thank-you');
    } catch (error) {
      console.error('Payment processing error:', error);
      showToast('Payment processing failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Steps array for the progress indicator
  const steps = [
    { name: 'Customer Info', description: 'Your details' },
    { name: 'Shipping', description: 'Delivery information' },
    { name: 'Payment', description: 'Secure payment' }
  ];

  if (items.length === 0) {
    return <div className="container mx-auto py-16 px-4 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      {/* Progress Steps */}
      <div className="mb-12">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center">
            {steps.map((step, index) => (
              <li key={step.name} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="flex flex-col items-center">
                  <div
                    className={`${
                      currentStep > index + 1
                        ? 'bg-black text-white'
                        : currentStep === index + 1
                        ? 'border-2 border-black text-black'
                        : 'border-2 border-gray-300 text-gray-400'
                    } h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200`}
                  >
                    {currentStep > index + 1 ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    currentStep === index + 1 ? 'text-black' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                
                {/* Connecting line */}
                {index !== steps.length - 1 && (
                  <div className="hidden sm:block absolute top-5 right-0 h-0.5 w-16 bg-gray-200">
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
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Main content - checkout steps */}
        <div className="lg:col-span-7">
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
                initialValues={paymentInfo} 
                onSubmit={handlePaymentSubmit} 
                onBack={handlePrevStep}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
        
        {/* Order summary sidebar */}
        <div className="lg:col-span-5">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
} 