import { 
  trackEcommerceEvent, 
  FacebookPixel, 
  GA4, 
  ServerSideTracking 
} from './tracking';

import { EcommerceTracker } from './ecommerce-tracking';

// Unified tracking interface for easy implementation
export interface TrackingProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
  brand?: string;
  variant?: string;
}

export interface TrackingCustomer {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface TrackingOrder {
  orderId: string;
  items: TrackingProduct[];
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  currency?: string;
  customer?: TrackingCustomer;
}

// Unified tracking class that calls all platforms simultaneously
export class UnifiedTracking {
  
  /**
   * Track page view across all platforms
   */
  static async trackPageView(customer?: TrackingCustomer) {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.pageView();
        GA4.pageView();
      }
      
      // Server-side tracking
      await ServerSideTracking.trackEvent('page_view', {
        user_data: customer ? {
          email: customer.email,
          phone: customer.phone,
          first_name: customer.firstName,
          last_name: customer.lastName,
          city: customer.city,
          state: customer.state,
          country: customer.country || 'AE',
          zip_code: customer.zipCode
        } : undefined,
        enableServerSide: true
      });
      
      // Database tracking
      await trackEcommerceEvent('page_view', {
        eventData: {
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * Track product view across all platforms
   */
  static async trackViewContent(product: TrackingProduct, customer?: TrackingCustomer) {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.viewContent(product.id, 'product', product.price, 'AED');
        GA4.viewItem({
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity: 1,
          price: product.price
        }, 'AED');
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('view_content', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category,
          price: product.price,
          quantity: 1
        }],
        value: product.price,
        currency: 'AED',
        content_name: product.name,
        content_category: product.category,
        user_data: customer ? {
          email: customer.email,
          phone: customer.phone,
          first_name: customer.firstName,
          last_name: customer.lastName
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('view_item', {
        value: product.price,
        currency: 'AED',
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity: 1,
          price: product.price
        }],
        eventData: {
          product,
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking view content:', error);
    }
  }

  /**
   * Track add to cart across all platforms
   */
  static async trackAddToCart(product: TrackingProduct, customer?: TrackingCustomer) {
    try {
      const quantity = product.quantity || 1;
      const value = product.price * quantity;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.addToCart(value, 'AED', [product.id]);
        GA4.addToCart({
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity,
          price: product.price
        }, value);
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('add_to_cart', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category,
          price: product.price,
          quantity
        }],
        value,
        currency: 'AED',
        user_data: customer ? {
          email: customer.email,
          phone: customer.phone,
          first_name: customer.firstName,
          last_name: customer.lastName
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('add_to_cart', {
        value,
        currency: 'AED',
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity,
          price: product.price
        }],
        eventData: {
          product,
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  }

  /**
   * Track remove from cart across all platforms
   */
  static async trackRemoveFromCart(product: TrackingProduct, customer?: TrackingCustomer) {
    try {
      const quantity = product.quantity || 1;
      const value = product.price * quantity;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        GA4.removeFromCart({
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity,
          price: product.price
        }, 'AED');
      }

      // Database tracking
      await trackEcommerceEvent('remove_from_cart', {
        value,
        currency: 'AED',
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category || '',
          quantity,
          price: product.price
        }],
        eventData: {
          product,
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking remove from cart:', error);
    }
  }

  /**
   * Track checkout initiation across all platforms
   */
  static async trackInitiateCheckout(order: Partial<TrackingOrder>) {
    try {
      const items = order.items || [];
      const value = order.total || 0;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.initiateCheckout(value, 'AED', items.map(item => item.id));
        GA4.beginCheckout(
          items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category || '',
            quantity: item.quantity || 1,
            price: item.price
          })),
          value,
          'AED'
        );
      }

             // Server-side tracking
       await ServerSideTracking.trackEvent('initiate_checkout', {
         items: items.map(item => ({
           item_id: item.id,
           item_name: item.name,
           category: item.category,
           price: item.price,
           quantity: item.quantity || 1
         })),
        value,
        currency: 'AED',
        user_data: order.customer ? {
          email: order.customer.email,
          phone: order.customer.phone,
          first_name: order.customer.firstName,
          last_name: order.customer.lastName
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('begin_checkout', {
        value,
        currency: 'AED',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category || '',
          quantity: item.quantity || 1,
          price: item.price
        })),
        eventData: {
          order,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking initiate checkout:', error);
    }
  }

  /**
   * Track shipping info addition across all platforms
   */
  static async trackAddShippingInfo(order: Partial<TrackingOrder>) {
    try {
      const items = order.items || [];
      const value = order.total || 0;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        GA4.addShippingInfo(
          items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category || '',
            quantity: item.quantity || 1,
            price: item.price
          })),
          value,
          'AED'
        );
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('add_shipping_info', {
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity || 1
        })),
        value,
        currency: 'AED',
        user_data: order.customer ? {
          email: order.customer.email,
          phone: order.customer.phone,
          first_name: order.customer.firstName,
          last_name: order.customer.lastName,
          city: order.customer.city,
          state: order.customer.state,
          country: order.customer.country || 'AE',
          zip_code: order.customer.zipCode
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('add_shipping_info', {
        value,
        currency: 'AED',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category || '',
          quantity: item.quantity || 1,
          price: item.price
        })),
        eventData: {
          order,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking add shipping info:', error);
    }
  }

  /**
   * Track payment info addition across all platforms
   */
  static async trackAddPaymentInfo(order: Partial<TrackingOrder>) {
    try {
      const items = order.items || [];
      const value = order.total || 0;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.addPaymentInfo(value, 'AED');
        GA4.addPaymentInfo(
          items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category || '',
            quantity: item.quantity || 1,
            price: item.price
          })),
          value,
          'AED'
        );
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('add_payment_info', {
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity || 1
        })),
        value,
        currency: 'AED',
        user_data: order.customer ? {
          email: order.customer.email,
          phone: order.customer.phone,
          first_name: order.customer.firstName,
          last_name: order.customer.lastName
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('add_payment_info', {
        value,
        currency: 'AED',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category || '',
          quantity: item.quantity || 1,
          price: item.price
        })),
        eventData: {
          order,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking add payment info:', error);
    }
  }

  /**
   * Track purchase completion across all platforms
   */
  static async trackPurchase(order: TrackingOrder) {
    try {
      const items = order.items || [];
      const value = order.total || 0;

      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.purchase(value, 'AED', items.map(item => item.id), order.orderId);
        GA4.purchase({
          event_name: 'purchase',
          transaction_id: order.orderId,
          value,
          currency: 'AED',
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category || '',
            quantity: item.quantity || 1,
            price: item.price
          })),
          coupon: order.discount ? 'DISCOUNT_APPLIED' : undefined,
          shipping: order.shipping || 0,
          tax: order.tax || 0
        });
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('purchase', {
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity || 1
        })),
        value,
        currency: 'AED',
        transaction_id: order.orderId,
        user_data: order.customer ? {
          email: order.customer.email,
          phone: order.customer.phone,
          first_name: order.customer.firstName,
          last_name: order.customer.lastName
        } : undefined,
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('purchase', {
        value,
        currency: 'AED',
        transactionId: order.orderId,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category || '',
          quantity: item.quantity || 1,
          price: item.price
        })),
        eventData: {
          order,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  /**
   * Track search across all platforms
   */
  static async trackSearch(searchTerm: string, resultsCount?: number, customer?: TrackingCustomer) {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.search(searchTerm);
        GA4.search(searchTerm, resultsCount);
      }

      // Database tracking
      await trackEcommerceEvent('search', {
        eventData: {
          search_term: searchTerm,
          results_count: resultsCount,
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Track user registration across all platforms
   */
  static async trackRegistration(customer: TrackingCustomer, method: string = 'email') {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.completeRegistration();
        GA4.signUp(method);
      }

      // Server-side tracking
      await ServerSideTracking.trackEvent('complete_registration', {
        user_data: {
          email: customer.email,
          phone: customer.phone,
          first_name: customer.firstName,
          last_name: customer.lastName
        },
        enableServerSide: true
      });

      // Database tracking
      await trackEcommerceEvent('sign_up', {
        eventData: {
          method,
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking registration:', error);
    }
  }

  /**
   * Track contact form submission
   */
  static async trackContact(customer?: TrackingCustomer) {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.contact();
      }

      // Database tracking
      await trackEcommerceEvent('contact', {
        eventData: {
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking contact:', error);
    }
  }

  /**
   * Track newsletter subscription
   */
  static async trackSubscription(customer?: TrackingCustomer) {
    try {
      // Client-side tracking
      if (typeof window !== 'undefined') {
        FacebookPixel.subscribe();
      }

      // Database tracking
      await trackEcommerceEvent('subscribe', {
        eventData: {
          customer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking subscription:', error);
    }
  }
}

// Export convenience functions
export const trackPageView = UnifiedTracking.trackPageView;
export const trackViewContent = UnifiedTracking.trackViewContent;
export const trackAddToCart = UnifiedTracking.trackAddToCart;
export const trackRemoveFromCart = UnifiedTracking.trackRemoveFromCart;
export const trackInitiateCheckout = UnifiedTracking.trackInitiateCheckout;
export const trackAddShippingInfo = UnifiedTracking.trackAddShippingInfo;
export const trackAddPaymentInfo = UnifiedTracking.trackAddPaymentInfo;
export const trackPurchase = UnifiedTracking.trackPurchase;
export const trackSearch = UnifiedTracking.trackSearch;
export const trackRegistration = UnifiedTracking.trackRegistration;
export const trackContact = UnifiedTracking.trackContact;
export const trackSubscription = UnifiedTracking.trackSubscription; 