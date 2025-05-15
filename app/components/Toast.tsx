'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      const fadeOutTimer = setTimeout(() => {
        onClose();
      }, 300); // Wait for fade out animation to complete
      
      return () => clearTimeout(fadeOutTimer);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get toast background color based on type
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500';
      case 'error':
        return 'bg-red-50 border-red-500';
      case 'info':
        return 'bg-blue-50 border-blue-500';
      default:
        return 'bg-green-50 border-green-500';
    }
  };

  // Get toast icon and text color based on type
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
          textColor: 'text-red-800'
        };
      case 'info':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />,
          textColor: 'text-blue-800'
        };
      default:
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          textColor: 'text-green-800'
        };
    }
  };

  const { icon, textColor } = getIconAndColor();

  return (
    <div className={`fixed top-4 right-4 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`rounded-md border shadow-lg py-3 px-4 ${getBgColor()} max-w-md transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-4'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className={`ml-3 ${textColor} flex-1 pr-6`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' : 
                  type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' : 
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a keyframe animation for the toast
const styles = `
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-fade-in-down {
  animation: fadeInDown 0.3s ease-out forwards;
}
`; 