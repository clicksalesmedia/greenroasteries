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
import { trackAddPaymentInfo, trackPurchase } from '../../lib/tracking-integration';

// Payment method types
type PaymentMethod = 'stripe' | 'tabby';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('stripe');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [tabbyAvailable, setTabbyAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check if Tabby is available for this order amount
    const checkTabbyAvailability = () => {
      // Tabby is typically available for amounts between 1 and 5000 AED
      setTabbyAvailable(totalAmount >= 1 && totalAmount <= 5000);
    };

    checkTabbyAvailability();
  }, [totalAmount]);

  useEffect(() => {
    // Create payment intent when component mounts and Stripe is selected
    if (selectedPaymentMethod !== 'stripe') return;

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
            items,
            subtotal,
            tax,
            shippingCost,
            discount
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
  }, [totalAmount, customerInfo, shippingInfo, items, subtotal, tax, shippingCost, discount, selectedPaymentMethod]);

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
          // Track purchase completion
          trackPurchase({
            orderId: orderData.orderId,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              category: 'Unknown'
            })),
            total: totalAmount,
            subtotal: subtotal,
            shipping: shippingCost,
            tax: tax,
            discount: discount,
            customer: {
              email: customerInfo.email,
              firstName: customerInfo.fullName.split(' ')[0],
              lastName: customerInfo.fullName.split(' ').slice(1).join(' '),
              phone: customerInfo.phone
            }
          });
          
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

  const handleTabbyPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Track add payment info
      trackAddPaymentInfo({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: 'Unknown'
        })),
        total: totalAmount,
        customer: {
          email: customerInfo.email,
          firstName: customerInfo.fullName.split(' ')[0],
          lastName: customerInfo.fullName.split(' ').slice(1).join(' '),
          phone: customerInfo.phone
        }
      });

      // Create Tabby payment session
      const response = await fetch('/api/payments/tabby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'AED',
          customerInfo,
          shippingInfo,
          items,
          subtotal,
          tax,
          shippingCost,
          discount,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Tabby checkout
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to create Tabby payment session');
      }
    } catch (err) {
      setError('Failed to initialize Tabby payment');
    }

    setProcessing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedPaymentMethod === 'tabby') {
      await handleTabbyPayment();
      return;
    }

    // Stripe payment handling
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError('');

    // Track add payment info
    trackAddPaymentInfo({
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: 'Unknown'
      })),
      total: totalAmount,
      customer: {
        email: customerInfo.email,
        firstName: customerInfo.fullName.split(' ')[0],
        lastName: customerInfo.fullName.split(' ').slice(1).join(' '),
        phone: customerInfo.phone
      }
    });

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
          // Track purchase completion
          trackPurchase({
            orderId: orderData.orderId,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              category: 'Unknown'
            })),
            total: totalAmount,
            subtotal: subtotal,
            shipping: shippingCost,
            tax: tax,
            discount: discount,
            customer: {
              email: customerInfo.email,
              firstName: customerInfo.fullName.split(' ')[0],
              lastName: customerInfo.fullName.split(' ').slice(1).join(' '),
              phone: customerInfo.phone
            }
          });
          
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
            <img 
              src="/images/creditvcard.webp" 
              alt="Accepted payment methods: Visa, MasterCard, American Express, Apple Pay, Google Pay" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        <p className={`text-sm text-gray-600 text-center sm:text-left ${language === 'ar' ? 'sm:text-right' : ''}`}>
          {t('all_transactions_secure', 'All transactions are secure and encrypted with Stripe.')}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('payment_method', 'Payment Method')}*
            </label>
            <div className="space-y-3">
              {/* Stripe/Card Payment Option */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'stripe' 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPaymentMethod('stripe')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="stripe"
                    name="paymentMethod"
                    value="stripe"
                    checked={selectedPaymentMethod === 'stripe'}
                    onChange={() => setSelectedPaymentMethod('stripe')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="stripe" className="text-sm font-medium text-gray-900 cursor-pointer">
                        {t('card_payment', 'Credit/Debit Card')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <img 
                          src="/images/creditvcard.webp" 
                          alt="Visa, MasterCard, American Express" 
                          className="h-6 w-auto"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('secure_payment_stripe', 'Secure payment with Stripe')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabby Payment Option */}
              {tabbyAvailable && (
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'tabby' 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedPaymentMethod('tabby')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="tabby"
                      name="paymentMethod"
                      value="tabby"
                      checked={selectedPaymentMethod === 'tabby'}
                      onChange={() => setSelectedPaymentMethod('tabby')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="tabby" className="text-sm font-medium text-gray-900 cursor-pointer">
                          {t('tabby_payment', 'Pay in 4 installments with Tabby')}
                        </label>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded mb-1">
                            0% Interest
                          </span>
                          <img 
                            src="/tabby.png" 
                            alt="Tabby" 
                            className="h-4 w-auto"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('tabby_description', `Split your ${totalAmount.toFixed(2)} AED into 4 payments of ${(totalAmount / 4).toFixed(2)} AED`)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Apple Pay / Google Pay Button - Only show for Stripe */}
          {selectedPaymentMethod === 'stripe' && paymentRequest && (
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

          {/* Card Element - Only show for Stripe */}
          {selectedPaymentMethod === 'stripe' && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
                {t('card_information', 'Card Information')}*
              </label>
              <div className="border border-gray-300 rounded-md shadow-sm p-3 focus-within:ring-black focus-within:border-black">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          )}

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
              {shippingCost > 0 && (
                <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span>{t('shipping', 'Shipping')}</span>
                  <span>{shippingCost.toFixed(2)} AED</span>
                </div>
              )}
              {shippingCost === 0 && (
                <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span>{t('shipping', 'Shipping')}</span>
                  <span className="text-green-600">{t('free', 'Free')}</span>
                </div>
              )}
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
              disabled={
                processing || isSubmitting || 
                (selectedPaymentMethod === 'stripe' && (!stripe || !clientSecret)) ||
                (selectedPaymentMethod === 'tabby' && !tabbyAvailable)
              }
            >
              {processing || isSubmitting 
                ? t('processing', 'Processing...') 
                : selectedPaymentMethod === 'tabby'
                  ? t('continue_with_tabby', 'Continue with Tabby')
                  : `${t('pay_amount', 'Pay')} ${totalAmount.toFixed(2)} AED`
              }
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