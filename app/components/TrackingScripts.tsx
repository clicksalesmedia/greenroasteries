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
    serverSideTracking: { enabled: true, facebookConversionsApi: false, googleConversionsApi: true, status: 'active' }
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
            gtag('config', 'AW-17214709280');
            console.log('Google Ads script loaded: AW-17214709280');
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

      {/* Facebook Pixel Script - Fixed with error handling */}
      <Script
        id="facebook-pixel"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              // Initialize with error handling
              if (typeof fbq !== 'undefined') {
                fbq('init', '3805848799548541');
                fbq('track', 'PageView');
                console.log('Facebook Pixel loaded successfully: 3805848799548541');
              }
            } catch (error) {
              console.warn('Facebook Pixel failed to load (non-critical):', error);
              // Create fallback fbq function to prevent errors
              window.fbq = function() { 
                console.log('FB Pixel fallback called:', arguments); 
              };
            }
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

      {/* Enhanced tracking initialization with Google Ads + GA4 Enhanced Ecommerce */}
      <Script
        id="tracking-initialization"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Initialize enhanced tracking
            window.trackingConfig = ${JSON.stringify(trackingConfig)};
            console.log('All tracking scripts initialized:', window.trackingConfig);
            
            // Google Ads Conversion Tracking Functions
            window.trackGoogleAdsAddToCart = function(value, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'conversion_event_add_to_cart', {
                  'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                  'value': value || 1.0,
                  'currency': currency || 'AED'
                });
                console.log('Google Ads Add to Cart conversion tracked:', value, currency);
              } else {
                console.warn('gtag not available for Google Ads Add to Cart conversion');
              }
            };
            
            window.trackGoogleAdsBeginCheckout = function(value, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'conversion_event_begin_checkout', {
                  'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                  'value': value || 1.0,
                  'currency': currency || 'AED'
                });
                console.log('Google Ads Begin Checkout conversion tracked:', value, currency);
              } else {
                console.warn('gtag not available for Google Ads Begin Checkout conversion');
              }
            };
            
            window.trackGoogleAdsPurchase = function(transactionId, value, currency) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'conversion', {
                  'send_to': 'AW-17214709280/rRb1CIv4r-waEKC8zpBA',
                  'value': value || 1.0,
                  'currency': currency || 'AED',
                  'transaction_id': transactionId || ''
                });
                console.log('Google Ads Purchase conversion tracked:', transactionId, value, currency);
              } else {
                console.warn('gtag not available for Google Ads Purchase conversion');
              }
            };

            // Enhanced GA4 Ecommerce Tracking Functions
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

            // Enhanced Facebook/Meta Tracking Functions (Pixel + Conversions API)
            window.trackFacebookAddToCart = function(item, value, currency) {
              // Facebook Pixel
              if (typeof fbq !== 'undefined') {
                fbq('track', 'AddToCart', {
                  value: value || item.price,
                  currency: currency || 'AED',
                  content_ids: [item.id],
                  content_name: item.name,
                  content_type: 'product',
                  content_category: item.category || 'Coffee'
                });
                console.log('Facebook Pixel Add to Cart tracked:', item.name, value);
              }

              // Facebook Conversions API (Server-side)
              fetch('/api/tracking/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_name: 'AddToCart',
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
                    value: value || item.price,
                    currency: currency || 'AED',
                    content_ids: [item.id],
                    content_name: item.name,
                    content_type: 'product',
                    content_category: item.category || 'Coffee'
                  },
                  event_id: 'add_to_cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                })
              }).then(response => response.json())
                .then(result => console.log('Facebook Conversions API Add to Cart:', result))
                .catch(error => console.warn('Facebook Conversions API error:', error));
            };

            window.trackFacebookBeginCheckout = function(items, value, currency) {
              const content_ids = items.map(item => item.id);
              
              // Facebook Pixel
              if (typeof fbq !== 'undefined') {
                fbq('track', 'InitiateCheckout', {
                  value: value,
                  currency: currency || 'AED',
                  content_ids: content_ids,
                  content_type: 'product',
                  num_items: items.length
                });
                console.log('Facebook Pixel Begin Checkout tracked:', items.length, 'items, value:', value);
              }

              // Facebook Conversions API (Server-side)
              fetch('/api/tracking/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_name: 'InitiateCheckout',
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
                    currency: currency || 'AED',
                    content_ids: content_ids,
                    content_type: 'product',
                    num_items: items.length
                  },
                  event_id: 'begin_checkout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                })
              }).then(response => response.json())
                .then(result => console.log('Facebook Conversions API Begin Checkout:', result))
                .catch(error => console.warn('Facebook Conversions API error:', error));
            };

            window.trackFacebookPurchase = function(transactionId, items, value, currency, userEmail) {
              const content_ids = items.map(item => item.id);
              
              // Facebook Pixel
              if (typeof fbq !== 'undefined') {
                fbq('track', 'Purchase', {
                  value: value,
                  currency: currency || 'AED',
                  content_ids: content_ids,
                  content_type: 'product',
                  order_id: transactionId,
                  num_items: items.length
                });
                console.log('Facebook Pixel Purchase tracked:', transactionId, 'Value:', value);
              }

              // Facebook Conversions API (Server-side) - CRITICAL FOR MISSING PURCHASE EVENTS
              fetch('/api/tracking/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_name: 'Purchase',
                  event_time: Math.floor(Date.now() / 1000),
                  action_source: 'website',
                  event_source_url: window.location.href,
                  user_data: {
                    email: userEmail, // Will be hashed server-side
                    client_ip_address: undefined, // Will be set server-side
                    client_user_agent: navigator.userAgent,
                    fbp: document.cookie.match(/_fbp=([^;]*)/)?.[1],
                    fbc: document.cookie.match(/_fbc=([^;]*)/)?.[1]
                  },
                  custom_data: {
                    value: value,
                    currency: currency || 'AED',
                    content_ids: content_ids,
                    content_type: 'product',
                    order_id: transactionId,
                    num_items: items.length
                  },
                  event_id: 'purchase_' + transactionId + '_' + Date.now()
                })
              }).then(response => response.json())
                .then(result => console.log('Facebook Conversions API Purchase:', result))
                .catch(error => console.warn('Facebook Conversions API error:', error));
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