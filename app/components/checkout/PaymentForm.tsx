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
import { useClarity } from '../../hooks/useClarity';
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
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    discountType: string;
    promotionId: string;
    name: string;
    description?: string;
  } | null;
  onSuccess: (orderId: string, isNewCustomer: boolean) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

// Helper function to track lead conversions
const trackLeadConversion = async (data: {
  email: string;
  name: string;
  phone: string;
  value: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  try {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        status: 'CONVERTED',
        convertedData: {
          name: data.name,
          phone: data.phone,
          value: data.value,
          currency: data.currency,
          items: data.items
        }
      }),
    });
    console.log('✅ Lead conversion tracked for:', data.email);
  } catch (error) {
    console.warn('⚠️ Lead conversion tracking failed (non-critical):', error);
  }
};

function CheckoutForm({ 
  customerInfo, 
  shippingInfo, 
  items, 
  totalAmount, 
  subtotal, 
  tax, 
  shippingCost, 
  discount = 0,
  appliedCoupon,
  onSuccess, 
  onBack, 
  isSubmitting 
}: PaymentFormProps) {
  const { t, language } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const clarity = useClarity();
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
          discount,
          appliedCoupon
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
  }, [totalAmount, customerInfo, shippingInfo, items, subtotal, tax, shippingCost, discount, appliedCoupon, selectedPaymentMethod]);

  // Set up payment request for Apple Pay / Google Pay
  useEffect(() => {
    // Wait for stripe to be available, but don't wait for clientSecret to avoid blocking initial setup
    if (!stripe || typeof window === 'undefined') return;

    // DEBUG: Log payment request setup
    console.log('🍎 Setting up Apple Pay/Google Pay with amount:', {
      totalAmount,
      discountedAmount: totalAmount,
      stripeAmount: Math.round(totalAmount * 100),
      appliedCoupon: appliedCoupon ? appliedCoupon.code : 'None',
      discount: discount,
      clientSecret: clientSecret ? 'Present' : 'Missing'
    });

    const pr = stripe.paymentRequest({
      country: 'AE',
      currency: 'aed',
      total: {
        label: 'Green Roasteries Order',
        amount: Math.round(totalAmount * 100), // totalAmount is already the discounted amount
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

    // Update existing payment request if amount changes
    if (paymentRequest) {
      console.log('🍎 Updating existing payment request with new amount:', Math.round(totalAmount * 100));
      paymentRequest.update({
        total: {
          label: 'Green Roasteries Order',
          amount: Math.round(totalAmount * 100),
        },
      });
    }

    pr.on('paymentmethod', async (event) => {
      // DEBUG: Log Apple Pay/Google Pay payment attempt
      console.log('🍎 Apple Pay/Google Pay payment method triggered:', {
        paymentMethodId: event.paymentMethod.id,
        clientSecret: clientSecret ? 'Present' : 'Missing',
        totalAmount: totalAmount,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : 'None'
      });

      if (!clientSecret) {
        console.error('🍎 No clientSecret available for Apple Pay/Google Pay - payment intent not ready');
        setError('Payment not ready. Please try again or use card payment.');
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
            appliedCoupon,
            paymentIntentId: paymentIntent.id,
          }),
          });

          const orderData = await orderResponse.json();

                  if (orderData.success) {
          // Convert lead to customer
          const convertLead = async () => {
            try {
              await fetch('/api/leads', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: customerInfo.email,
                  status: 'CONVERTED',
                  convertedUserId: orderData.userId // Assuming the order response includes userId
                }),
              });
            } catch (error) {
              console.warn('Lead conversion error (non-critical):', error);
            }
          };
          
          // Convert lead (non-blocking)
          convertLead();
          
          // NOTE: Purchase tracking moved to server-side webhooks for accurate payment confirmation
          // This ensures events are only fired when payments are actually successful
          
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
  }, [stripe, clientSecret, totalAmount, customerInfo, shippingInfo, items, subtotal, tax, shippingCost, discount, appliedCoupon, onSuccess]);

  // 🔮 Track checkout initialization and page view
  useEffect(() => {
    // Identify user for Clarity tracking
    clarity.identifyUser(
      customerInfo.email,
      `checkout_${Date.now()}`,
      'checkout_payment',
      customerInfo.fullName
    );

    // Set initial checkout tags
    clarity.setTag('checkout_step', 'payment_form');
    clarity.setTag('checkout_step_number', '3');
    clarity.setTag('checkout_total_amount', totalAmount.toString());
    clarity.setTag('checkout_items_count', items.length.toString());
    clarity.setTag('checkout_shipping_cost', shippingCost.toString());
    clarity.setTag('checkout_has_discount', discount ? 'yes' : 'no');
    if (appliedCoupon) {
      clarity.setTag('checkout_coupon_code', appliedCoupon.code);
      clarity.setTag('checkout_discount_amount', appliedCoupon.discountAmount.toString());
    }

    // Track checkout step
    clarity.trackCheckoutStep('payment_form', 3, totalAmount);

    // Upgrade session for checkout
    clarity.upgradeSession('checkout_payment_form');

    console.log('🔮 Clarity checkout payment form tracking initialized');
  }, []);

  // 🔮 Track payment method selection
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    
    // Track payment method selection in Clarity
    clarity.setTag('selected_payment_method', method);
    clarity.trackEvent(`payment_method_selected_${method}`);
    
    // Track payment method preference
    clarity.trackUserPreference('payment_method', method);
    
    console.log('🔮 Payment method selection tracked:', method);
  };

  const handleTabbyPayment = async () => {
    setProcessing(true);
    setError('');

    // 🔮 Track Tabby payment initiation
    clarity.setTag('payment_processor', 'tabby');
    clarity.setTag('payment_action', 'initiate');
    clarity.trackEvent('tabby_payment_initiated');
    clarity.upgradeSession('tabby_payment_attempt');

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

      // Track Facebook Add Payment Info for Tabby (Pixel + Conversions API)
      if (typeof window !== 'undefined' && (window as any).trackFacebookAddPaymentInfo) {
        (window as any).trackFacebookAddPaymentInfo(totalAmount, 'AED');
      }

      // ✅ NEW TABBY FLOW: Don't create order in database until payment is confirmed
      // Store order data temporarily for webhook processing
      console.log('🛒 Preparing Tabby payment session (order will be created by webhook after payment)...');
      
      // Create Tabby payment session directly without creating order first
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
          appliedCoupon,
          // Don't pass orderId - it will be created by webhook
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        console.log('✅ Tabby payment session created');
        
        // 🔮 Track successful Tabby session creation
        clarity.setTag('tabby_session_created', 'yes');
        clarity.setTag('tabby_payment_id', data.payment_id || 'unknown');
        clarity.trackEvent('tabby_session_created');
        
        // ✅ CRITICAL: Store complete order data in localStorage for webhook order creation
        const tempOrderData = {
          customerInfo,
          shippingInfo,
          items,
          totalAmount,
          subtotal,
          tax,
          shippingCost,
          discount,
          appliedCoupon,
          paymentProvider: 'TABBY',
          timestamp: Date.now(),
          sessionId: data.payment_id // For tracking
        };

        localStorage.setItem('tabbyOrderData', JSON.stringify(tempOrderData));
        console.log('✅ Order data stored for webhook processing');

        // Track lead conversion for Tabby payments  
        trackLeadConversion({
          email: customerInfo.email,
          name: customerInfo.fullName,
          phone: customerInfo.phone,
          value: totalAmount,
          currency: 'AED',
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        });

        // 🔮 Track redirect to Tabby
        clarity.setTag('tabby_redirect', 'initiated');
        clarity.trackEvent('tabby_redirect_started');
        
        console.log('🔄 Redirecting to Tabby payment...');
        window.location.href = data.checkout_url;
      } else {
        // 🔮 Track Tabby session creation failure
        clarity.setTag('tabby_session_error', data.error || 'unknown_error');
        clarity.trackEvent('tabby_session_failed');
        clarity.trackErrorOccurred('tabby_session_creation', data.error || 'Failed to create Tabby payment session', 'checkout_payment');
        
        setError(data.error || 'Failed to create Tabby payment session');
        console.error('❌ Tabby payment session failed:', data);
      }
    } catch (error) {
      console.error('❌ Tabby payment error:', error);
      
      // 🔮 Track Tabby network error
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      clarity.setTag('tabby_network_error', errorMessage);
      clarity.trackEvent('tabby_network_error');
      clarity.trackErrorOccurred('tabby_network', errorMessage, 'checkout_payment');
      
      setError('Network error. Please try again.');
    }

    setProcessing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // 🔮 Track form submission attempt
    clarity.setTag('payment_form_submitted', 'yes');
    clarity.setTag('payment_method_on_submit', selectedPaymentMethod);
    clarity.trackEvent('payment_form_submitted');

    if (selectedPaymentMethod === 'tabby') {
      await handleTabbyPayment();
      return;
    }

    // 🔮 Track Stripe payment initiation
    clarity.setTag('payment_processor', 'stripe');
    clarity.setTag('payment_action', 'initiate');
    clarity.trackEvent('stripe_payment_initiated');
    clarity.upgradeSession('stripe_payment_attempt');

    // Stripe payment handling
    if (!stripe || !elements || !clientSecret) {
      // 🔮 Track Stripe initialization error
      clarity.trackErrorOccurred('stripe_init', 'Stripe not initialized or client secret missing', 'checkout_payment');
      return;
    }

    setProcessing(true);
    setError('');

    // Update lead with payment info
    const updateLeadPayment = async () => {
      try {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customerInfo.email,
            hasPaymentInfo: true,
            paymentData: {
              preferredPayment: selectedPaymentMethod
            }
          }),
        });
      } catch (error) {
        console.warn('Lead payment update error (non-critical):', error);
      }
    };
    
    // Update lead (non-blocking)
    updateLeadPayment();
    
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

    // Track Facebook Add Payment Info (Pixel + Conversions API)
    if (typeof window !== 'undefined' && (window as any).trackFacebookAddPaymentInfo) {
      (window as any).trackFacebookAddPaymentInfo(totalAmount, 'AED');
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      // 🔮 Track card element error
      clarity.trackErrorOccurred('stripe_card_element', 'Card element not found', 'checkout_payment');
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    // 🔮 Track card payment confirmation attempt
    clarity.setTag('stripe_confirmation_attempt', 'yes');
    clarity.trackEvent('stripe_card_confirmation_started');

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
      // 🔮 Track Stripe payment error
      clarity.setTag('stripe_error_code', stripeError.code || 'unknown');
      clarity.setTag('stripe_error_type', stripeError.type || 'unknown');
      clarity.trackEvent('stripe_payment_failed');
      clarity.trackErrorOccurred('stripe_payment', stripeError.message || 'Payment failed', 'checkout_payment');
      
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // 🔮 Track successful Stripe payment
      clarity.setTag('stripe_payment_succeeded', 'yes');
      clarity.setTag('stripe_payment_intent_id', paymentIntent.id);
      clarity.trackEvent('stripe_payment_succeeded');
      clarity.upgradeSession('successful_payment');

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
            appliedCoupon,
            paymentIntentId: paymentIntent.id,
          }),
        });

        const orderData = await orderResponse.json();

        if (orderData.success) {
          // 🔮 Track successful order creation
          clarity.setTag('order_created', 'yes');
          clarity.setTag('order_id', orderData.orderId);
          clarity.setTag('customer_type', orderData.isNewCustomer ? 'new' : 'returning');
          clarity.trackEvent('order_created_successfully');
          clarity.upgradeSession('successful_order_completion');

          // Convert lead to customer
          const convertLead = async () => {
            try {
              await fetch('/api/leads', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: customerInfo.email,
                  status: 'CONVERTED',
                  convertedUserId: orderData.userId // Assuming the order response includes userId
                }),
              });
            } catch (error) {
              console.warn('Lead conversion error (non-critical):', error);
            }
          };
          
          // Convert lead (non-blocking)
          convertLead();
          
          // NOTE: Purchase tracking moved to server-side webhooks for accurate payment confirmation
          // This ensures events are only fired when payments are actually successful
          
          onSuccess(orderData.orderId, orderData.isNewCustomer);
        } else {
          // 🔮 Track order creation failure
          clarity.trackErrorOccurred('order_creation', orderData.error || 'Failed to create order', 'checkout_payment');
          setError(orderData.error || 'Failed to create order');
        }
      } catch (err) {
        // 🔮 Track order creation network error
        const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
        clarity.trackErrorOccurred('order_creation_network', errorMessage, 'checkout_payment');
        setError('Failed to create order');
      }
    }

    setProcessing(false);
  };

  // 🔮 Track processing state changes
  useEffect(() => {
    clarity.setTag('payment_processing', processing ? 'yes' : 'no');
    if (processing) {
      clarity.trackEvent('payment_processing_started');
    }
  }, [processing]);

  // 🔮 Track errors
  useEffect(() => {
    if (error) {
      clarity.setTag('payment_form_error', error.substring(0, 100));
      clarity.trackEvent('payment_form_error_displayed');
    }
  }, [error]);

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
              className="h-8 w-auto max-w-[150px]"
              style={{ height: '32px', maxWidth: '150px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
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
                onClick={() => handlePaymentMethodChange('stripe')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="stripe"
                    name="paymentMethod"
                    value="stripe"
                    checked={selectedPaymentMethod === 'stripe'}
                    onChange={() => handlePaymentMethodChange('stripe')}
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
                          className="h-6 w-auto max-w-[120px]"
                          style={{ height: '24px', maxWidth: '120px' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('secure_payment_stripe', 'Secure payment with Stripe')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabby Payment Option - Simplified Design */}
              {tabbyAvailable && (
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'tabby' 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handlePaymentMethodChange('tabby')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="tabby"
                      name="paymentMethod"
                      value="tabby"
                      checked={selectedPaymentMethod === 'tabby'}
                      onChange={() => handlePaymentMethodChange('tabby')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="tabby" className="text-sm font-medium text-gray-900 cursor-pointer">
                          {t('tabby_payment', 'Pay later with Tabby')}
                        </label>
                          <img 
                            src="/tabby.png" 
                            alt="Tabby" 
                          className="h-4 w-auto max-w-[60px]"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('pay_in_4_installments', 'Pay in 4 interest-free installments')}
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