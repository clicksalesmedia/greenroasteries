import crypto from 'crypto';

// Facebook SDK imports using require (package doesn't have built-in TypeScript definitions)
const { FacebookAdsApi, ServerEvent, EventRequest, UserData, CustomData, Content } = require('facebook-nodejs-business-sdk');

// Facebook CAPI Configuration
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || '3805848799548541';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || 'EAAX7Xr0jeMQBPKlPE7qzNjNNnFZBilfc36OBvZCz8aN2O9H8NHPkXiZAcHrH6g3dWStgfuObHvzJj52uHqGmX8ivTr2BnfH12jdCCaTnM2H5t7UOHHbDrUkMa2ZCfq3lE6rsswL9KYAowaIssHZCKxXA1o465Q9RQ5P2Bnh3LWGxyqcKUnxrurYy6n3hmzQZDZD';

// Initialize Facebook Ads API
const api = FacebookAdsApi.init(FACEBOOK_ACCESS_TOKEN);

// Store information
const STORE_INFO = {
  name: 'Green Roasteries',
  domain: 'thegreenroasteries.com',
  category: 'Coffee & Tea',
  currency: 'AED',
  country: 'AE'
};

// Types for our tracking data
export interface FacebookCapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  state?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface FacebookCapiProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  brand?: string;
  description?: string;
}

export interface FacebookCapiOrderData {
  orderId: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
  currency: string;
  items: FacebookCapiProduct[];
  paymentMethod?: string;
  isNewCustomer?: boolean;
}

/**
 * Facebook Conversions API Service
 * Enhanced with official Facebook Business SDK for iOS tracking
 */
export class FacebookCapiService {
  /**
   * Hash PII data for privacy compliance
   */
  private static async hashData(data: string): Promise<string> {
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  }

  /**
   * Create Facebook UserData object with proper hashing
   */
  private static async createUserData(userData: FacebookCapiUserData): Promise<any> {
    const fbUserData = new UserData();

    if (userData.email) {
      fbUserData.setEmail(await this.hashData(userData.email));
    }

    if (userData.phone) {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = userData.phone.replace(/[\s\-\(\)]/g, '');
      fbUserData.setPhone(await this.hashData(cleanPhone));
    }

    if (userData.firstName) {
      fbUserData.setFirstName(await this.hashData(userData.firstName));
    }

    if (userData.lastName) {
      fbUserData.setLastName(await this.hashData(userData.lastName));
    }

    if (userData.city) {
      fbUserData.setCity(await this.hashData(userData.city));
    }

    if (userData.country) {
      fbUserData.setCountryCode(await this.hashData(userData.country));
    }

    if (userData.zipCode) {
      fbUserData.setZipCode(await this.hashData(userData.zipCode));
    }

    if (userData.state) {
      fbUserData.setState(await this.hashData(userData.state));
    }

    if (userData.externalId) {
      fbUserData.setExternalId(await this.hashData(userData.externalId));
    }

    // Non-hashed data
    if (userData.clientIpAddress) {
      fbUserData.setClientIpAddress(userData.clientIpAddress);
    }

    if (userData.clientUserAgent) {
      fbUserData.setClientUserAgent(userData.clientUserAgent);
    }

    if (userData.fbp) {
      fbUserData.setFbp(userData.fbp);
    }

    if (userData.fbc) {
      fbUserData.setFbc(userData.fbc);
    }

    return fbUserData;
  }

  /**
   * Create Facebook Content objects for products
   */
  private static createContents(products: FacebookCapiProduct[]): any[] {
    return products.map(product => {
      const content = new Content();
      content.setId(product.id);
      content.setQuantity(product.quantity);
      content.setItemPrice(product.price);
      content.setTitle(product.name);
      content.setDescription(product.description || product.name);
      content.setCategory(product.category || 'Coffee');
      content.setBrand(product.brand || STORE_INFO.name);
      return content;
    });
  }

  /**
   * Create Facebook CustomData object
   */
  private static createCustomData(orderData: FacebookCapiOrderData): any {
    const customData = new CustomData();
    
    customData.setValue(orderData.total);
    customData.setCurrency(orderData.currency);
    customData.setContentType('product');
    customData.setContentIds(orderData.items.map(item => item.id));
    customData.setContents(this.createContents(orderData.items));
    customData.setOrderId(orderData.orderId);
    customData.setNumItems(orderData.items.reduce((sum, item) => sum + item.quantity, 0));

    // Enhanced data
    if (orderData.paymentMethod) {
      customData.setCustomProperties({
        payment_method: orderData.paymentMethod,
        store_name: STORE_INFO.name,
        is_new_customer: orderData.isNewCustomer || false,
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shippingCost || 0,
        discount: orderData.discount || 0
      });
    }

    return customData;
  }

  /**
   * Generate unique event ID to prevent duplicates
   */
  private static generateEventId(eventType: string, orderId: string, source: string = 'webhook'): string {
    return `${eventType.toLowerCase()}_${source}_${orderId}_${Date.now()}`;
  }

  /**
   * Track Purchase Event via Facebook CAPI
   */
  static async trackPurchase(
    orderData: FacebookCapiOrderData, 
    userData: FacebookCapiUserData,
    source: 'stripe' | 'tabby' | 'website' = 'website'
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking purchase for order ${orderData.orderId}, source: ${source}`);

      // Create Facebook objects using official SDK
      const fbUserData = await this.createUserData(userData);
      const customData = this.createCustomData(orderData);

      // Create server event
      const serverEvent = new ServerEvent();
      serverEvent.setEventName('Purchase');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/checkout/thank-you`);
      serverEvent.setActionSource(source === 'website' ? 'website' : 'system_generated');
      serverEvent.setEventId(this.generateEventId('purchase', orderData.orderId, source));

      // Create event request
      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      // Send to Facebook
      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] Purchase tracked successfully:`, {
        orderId: orderData.orderId,
        total: orderData.total,
        currency: orderData.currency,
        items: orderData.items.length,
        source: source,
        eventId: serverEvent.event_id,
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] Purchase tracking failed:', error);
      // Don't throw - tracking failures shouldn't break the application
    }
  }

  /**
   * Track Add to Cart Event via Facebook CAPI
   */
  static async trackAddToCart(
    product: FacebookCapiProduct,
    userData: FacebookCapiUserData
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking add to cart for product ${product.id}`);

      const fbUserData = await this.createUserData(userData);
      
      const customData = new CustomData();
      customData.setValue(product.price * product.quantity);
      customData.setCurrency('AED');
      customData.setContentType('product');
      customData.setContentIds([product.id]);
      customData.setContents(this.createContents([product]));

      const serverEvent = new ServerEvent();
      serverEvent.setEventName('AddToCart');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/product/${product.id}`);
      serverEvent.setActionSource('website');
      serverEvent.setEventId(this.generateEventId('add_to_cart', product.id, 'website'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] Add to cart tracked successfully:`, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: product.quantity,
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] Add to cart tracking failed:', error);
    }
  }

  /**
   * Track View Content Event via Facebook CAPI
   */
  static async trackViewContent(
    product: FacebookCapiProduct,
    userData: FacebookCapiUserData
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking view content for product ${product.id}`);

      const fbUserData = await this.createUserData(userData);
      
      const customData = new CustomData();
      customData.setValue(product.price);
      customData.setCurrency('AED');
      customData.setContentType('product');
      customData.setContentIds([product.id]);
      customData.setContents(this.createContents([product]));

      const serverEvent = new ServerEvent();
      serverEvent.setEventName('ViewContent');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/product/${product.id}`);
      serverEvent.setActionSource('website');
      serverEvent.setEventId(this.generateEventId('view_content', product.id, 'website'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] View content tracked successfully:`, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] View content tracking failed:', error);
    }
  }

  /**
   * Track Initiate Checkout Event via Facebook CAPI
   */
  static async trackInitiateCheckout(
    orderData: FacebookCapiOrderData,
    userData: FacebookCapiUserData
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking initiate checkout for order ${orderData.orderId}`);

      const fbUserData = await this.createUserData(userData);
      const customData = this.createCustomData(orderData);

      const serverEvent = new ServerEvent();
      serverEvent.setEventName('InitiateCheckout');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/checkout`);
      serverEvent.setActionSource('website');
      serverEvent.setEventId(this.generateEventId('initiate_checkout', orderData.orderId, 'website'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] Initiate checkout tracked successfully:`, {
        orderId: orderData.orderId,
        total: orderData.total,
        items: orderData.items.length,
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] Initiate checkout tracking failed:', error);
    }
  }

  /**
   * Track Add Payment Info Event via Facebook CAPI
   */
  static async trackAddPaymentInfo(
    orderData: FacebookCapiOrderData,
    userData: FacebookCapiUserData
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking add payment info for order ${orderData.orderId}`);

      const fbUserData = await this.createUserData(userData);
      const customData = this.createCustomData(orderData);

      const serverEvent = new ServerEvent();
      serverEvent.setEventName('AddPaymentInfo');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/checkout`);
      serverEvent.setActionSource('website');
      serverEvent.setEventId(this.generateEventId('add_payment_info', orderData.orderId, 'website'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] Add payment info tracked successfully:`, {
        orderId: orderData.orderId,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] Add payment info tracking failed:', error);
    }
  }

  /**
   * Track Lead Event via Facebook CAPI (for newsletter signups, contact forms)
   */
  static async trackLead(
    leadType: 'newsletter' | 'contact',
    userData: FacebookCapiUserData
  ): Promise<void> {
    try {
      console.log(`[Facebook CAPI] Tracking lead for type: ${leadType}`);

      const fbUserData = await this.createUserData(userData);
      
      const customData = new CustomData();
      customData.setContentName(leadType === 'newsletter' ? 'Newsletter Signup' : 'Contact Form');
      customData.setContentCategory(leadType);
      customData.setCustomProperties({
        lead_type: leadType,
        source: 'website',
        store_name: STORE_INFO.name
      });

      const serverEvent = new ServerEvent();
      serverEvent.setEventName('Lead');
      serverEvent.setEventTime(Math.floor(Date.now() / 1000));
      serverEvent.setUserData(fbUserData);
      serverEvent.setCustomData(customData);
      serverEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/${leadType === 'newsletter' ? 'newsletter' : 'contact'}`);
      serverEvent.setActionSource('website');
      serverEvent.setEventId(this.generateEventId('lead', leadType, 'website'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([serverEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');

      const response = await eventRequest.execute();
      
      console.log(`[Facebook CAPI] Lead tracked successfully:`, {
        leadType: leadType,
        email: userData.email ? 'present' : 'missing',
        response: response
      });

    } catch (error) {
      console.error('[Facebook CAPI] Lead tracking failed:', error);
    }
  }

  /**
   * Test Facebook CAPI connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('[Facebook CAPI] Testing connection...');
      
      // Create a simple test event
      const testUserData = new UserData();
      testUserData.setEmail(await this.hashData('test@example.com'));
      
      const testCustomData = new CustomData();
      testCustomData.setValue(1.00);
      testCustomData.setCurrency('AED');
      
      const testEvent = new ServerEvent();
      testEvent.setEventName('PageView');
      testEvent.setEventTime(Math.floor(Date.now() / 1000));
      testEvent.setUserData(testUserData);
      testEvent.setCustomData(testCustomData);
      testEvent.setEventSourceUrl(`https://${STORE_INFO.domain}/test`);
      testEvent.setActionSource('website');
      testEvent.setEventId(this.generateEventId('test', 'connection', 'test'));

      const eventRequest = new EventRequest();
      eventRequest.setPixelId(FACEBOOK_PIXEL_ID);
      eventRequest.setEvents([testEvent]);
      eventRequest.setPartnerAgent('Green Roasteries CAPI v1.0');
      eventRequest.setTestEventCode('TEST12345'); // Use test event code for testing

      const response = await eventRequest.execute();
      
      console.log('[Facebook CAPI] Connection test successful:', response);
      return true;
    } catch (error) {
      console.error('[Facebook CAPI] Connection test failed:', error);
      return false;
    }
  }
}

export default FacebookCapiService; 