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

  // Track view item event
  viewItem: (item: EcommerceItem, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency,
        value: item.price,
        items: [item]
      });
    }
  },

  // Track view item list event
  viewItemList: (items: EcommerceItem[], listName?: string, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item_list', {
        currency,
        item_list_name: listName,
        items
      });
    }
  },

  // Track add to wishlist event
  addToWishlist: (item: EcommerceItem, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_wishlist', {
        currency,
        value: item.price,
        items: [item]
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

  // Track remove from cart event
  removeFromCart: (item: EcommerceItem, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remove_from_cart', {
        currency,
        value: item.price * item.quantity,
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

  // Track add shipping info event
  addShippingInfo: (items: EcommerceItem[], value: number, currency = 'AED', shippingTier?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_shipping_info', {
        currency,
        value,
        items,
        shipping_tier: shippingTier
      });
    }
  },

  // Track add payment info event
  addPaymentInfo: (items: EcommerceItem[], value: number, currency = 'AED', paymentType?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_payment_info', {
        currency,
        value,
        items,
        payment_type: paymentType
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

  // Track search event
  search: (searchTerm: string, searchResults?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        search_results: searchResults
      });
    }
  },

  // Track sign up event
  signUp: (method?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method
      });
    }
  },

  // Track login event
  login: (method?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'login', {
        method
      });
    }
  },

  // Track share event
  share: (contentType?: string, itemId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        content_type: contentType,
        item_id: itemId
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

  // Track view content event
  viewContent: (contentId?: string, contentType = 'product', value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: contentId ? [contentId] : [],
        content_type: contentType,
        value,
        currency
      });
    }
  },

  // Track add to wishlist event
  addToWishlist: (contentId?: string, value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToWishlist', {
        content_ids: contentId ? [contentId] : [],
        value,
        currency
      });
    }
  },

  // Track purchase event
  purchase: (value: number, currency = 'AED', contentIds: string[] = [], orderId?: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value,
        currency,
        content_ids: contentIds,
        content_type: 'product',
        order_id: orderId
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

  // Track add payment info event
  addPaymentInfo: (value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddPaymentInfo', {
        value,
        currency
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

  // Track contact event
  contact: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact');
    }
  },

  // Track search event
  search: (searchString: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchString
      });
    }
  },

  // Track complete registration event
  completeRegistration: (value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        value,
        currency
      });
    }
  },

  // Track subscribe event
  subscribe: (value?: number, currency = 'AED') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Subscribe', {
        value,
        currency
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
      content_name?: string;
      content_category?: string;
      search_string?: string;
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
          event_source_url: eventData.event_source_url || (typeof window !== 'undefined' ? window.location.href : ''),
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
  },

  // Unified event tracking for all platforms
  trackEvent: async (eventName: string, eventData: {
    items?: EcommerceItem[];
    value?: number;
    currency?: string;
    transaction_id?: string;
    user_data?: UserData;
    search_term?: string;
    content_name?: string;
    content_category?: string;
    enableServerSide?: boolean;
  }) => {
    const promises = [];

    // Client-side tracking
    if (typeof window !== 'undefined') {
      // Facebook Pixel
      switch (eventName) {
        case 'page_view':
          FacebookPixel.pageView();
          break;
        case 'view_content':
          FacebookPixel.viewContent(
            eventData.items?.[0]?.item_id,
            'product',
            eventData.value,
            eventData.currency
          );
          break;
        case 'add_to_cart':
          FacebookPixel.addToCart(
            eventData.value || 0,
            eventData.currency,
            eventData.items?.map(item => item.item_id) || []
          );
          break;
        case 'add_to_wishlist':
          FacebookPixel.addToWishlist(
            eventData.items?.[0]?.item_id,
            eventData.value,
            eventData.currency
          );
          break;
        case 'initiate_checkout':
          FacebookPixel.initiateCheckout(
            eventData.value || 0,
            eventData.currency,
            eventData.items?.map(item => item.item_id) || []
          );
          break;
        case 'add_payment_info':
          FacebookPixel.addPaymentInfo(eventData.value, eventData.currency);
          break;
        case 'purchase':
          FacebookPixel.purchase(
            eventData.value || 0,
            eventData.currency,
            eventData.items?.map(item => item.item_id) || [],
            eventData.transaction_id
          );
          break;
        case 'search':
          FacebookPixel.search(eventData.search_term || '');
          break;
        case 'complete_registration':
          FacebookPixel.completeRegistration(eventData.value, eventData.currency);
          break;
        case 'contact':
          FacebookPixel.contact();
          break;
        case 'subscribe':
          FacebookPixel.subscribe(eventData.value, eventData.currency);
          break;
      }

      // Google Analytics 4
      switch (eventName) {
        case 'page_view':
          GA4.pageView();
          break;
        case 'view_item':
          if (eventData.items?.[0]) {
            GA4.viewItem(eventData.items[0], eventData.currency);
          }
          break;
        case 'view_item_list':
          if (eventData.items) {
            GA4.viewItemList(eventData.items, eventData.content_category, eventData.currency);
          }
          break;
        case 'add_to_cart':
          if (eventData.items?.[0]) {
            GA4.addToCart(eventData.items[0], eventData.value);
          }
          break;
        case 'add_to_wishlist':
          if (eventData.items?.[0]) {
            GA4.addToWishlist(eventData.items[0], eventData.currency);
          }
          break;
        case 'remove_from_cart':
          if (eventData.items?.[0]) {
            GA4.removeFromCart(eventData.items[0], eventData.currency);
          }
          break;
        case 'begin_checkout':
          if (eventData.items) {
            GA4.beginCheckout(eventData.items, eventData.value || 0, eventData.currency);
          }
          break;
        case 'add_shipping_info':
          if (eventData.items) {
            GA4.addShippingInfo(eventData.items, eventData.value || 0, eventData.currency);
          }
          break;
        case 'add_payment_info':
          if (eventData.items) {
            GA4.addPaymentInfo(eventData.items, eventData.value || 0, eventData.currency);
          }
          break;
        case 'purchase':
          GA4.purchase({
            event_name: 'purchase',
            transaction_id: eventData.transaction_id || '',
            value: eventData.value || 0,
            currency: eventData.currency || 'AED',
            items: eventData.items || []
          });
          break;
        case 'search':
          GA4.search(eventData.search_term || '');
          break;
        case 'sign_up':
          GA4.signUp();
          break;
        case 'login':
          GA4.login();
          break;
        case 'share':
          GA4.share(eventData.content_category, eventData.items?.[0]?.item_id);
          break;
      }
    }

    // Server-side tracking (non-blocking with extra error handling)
    if (eventData.enableServerSide) {
      // Facebook Conversions API - wrapped with extra error handling to prevent UI crashes
      promises.push(
        ServerSideTracking.sendFacebookEvent({
          event_name: eventName === 'initiate_checkout' ? 'InitiateCheckout' :
                     eventName === 'add_to_cart' ? 'AddToCart' :
                     eventName === 'add_payment_info' ? 'AddPaymentInfo' :
                     eventName === 'purchase' ? 'Purchase' :
                     eventName === 'view_content' ? 'ViewContent' :
                     eventName === 'add_to_wishlist' ? 'AddToWishlist' :
                     eventName === 'search' ? 'Search' :
                     eventName === 'complete_registration' ? 'CompleteRegistration' :
                     eventName === 'contact' ? 'Contact' :
                     eventName === 'subscribe' ? 'Subscribe' :
                     'PageView',
          user_data: eventData.user_data,
          custom_data: {
            value: eventData.value,
            currency: eventData.currency,
            content_ids: eventData.items?.map(item => item.item_id),
            order_id: eventData.transaction_id,
            content_name: eventData.content_name,
            content_category: eventData.content_category,
            search_string: eventData.search_term
          }
        }).catch(error => {
          // Silent error handling to prevent tracking failures from affecting UI
          console.warn('Facebook tracking failed (non-critical):', error);
          return { success: false, error: 'Facebook tracking failed' };
        })
      );

      // Google Analytics Measurement Protocol - wrapped with extra error handling to prevent UI crashes
      promises.push(
        ServerSideTracking.sendGoogleEvent({
          conversion_action: eventName,
          conversion_value: eventData.value,
          currency_code: eventData.currency,
          order_id: eventData.transaction_id,
          user_data: eventData.user_data,
          method: 'ga4'
        }).catch(error => {
          // Silent error handling to prevent tracking failures from affecting UI
          console.warn('Google tracking failed (non-critical):', error);
          return { success: false, error: 'Google tracking failed' };
        })
      );
    }

    // Wait for all server-side requests
    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('Error in server-side tracking:', error);
      }
    }

    return { success: true };
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