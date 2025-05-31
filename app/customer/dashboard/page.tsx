'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  trackingNumber?: string;
  customerName: string;
  customerEmail: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      imageUrl?: string;
    };
  }[];
}

export default function CustomerDashboard() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  // First useEffect to set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Second useEffect for client-side logic only
  useEffect(() => {
    if (!isClient) return;

    const token = localStorage.getItem('customerToken');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    fetchCustomerData(token);
  }, [router, isClient]);

  const fetchCustomerData = async (token: string) => {
    try {
      setLoading(true);

      // Fetch customer profile
      const profileResponse = await fetch('/api/customer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCustomer(profileData.customer);
      }

      // Fetch customer orders
      const ordersResponse = await fetch('/api/customer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerId');
    }
    router.push('/customer/login');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PROCESSING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'SHIPPED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading state until client-side hydration is complete
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-green-50 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-green-100">
        <div className="container mx-auto px-4 py-6">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">🌱</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t('my_account', 'My Account')}
                  </h1>
                  <p className="text-gray-600">
                    {t('welcome_back', 'Welcome back')}, <span className="font-semibold text-green-700">{customer?.name || customer?.email}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className={`flex items-center space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-green-700 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-green-50"
              >
                <span>🏪</span>
                <span>{t('back_to_store', 'Back to Store')}</span>
              </Link>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-2xl shadow-xl p-6 border border-green-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                {t('navigation', 'Navigation')}
              </h2>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'overview' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <span>📊</span>
                    <span>{t('overview', 'Overview')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'orders' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <span>📦</span>
                    <span>{t('my_orders', 'My Orders')}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === 'profile' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <span>👤</span>
                    <span>{t('profile', 'Profile')}</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📦</span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {t('total_orders', 'Total Orders')}
                    </h3>
                    <p className="text-gray-600 text-sm">{t('all_time_orders', 'All time orders')}</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">💰</span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">
                          {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </p>
                        <p className="text-green-600 font-semibold">AED</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {t('total_spent', 'Total Spent')}
                    </h3>
                    <p className="text-gray-600 text-sm">{t('lifetime_value', 'Lifetime value')}</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">⏳</span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-yellow-600">
                          {orders.filter(order => ['NEW', 'PROCESSING'].includes(order.status)).length}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {t('pending_orders', 'Pending Orders')}
                    </h3>
                    <p className="text-gray-600 text-sm">{t('in_progress', 'In progress')}</p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                      <span className="mr-3">📋</span>
                      {t('recent_orders', 'Recent Orders')}
                    </h3>
                    {orders.length > 3 && (
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-green-600 hover:text-green-700 font-semibold flex items-center space-x-2"
                      >
                        <span>{t('view_all', 'View All')}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-green-200">
                          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                                <span className="text-green-700 font-bold">#{order.id.slice(-3)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-lg text-gray-900">#{order.id.slice(-8)}</p>
                                <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              <p className="text-2xl font-bold text-gray-900 mt-2">{order.total.toFixed(2)} AED</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📦</span>
                      </div>
                      <p className="text-xl text-gray-500 mb-4">{t('no_orders_yet', 'No orders yet')}</p>
                      <p className="text-gray-400 mb-6">{t('start_shopping_desc', 'Discover our premium coffee collection')}</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="mr-2">🛍️</span>
                        {t('start_shopping', 'Start Shopping')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="mr-3">📦</span>
                  {t('order_history', 'Order History')}
                </h3>
                {orders.length > 0 ? (
                  <div className="space-y-8">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-green-200">
                        <div className={`flex items-start justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                              <span className="text-green-700 font-bold text-lg">#{order.id.slice(-3)}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-xl text-gray-900">#{order.id.slice(-8)}</h4>
                              <p className="text-gray-600 text-lg">{formatDate(order.createdAt)}</p>
                              {order.trackingNumber && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">{t('tracking', 'Tracking')}:</span>
                                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-mono font-semibold">
                                    {order.trackingNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="text-3xl font-bold text-gray-900 mt-3">{order.total.toFixed(2)} AED</p>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📋</span>
                            {t('order_items', 'Order Items')}
                          </h5>
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item.id} className={`flex items-center space-x-4 ${language === 'ar' ? 'space-x-reverse flex-row-reverse' : ''} bg-white rounded-lg p-4`}>
                                {item.product.imageUrl ? (
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="w-20 h-20 object-cover rounded-lg shadow-md"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                    <span className="text-green-700 text-2xl">☕</span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-lg text-gray-900">{item.product.name}</p>
                                  <p className="text-gray-600">
                                    {t('quantity', 'Qty')}: <span className="font-semibold">{item.quantity}</span> × <span className="font-semibold">{item.unitPrice.toFixed(2)} AED</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                      <span className="text-6xl">📦</span>
                    </div>
                    <p className="text-2xl text-gray-500 mb-4">{t('no_orders', 'You haven\'t placed any orders yet')}</p>
                    <p className="text-gray-400 mb-8">{t('discover_coffee', 'Discover our premium coffee collection and place your first order')}</p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                    >
                      <span className="mr-3">🛍️</span>
                      {t('start_shopping', 'Start Shopping')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="mr-3">👤</span>
                  {t('profile_information', 'Profile Information')}
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="mr-2">👤</span>
                      {t('full_name', 'Full Name')}
                    </label>
                    <p className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-lg">
                      {customer?.name || t('not_provided', 'Not provided')}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="mr-2">📧</span>
                      {t('email_address', 'Email Address')}
                    </label>
                    <p className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-lg">
                      {customer?.email}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="mr-2">📱</span>
                      {t('phone_number', 'Phone Number')}
                    </label>
                    <p className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-lg">
                      {customer?.phone || t('not_provided', 'Not provided')}
                    </p>
                  </div>
                  
                  <div className="pt-6">
                    <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2">
                      <span>✏️</span>
                      <span>{t('update_profile', 'Update Profile')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 