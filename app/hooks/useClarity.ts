import { useCallback } from 'react';

interface ClarityPreferences {
  roast?: string;
  grind?: string;
  origin?: string;
  budgetRange?: string;
}

interface ClarityEcommerceData {
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  firstName?: string;
  lastName?: string;
  orderId?: string;
  items?: Array<{
    id: string;
    name: string;
    category?: string;
    price?: number;
    quantity?: number;
  }>;
  value?: number;
  currency?: string;
}

export const useClarity = () => {
  // Check if Clarity is available
  const isClarityAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           (window as any).clarityReady && 
           typeof (window as any).clarity !== 'undefined';
  }, []);

  // Identify user
  const identifyUser = useCallback((
    userId: string,
    customSessionId?: string,
    customPageId?: string,
    friendlyName?: string
  ) => {
    if (typeof window !== 'undefined' && (window as any).trackClarityIdentify) {
      (window as any).trackClarityIdentify(userId, customSessionId, customPageId, friendlyName);
    }
  }, []);

  // Set custom tags
  const setTag = useCallback((key: string, value: string | string[]) => {
    if (typeof window !== 'undefined' && (window as any).trackClaritySetTag) {
      (window as any).trackClaritySetTag(key, value);
    }
  }, []);

  // Track custom events
  const trackEvent = useCallback((eventName: string) => {
    if (typeof window !== 'undefined' && (window as any).trackClarityEvent) {
      (window as any).trackClarityEvent(eventName);
    }
  }, []);

  // Upgrade session for high-value interactions
  const upgradeSession = useCallback((reason: string) => {
    if (typeof window !== 'undefined' && (window as any).trackClarityUpgrade) {
      (window as any).trackClarityUpgrade(reason);
    }
  }, []);

  // Set consent
  const setConsent = useCallback((hasConsent: boolean = true) => {
    if (typeof window !== 'undefined' && (window as any).trackClarityConsent) {
      (window as any).trackClarityConsent(hasConsent);
    }
  }, []);

  // Track coffee preferences
  const trackCoffeePreferences = useCallback((userId: string, preferences: ClarityPreferences) => {
    if (typeof window !== 'undefined' && (window as any).trackCoffeePreferences) {
      (window as any).trackCoffeePreferences(userId, preferences);
    }
  }, []);

  // Track high-value sessions
  const trackHighValueSession = useCallback((reason: string, value?: number) => {
    if (typeof window !== 'undefined' && (window as any).trackHighValueSession) {
      (window as any).trackHighValueSession(reason, value);
    }
  }, []);

  // Track ecommerce events
  const trackEcommerceEvent = useCallback((eventType: string, data: ClarityEcommerceData) => {
    if (typeof window !== 'undefined' && (window as any).trackEcommerceEvent) {
      (window as any).trackEcommerceEvent(eventType, data);
    }
  }, []);

  // Track specific app events
  const trackCartInteraction = useCallback((action: 'add' | 'remove' | 'update', productId: string, quantity?: number) => {
    setTag('last_cart_action', action);
    setTag('last_cart_product', productId);
    if (quantity) setTag('last_cart_quantity', quantity.toString());
    trackEvent(`cart_${action}`);
  }, [setTag, trackEvent]);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    setTag('last_search_term', searchTerm);
    setTag('last_search_results', resultsCount.toString());
    trackEvent('search_performed');
  }, [setTag, trackEvent]);

  const trackPageInteraction = useCallback((interactionType: string, elementId?: string) => {
    setTag('last_interaction_type', interactionType);
    if (elementId) setTag('last_interaction_element', elementId);
    trackEvent(`page_interaction_${interactionType}`);
  }, [setTag, trackEvent]);

  const trackProductInteraction = useCallback((
    action: 'view' | 'zoom' | 'gallery' | 'variation_change',
    productId: string,
    additionalData?: Record<string, string>
  ) => {
    setTag('last_product_interaction', action);
    setTag('last_product_id', productId);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        setTag(key, value);
      });
    }
    
    trackEvent(`product_${action}`);
  }, [setTag, trackEvent]);

  const trackCheckoutStep = useCallback((step: string, stepNumber: number, value?: number) => {
    setTag('checkout_step', step);
    setTag('checkout_step_number', stepNumber.toString());
    if (value) setTag('checkout_value', value.toString());
    trackEvent(`checkout_${step}`);
    
    // Upgrade session for checkout interactions
    upgradeSession(`checkout_${step}`);
  }, [setTag, trackEvent, upgradeSession]);

  const trackUserPreference = useCallback((preferenceType: string, preferenceValue: string) => {
    setTag(`user_preference_${preferenceType}`, preferenceValue);
    trackEvent('user_preference_set');
  }, [setTag, trackEvent]);

  const trackLanguageChange = useCallback((fromLanguage: string, toLanguage: string) => {
    setTag('language_from', fromLanguage);
    setTag('language_to', toLanguage);
    setTag('user_language', toLanguage);
    trackEvent('language_changed');
  }, [setTag, trackEvent]);

  const trackErrorOccurred = useCallback((errorType: string, errorMessage: string, page?: string) => {
    setTag('last_error_type', errorType);
    setTag('last_error_message', errorMessage.substring(0, 100)); // Limit length
    if (page) setTag('error_page', page);
    trackEvent('error_occurred');
    
    // Upgrade session for error tracking
    upgradeSession('error_tracking');
  }, [setTag, trackEvent, upgradeSession]);

  return {
    // Core Clarity functions
    isClarityAvailable,
    identifyUser,
    setTag,
    trackEvent,
    upgradeSession,
    setConsent,
    
    // Specialized tracking functions
    trackCoffeePreferences,
    trackHighValueSession,
    trackEcommerceEvent,
    
    // App-specific tracking functions
    trackCartInteraction,
    trackSearch,
    trackPageInteraction,
    trackProductInteraction,
    trackCheckoutStep,
    trackUserPreference,
    trackLanguageChange,
    trackErrorOccurred,
  };
}; 