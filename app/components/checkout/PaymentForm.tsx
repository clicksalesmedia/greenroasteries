'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useLanguage } from '../../contexts/LanguageContext';

// Initialize Stripe promise
let stripePromise: Promise<any> | null = null;
const getStripePromise = () => {
  if (!stripePromise && typeof window !== 'undefined') {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

interface PaymentFormProps {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingInfo: {
    address: string;
    city: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variation: any;
  }>;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount?: number;
  onSuccess: (orderId: string, isNewCustomer: boolean) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function CheckoutForm({ 
  customerInfo, 
  shippingInfo, 
  items, 
  totalAmount, 
  subtotal, 
  tax, 
  shippingCost, 
  discount = 0,
  onSuccess, 
  onBack, 
  isSubmitting 
}: PaymentFormProps) {
  const { t, language } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'aed',
            customerInfo,
            shippingInfo,
            items
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        }
      } catch (err) {
        setError('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [totalAmount, customerInfo, shippingInfo, items]);

  // Set up payment request for Apple Pay / Google Pay
  useEffect(() => {
    if (!stripe || typeof window === 'undefined') return;

    const pr = stripe.paymentRequest({
      country: 'AE',
      currency: 'aed',
      total: {
        label: 'Green Roasteries Order',
        amount: Math.round(totalAmount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if payment request is available (Apple Pay, Google Pay, etc.)
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event) => {
      if (!clientSecret) {
        event.complete('fail');
        return;
      }

      setProcessing(true);
      setError('');

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: event.paymentMethod.id,
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        event.complete('fail');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create order in database
        try {
          const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerInfo,
              shippingInfo,
              items,
              totalAmount,
              subtotal,
              tax,
              shippingCost,
              discount,
              paymentIntentId: paymentIntent.id,
            }),
          });

          const orderData = await orderResponse.json();

          if (orderData.success) {
            event.complete('success');
            onSuccess(orderData.orderId, orderData.isNewCustomer);
          } else {
            event.complete('fail');
            setError(orderData.error || 'Failed to create order');
          }
        } catch (err) {
          event.complete('fail');
          setError('Failed to create order');
        }
      }

      setProcessing(false);
    });
  }, [stripe, totalAmount, clientSecret, customerInfo, shippingInfo, items, subtotal, tax, shippingCost, discount, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    // Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.fullName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              city: shippingInfo.city,
              line1: shippingInfo.address,
            },
          },
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Create order in database
      try {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerInfo,
            shippingInfo,
            items,
            totalAmount,
            subtotal,
            tax,
            shippingCost,
            discount,
            paymentIntentId: paymentIntent.id,
          }),
        });

        const orderData = await orderResponse.json();

        if (orderData.success) {
          onSuccess(orderData.orderId, orderData.isNewCustomer);
        } else {
          setError(orderData.error || 'Failed to create order');
        }
      } catch (err) {
        setError('Failed to create order');
      }
    }

    setProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const paymentRequestButtonOptions = {
    paymentRequest,
    style: {
      paymentRequestButton: {
        type: 'default' as const,
        theme: 'dark' as const,
        height: '48px',
      },
    },
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={`text-xl font-bold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>
        {t('payment_info', 'Payment Information')}
      </h2>
      
      <div className="mb-6 bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-center space-x-3 mb-2 sm:mb-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">💳 Cards</span>
            <span className="text-sm font-medium">🍎 Apple Pay</span>
            <span className="text-sm font-medium">🌐 Google Pay</span>
          </div>
        </div>
        <p className={`text-sm text-gray-600 text-center sm:text-left ${language === 'ar' ? 'sm:text-right' : ''}`}>
          {t('all_transactions_secure', 'All transactions are secure and encrypted with Stripe.')}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Apple Pay / Google Pay Button */}
          {paymentRequest && (
            <div>
              <div className="text-center mb-4">
                <PaymentRequestButtonElement 
                  options={paymentRequestButtonOptions} 
                  className="StripeElement"
                />
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {t('or_pay_with_card', 'Or pay with card')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card Element */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('card_information', 'Card Information')}*
            </label>
            <div className="border border-gray-300 rounded-md shadow-sm p-3 focus-within:ring-black focus-within:border-black">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className={`text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{error}</p>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className={`text-sm font-medium text-gray-900 mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('order_summary', 'Order Summary')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span>{t('subtotal', 'Subtotal')}</span>
                <span>{subtotal.toFixed(2)} AED</span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span>{t('tax', 'Tax')}</span>
                <span>{tax.toFixed(2)} AED</span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span>{t('shipping', 'Shipping')}</span>
                <span>{shippingCost.toFixed(2)} AED</span>
              </div>
              {discount > 0 && (
                <div className={`flex justify-between text-green-600 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span>{t('discount', 'Discount')}</span>
                  <span>-{discount.toFixed(2)} AED</span>
                </div>
              )}
              <div className={`border-t pt-2 flex justify-between font-medium ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span>{t('total', 'Total')}</span>
                <span>{totalAmount.toFixed(2)} AED</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className={`pt-4 flex flex-col sm:flex-row gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : 'sm:flex-row-reverse'}`}>
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={!stripe || processing || isSubmitting || !clientSecret}
            >
              {processing || isSubmitting ? t('processing', 'Processing...') : `${t('pay_amount', 'Pay')} ${totalAmount.toFixed(2)} AED`}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-1/2 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={processing || isSubmitting}
            >
              {t('back', 'Back')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Create the PaymentForm component using dynamic import with SSR disabled
const PaymentForm = dynamic(
  () => Promise.resolve(function PaymentFormWrapper(props: PaymentFormProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      );
    }

    return (
      <Elements stripe={getStripePromise()}>
        <CheckoutForm {...props} />
      </Elements>
    );
  }),
  { ssr: false }
);

export default PaymentForm; 