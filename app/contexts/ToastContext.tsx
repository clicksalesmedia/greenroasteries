'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import Toast from '../components/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(0);

  const showToast = (message: string, type: ToastType = 'success') => {
    // Increment counter for unique IDs
    toastCounter.current += 1;
    const id = `${Date.now()}-${toastCounter.current}`;
    
    // Limit number of toasts to 3 at a time
    setToasts((prevToasts) => {
      // If we already have 3 toasts, remove the oldest one
      if (prevToasts.length >= 3) {
        return [...prevToasts.slice(1), { id, message, type }];
      }
      return [...prevToasts, { id, message, type }];
    });
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 