'use client';

import { useCart } from '../../contexts/CartContext';
import Image from 'next/image';

export default function OrderSummary() {
  const { items, totalItems, totalPrice } = useCart();

  // Format price to 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Shipping cost calculation - Free for orders over 75 AED
  const shippingCost = totalPrice >= 75 ? 0 : 10;
  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>

      {/* Item list */}
      <div className="max-h-80 overflow-y-auto mb-6 pr-1">
        {items.map(item => (
          <div key={item.id} className="flex items-start py-3 border-b last:border-b-0">
            {/* Item image */}
            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative">
              {item.image ? (
                <Image 
                  src={item.image} 
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 64px, 64px"
                  className="object-contain rounded"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {item.quantity > 1 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {item.quantity}
                </span>
              )}
            </div>
            
            {/* Item details */}
            <div className="ml-4 flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {Object.values(item.variation).filter(Boolean).join(', ')}
              </p>
              <div className="mt-1 text-sm font-medium">{formatPrice(item.price)}D</div>
            </div>
          </div>
        ))}
      </div>

      {/* Price summary */}
      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({totalItems} items)</span>
          <span className="font-medium">{formatPrice(totalPrice)}D</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">
            {shippingCost === 0 ? 'Free' : `${formatPrice(shippingCost)}D`}
          </span>
        </div>
        {shippingCost > 0 && (
          <div className="text-xs text-gray-500 italic">
            Free shipping on orders over 75D
          </div>
        )}
        {/* Tax would go here */}
      </div>

      {/* Total */}
      <div className="flex justify-between mb-6">
        <span className="text-lg font-bold">Total</span>
        <span className="text-lg font-bold">{formatPrice(finalTotal)}D</span>
      </div>

      {/* Payment methods icons */}
      <div className="border-t pt-4">
        <div className="flex justify-center space-x-2 mb-2">
          <img src="/images/payment-methods.svg" alt="Payment methods" className="h-6" />
        </div>
        <p className="text-xs text-center text-gray-500">
          All transactions are secure and encrypted.
        </p>
      </div>
    </div>
  );
} 