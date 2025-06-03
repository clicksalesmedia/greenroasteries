'use client';

import React, { useState } from 'react';
import { trackEcommerceEvent, trackAddToCart, trackBeginCheckout, trackPurchase, trackPageView } from '@/app/lib/tracking';

// Example product data
const exampleProduct = {
  id: 'prod_123',
  name: 'Premium Coffee Beans',
  price: 45.00,
  currency: 'AED',
  category: 'Coffee'
};

// Example user data (for server-side tracking)
const exampleUser = {
  email: 'customer@example.com',
  phone: '+971501234567',
  first_name: 'John',
  last_name: 'Doe'
};

export default function TrackingExample() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Track page view using new API
  const handleTrackPageView = () => {
    trackPageView(window.location.href, document.title, 'user_123');
    console.log('✅ Page view tracked');
  };

  // Track add to cart using new API
  const handleTrackAddToCart = async () => {
    setIsTracking(true);
    
    try {
      await trackAddToCart({
        item_id: exampleProduct.id,
        item_name: exampleProduct.name,
        category: exampleProduct.category,
        quantity: 1,
        price: exampleProduct.price
      }, exampleProduct.price, exampleProduct.currency, 'user_123');

      setCartItems([...cartItems, exampleProduct]);
      console.log('✅ Add to cart tracked');
    } catch (error) {
      console.error('❌ Error tracking add to cart:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track begin checkout using new API
  const handleTrackBeginCheckout = async () => {
    setIsTracking(true);
    
    try {
      const items = cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        price: item.price
      }));
      
      const totalValue = cartItems.reduce((sum, item) => sum + item.price, 0);

      await trackBeginCheckout(totalValue, exampleProduct.currency, items, 'user_123');

      console.log('✅ Begin checkout tracked');
    } catch (error) {
      console.error('❌ Error tracking begin checkout:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track purchase using new API
  const handleTrackPurchase = async () => {
    setIsTracking(true);
    const orderId = 'ORDER_' + Date.now();
    const orderValue = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    try {
      const items = cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        price: item.price
      }));

      await trackPurchase(orderId, orderValue, exampleProduct.currency, items, 'user_123');

      console.log(`✅ Purchase tracked - Order: ${orderId}`);
      setCartItems([]); // Clear cart after purchase
    } catch (error) {
      console.error('❌ Error tracking purchase:', error);
    } finally {
      setIsTracking(false);
    }
  };

  // Track custom events using new API
  const handleTrackNewsletterSignup = async () => {
    setIsTracking(true);
    
    try {
      await trackEcommerceEvent('newsletter_signup', {
        userId: 'user_123',
        eventData: {
          method: 'newsletter',
          source: 'demo'
        }
      });
      console.log('✅ Newsletter signup tracked');
    } catch (error) {
      console.error('❌ Error tracking newsletter signup:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const handleTrackSearch = async () => {
    setIsTracking(true);
    
    try {
      await trackEcommerceEvent('search', {
        userId: 'user_123',
        eventData: {
          search_term: 'coffee beans'
        }
      });
      console.log('✅ Search event tracked');
    } catch (error) {
      console.error('❌ Error tracking search:', error);
    } finally {
      setIsTracking(false);
    }
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
          user_data: {
            em: 'customer@example.com', // hashed email
            ph: '+971501234567', // hashed phone
            fn: 'john', // hashed first name
            ln: 'doe' // hashed last name
          },
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
          client_id: 'user_123'
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
            onClick={handleTrackPageView}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isTracking}
          >
            📄 Track Page View
          </button>
          
          <button
            onClick={handleTrackAddToCart}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={isTracking}
          >
            🛒 Add to Cart
          </button>
          
          <button
            onClick={handleTrackBeginCheckout}
            className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            disabled={isTracking || cartItems.length === 0}
          >
            💳 Begin Checkout
          </button>
          
          <button
            onClick={handleTrackPurchase}
            className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={isTracking || cartItems.length === 0}
          >
            💰 Complete Purchase
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Custom Events</h4>
          
          <button
            onClick={handleTrackNewsletterSignup}
            className="w-full p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            disabled={isTracking}
          >
            📧 Newsletter Signup
          </button>
          
          <button
            onClick={handleTrackSearch}
            className="w-full p-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
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
            📊 Test Google API
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p className="mb-2">
          <strong>Instructions:</strong> Open your browser's developer console to see tracking results.
        </p>
        <p className="mb-2">
          1. Click "Track Page View" to track a page view event
        </p>
        <p className="mb-2">
          2. Click "Add to Cart" to add the product to cart and track the event
        </p>
        <p className="mb-2">
          3. Click "Begin Checkout" to track checkout initiation (requires items in cart)
        </p>
        <p className="mb-2">
          4. Click "Complete Purchase" to track a purchase (requires items in cart)
        </p>
        <p className="mb-2">
          5. Use custom events to test newsletter signup and search functionality
        </p>
        <p>
          6. Test server-side APIs directly with Facebook and Google API buttons
        </p>
      </div>
    </div>
  );
} 