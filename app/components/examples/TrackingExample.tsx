'use client';

import { useState } from 'react';
import { trackEcommerceEvent, GA4, FacebookPixel, GoogleAds } from '@/app/lib/tracking';

// Example product data
const exampleProduct = {
  id: 'COFFEE_BEANS_001',
  name: 'Premium Arabica Coffee Beans',
  category: 'Coffee',
  price: 35.00,
  currency: 'AED'
};

// Example user data
const exampleUser = {
  email: 'customer@example.com',
  phone: '+971501234567',
  first_name: 'Ahmed',
  last_name: 'Al-Mansouri'
};

export default function TrackingExample() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Track page view
  const trackPageView = () => {
    GA4.pageView('Product Page - ' + exampleProduct.name);
    FacebookPixel.pageView();
    console.log('✅ Page view tracked');
  };

  // Track add to cart
  const trackAddToCart = async () => {
    setIsTracking(true);
    
    try {
      await trackEcommerceEvent('add_to_cart', {
        items: [{
          item_id: exampleProduct.id,
          item_name: exampleProduct.name,
          category: exampleProduct.category,
          quantity: 1,
          price: exampleProduct.price
        }],
        value: exampleProduct.price,
        currency: exampleProduct.currency,
        user_data: exampleUser,
        enableServerSide: true
      });

      setCartItems([...cartItems, exampleProduct]);
      console.log('✅ Add to cart tracked (client + server-side)');
    } catch (error) {
      console.error('❌ Error tracking add to cart:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track begin checkout
  const trackBeginCheckout = async () => {
    setIsTracking(true);
    
    try {
      await trackEcommerceEvent('begin_checkout', {
        items: cartItems.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          quantity: 1,
          price: item.price
        })),
        value: cartItems.reduce((sum, item) => sum + item.price, 0),
        currency: exampleProduct.currency,
        user_data: exampleUser,
        enableServerSide: true
      });

      console.log('✅ Begin checkout tracked (client + server-side)');
    } catch (error) {
      console.error('❌ Error tracking begin checkout:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track purchase
  const trackPurchase = async () => {
    setIsTracking(true);
    const orderId = 'ORDER_' + Date.now();
    const orderValue = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    try {
      await trackEcommerceEvent('purchase', {
        items: cartItems.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          quantity: 1,
          price: item.price
        })),
        value: orderValue,
        currency: exampleProduct.currency,
        transaction_id: orderId,
        user_data: exampleUser,
        enableServerSide: true
      });

      console.log(`✅ Purchase tracked (client + server-side) - Order: ${orderId}`);
      setCartItems([]); // Clear cart after purchase
    } catch (error) {
      console.error('❌ Error tracking purchase:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track custom events
  const trackNewsletterSignup = () => {
    GA4.customEvent('sign_up', {
      method: 'newsletter',
      user_id: exampleUser.email
    });

    FacebookPixel.lead(0, exampleProduct.currency);
    console.log('✅ Newsletter signup tracked');
  };

  const trackSearch = () => {
    GA4.customEvent('search', {
      search_term: 'coffee beans'
    });
    console.log('✅ Search event tracked');
  };

  // Test server-side APIs directly
  const testFacebookAPI = async () => {
    setIsTracking(true);
    
    try {
      const response = await fetch('/api/tracking/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'ViewContent',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: exampleUser,
          custom_data: {
            value: exampleProduct.price,
            currency: exampleProduct.currency,
            content_ids: [exampleProduct.id]
          }
        })
      });

      const result = await response.json();
      console.log('✅ Facebook API Response:', result);
    } catch (error) {
      console.error('❌ Facebook API Error:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const testGoogleAPI = async () => {
    setIsTracking(true);
    
    try {
      const response = await fetch('/api/tracking/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'ga4',
          conversion_action: 'view_item',
          conversion_value: exampleProduct.price,
          currency_code: exampleProduct.currency,
          user_data: exampleUser
        })
      });

      const result = await response.json();
      console.log('✅ Google API Response:', result);
    } catch (error) {
      console.error('❌ Google API Error:', error);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔍 E-commerce Tracking Demo
      </h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Product Example</h3>
        <p><strong>Name:</strong> {exampleProduct.name}</p>
        <p><strong>Price:</strong> {exampleProduct.price} {exampleProduct.currency}</p>
        <p><strong>Category:</strong> {exampleProduct.category}</p>
        <p><strong>Cart Items:</strong> {cartItems.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">E-commerce Events</h4>
          
          <button
            onClick={trackPageView}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isTracking}
          >
            📄 Track Page View
          </button>
          
          <button
            onClick={trackAddToCart}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={isTracking}
          >
            🛒 Add to Cart
          </button>
          
          <button
            onClick={trackBeginCheckout}
            className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            disabled={isTracking || cartItems.length === 0}
          >
            💳 Begin Checkout
          </button>
          
          <button
            onClick={trackPurchase}
            className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={isTracking || cartItems.length === 0}
          >
            ✅ Complete Purchase
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Custom Events</h4>
          
          <button
            onClick={trackNewsletterSignup}
            className="w-full p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            disabled={isTracking}
          >
            📧 Newsletter Signup
          </button>
          
          <button
            onClick={trackSearch}
            className="w-full p-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
            disabled={isTracking}
          >
            🔍 Search Event
          </button>
          
          <button
            onClick={testFacebookAPI}
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isTracking}
          >
            📘 Test Facebook API
          </button>
          
          <button
            onClick={testGoogleAPI}
            className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            disabled={isTracking}
          >
            🔴 Test Google API
          </button>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>📝 Note:</strong> Check your browser's developer console to see tracking events and API responses.
          This demo tracks events to GA4, Facebook Pixel, Google Ads, and server-side APIs (when configured).
        </p>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Quick Setup Reminder:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Add your tracking IDs to environment variables</li>
          <li>• Configure the tracking system in `/backend/tracking`</li>
          <li>• Import tracking functions: import trackEcommerceEvent from @/app/lib/tracking</li>
          <li>• Enable server-side tracking for better accuracy</li>
        </ul>
      </div>
    </div>
  );
} 