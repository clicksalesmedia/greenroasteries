import { ServerSideTracking } from './tracking';

export interface CustomerData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  brand?: string;
  variant?: string;
}

export interface OrderData {
  orderId: string;
  total: number;
  currency?: string;
  items: ProductItem[];
  customer?: CustomerData;
  shipping?: number;
  tax?: number;
  coupon?: string;
}

// Comprehensive E-commerce Tracking Class
export class EcommerceTracker {
  
  /**
   * Track page view across all platforms
   */
  static async trackPageView(customer?: CustomerData) {
    return await ServerSideTracking.trackEvent('page_view', {
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when a user views a product page
   */
  static async trackViewContent(product: ProductItem, customer?: CustomerData) {
    const item = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1
    };

    return await ServerSideTracking.trackEvent('view_content', {
      items: [item],
      value: product.price,
      currency: 'AED',
      content_name: product.name,
      content_category: product.category,
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when a user adds a product to cart
   */
  static async trackAddToCart(product: ProductItem, customer?: CustomerData) {
    const item = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    };

    return await ServerSideTracking.trackEvent('add_to_cart', {
      items: [item],
      value: product.price * product.quantity,
      currency: 'AED',
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when a user adds a product to wishlist
   */
  static async trackAddToWishlist(product: ProductItem, customer?: CustomerData) {
    const item = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1
    };

    return await ServerSideTracking.trackEvent('add_to_wishlist', {
      items: [item],
      value: product.price,
      currency: 'AED',
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when checkout process begins (Step 1: Personal Info)
   */
  static async trackInitiateCheckout(orderData: Partial<OrderData>) {
    const items = orderData.items?.map(product => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    })) || [];

    return await ServerSideTracking.trackEvent('initiate_checkout', {
      items,
      value: orderData.total || 0,
      currency: orderData.currency || 'AED',
      user_data: orderData.customer,
      enableServerSide: true
    });
  }

  /**
   * Track when shipping information is added (Step 2: Address Info)
   */
  static async trackAddShippingInfo(orderData: Partial<OrderData>) {
    const items = orderData.items?.map(product => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    })) || [];

    return await ServerSideTracking.trackEvent('add_shipping_info', {
      items,
      value: orderData.total || 0,
      currency: orderData.currency || 'AED',
      user_data: orderData.customer,
      enableServerSide: true
    });
  }

  /**
   * Track when payment information is added (Step 3: Payment Info)
   */
  static async trackAddPaymentInfo(orderData: Partial<OrderData>) {
    const items = orderData.items?.map(product => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    })) || [];

    return await ServerSideTracking.trackEvent('add_payment_info', {
      items,
      value: orderData.total || 0,
      currency: orderData.currency || 'AED',
      user_data: orderData.customer,
      enableServerSide: true
    });
  }

  /**
   * Track successful purchase completion
   */
  static async trackPurchase(orderData: OrderData) {
    const items = orderData.items.map(product => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    }));

    return await ServerSideTracking.trackEvent('purchase', {
      items,
      value: orderData.total,
      currency: orderData.currency || 'AED',
      transaction_id: orderData.orderId,
      user_data: orderData.customer,
      enableServerSide: true
    });
  }

  /**
   * Track search events
   */
  static async trackSearch(searchTerm: string, customer?: CustomerData) {
    return await ServerSideTracking.trackEvent('search', {
      search_term: searchTerm,
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track contact form submissions or inquiries
   */
  static async trackContact(customer?: CustomerData) {
    return await ServerSideTracking.trackEvent('contact', {
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track user registration/signup
   */
  static async trackCompleteRegistration(customer?: CustomerData, value?: number) {
    return await ServerSideTracking.trackEvent('complete_registration', {
      value,
      currency: 'AED',
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track newsletter subscription
   */
  static async trackSubscribe(customer?: CustomerData, value?: number) {
    return await ServerSideTracking.trackEvent('subscribe', {
      value,
      currency: 'AED',
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when a user views a product list/category
   */
  static async trackViewItemList(products: ProductItem[], listName: string, customer?: CustomerData) {
    const items = products.map(product => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1
    }));

    return await ServerSideTracking.trackEvent('view_item_list', {
      items,
      content_category: listName,
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track when a user removes an item from cart
   */
  static async trackRemoveFromCart(product: ProductItem, customer?: CustomerData) {
    const item = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity
    };

    return await ServerSideTracking.trackEvent('remove_from_cart', {
      items: [item],
      value: product.price * product.quantity,
      currency: 'AED',
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track user login
   */
  static async trackLogin(customer?: CustomerData, method?: string) {
    return await ServerSideTracking.trackEvent('login', {
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track user signup
   */
  static async trackSignUp(customer?: CustomerData, method?: string) {
    return await ServerSideTracking.trackEvent('sign_up', {
      user_data: customer,
      enableServerSide: true
    });
  }

  /**
   * Track social sharing
   */
  static async trackShare(contentType: string, itemId?: string, customer?: CustomerData) {
    return await ServerSideTracking.trackEvent('share', {
      content_category: contentType,
      items: itemId ? [{ item_id: itemId, item_name: '', price: 0, quantity: 1 }] : undefined,
      user_data: customer,
      enableServerSide: true
    });
  }
}

// Export convenience functions for easy use
export const trackPageView = EcommerceTracker.trackPageView;
export const trackViewContent = EcommerceTracker.trackViewContent;
export const trackAddToCart = EcommerceTracker.trackAddToCart;
export const trackAddToWishlist = EcommerceTracker.trackAddToWishlist;
export const trackInitiateCheckout = EcommerceTracker.trackInitiateCheckout;
export const trackAddShippingInfo = EcommerceTracker.trackAddShippingInfo;
export const trackAddPaymentInfo = EcommerceTracker.trackAddPaymentInfo;
export const trackPurchase = EcommerceTracker.trackPurchase;
export const trackSearch = EcommerceTracker.trackSearch;
export const trackContact = EcommerceTracker.trackContact;
export const trackCompleteRegistration = EcommerceTracker.trackCompleteRegistration;
export const trackSubscribe = EcommerceTracker.trackSubscribe;
export const trackViewItemList = EcommerceTracker.trackViewItemList;
export const trackRemoveFromCart = EcommerceTracker.trackRemoveFromCart;
export const trackLogin = EcommerceTracker.trackLogin;
export const trackSignUp = EcommerceTracker.trackSignUp;
export const trackShare = EcommerceTracker.trackShare;

// Default export
export default EcommerceTracker; 