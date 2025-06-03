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

// Enhanced tracking function that sends to database
export async function trackEcommerceEvent(
  eventName: string,
  parameters: {
    sessionId?: string;
    userId?: string;
    transactionId?: string;
    value?: number;
    currency?: string;
    items?: EcommerceItem[];
    eventData?: any;
    pageUrl?: string;
    pageTitle?: string;
    conversionType?: string;
  } = {}
) {
  try {
    // Generate session ID if not provided
    const sessionId = parameters.sessionId || generateSessionId();
    
    // Determine event type based on event name
    const eventTypeMap: { [key: string]: string } = {
      'page_view': 'PAGE_VIEW',
      'view_item': 'VIEW_ITEM',
      'add_to_cart': 'ADD_TO_CART',
      'remove_from_cart': 'REMOVE_FROM_CART',
      'begin_checkout': 'BEGIN_CHECKOUT',
      'add_payment_info': 'ADD_PAYMENT_INFO',
      'purchase': 'PURCHASE',
      'search': 'SEARCH',
      'sign_up': 'SIGN_UP',
      'login': 'LOGIN',
      'share': 'SHARE',
      'click': 'CLICK',
      'form_submit': 'FORM_SUBMIT'
    };

    const eventType = eventTypeMap[eventName.toLowerCase()] || 'CUSTOM';

    // Send to database first
    const trackingData = {
      sessionId,
      userId: parameters.userId,
      eventName: eventName.toLowerCase(),
      eventType,
      platform: 'GA4',
      eventData: parameters.eventData || {},
      pageUrl: parameters.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      pageTitle: parameters.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      transactionId: parameters.transactionId,
      value: parameters.value,
      currency: parameters.currency || 'AED',
      items: parameters.items || [],
      conversionType: parameters.conversionType,
      clientTimestamp: new Date().toISOString()
    };

    // Send to backend API
    const response = await fetch('/api/tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData)
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to track event:', result.error);
    }

    // Store session ID for future use
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tracking_session_id', sessionId);
    }

    return result;

  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error: String(error) };
  }
}

// Generate or retrieve session ID
function generateSessionId(): string {
  if (typeof localStorage !== 'undefined') {
    const existing = localStorage.getItem('tracking_session_id');
    if (existing) return existing;
  }
  
  // Generate new session ID
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tracking_session_id', sessionId);
  }
  
  return sessionId;
}

// Enhanced page view tracking
export function trackPageView(pageUrl?: string, pageTitle?: string, userId?: string) {
  return trackEcommerceEvent('page_view', {
    pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    pageTitle: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    userId,
    eventData: {
      page_location: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      page_referrer: typeof document !== 'undefined' ? document.referrer : ''
    }
  });
}

// Enhanced purchase tracking
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = 'AED',
  items: EcommerceItem[],
  userId?: string
) {
  return trackEcommerceEvent('purchase', {
    transactionId,
    value,
    currency,
    items,
    userId,
    conversionType: 'purchase',
    eventData: {
      transaction_id: transactionId,
      value,
      currency,
      items,
      item_count: items.length
    }
  });
}

// Enhanced add to cart tracking
export function trackAddToCart(
  item: EcommerceItem,
  value?: number,
  currency: string = 'AED',
  userId?: string
) {
  return trackEcommerceEvent('add_to_cart', {
    value,
    currency,
    items: [item],
    userId,
    eventData: {
      currency,
      value,
      items: [item]
    }
  });
}

// Enhanced checkout tracking
export function trackBeginCheckout(
  value: number,
  currency: string = 'AED',
  items: EcommerceItem[],
  userId?: string
) {
  return trackEcommerceEvent('begin_checkout', {
    value,
    currency,
    items,
    userId,
    eventData: {
      currency,
      value,
      items,
      coupon: '' // Can be added if applicable
    }
  });
}

// Custom event tracking
export function trackCustomEvent(
  eventName: string,
  parameters: any = {},
  userId?: string
) {
  return trackEcommerceEvent(eventName, {
    userId,
    eventData: parameters,
    value: parameters.value,
    currency: parameters.currency,
    conversionType: 'custom'
  });
}

// User identification
export function identifyUser(userId: string, userProperties: any = {}) {
  return trackEcommerceEvent('user_identify', {
    userId,
    eventData: {
      user_id: userId,
      user_properties: userProperties
    }
  });
}

// Search tracking
export function trackSearch(searchTerm: string, userId?: string) {
  return trackEcommerceEvent('search', {
    userId,
    eventData: {
      search_term: searchTerm
    }
  });
}

// View item tracking
export function trackViewItem(
  item: EcommerceItem,
  value?: number,
  currency: string = 'AED',
  userId?: string
) {
  return trackEcommerceEvent('view_item', {
    value,
    currency,
    items: [item],
    userId,
    eventData: {
      currency,
      value,
      items: [item]
    }
  });
}

// Form submission tracking
export function trackFormSubmit(
  formName: string,
  formData: any = {},
  userId?: string
) {
  return trackEcommerceEvent('form_submit', {
    userId,
    eventData: {
      form_name: formName,
      form_data: formData
    }
  });
}

// Button click tracking
export function trackButtonClick(
  buttonName: string,
  buttonData: any = {},
  userId?: string
) {
  return trackEcommerceEvent('click', {
    userId,
    eventData: {
      button_name: buttonName,
      button_data: buttonData
    }
  });
}

// Enhanced error tracking
export function trackError(
  errorMessage: string,
  errorStack?: string,
  userId?: string
) {
  return trackEcommerceEvent('error', {
    userId,
    eventData: {
      error_message: errorMessage,
      error_stack: errorStack
    }
  });
}

// Video tracking
export function trackVideoPlay(videoId: string, videoTitle?: string, userId?: string) {
  return trackEcommerceEvent('video_play', {
    userId,
    eventData: {
      video_id: videoId,
      video_title: videoTitle
    }
  });
}

export function trackVideoComplete(videoId: string, videoTitle?: string, userId?: string) {
  return trackEcommerceEvent('video_complete', {
    userId,
    eventData: {
      video_id: videoId,
      video_title: videoTitle
    }
  });
}

// Download tracking
export function trackDownload(fileName: string, fileUrl: string, userId?: string) {
  return trackEcommerceEvent('download', {
    userId,
    eventData: {
      file_name: fileName,
      file_url: fileUrl
    }
  });
}

// Share tracking
export function trackShare(
  contentId: string,
  contentType: string,
  method: string,
  userId?: string
) {
  return trackEcommerceEvent('share', {
    userId,
    eventData: {
      content_id: contentId,
      content_type: contentType,
      method
    }
  });
}

// Newsletter subscription tracking
export function trackNewsletterSignup(email: string, source?: string) {
  return trackEcommerceEvent('newsletter_signup', {
    eventData: {
      email,
      source: source || 'website'
    }
  });
}

// Contact form tracking
export function trackContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  return trackEcommerceEvent('contact_form', {
    eventData: {
      name,
      email,
      subject,
      message
    }
  });
}

// Session management
export function getSessionId(): string {
  return generateSessionId();
}

export function clearSession() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('tracking_session_id');
  }
}

// Enhanced analytics helper
export async function getAnalytics(
  type: 'overview' | 'events' | 'sessions' | 'conversions' | 'realtime' = 'overview',
  startDate?: string,
  endDate?: string,
  period: '1d' | '7d' | '30d' | '90d' = '7d'
) {
  try {
    const params = new URLSearchParams({
      type,
      period
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/tracking/analytics?${params}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

// Type declarations for global objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
} 