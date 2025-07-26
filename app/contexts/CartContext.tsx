'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { trackRemoveFromCart } from '../lib/tracking-integration';

// Type definitions
export interface CartVariation {
  weight?: string;
  beans?: string;
  additions?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variation: CartVariation;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateItemQuantity: () => {},
  clearCart: () => {},
});

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// Cart provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on first render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
        setItems([]);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Calculate total items and price
  const totalItems = Array.isArray(items) ? items.reduce((total, item) => total + item.quantity, 0) : 0;
  const totalPrice = Array.isArray(items) ? items.reduce((total, item) => total + (item.price * item.quantity), 0) : 0;

  // Add item to cart
  const addItem = (item: CartItem) => {
    setItems(currentItems => {
      // Generate a unique ID for the cart item if not provided
      const newItem = { 
        ...item, 
        id: item.id || `${item.productId}-${Date.now()}`
      };
      
      // Check if the exact same product with the same variations already exists
      const existingItemIndex = currentItems.findIndex(cartItem => 
        cartItem.productId === newItem.productId && 
        cartItem.variation.weight === newItem.variation.weight &&
        cartItem.variation.beans === newItem.variation.beans &&
        cartItem.variation.additions === newItem.variation.additions
      );

      const cartValue = newItem.price * newItem.quantity;

      // Track Google Ads Add to Cart conversion
      if (typeof window !== 'undefined' && (window as any).trackGoogleAdsAddToCart) {
        (window as any).trackGoogleAdsAddToCart(cartValue, 'AED');
      }

      // Track GA4 Enhanced Add to Cart
      if (typeof window !== 'undefined' && (window as any).trackGA4AddToCart) {
        const itemData = {
          id: newItem.productId,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
          category: 'Coffee',
          variation: `${newItem.variation.weight || ''} ${newItem.variation.beans || ''} ${newItem.variation.additions || ''}`.trim()
        };
        (window as any).trackGA4AddToCart(itemData, cartValue, 'AED');
      }

      // Track Facebook Add to Cart (Pixel + Conversions API)
      if (typeof window !== 'undefined' && (window as any).trackFacebookAddToCart) {
        const itemData = {
          id: newItem.productId,
          name: newItem.name,
          price: newItem.price,
          category: 'Coffee'
        };
        (window as any).trackFacebookAddToCart(itemData, cartValue, 'AED');
      }

      // 🔮 Track Microsoft Clarity Add to Cart
      if (typeof window !== 'undefined') {
        // Set detailed Clarity tags for cart behavior analysis
        if ((window as any).trackClaritySetTag) {
          (window as any).trackClaritySetTag('cart_item_added', newItem.productId);
          (window as any).trackClaritySetTag('cart_item_name', newItem.name);
          (window as any).trackClaritySetTag('cart_item_price', newItem.price.toString());
          (window as any).trackClaritySetTag('cart_item_quantity', newItem.quantity.toString());
          (window as any).trackClaritySetTag('cart_item_value', cartValue.toString());
          (window as any).trackClaritySetTag('cart_variation_weight', newItem.variation.weight || 'none');
          (window as any).trackClaritySetTag('cart_variation_beans', newItem.variation.beans || 'none');
          (window as any).trackClaritySetTag('cart_variation_additions', newItem.variation.additions || 'none');
          (window as any).trackClaritySetTag('cart_total_items', (totalItems + newItem.quantity).toString());
          (window as any).trackClaritySetTag('cart_total_value', (totalPrice + cartValue).toString());
          (window as any).trackClaritySetTag('cart_action_type', existingItemIndex >= 0 ? 'quantity_increase' : 'new_item');
        }

        // Track Clarity event
        if ((window as any).trackClarityEvent) {
          (window as any).trackClarityEvent('cart_add_item');
        }

        // Upgrade session for high-value cart additions
        if (cartValue > 100 && (window as any).trackClarityUpgrade) {
          (window as any).trackClarityUpgrade('high_value_cart_addition');
        }
      }

      // If item exists, update quantity, otherwise add new item
      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        return [...currentItems, newItem];
      }
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setItems(currentItems => {
      const itemToRemove = currentItems.find(item => item.id === itemId);
      
      // Track remove from cart
      if (itemToRemove) {
        trackRemoveFromCart({
          id: itemToRemove.productId,
          name: itemToRemove.name,
          price: itemToRemove.price,
          quantity: itemToRemove.quantity,
          category: 'Unknown' // We don't have category in cart item, could be enhanced
        });

        // 🔮 Track Microsoft Clarity Remove from Cart
        if (typeof window !== 'undefined') {
          const itemValue = itemToRemove.price * itemToRemove.quantity;
          const newTotalItems = totalItems - itemToRemove.quantity;
          const newTotalValue = totalPrice - itemValue;

          // Set detailed Clarity tags for removal analysis
          if ((window as any).trackClaritySetTag) {
            (window as any).trackClaritySetTag('cart_item_removed', itemToRemove.productId);
            (window as any).trackClaritySetTag('cart_removed_name', itemToRemove.name);
            (window as any).trackClaritySetTag('cart_removed_price', itemToRemove.price.toString());
            (window as any).trackClaritySetTag('cart_removed_quantity', itemToRemove.quantity.toString());
            (window as any).trackClaritySetTag('cart_removed_value', itemValue.toString());
            (window as any).trackClaritySetTag('cart_total_items_after_removal', newTotalItems.toString());
            (window as any).trackClaritySetTag('cart_total_value_after_removal', newTotalValue.toString());
            (window as any).trackClaritySetTag('cart_abandonment_risk', newTotalItems === 0 ? 'high' : newTotalValue < 50 ? 'medium' : 'low');
          }

          // Track Clarity event
          if ((window as any).trackClarityEvent) {
            (window as any).trackClarityEvent('cart_remove_item');
          }

          // Upgrade session for cart abandonment analysis
          if (newTotalItems === 0 && (window as any).trackClarityUpgrade) {
            (window as any).trackClarityUpgrade('cart_emptied');
          }
        }
      }
      
      return currentItems.filter(item => item.id !== itemId);
    });
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(currentItems => {
      const itemToUpdate = currentItems.find(item => item.id === itemId);
      
      // 🔮 Track Microsoft Clarity Quantity Update
      if (itemToUpdate && typeof window !== 'undefined') {
        const oldQuantity = itemToUpdate.quantity;
        const quantityChange = quantity - oldQuantity;
        const valueChange = quantityChange * itemToUpdate.price;
        const newTotalValue = totalPrice + valueChange;

        // Set detailed Clarity tags for quantity update analysis
        if ((window as any).trackClaritySetTag) {
          (window as any).trackClaritySetTag('cart_quantity_updated', itemToUpdate.productId);
          (window as any).trackClaritySetTag('cart_quantity_from', oldQuantity.toString());
          (window as any).trackClaritySetTag('cart_quantity_to', quantity.toString());
          (window as any).trackClaritySetTag('cart_quantity_change', quantityChange.toString());
          (window as any).trackClaritySetTag('cart_value_change', valueChange.toString());
          (window as any).trackClaritySetTag('cart_total_value_after_update', newTotalValue.toString());
          (window as any).trackClaritySetTag('cart_update_direction', quantityChange > 0 ? 'increase' : 'decrease');
        }

        // Track Clarity event
        if ((window as any).trackClarityEvent) {
          (window as any).trackClarityEvent('cart_update_quantity');
        }
      }

      return currentItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
    });
  };

  // Clear cart
  const clearCart = () => {
    // 🔮 Track Microsoft Clarity Cart Clear
    if (typeof window !== 'undefined' && items.length > 0) {
      // Set detailed Clarity tags for cart clear analysis
      if ((window as any).trackClaritySetTag) {
        (window as any).trackClaritySetTag('cart_cleared_items_count', items.length.toString());
        (window as any).trackClaritySetTag('cart_cleared_total_value', totalPrice.toString());
        (window as any).trackClaritySetTag('cart_cleared_product_ids', items.map(item => item.productId).join(','));
        (window as any).trackClaritySetTag('cart_clear_reason', 'user_action'); // Could be enhanced to track different reasons
      }

      // Track Clarity event
      if ((window as any).trackClarityEvent) {
        (window as any).trackClarityEvent('cart_cleared');
      }

      // Upgrade session for cart abandonment analysis
      if (totalPrice > 100 && (window as any).trackClarityUpgrade) {
        (window as any).trackClarityUpgrade('high_value_cart_abandonment');
      }
    }

    setItems([]);
  };

  // 🔮 Track cart state changes for Clarity analytics
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      // Set current cart state in Clarity tags
      if ((window as any).trackClaritySetTag) {
        (window as any).trackClaritySetTag('current_cart_items', totalItems.toString());
        (window as any).trackClaritySetTag('current_cart_value', totalPrice.toString());
        (window as any).trackClaritySetTag('cart_status', totalItems === 0 ? 'empty' : totalPrice > 200 ? 'high_value' : totalPrice > 50 ? 'medium_value' : 'low_value');
        
        // Track product categories in cart
        const categories = items.map(item => 'Coffee').filter((category, index, arr) => arr.indexOf(category) === index);
        (window as any).trackClaritySetTag('cart_categories', categories.join(','));
        
        // Track cart composition
        if (items.length > 0) {
          const avgItemPrice = totalPrice / totalItems;
          (window as any).trackClaritySetTag('cart_avg_item_price', avgItemPrice.toFixed(2));
          (window as any).trackClaritySetTag('cart_unique_products', items.length.toString());
          
          // Track variations preferences
          const weightPreferences = items.map(item => item.variation.weight).filter(Boolean);
          const beansPreferences = items.map(item => item.variation.beans).filter(Boolean);
          if (weightPreferences.length > 0) (window as any).trackClaritySetTag('cart_weight_preferences', weightPreferences.join(','));
          if (beansPreferences.length > 0) (window as any).trackClaritySetTag('cart_beans_preferences', beansPreferences.join(','));
        }
      }
    }
  }, [items, totalItems, totalPrice, isInitialized]);

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateItemQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}; 