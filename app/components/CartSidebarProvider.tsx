'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import CartSidebar from './CartSidebar';

// Create context for cart sidebar state
interface CartSidebarContextType {
  isCartSidebarOpen: boolean;
  openCartSidebar: () => void;
  closeCartSidebar: () => void;
}

const CartSidebarContext = createContext<CartSidebarContextType>({
  isCartSidebarOpen: false,
  openCartSidebar: () => {},
  closeCartSidebar: () => {},
});

export const useCartSidebar = () => useContext(CartSidebarContext);

// Cart Sidebar Provider Component
export default function CartSidebarProvider({ children }: { children: ReactNode }) {
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  const openCartSidebar = () => setIsCartSidebarOpen(true);
  const closeCartSidebar = () => setIsCartSidebarOpen(false);

  return (
    <CartSidebarContext.Provider 
      value={{ 
        isCartSidebarOpen, 
        openCartSidebar, 
        closeCartSidebar 
      }}
    >
      {children}
      <CartSidebar 
        isOpen={isCartSidebarOpen} 
        onClose={closeCartSidebar} 
      />
    </CartSidebarContext.Provider>
  );
} 