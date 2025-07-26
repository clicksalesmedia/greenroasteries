import crypto from 'crypto';

// Facebook Pixel ID and Access Token from environment
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || '3805848799548541';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || 'EAAX7Xr0jeMQBPKlPE7qzNjNNnFZBilfc36OBvZCz8aN2O9H8NHPkXiZAcHrH6g3dWStgfuObHvzJj52uHqGmX8ivTr2BnfH12jdCCaTnM2H5t7UOHHbDrUkMa2ZCfq3lE6rsswL9KYAowaIssHZCKxXA1o465Q9RQ5P2Bnh3LWGxyqcKUnxrurYy6n3hmzQZDZD';

// Store information for Green Roasteries
const STORE_INFO = {
  name: 'Green Roasteries',
  domain: 'greenroasteries.com',
  category: 'Coffee & Tea',
  currency: 'AED',
  country: 'AE'
};

// Facebook Event Types
export type FacebookEventType = 
  | 'Purchase'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Search'
  | 'AddToWishlist'
  | 'PageView'
  | 'Subscribe'
  | 'Contact';

// Facebook Event Data Interface
export interface FacebookEventData {
  event_name: FacebookEventType;
  event_time: number;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_source_url?: string;
  user_data: {
    em?: string[]; // email (hashed)
    ph?: string[]; // phone (hashed)
    fn?: string[]; // first name (hashed)
    ln?: string[]; // last name (hashed)
    ct?: string[]; // city (hashed)
    st?: string[]; // state (hashed)
    zp?: string[]; // zip code (hashed)
    country?: string[]; // country (hashed)
    external_id?: string[]; // external ID (hashed)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    predicted_ltv?: number;
    num_items?: number;
    search_string?: string;
    status?: string;
    item_number?: string;
    delivery_category?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price: number;
      title?: string;
      description?: string;
      category?: string;
      brand?: string;
    }>;
  };
  event_id?: string; // For deduplication
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

// User Data Interface
export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

// Product Data Interface
export interface ProductData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  variation?: {
    size?: string;
    grind?: string;
    roast?: string;
    beans?: string;
  };
}

// Order Data Interface
export interface OrderData {
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

// Hash function for PII data (Facebook requirement)
function hashData(data: string): string {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Normalize phone number (remove non-digits)
function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Create hashed user data for Facebook
function createUserData(userData: UserData): FacebookEventData['user_data'] {
  const result: FacebookEventData['user_data'] = {};

  if (userData.email) {
    result.em = [hashData(userData.email)];
  }
  if (userData.phone) {
    result.ph = [hashData(normalizePhone(userData.phone))];
  }
  if (userData.firstName) {
    result.fn = [hashData(userData.firstName)];
  }
  if (userData.lastName) {
    result.ln = [hashData(userData.lastName)];
  }
  if (userData.city) {
    result.ct = [hashData(userData.city)];
  }
  if (userData.state) {
    result.st = [hashData(userData.state)];
  }
  if (userData.zipCode) {
    result.zp = [hashData(userData.zipCode)];
  }
  if (userData.country) {
    result.country = [hashData(userData.country)];
  }
  if (userData.externalId) {
    result.external_id = [hashData(userData.externalId)];
  }

  // Non-PII data (not hashed)
  if (userData.clientIpAddress) {
    result.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    result.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbc) {
    result.fbc = userData.fbc;
  }
  if (userData.fbp) {
    result.fbp = userData.fbp;
  }

  return result;
}

// Create event ID for deduplication
function createEventId(prefix: string, orderId?: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${orderId || randomId}_${timestamp}`;
}

// Send event to Facebook Conversions API
async function sendToFacebookCAPI(eventData: FacebookEventData[]): Promise<any> {
  const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PIXEL_ID}/events`;
  
  const payload = {
    data: eventData,
    access_token: FACEBOOK_ACCESS_TOKEN
  };

  console.log('📱 Sending Facebook CAPI event:', {
    pixel_id: FACEBOOK_PIXEL_ID,
    events: eventData.map(e => ({
      event_name: e.event_name,
      event_time: e.event_time,
      action_source: e.action_source,
      event_id: e.event_id,
      custom_data: e.custom_data
    }))
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GreenRoasteries/1.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      console.error('📱 Facebook CAPI error:', result);
      throw new Error(`Facebook CAPI Error: ${result.error?.message || 'Unknown error'}`);
    }

    console.log('📱 Facebook CAPI success:', {
      events_received: result.events_received,
      messages: result.messages,
      fbtrace_id: result.fbtrace_id
    });

    return result;
  } catch (error: any) {
    console.error('📱 Facebook CAPI request failed:', error.message);
    throw error;
  }
}

// Facebook Tracking Service
export class FacebookTrackingService {
  // Track Purchase Event (for completed orders)
  static async trackPurchase(orderData: OrderData, userData: UserData, source: 'stripe' | 'tabby' | 'website' = 'website'): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: source === 'website' ? 'website' : 'system_generated',
        event_source_url: source === 'website' ? `https://${STORE_INFO.domain}/checkout/thank-you` : undefined,
        user_data: createUserData(userData),
        custom_data: {
          value: orderData.total,
          currency: orderData.currency,
          content_type: 'product',
          content_ids: orderData.items.map(item => item.id),
          contents: orderData.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price,
            title: item.name,
            description: item.description,
            category: item.category || 'Coffee',
            brand: STORE_INFO.name
          })),
          order_id: orderData.orderId,
          num_items: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
          predicted_ltv: orderData.isNewCustomer ? orderData.total * 3 : undefined,
          delivery_category: 'home_delivery'
        },
        event_id: createEventId(`purchase_${source}`, orderData.orderId)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 Purchase tracking failed:', error);
      // Don't throw - tracking failures shouldn't break the application
    }
  }

  // Track Add to Cart Event
  static async trackAddToCart(productData: ProductData, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'AddToCart',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}/product/${productData.id}`,
        user_data: createUserData(userData),
        custom_data: {
          value: productData.price * productData.quantity,
          currency: STORE_INFO.currency,
          content_type: 'product',
          content_ids: [productData.id],
          contents: [{
            id: productData.id,
            quantity: productData.quantity,
            item_price: productData.price,
            title: productData.name,
            category: productData.category || 'Coffee',
            brand: STORE_INFO.name
          }],
          content_name: productData.name,
          content_category: productData.category || 'Coffee'
        },
        event_id: createEventId('add_to_cart', productData.id)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 AddToCart tracking failed:', error);
    }
  }

  // Track Initiate Checkout Event
  static async trackInitiateCheckout(orderData: OrderData, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'InitiateCheckout',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}/checkout`,
        user_data: createUserData(userData),
        custom_data: {
          value: orderData.total,
          currency: orderData.currency,
          content_type: 'product',
          content_ids: orderData.items.map(item => item.id),
          contents: orderData.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price,
            title: item.name,
            category: item.category || 'Coffee',
            brand: STORE_INFO.name
          })),
          num_items: orderData.items.reduce((sum, item) => sum + item.quantity, 0)
        },
        event_id: createEventId('initiate_checkout', orderData.orderId)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 InitiateCheckout tracking failed:', error);
    }
  }

  // Track Add Payment Info Event
  static async trackAddPaymentInfo(orderData: OrderData, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'AddPaymentInfo',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}/checkout`,
        user_data: createUserData(userData),
        custom_data: {
          value: orderData.total,
          currency: orderData.currency,
          content_type: 'product',
          content_ids: orderData.items.map(item => item.id),
          num_items: orderData.items.reduce((sum, item) => sum + item.quantity, 0)
        },
        event_id: createEventId('add_payment_info', orderData.orderId)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 AddPaymentInfo tracking failed:', error);
    }
  }

  // Track View Content Event
  static async trackViewContent(productData: ProductData, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'ViewContent',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}/product/${productData.id}`,
        user_data: createUserData(userData),
        custom_data: {
          value: productData.price,
          currency: STORE_INFO.currency,
          content_type: 'product',
          content_ids: [productData.id],
          content_name: productData.name,
          content_category: productData.category || 'Coffee'
        },
        event_id: createEventId('view_content', productData.id)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 ViewContent tracking failed:', error);
    }
  }

  // Track Lead Event (for newsletter signups, contact forms)
  static async trackLead(userData: UserData, leadType: 'newsletter' | 'contact' = 'newsletter'): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}`,
        user_data: createUserData(userData),
        custom_data: {
          content_name: leadType === 'newsletter' ? 'Newsletter Signup' : 'Contact Form',
          content_category: leadType,
          status: 'subscribed'
        },
        event_id: createEventId(`lead_${leadType}`)
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 Lead tracking failed:', error);
    }
  }

  // Track Search Event
  static async trackSearch(searchTerm: string, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'Search',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `https://${STORE_INFO.domain}/shop`,
        user_data: createUserData(userData),
        custom_data: {
          search_string: searchTerm,
          content_type: 'product',
          content_category: 'Coffee'
        },
        event_id: createEventId('search')
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 Search tracking failed:', error);
    }
  }

  // Track Page View Event
  static async trackPageView(pageUrl: string, userData: UserData): Promise<void> {
    try {
      const eventData: FacebookEventData = {
        event_name: 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: pageUrl,
        user_data: createUserData(userData),
        custom_data: {
          content_name: 'Page View',
          content_category: 'Website'
        },
        event_id: createEventId('page_view')
      };

      await sendToFacebookCAPI([eventData]);
    } catch (error) {
      console.error('📱 PageView tracking failed:', error);
    }
  }

  // Health check for Facebook CAPI
  static async healthCheck(): Promise<boolean> {
    try {
      const testEvent: FacebookEventData = {
        event_name: 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          em: [hashData('test@example.com')]
        },
        custom_data: {
          content_name: 'Health Check',
          content_category: 'Test'
        },
        event_id: createEventId('health_check')
      };

      await sendToFacebookCAPI([testEvent]);
      return true;
    } catch (error) {
      console.error('📱 Facebook CAPI health check failed:', error);
      return false;
    }
  }
}

export default FacebookTrackingService; 