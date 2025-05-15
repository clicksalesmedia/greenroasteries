'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(currentItems => 
      currentItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

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