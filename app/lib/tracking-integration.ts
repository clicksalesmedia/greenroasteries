// TypeScript declarations for window object properties
declare global {
  interface Window {
    fbqReady: boolean;
    trackViewContent: (productId: string, productName: string, price: number, category: string) => void;
    trackAddToCart: (productId: string, productName: string, price: number, category: string) => void;
    trackRemoveFromCart: (productId: string, productName: string, price: number, category: string) => void;
    trackInitiateCheckout: (value: number, currency: string, itemCount: number) => void;
  }
}

// Facebook Pixel Integration
export const trackViewContent = (productIdOrOptions: string | any, productName?: string, price?: number, category: string = "Coffee") => {
  // Handle object parameter (from product page)
  if (typeof productIdOrOptions === 'object' && productIdOrOptions !== null) {
    const { id, name, price: objPrice, category: objCategory } = productIdOrOptions;
    
    // Wait for Facebook Pixel to be ready
    const waitForFbq = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          // Track with Facebook Pixel
          window.fbq('track', 'ViewContent', {
            content_ids: [id],
            content_type: 'product',
            content_name: name,
            content_category: objCategory || category,
            value: objPrice,
            currency: 'AED'
          });
          
          console.log(`📱 Facebook Pixel: ViewContent tracked for ${name}`, {
            productId: id,
            price: objPrice,
            category: objCategory || category
          });
        } catch (error) {
          console.error('Facebook Pixel ViewContent error:', error);
        }
      } else {
        // Retry after 100ms if fbq is not ready
        setTimeout(waitForFbq, 100);
      }
    };
    
    waitForFbq();
    
    // Also call global tracking function if available
    if (typeof window !== 'undefined' && window.trackViewContent) {
      window.trackViewContent(id, name, objPrice, objCategory || category);
    }
    return;
  }
  
  // Handle individual parameters (original implementation)
  const waitForFbq = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        // Track with Facebook Pixel
        window.fbq('track', 'ViewContent', {
          content_ids: [productIdOrOptions],
          content_type: 'product',
          content_name: productName,
          content_category: category,
          value: price,
          currency: 'AED'
        });
        
        console.log(`📱 Facebook Pixel: ViewContent tracked for ${productName}`, {
          productId: productIdOrOptions,
          price,
          category
        });
      } catch (error) {
        console.error('Facebook Pixel ViewContent error:', error);
      }
    } else {
      // Retry after 100ms if fbq is not ready
      setTimeout(waitForFbq, 100);
    }
  };
  
  waitForFbq();
  
  // Also call global tracking function if available
  if (typeof window !== 'undefined' && window.trackViewContent) {
    window.trackViewContent(productIdOrOptions, productName || '', price || 0, category);
  }
};

export const trackAddToCart = (productIdOrOptions: string | any, productName?: string, price?: number, category: string = "Coffee") => {
  // Handle object parameter (from product page)
  if (typeof productIdOrOptions === 'object' && productIdOrOptions !== null) {
    const { id, name, price: objPrice, category: objCategory } = productIdOrOptions;
    
    // Wait for Facebook Pixel to be ready
    const waitForFbq = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          // Track with Facebook Pixel
          window.fbq('track', 'AddToCart', {
            content_ids: [id],
            content_type: 'product',
            content_name: name,
            content_category: objCategory || category,
            value: objPrice,
            currency: 'AED'
          });
          
          console.log(`📱 Facebook Pixel: AddToCart tracked for ${name}`, {
            productId: id,
            price: objPrice,
            category: objCategory || category
          });
        } catch (error) {
          console.error('Facebook Pixel AddToCart error:', error);
        }
      } else {
        // Retry after 100ms if fbq is not ready
        setTimeout(waitForFbq, 100);
      }
    };
    
    waitForFbq();
    
    // Also call global tracking function if available
    if (typeof window !== 'undefined' && window.trackAddToCart) {
      window.trackAddToCart(id, name, objPrice, objCategory || category);
    }
    return;
  }
  
  // Handle individual parameters (original implementation)
  const waitForFbq = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        // Track with Facebook Pixel
        window.fbq('track', 'AddToCart', {
          content_ids: [productIdOrOptions],
          content_type: 'product',
          content_name: productName,
          content_category: category,
          value: price,
          currency: 'AED'
        });
        
        console.log(`📱 Facebook Pixel: AddToCart tracked for ${productName}`, {
          productId: productIdOrOptions,
          price,
          category
        });
      } catch (error) {
        console.error('Facebook Pixel AddToCart error:', error);
      }
    } else {
      // Retry after 100ms if fbq is not ready
      setTimeout(waitForFbq, 100);
    }
  };
  
  waitForFbq();
  
  // Also call global tracking function if available
  if (typeof window !== 'undefined' && window.trackAddToCart) {
    window.trackAddToCart(productIdOrOptions, productName || '', price || 0, category);
  }
};

// Page view tracking
export const trackPageView = (url?: string, title?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'PageView');
      console.log('📱 Facebook Pixel: PageView tracked');
    } catch (error) {
      console.error('Facebook Pixel PageView error:', error);
    }
  }
};

// Additional tracking functions for compatibility
export const trackRemoveFromCart = (productIdOrOptions: string | any, productName?: string, price?: number, category: string = "Coffee") => {
  // Handle object parameter (from cart context)
  if (typeof productIdOrOptions === 'object' && productIdOrOptions !== null) {
    const { id, name, price: objPrice, category: objCategory } = productIdOrOptions;
    console.log(`📱 Facebook Pixel: RemoveFromCart tracked for ${name}`, { id, price: objPrice, category: objCategory || category });
    return;
  }
  
  // Handle individual parameters
  console.log(`📱 Facebook Pixel: RemoveFromCart tracked for ${productName}`, { 
    productId: productIdOrOptions, 
    price, 
    category 
  });
};

export const trackInitiateCheckout = (valueOrOptions: number | any, currency: string = 'AED', itemCount: number = 1) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      let value = valueOrOptions;
      let curr = currency;
      let items = itemCount;
      
      // Handle object parameter (from checkout page)
      if (typeof valueOrOptions === 'object' && valueOrOptions !== null) {
        value = valueOrOptions.total || valueOrOptions.value || 0;
        curr = valueOrOptions.currency || 'AED';
        items = valueOrOptions.items?.length || 1;
      }
      
      window.fbq('track', 'InitiateCheckout', {
        value: value,
        currency: curr,
        num_items: items
      });
      console.log('📱 Facebook Pixel: InitiateCheckout tracked', { value, currency: curr, itemCount: items });
    } catch (error) {
      console.error('Facebook Pixel InitiateCheckout error:', error);
    }
  }
};

export const trackPurchase = (orderId: string, value: number, currency: string = 'AED', items: any[] = []) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_ids: items.map(item => item.id),
        content_type: 'product',
        num_items: items.length
      });
      console.log('📱 Facebook Pixel: Purchase tracked', { orderId, value, currency });
    } catch (error) {
      console.error('Facebook Pixel Purchase error:', error);
    }
  }
};

export const trackAddShippingInfo = (valueOrOptions: number | any, currency: string = 'AED') => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      let value = valueOrOptions;
      let curr = currency;
      
      // Handle object parameter (from checkout page)
      if (typeof valueOrOptions === 'object' && valueOrOptions !== null) {
        value = valueOrOptions.total || valueOrOptions.value || 0;
        curr = valueOrOptions.currency || 'AED';
      }
      
      window.fbq('track', 'AddShippingInfo', {
        value: value,
        currency: curr
      });
      console.log('📱 Facebook Pixel: AddShippingInfo tracked', { value, currency: curr });
    } catch (error) {
      console.error('Facebook Pixel AddShippingInfo error:', error);
    }
  }
};

export const trackAddPaymentInfo = (valueOrOptions: number | any, currency: string = 'AED') => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      let value = valueOrOptions;
      let curr = currency;
      
      // Handle object parameter (from checkout page)
      if (typeof valueOrOptions === 'object' && valueOrOptions !== null) {
        value = valueOrOptions.total || valueOrOptions.value || 0;
        curr = valueOrOptions.currency || 'AED';
      }
      
      window.fbq('track', 'AddPaymentInfo', {
        value: value,
        currency: curr
      });
      console.log('📱 Facebook Pixel: AddPaymentInfo tracked', { value, currency: curr });
    } catch (error) {
      console.error('Facebook Pixel AddPaymentInfo error:', error);
    }
  }
}; 