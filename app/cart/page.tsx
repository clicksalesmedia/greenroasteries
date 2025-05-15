'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateItemQuantity } = useCart();
  const { t } = useLanguage();
  const [couponCode, setCouponCode] = useState('');

  // Format price to 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Handle quantity changes
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItemQuantity(itemId, newQuantity);
  };

  // Empty cart message
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('your_cart', 'Your Cart')}</h1>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-600 mb-6">{t('cart_empty', 'Your cart is currently empty.')}</p>
          <Link href="/shop" className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            {t('continue_shopping', 'Continue Shopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('your_cart', 'Your Cart')}</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items (Left Column) */}
        <div className="lg:col-span-8 mb-8 lg:mb-0">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Cart Header */}
            <div className="hidden md:grid md:grid-cols-12 bg-gray-50 p-4 border-b">
              <div className="md:col-span-6 font-medium text-gray-700">{t('product', 'Product')}</div>
              <div className="md:col-span-2 font-medium text-gray-700 text-center">{t('price', 'Price')}</div>
              <div className="md:col-span-2 font-medium text-gray-700 text-center">{t('quantity', 'Quantity')}</div>
              <div className="md:col-span-2 font-medium text-gray-700 text-center">{t('total', 'Total')}</div>
            </div>
            
            {/* Cart Items */}
            {items.map(item => (
              <div key={item.id} className="p-4 md:p-6 border-b last:border-b-0 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                {/* Product Info */}
                <div className="md:col-span-6 flex mb-4 md:mb-0">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {Object.values(item.variation).filter(Boolean).join(', ')}
                    </p>
                    
                    {/* Mobile Price */}
                    <div className="md:hidden mt-2 flex justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {t('price', 'Price')}: ${formatPrice(item.price)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {t('total', 'Total')}: ${formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                    
                    {/* Mobile Remove Button */}
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="md:hidden mt-3 text-sm text-red-600 hover:text-red-800 flex items-center"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {t('remove', 'Remove')}
                    </button>
                  </div>
                </div>
                
                {/* Price */}
                <div className="hidden md:block md:col-span-2 text-center">
                  <span className="text-sm font-medium text-gray-900">${formatPrice(item.price)}</span>
                </div>
                
                {/* Quantity */}
                <div className="md:col-span-2 flex justify-center my-4 md:my-0">
                  <div className="flex border border-gray-300 rounded">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center py-1">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Total & Remove (Desktop) */}
                <div className="hidden md:flex md:col-span-2 justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">${formatPrice(item.price * item.quantity)}</span>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label={t('remove', 'Remove item')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Continue Shopping Button */}
            <div className="p-4 md:p-6 bg-gray-50 flex justify-between">
              <Link 
                href="/shop" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                {t('continue_shopping', 'Continue Shopping')}
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                {t('update_cart', 'Update Cart')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Summary (Right Column) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">{t('order_summary', 'Order Summary')}</h2>
            
            {/* Coupon Code Section */}
            <div className="mb-6 pb-6 border-b">
              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
                {t('discount_code', 'Discount Code')}
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-black focus:border-black"
                  placeholder={t('enter_code', 'Enter code')}
                />
                <button
                  type="button"
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded-r-md border border-gray-300 border-l-0 hover:bg-gray-200"
                >
                  {t('apply', 'Apply')}
                </button>
              </div>
            </div>
            
            {/* Price Summary */}
            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t('subtotal', 'Subtotal')} ({totalItems} {t('items', 'items')})
                </span>
                <span className="font-medium">${formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('shipping', 'Shipping')}</span>
                <span className="font-medium">{t('free', 'Free')}</span>
              </div>
              {/* Discount would go here if coupon is valid */}
            </div>
            
            {/* Total */}
            <div className="flex justify-between mb-6">
              <span className="text-lg font-bold">{t('total', 'Total')}</span>
              <span className="text-lg font-bold">${formatPrice(totalPrice)}</span>
            </div>
            
            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="w-full bg-black text-white py-3 px-6 rounded-md text-center font-medium hover:bg-gray-800 transition"
            >
              {t('proceed_to_checkout', 'Proceed to Checkout')}
            </Link>
            
            {/* Secure Checkout Message */}
            <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('secure_checkout', 'Secure Checkout')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 