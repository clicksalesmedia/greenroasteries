'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface TrackingConfig {
  googleTagManager: {
    enabled: boolean;
    containerId: string;
    status: string;
  };
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
    status: string;
  };
  metaAds: {
    enabled: boolean;
    pixelId: string;
    accessToken: string;
    status: string;
  };
  googleAds: {
    enabled: boolean;
    conversionId: string;
    conversionLabel: string;
    status: string;
  };
  serverSideTracking: {
    enabled: boolean;
    facebookConversionsApi: boolean;
    googleConversionsApi: boolean;
    status: string;
  };
  microsoftClarity: {
    enabled: boolean;
    projectId: string;
    status: string;
  };
}

export default function TrackingScripts() {
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/tracking/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error loading tracking config:', error);
        // Fallback to default config
        setConfig({
          googleTagManager: {
            enabled: true,
            containerId: 'GTM-W6X2NGX7',
            status: 'active'
          },
          googleAnalytics: {
            enabled: true,
            measurementId: 'G-RYC9K25QGQ',
            status: 'active'
          },
          metaAds: {
            enabled: true,
            pixelId: '3805848799548541',
            accessToken: 'EAAX7Xr0jeMQBO2lCgCyyRhnG1AVnKMdILdHv6gRwomuZBVF4Aoz1beFjoLhzDf3njCZAB2eg3u9bw2EjnlEuyvnaxH7h3gZCtWFBw0QZAxacZCBs3ieR2OP1KUyAevlrMTdCb62pfkJZBoVPkkAvBvoIKWeXVxgUbBnMBm6KuZCAT2d1k1N6DZCRl1I9fwP96T3IZCQZDZD',
            status: 'active'
          },
          googleAds: {
            enabled: true,
            conversionId: 'AW-17214709280',
            conversionLabel: 'rRb1CIv4r-waEKC8zpBA',
            status: 'active'
          },
          serverSideTracking: {
            enabled: true,
            facebookConversionsApi: true,
            googleConversionsApi: true,
            status: 'active'
          },
          microsoftClarity: {
            enabled: true,
            projectId: 'sk2jz9koie',
            status: 'active'
          }
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadConfig();
  }, []);

  // Always render scripts, don't wait for config to load
  const trackingConfig = config || {
    googleTagManager: { enabled: true, containerId: 'GTM-W6X2NGX7', status: 'active' },
    googleAnalytics: { enabled: true, measurementId: 'G-RYC9K25QGQ', status: 'active' },
    metaAds: { enabled: true, pixelId: '3805848799548541', status: 'active' },
    googleAds: { enabled: true, conversionId: 'AW-17214709280', conversionLabel: 'rRb1CIv4r-waEKC8zpBA', status: 'active' },
    serverSideTracking: { enabled: true, facebookConversionsApi: false, googleConversionsApi: true, status: 'active' },
    microsoftClarity: { enabled: true, projectId: 'sk2jz9koie', status: 'active' }
  };

  return (
    <>
      {/* Test Script to verify component is rendering - Non-blocking */}
      <Script
        id="tracking-test"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            console.log('TrackingScripts component loaded successfully');
            window.trackingDebug = true;
          `,
        }}
      />

      {/* Microsoft Clarity Script - High Priority for User Behavior Analytics */}
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "sk2jz9koie");
            
            console.log('🔮 Microsoft Clarity initialized with Project ID: sk2jz9koie');
            
            // Make Clarity functions globally available
            window.clarityReady = true;
          `,
        }}
      />

      {/* Google Ads Script - Non-blocking load */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17214709280"
        strategy="lazyOnload"
      />
      <Script
        id="google-ads-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Configure Google Ads with Enhanced Conversions
            gtag('config', 'AW-17214709280', {
              allow_enhanced_conversions: true,
              currency: 'AED'
            });
            
            console.log('Google Ads Enhanced Conversions loaded: AW-17214709280');
          `,
        }}
      />

      {/* Google Analytics 4 Enhanced Script - Non-blocking */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-RYC9K25QGQ"
        strategy="lazyOnload"
      />
      <Script
        id="ga4-enhanced-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Enhanced GA4 Configuration for Greenroasteries
            gtag('config', 'G-RYC9K25QGQ', {
              // Stream Configuration
              site_name: 'Greenroasteries',
              page_title: document.title,
              page_location: window.location.href,
              // Enhanced Ecommerce Configuration
              send_page_view: true,
              allow_enhanced_conversions: true,
              allow_google_signals: true,
              cookie_domain: 'thegreenroasteries.com',
              cookie_expires: 63072000, // 2 years
              // Custom Parameters
              custom_map: {
                'custom_parameter_1': 'coffee_preference',
                'custom_parameter_2': 'roast_level'
              }
            });
            
            // Set custom dimensions
            gtag('config', 'G-RYC9K25QGQ', {
              custom_parameters: {
                stream_id: '11301015673',
                business_type: 'coffee_retail',
                currency_default: 'AED'
              }
            });
            
            console.log('Enhanced Google Analytics GA4 loaded: G-RYC9K25QGQ (Stream ID: 11301015673)');
          `,
        }}
      />

      {/* Facebook Pixel Script - Simplified and reliable */}
      <Script
        id="facebook-pixel"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('init', '3805848799548541');
            fbq('track', 'PageView');
            
            console.log('Facebook Pixel loaded: 3805848799548541');
          `,
        }}
      />

      {/* Facebook Pixel - Alternative direct implementation */}
      <Script
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="beforeInteractive"
      />
      <Script
        id="facebook-pixel-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.fbq = window.fbq || function() {
              (window.fbq.queue = window.fbq.queue || []).push(arguments);
            };
            window.fbq.loaded = !0;
            window.fbq.version = '2.0';
            window.fbq.queue = [];
            
            if (!window._fbq) window._fbq = window.fbq;
            
            // Initialize Facebook Pixel
            window.fbq('init', '3805848799548541');
            window.fbq('track', 'PageView');
            
            // Debug log
            console.log('🚀 Facebook Pixel initialized with ID: 3805848799548541');
            
            // Make fbq globally accessible
            window.fbqReady = true;
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=3805848799548541&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      {/* Enhanced tracking initialization with Google Ads + GA4 Enhanced Ecommerce + Microsoft Clarity */}
      <Script
        id="tracking-initialization"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Initialize enhanced tracking
            window.trackingConfig = ${JSON.stringify(trackingConfig)};
            console.log('All tracking scripts initialized:', window.trackingConfig);
            
            // SHA-256 hashing utility for user data
            async function sha256(message) {
              const msgBuffer = new TextEncoder().encode(message);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              return hashHex;
            }

            // MICROSOFT CLARITY INTEGRATION FUNCTIONS
            window.trackClarityIdentify = function(userId, customSessionId, customPageId, friendlyName) {
              if (typeof clarity !== 'undefined') {
                try {
                  clarity.identify(
                    userId, 
                    customSessionId || null, 
                    customPageId || null, 
                    friendlyName || null
                  );
                  console.log('🔮 Clarity user identified:', userId, friendlyName);
                } catch (error) {
                  console.warn('Clarity identify error:', error);
                }
              }
            };

            window.trackClaritySetTag = function(key, value) {
              if (typeof clarity !== 'undefined') {
                try {
                  clarity.setTag(key, value);
                  console.log('🔮 Clarity tag set:', key, value);
                } catch (error) {
                  console.warn('Clarity setTag error:', error);
                }
              }
            };

            window.trackClarityEvent = function(eventName) {
              if (typeof clarity !== 'undefined') {
                try {
                  clarity.event(eventName);
                  console.log('🔮 Clarity event tracked:', eventName);
                } catch (error) {
                  console.warn('Clarity event error:', error);
                }
              }
            };

            window.trackClarityUpgrade = function(reason) {
              if (typeof clarity !== 'undefined') {
                try {
                  clarity.upgrade(reason);
                  console.log('🔮 Clarity session upgraded:', reason);
                } catch (error) {
                  console.warn('Clarity upgrade error:', error);
                }
              }
            };

            window.trackClarityConsent = function(hasConsent = true) {
              if (typeof clarity !== 'undefined') {
                try {
                  clarity.consent(hasConsent);
                  console.log('🔮 Clarity consent set:', hasConsent);
                } catch (error) {
                  console.warn('Clarity consent error:', error);
                }
              }
            };

            // UNIFIED TRACKING FUNCTIONS (Enhanced with Clarity)
            window.trackEcommerceEvent = function(eventType, data) {
              const { userId, userEmail, userPhone, firstName, lastName, orderId, items, value, currency } = data;

              // Set Clarity user identification
              if (userId || userEmail) {
                window.trackClarityIdentify(
                  userId || userEmail, 
                  orderId, 
                  window.location.pathname, 
                  firstName && lastName ? firstName + ' ' + lastName : firstName || lastName
                );
              }

              // Set Clarity tags for ecommerce events
              window.trackClaritySetTag('ecommerce_event', eventType);
              window.trackClaritySetTag('order_value', value ? value.toString() : '0');
              window.trackClaritySetTag('currency', currency || 'AED');
              if (orderId) window.trackClaritySetTag('order_id', orderId);
              if (items && items.length > 0) {
                window.trackClaritySetTag('product_categories', items.map(item => item.category || 'Coffee').join(','));
                window.trackClaritySetTag('product_count', items.length.toString());
              }

              // Track Clarity custom event
              window.trackClarityEvent('ecommerce_' + eventType);

              // Existing Google Ads, GA4, and Facebook tracking remains the same
              console.log('🔮 Enhanced ecommerce tracking with Clarity:', eventType, data);
            };

            window.trackCoffeePreferences = function(userId, preferences) {
              // Track coffee preferences in Clarity for behavioral analysis
              window.trackClarityIdentify(userId, null, null, null);
              window.trackClaritySetTag('coffee_roast_preference', preferences.roast || 'unknown');
              window.trackClaritySetTag('coffee_grind_preference', preferences.grind || 'unknown');
              window.trackClaritySetTag('coffee_origin_preference', preferences.origin || 'unknown');
              window.trackClaritySetTag('coffee_budget_range', preferences.budgetRange || 'unknown');
              window.trackClarityEvent('coffee_preferences_set');
              console.log('🔮 Coffee preferences tracked in Clarity:', preferences);
            };

            window.trackHighValueSession = function(reason, value) {
              // Upgrade Clarity session for high-value interactions
              window.trackClarityUpgrade('high_value_' + reason);
              window.trackClaritySetTag('high_value_reason', reason);
              window.trackClaritySetTag('session_value', value ? value.toString() : 'unknown');
              window.trackClarityEvent('high_value_session');
              console.log('🔮 High-value session tracked:', reason, value);
            };

            // ENHANCED GOOGLE ADS CONVERSIONS with User Data
            window.trackGoogleAdsEnhanced = async function(eventName, value, currency, userEmail, userPhone, userFirstName, userLastName) {
              if (typeof gtag !== 'undefined') {
                try {
                  // Prepare enhanced conversion data
                  const enhancedData = {
                    'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  };

                  // Add user data if provided (for Enhanced Conversions)
                  if (userEmail || userPhone || userFirstName || userLastName) {
                    const userData = {};
                    
                    if (userEmail) {
                      userData.email = await sha256(userEmail.toLowerCase().trim());
                    }
                    if (userPhone) {
                      // Clean phone number (remove spaces, dashes, etc.)
                      const cleanPhone = userPhone.replace(/[^+\\d]/g, '');
                      userData.phone_number = await sha256(cleanPhone);
                    }
                    if (userFirstName) {
                      userData.first_name = await sha256(userFirstName.toLowerCase().trim());
                    }
                    if (userLastName) {
                      userData.last_name = await sha256(userLastName.toLowerCase().trim());
                    }

                    enhancedData.user_data = userData;
                  }

                  // Send enhanced conversion
                  gtag('event', 'conversion', enhancedData);
                  console.log('Google Ads Enhanced Conversion tracked:', eventName, enhancedData);
                } catch (error) {
                  console.warn('Google Ads Enhanced Conversion error:', error);
                  // Fallback to regular conversion
                  gtag('event', 'conversion', {
                    'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  });
                }
              } else {
                console.warn('gtag not available for Google Ads Enhanced Conversion');
              }
            };

            // Google Ads Remarketing Events
            window.trackGoogleAdsRemarketing = function(eventName, customParameters = {}) {
              if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                  'send_to': 'AW-17214709280',
                  'custom_parameters': {
                    ...customParameters,
                    'ecomm_pagetype': eventName,
                    'ecomm_prodid': customParameters.product_id || '',
                    'ecomm_totalvalue': customParameters.value || 0
                  }
                });
                console.log('Google Ads Remarketing tracked:', eventName, customParameters);
              }
            };

            // UNIFIED Google Ads Tracking Functions (Enhanced with Clarity)
            window.trackGoogleAdsAddToCart = async function(item, value, currency, userEmail, userPhone, firstName, lastName) {
              if (typeof gtag !== 'undefined') {
                try {
                  // Prepare enhanced conversion data for Add to Cart
                  const enhancedData = {
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  };

                  // Add user data if provided (for Enhanced Conversions)
                  if (userEmail || userPhone || firstName || lastName) {
                    const userData = {};
                    
                    if (userEmail) {
                      userData.email = await sha256(userEmail.toLowerCase().trim());
                    }
                    if (userPhone) {
                      const cleanPhone = userPhone.replace(/[^+\\d]/g, '');
                      userData.phone_number = await sha256(cleanPhone);
                    }
                    if (firstName) {
                      userData.first_name = await sha256(firstName.toLowerCase().trim());
                    }
                    if (lastName) {
                      userData.last_name = await sha256(lastName.toLowerCase().trim());
                    }

                    enhancedData.user_data = userData;
                  }

                  // Use exact Google Ads event name for Add to Cart
                  gtag('event', 'conversion_event_add_to_cart', enhancedData);
                  console.log('Google Ads Add to Cart conversion tracked:', enhancedData);

                  // Enhanced Clarity tracking for add to cart
                  window.trackEcommerceEvent('add_to_cart', {
                    userId: userEmail,
                    userEmail,
                    userPhone,
                    firstName,
                    lastName,
                    items: [item],
                    value,
                    currency
                  });

                  // If high-value item, upgrade Clarity session
                  if (value > 100) {
                    window.trackHighValueSession('add_to_cart', value);
                  }

                } catch (error) {
                  console.warn('Google Ads Add to Cart error:', error);
                  // Fallback to simple event
                  gtag('event', 'conversion_event_add_to_cart', {
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  });
                }
                
                // Remarketing
                window.trackGoogleAdsRemarketing('add_to_cart', {
                  'product_id': item.id,
                  'product_name': item.name,
                  'category': item.category || 'Coffee',
                  'value': value,
                  'currency': currency || 'AED'
                });
              }
            };

            window.trackGoogleAdsBeginCheckout = async function(items, value, currency, userEmail, userPhone, firstName, lastName) {
              if (typeof gtag !== 'undefined') {
                try {
                  // Prepare enhanced conversion data for Begin Checkout
                  const enhancedData = {
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  };

                  // Add user data if provided (for Enhanced Conversions)
                  if (userEmail || userPhone || firstName || lastName) {
                    const userData = {};
                    
                    if (userEmail) {
                      userData.email = await sha256(userEmail.toLowerCase().trim());
                    }
                    if (userPhone) {
                      const cleanPhone = userPhone.replace(/[^+\\d]/g, '');
                      userData.phone_number = await sha256(cleanPhone);
                    }
                    if (firstName) {
                      userData.first_name = await sha256(firstName.toLowerCase().trim());
                    }
                    if (lastName) {
                      userData.last_name = await sha256(lastName.toLowerCase().trim());
                    }

                    enhancedData.user_data = userData;
                  }

                  // Use exact Google Ads event name for Begin Checkout
                  gtag('event', 'conversion_event_begin_checkout', enhancedData);
                  console.log('Google Ads Begin Checkout conversion tracked:', enhancedData);

                  // Enhanced Clarity tracking for checkout
                  window.trackEcommerceEvent('begin_checkout', {
                    userId: userEmail,
                    userEmail,
                    userPhone,
                    firstName,
                    lastName,
                    items,
                    value,
                    currency
                  });

                  // Always upgrade session for checkout events
                  window.trackHighValueSession('begin_checkout', value);

                } catch (error) {
                  console.warn('Google Ads Begin Checkout error:', error);
                  // Fallback to simple event
                  gtag('event', 'conversion_event_begin_checkout', {
                    'value': value || 1.0,
                    'currency': currency || 'AED'
                  });
                }
                
                // Remarketing
                window.trackGoogleAdsRemarketing('begin_checkout', {
                  'product_id': items.map(item => item.id).join(','),
                  'value': value,
                  'currency': currency || 'AED',
                  'num_items': items.length
                });
              }
            };

            window.trackGoogleAdsPurchase = async function(transactionId, items, value, currency, userEmail, userPhone, firstName, lastName) {
              if (typeof gtag !== 'undefined') {
                try {
                  // Prepare enhanced conversion data for Purchase with exact Google Ads format
                  const enhancedData = {
                    'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                    'value': value,
                    'currency': currency || 'AED',
                    'transaction_id': transactionId
                  };

                  // Add user data if provided (for Enhanced Conversions)
                  if (userEmail || userPhone || firstName || lastName) {
                    const userData = {};
                    
                    if (userEmail) {
                      userData.email = await sha256(userEmail.toLowerCase().trim());
                    }
                    if (userPhone) {
                      const cleanPhone = userPhone.replace(/[^+\\d]/g, '');
                      userData.phone_number = await sha256(cleanPhone);
                    }
                    if (firstName) {
                      userData.first_name = await sha256(firstName.toLowerCase().trim());
                    }
                    if (lastName) {
                      userData.last_name = await sha256(lastName.toLowerCase().trim());
                    }

                    enhancedData.user_data = userData;
                  }

                  // Use exact Google Ads conversion event for Purchase
                  gtag('event', 'conversion', enhancedData);
                  console.log('Google Ads Purchase conversion tracked:', enhancedData);

                  // Enhanced Clarity tracking for purchase
                  window.trackEcommerceEvent('purchase', {
                    userId: userEmail,
                    userEmail,
                    userPhone,
                    firstName,
                    lastName,
                    orderId: transactionId,
                    items,
                    value,
                    currency
                  });

                  // Always upgrade session for purchases
                  window.trackHighValueSession('purchase', value);

                } catch (error) {
                  console.warn('Google Ads Purchase error:', error);
                  // Fallback to simple purchase conversion
                  gtag('event', 'conversion', {
                    'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                    'value': value,
                    'currency': currency || 'AED',
                    'transaction_id': transactionId
                  });
                }
                
                // Remarketing
                window.trackGoogleAdsRemarketing('purchase', {
                  'product_id': items.map(item => item.id).join(','),
                  'value': value,
                  'currency': currency || 'AED',
                  'transaction_id': transactionId,
                  'num_items': items.length
                });
              }
            };

            // Helper function for delayed navigation (as provided by Google Ads)
            window.gtagSendEvent = function(url) {
              var callback = function () {
                if (typeof url === 'string') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion_event_add_to_cart', {
                'event_callback': callback,
                'event_timeout': 2000
              });
              return false;
            };

            // Google Ads View Item for Remarketing (Enhanced with Clarity)
            window.trackGoogleAdsViewItem = function(item, value, currency) {
              window.trackGoogleAdsRemarketing('view_item', {
                'product_id': item.id,
                'product_name': item.name,
                'category': item.category || 'Coffee',
                'value': value || item.price,
                'currency': currency || 'AED'
              });

              // Enhanced Clarity tracking for product views
              window.trackClaritySetTag('viewed_product_id', item.id);
              window.trackClaritySetTag('viewed_product_category', item.category || 'Coffee');
              window.trackClaritySetTag('viewed_product_price', (value || item.price).toString());
              window.trackClarityEvent('product_view');
            };

            // Google Ads Page View for Remarketing
            window.trackGoogleAdsPageView = function(pageType = 'other') {
              window.trackGoogleAdsRemarketing('page_view', {
                'ecomm_pagetype': pageType,
                'page_url': window.location.href,
                'page_title': document.title
              });

              // Set Clarity tags for page view
              window.trackClaritySetTag('page_type', pageType);
              window.trackClaritySetTag('page_url', window.location.href);
              window.trackClarityEvent('page_view_' + pageType);
            };

            // Enhanced GA4 Ecommerce Tracking Functions (Enhanced with Clarity)
            window.trackGA4AddToCart = function(item, value, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'add_to_cart', {
                  currency: currency || 'AED',
                  value: value || item.price,
                  items: [{
                    item_id: item.id,
                    item_name: item.name,
                    category: item.category || 'Coffee',
                    quantity: item.quantity || 1,
                    price: item.price,
                    item_brand: 'Green Roasteries',
                    item_variant: item.variation || 'Standard'
                  }]
                });
                console.log('GA4 Add to Cart tracked:', item.name, value);
              }
            };

            window.trackGA4BeginCheckout = function(items, value, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                  currency: currency || 'AED',
                  value: value,
                  items: items.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    category: item.category || 'Coffee',
                    quantity: item.quantity || 1,
                    price: item.price,
                    item_brand: 'Green Roasteries',
                    item_variant: item.variation || 'Standard'
                  }))
                });
                console.log('GA4 Begin Checkout tracked:', items.length, 'items, value:', value);
              }
            };

            window.trackGA4Purchase = function(transactionId, items, value, currency, shipping, tax) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                  transaction_id: transactionId,
                  currency: currency || 'AED',
                  value: value,
                  shipping: shipping || 0,
                  tax: tax || 0,
                  items: items.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    category: item.category || 'Coffee',
                    quantity: item.quantity || 1,
                    price: item.price,
                    item_brand: 'Green Roasteries',
                    item_variant: item.variation || 'Standard'
                  })),
                  // Enhanced parameters
                  event_category: 'ecommerce',
                  event_label: 'purchase_completed',
                  custom_parameters: {
                    store_name: 'Green Roasteries',
                    payment_type: 'online',
                    customer_type: 'web'
                  }
                });
                console.log('GA4 Enhanced Purchase tracked:', transactionId, 'Value:', value, 'Items:', items.length);
              }
            };

            window.trackGA4ViewItem = function(item, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'view_item', {
                  currency: currency || 'AED',
                  value: item.price,
                  items: [{
                    item_id: item.id,
                    item_name: item.name,
                    category: item.category || 'Coffee',
                    price: item.price,
                    item_brand: 'Green Roasteries',
                    item_variant: item.variation || 'Standard'
                  }]
                });
              }
            };

            // UNIFIED Facebook Tracking Functions (Pixel + Conversions API) - Enhanced with Clarity
            window.trackFacebookEvent = function(eventName, eventData = {}) {
              // Facebook Pixel (Client-side)
              if (typeof fbq !== 'undefined') {
                fbq('track', eventName, eventData);
                console.log('Facebook Pixel tracked:', eventName, eventData);
              }

              // Facebook Conversions API (Server-side)
              fetch('/api/tracking/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_name: eventName, // Already in correct PascalCase
                  event_time: Math.floor(Date.now() / 1000),
                  action_source: 'website',
                  event_source_url: window.location.href,
                  user_data: {
                    client_ip_address: undefined, // Will be set server-side
                    client_user_agent: navigator.userAgent,
                    fbp: document.cookie.match(/_fbp=([^;]*)/)?.[1],
                    fbc: document.cookie.match(/_fbc=([^;]*)/)?.[1]
                  },
                  custom_data: eventData,
                  event_id: eventName.toLowerCase() + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                })
              }).then(response => response.json())
                .then(result => console.log('Facebook Conversions API tracked:', eventName, result))
                .catch(error => console.warn('Facebook Conversions API error:', error));
            };

            // Simplified Facebook Add to Cart
            window.trackFacebookAddToCart = function(item, value, currency) {
              window.trackFacebookEvent('AddToCart', {
                value: value || item.price,
                currency: currency || 'AED',
                content_ids: [item.id],
                content_name: item.name,
                content_type: 'product',
                content_category: item.category || 'Coffee'
              });
            };

            // Simplified Facebook Begin Checkout
            window.trackFacebookBeginCheckout = function(items, value, currency) {
              window.trackFacebookEvent('InitiateCheckout', {
                value: value,
                currency: currency || 'AED',
                content_ids: items.map(item => item.id),
                content_type: 'product',
                num_items: items.length
              });
            };

            // Simplified Facebook Purchase
            window.trackFacebookPurchase = function(transactionId, items, value, currency, userEmail) {
              window.trackFacebookEvent('Purchase', {
                value: value,
                currency: currency || 'AED',
                content_ids: items.map(item => item.id),
                content_type: 'product',
                order_id: transactionId,
                num_items: items.length
              });
            };

            window.trackFacebookAddPaymentInfo = function(value, currency) {
              // Facebook Pixel
              if (typeof fbq !== 'undefined') {
                fbq('track', 'AddPaymentInfo', {
                  value: value,
                  currency: currency || 'AED'
                });
                console.log('Facebook Pixel Add Payment Info tracked:', value);
              }

              // Facebook Conversions API (Server-side)
              fetch('/api/tracking/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_name: 'AddPaymentInfo',
                  event_time: Math.floor(Date.now() / 1000),
                  action_source: 'website',
                  event_source_url: window.location.href,
                  user_data: {
                    client_ip_address: undefined, // Will be set server-side
                    client_user_agent: navigator.userAgent,
                    fbp: document.cookie.match(/_fbp=([^;]*)/)?.[1],
                    fbc: document.cookie.match(/_fbc=([^;]*)/)?.[1]
                  },
                  custom_data: {
                    value: value,
                    currency: currency || 'AED'
                  },
                  event_id: 'add_payment_info_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                })
              }).then(response => response.json())
                .then(result => console.log('Facebook Conversions API Add Payment Info:', result))
                .catch(error => console.warn('Facebook Conversions API error:', error));
            };
          `,
        }}
      />
    </>
  );
} 