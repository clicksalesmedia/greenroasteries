'use client';

import { useEffect } from 'react';
import Script from 'next/script';

// Facebook Pixel ID for Green Roasteries
const FACEBOOK_PIXEL_ID = '3805848799548541';

// Product Data Interface
interface ProductData {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  brand?: string;
  variation?: {
    size?: string;
    grind?: string;
    roast?: string;
    beans?: string;
  };
}

// Order Data Interface
interface OrderData {
  orderId: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  currency: string;
  items: ProductData[];
  paymentMethod: string;
  promotionCode?: string;
  isNewCustomer?: boolean;
}

// User Data Interface
interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

// Facebook Pixel Tracker Component
export default function FacebookPixelTracker() {
  return (
    <>
      {/* Facebook Pixel Script */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FACEBOOK_PIXEL_ID}');
            fbq('track', 'PageView');
            console.log('📱 Facebook Pixel initialized: ${FACEBOOK_PIXEL_ID}');
          `,
        }}
      />

      {/* Facebook Pixel NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          alt="Facebook Pixel"
        />
      </noscript>
    </>
  );
}

// Facebook Pixel Tracking Functions
export const FacebookPixelEvents = {
  // Track View Content (product page visits)
  trackViewContent: (product: ProductData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_ids: [product.id],
        content_type: 'product',
        content_name: product.name,
        content_category: product.category || 'Coffee',
        value: product.price,
        currency: 'AED'
      });
      console.log('📱 Facebook Pixel: ViewContent tracked', product.name);
    }
  },

  // Track Add to Cart
  trackAddToCart: (product: ProductData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_type: 'product',
        content_name: product.name,
        content_category: product.category || 'Coffee',
        value: product.price * (product.quantity || 1),
        currency: 'AED'
      });
      console.log('📱 Facebook Pixel: AddToCart tracked', product.name);
    }
  },

  // Track Initiate Checkout
  trackInitiateCheckout: (order: OrderData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_ids: order.items.map(item => item.id),
        content_type: 'product',
        value: order.total,
        currency: order.currency,
        num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      });
      console.log('📱 Facebook Pixel: InitiateCheckout tracked', order.total);
    }
  },

  // Track Add Payment Info
  trackAddPaymentInfo: (order: OrderData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddPaymentInfo', {
        content_ids: order.items.map(item => item.id),
        content_type: 'product',
        value: order.total,
        currency: order.currency,
        num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      });
      console.log('📱 Facebook Pixel: AddPaymentInfo tracked', order.total);
    }
  },

  // Track Purchase (for client-side confirmation)
  trackPurchase: (order: OrderData, user: UserData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        content_ids: order.items.map(item => item.id),
        content_type: 'product',
        value: order.total,
        currency: order.currency,
        num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
        contents: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity || 1,
          item_price: item.price
        }))
      });
      console.log('📱 Facebook Pixel: Purchase tracked', order.orderId);
    }
  },

  // Track Lead (newsletter signup, contact form)
  trackLead: (leadType: 'newsletter' | 'contact', user: UserData) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: leadType === 'newsletter' ? 'Newsletter Signup' : 'Contact Form',
        content_category: leadType
      });
      console.log('📱 Facebook Pixel: Lead tracked', leadType);
    }
  },

  // Track Search
  trackSearch: (searchTerm: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Search', {
        search_string: searchTerm,
        content_type: 'product',
        content_category: 'Coffee'
      });
      console.log('📱 Facebook Pixel: Search tracked', searchTerm);
    }
  },

  // Track Custom Event
  trackCustomEvent: (eventName: string, eventData: any) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, eventData);
      console.log('📱 Facebook Pixel: Custom event tracked', eventName);
    }
  }
};

// Hook for easy tracking in components
export const useFacebookPixel = () => {
  return FacebookPixelEvents;
}; 