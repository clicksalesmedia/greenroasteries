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

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    fetchCustomerData(token);
  }, [router]);

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
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerId');
    router.push('/customer/login');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('my_account', 'My Account')}
              </h1>
              <p className="text-gray-600">
                {t('welcome_back', 'Welcome back')}, {customer?.name || customer?.email}
              </p>
            </div>
            <div className={`flex items-center space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              <Link
                href="/"
                className="text-gray-600 hover:text-black transition-colors"
              >
                {t('back_to_store', 'Back to Store')}
              </Link>
              <button
                onClick={logout}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
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
            <nav className="bg-white rounded-lg shadow-sm p-6">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'overview' 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('overview', 'Overview')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'orders' 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('my_orders', 'My Orders')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('profile', 'Profile')}
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('total_orders', 'Total Orders')}
                    </h3>
                    <p className="text-3xl font-bold text-black">{orders.length}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('total_spent', 'Total Spent')}
                    </h3>
                    <p className="text-3xl font-bold text-black">
                      {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('pending_orders', 'Pending Orders')}
                    </h3>
                    <p className="text-3xl font-bold text-black">
                      {orders.filter(order => ['NEW', 'PROCESSING'].includes(order.status)).length}
                    </p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('recent_orders', 'Recent Orders')}
                  </h3>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div>
                              <p className="font-semibold">#{order.id.slice(-8)}</p>
                              <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              <p className="text-lg font-semibold mt-1">{order.total.toFixed(2)} AED</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      {t('no_orders_yet', 'No orders yet')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {t('order_history', 'Order History')}
                </h3>
                {orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-6">
                        <div className={`flex items-start justify-between mb-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <div>
                            <h4 className="font-semibold text-lg">#{order.id.slice(-8)}</h4>
                            <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                            {order.trackingNumber && (
                              <p className="text-sm text-gray-600 mt-1">
                                {t('tracking', 'Tracking')}: {order.trackingNumber}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="text-xl font-bold mt-2">{order.total.toFixed(2)} AED</p>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className={`flex items-center space-x-4 ${language === 'ar' ? 'space-x-reverse flex-row-reverse' : ''}`}>
                              {item.product.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-gray-600">
                                  {t('quantity', 'Qty')}: {item.quantity} × {item.unitPrice.toFixed(2)} AED
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">{t('no_orders', 'You haven\'t placed any orders yet')}</p>
                    <Link
                      href="/shop"
                      className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      {t('start_shopping', 'Start Shopping')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {t('profile_information', 'Profile Information')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('full_name', 'Full Name')}
                    </label>
                    <p className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {customer?.name || t('not_provided', 'Not provided')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email_address', 'Email Address')}
                    </label>
                    <p className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {customer?.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phone_number', 'Phone Number')}
                    </label>
                    <p className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {customer?.phone || t('not_provided', 'Not provided')}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
                      {t('update_profile', 'Update Profile')}
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