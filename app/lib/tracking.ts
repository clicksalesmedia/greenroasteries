export interface EcommerceItem {
  item_id: string;
  item_name: string;
  category?: string;
  quantity: number;
  price: number;
  brand?: string;
  variant?: string;
}

export interface EcommerceEvent {
  event_name: string;
  transaction_id?: string;
  value?: number;
  currency?: string;
  items?: EcommerceItem[];
  coupon?: string;
  shipping?: number;
  tax?: number;
}

export interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

// Google Analytics 4 Helper Functions
export const GA4 = {
  // Track page view
  pageView: (page_title?: string, page_location?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title,
        page_location: page_location || window.location.href
      });
    }
  },

  // Track purchase event
  purchase: (transactionData: EcommerceEvent) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionData.transaction_id,
        value: transactionData.value,
        currency: transactionData.currency || 'AED',
        items: transactionData.items,
        coupon: transactionData.coupon,
        shipping: transactionData.shipping,
        tax: transactionData.tax
      });
    }
  },

  // Track add to cart event
  addToCart: (item: EcommerceItem, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'AED',
        value: value || item.price * item.quantity,
        items: [item]
      });
    }
  },

  // Track begin checkout event
  beginCheckout: (items: EcommerceItem[], value: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency,
        value,
        items
      });
    }
  },

  // Track custom event
  customEvent: (eventName: string, parameters: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }
};

// Facebook Pixel Helper Functions
export const FacebookPixel = {
  // Track page view
  pageView: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  },

  // Track purchase event
  purchase: (value: number, currency = 'AED', contentIds: string[] = []) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value,
        currency,
        content_ids: contentIds,
        content_type: 'product'
      });
    }
  },

  // Track add to cart event
  addToCart: (value: number, currency = 'AED', contentIds: string[] = []) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        value,
        currency,
        content_ids: contentIds,
        content_type: 'product'
      });
    }
  },

  // Track initiate checkout event
  initiateCheckout: (value: number, currency = 'AED', contentIds: string[] = []) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value,
        currency,
        content_ids: contentIds,
        content_type: 'product'
      });
    }
  },

  // Track lead event
  lead: (value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        value,
        currency
      });
    }
  },

  // Track custom event
  customEvent: (eventName: string, parameters: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  }
};

// Google Ads Helper Functions
export const GoogleAds = {
  // Track conversion
  conversion: (conversionLabel: string, value?: number, currency = 'AED', transactionId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
      if (conversionId) {
        window.gtag('event', 'conversion', {
          send_to: `${conversionId}/${conversionLabel}`,
          value,
          currency,
          transaction_id: transactionId
        });
      }
    }
  },

  // Track purchase conversion
  purchaseConversion: (value: number, transactionId: string, currency = 'AED') => {
    const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
    if (conversionLabel) {
      GoogleAds.conversion(conversionLabel, value, currency, transactionId);
    }
  }
};

// Server-side tracking functions
export const ServerSideTracking = {
  // Send Facebook Conversion API event
  sendFacebookEvent: async (eventData: {
    event_name: string;
    user_data?: UserData;
    custom_data?: {
      value?: number;
      currency?: string;
      content_ids?: string[];
      order_id?: string;
    };
    event_source_url?: string;
  }) => {
    try {
      const response = await fetch('/api/tracking/facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_name: eventData.event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: eventData.event_source_url || window.location.href,
          user_data: eventData.user_data,
          custom_data: eventData.custom_data,
          event_id: crypto.randomUUID()
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending Facebook conversion event:', error);
      return { success: false, error };
    }
  },

  // Send Google Conversion API event
  sendGoogleEvent: async (conversionData: {
    conversion_action: string;
    conversion_value?: number;
    currency_code?: string;
    order_id?: string;
    user_data?: UserData;
    method?: 'ga4' | 'ads';
  }) => {
    try {
      const response = await fetch('/api/tracking/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: conversionData.method || 'ga4',
          conversion_action: conversionData.conversion_action,
          conversion_date_time: new Date().toISOString(),
          conversion_value: conversionData.conversion_value,
          currency_code: conversionData.currency_code || 'AED',
          order_id: conversionData.order_id,
          user_data: conversionData.user_data
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending Google conversion event:', error);
      return { success: false, error };
    }
  }
};

// Comprehensive tracking function for e-commerce events
export const trackEcommerceEvent = async (
  eventType: 'page_view' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  data: {
    items?: EcommerceItem[];
    value?: number;
    currency?: string;
    transaction_id?: string;
    user_data?: UserData;
    page_title?: string;
    enableServerSide?: boolean;
  }
) => {
  const { items = [], value = 0, currency = 'AED', transaction_id, user_data, page_title, enableServerSide = false } = data;

  switch (eventType) {
    case 'page_view':
      GA4.pageView(page_title);
      FacebookPixel.pageView();
      break;

    case 'add_to_cart':
      if (items.length > 0) {
        GA4.addToCart(items[0], value);
        FacebookPixel.addToCart(value, currency, items.map(item => item.item_id));
        
        if (enableServerSide && user_data) {
          await ServerSideTracking.sendFacebookEvent({
            event_name: 'AddToCart',
            user_data,
            custom_data: {
              value,
              currency,
              content_ids: items.map(item => item.item_id)
            }
          });
        }
      }
      break;

    case 'begin_checkout':
      GA4.beginCheckout(items, value, currency);
      FacebookPixel.initiateCheckout(value, currency, items.map(item => item.item_id));
      
      if (enableServerSide && user_data) {
        await ServerSideTracking.sendFacebookEvent({
          event_name: 'InitiateCheckout',
          user_data,
          custom_data: {
            value,
            currency,
            content_ids: items.map(item => item.item_id)
          }
        });
      }
      break;

    case 'purchase':
      GA4.purchase({ event_name: 'purchase', transaction_id, value, currency, items });
      FacebookPixel.purchase(value, currency, items.map(item => item.item_id));
      GoogleAds.purchaseConversion(value, transaction_id || '', currency);
      
      if (enableServerSide) {
        // Send to Facebook Conversions API
        if (user_data) {
          await ServerSideTracking.sendFacebookEvent({
            event_name: 'Purchase',
            user_data,
            custom_data: {
              value,
              currency,
              content_ids: items.map(item => item.item_id),
              order_id: transaction_id
            }
          });
        }

        // Send to Google Conversions API
        await ServerSideTracking.sendGoogleEvent({
          conversion_action: 'purchase',
          conversion_value: value,
          currency_code: currency,
          order_id: transaction_id,
          user_data,
          method: 'ga4'
        });
      }
      break;
  }
};

// Type declarations for global objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
} 