'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import UAEDirhamSymbol from '../../components/UAEDirhamSymbol';

export default function ThankYouPage() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Retrieve the order details from localStorage
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      try {
        const orderData = JSON.parse(savedOrder);
        setOrderDetails(orderData);
      } catch (error) {
        console.error('Failed to parse order details:', error);
      }
    }
  }, []);

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
          <p className="text-gray-600 mb-8">
            Your order has been successfully processed.
          </p>
          <Link href="/shop" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price with UAE Dirham symbol
  const formatPrice = (price: number) => {
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Success Banner */}
        <div className="bg-green-50 p-6 border-b border-green-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-green-800">Thank you for your order!</h1>
              <p className="text-green-700">
                Your order has been successfully placed and is being processed.
              </p>
              {orderDetails.isNewCustomer && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 text-sm font-medium">
                    🎉 Welcome to Green Roasteries! We've created an account for you.
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Check your email for login credentials to track your orders and manage your profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Information */}
        <div className="p-6 md:p-8">
          <div className="border-b pb-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Order Number:</p>
                <p className="font-medium">{orderDetails.orderId}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Order Date:</p>
                <p className="font-medium">{formatDate(orderDetails.orderDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Email:</p>
                <p className="font-medium">{orderDetails.customerInfo.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Payment Method:</p>
                <p className="font-medium">Stripe Payment</p>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="border-b pb-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Recipient:</p>
                <p className="font-medium">{orderDetails.customerInfo.fullName}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Phone Number:</p>
                <p className="font-medium">{orderDetails.customerInfo.phone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-600 text-sm mb-1">Delivery Address:</p>
                <p className="font-medium">
                  {orderDetails.shippingInfo.address}, {orderDetails.shippingInfo.city}
                </p>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            {/* Item list */}
            <div className="border rounded-md mb-6 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Quantity</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderDetails.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {item.image && (
                            <div className="h-16 w-16 flex-shrink-0 mr-4 bg-gray-100 rounded overflow-hidden">
                              <div className="h-full w-full relative">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="64px"
                                  className="object-contain"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">{Object.values(item.variation).filter(Boolean).join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">{item.quantity}</td>
                      <td className="py-4 px-4 text-right">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-right font-medium">Subtotal:</td>
                    <td className="py-3 px-4 text-right">{formatPrice(orderDetails.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-right font-medium">Shipping:</td>
                    <td className="py-3 px-4 text-right">Free</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="py-3 px-4 text-right font-bold">Total:</td>
                    <td className="py-3 px-4 text-right font-bold">{formatPrice(orderDetails.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Actions */}
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You will receive an email confirmation shortly at {orderDetails.customerInfo.email}
              </p>
              <Link href="/shop" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 