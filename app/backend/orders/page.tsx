'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface OrderItem {
  id: string;
  productId: string;
  variationId?: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    imageUrl?: string;
    category?: {
      id: string;
      name: string;
      nameAr?: string;
    };
  };
  variation?: {
    id: string;
    size?: { 
      id: string;
      displayName: string;
      name?: string;
    };
    type?: { 
      id: string;
      name: string;
    };
    beans?: { 
      id: string;
      name: string;
    };
    price?: number;
    stockQuantity?: number;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Payment {
  id: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  last4?: string;
  brand?: string;
  receiptUrl?: string;
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    address?: string;
    isNewCustomer?: boolean;
    emailVerified?: boolean;
    lastLoginAt?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  city?: string;
  shippingAddress?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  paymentId?: string;
  stripePaymentIntentId?: string;
  trackingNumber?: string;
  notes?: string;
  emailSent?: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: Payment[];
}

type OrderStatus = 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export default function OrdersPage() {
  const router = useRouter();
  const { t, contentByLang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery })
        });

        const response = await fetch(`/api/orders?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [statusFilter, searchQuery]);
  
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
  };
  
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }
      
      // Update the local state with the updated order
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        )
      );
      
      // Show success message (you could use a toast component here)
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingOrder(orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete order');
      }
      
      // Remove the order from local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      // Close expanded details if this order was expanded
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
      }
      
      console.log(`Order ${orderId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete order');
    } finally {
      setDeletingOrder(null);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) ||
        order.user.name.toLowerCase().includes(query) ||
        order.user.email.toLowerCase().includes(query) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const formatPrice = (amount: number) => {
    return amount.toFixed(2);
  };
  
  return (
    <BackendLayout activePage="orders">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">{t('orders', 'Orders')}</h1>
            <p className="mt-2 text-sm text-gray-700">
              {t('orders_management_description', 'A list of all orders in your store including customer information and order details.')}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Status filter */}
          <div className="w-full sm:w-52">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('status', 'Status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              <option value="ALL">{t('all_statuses', 'All Statuses')}</option>
              <option value="NEW">{t('new', 'New')}</option>
              <option value="PROCESSING">{t('processing', 'Processing')}</option>
              <option value="SHIPPED">{t('shipped', 'Shipped')}</option>
              <option value="DELIVERED">{t('delivered', 'Delivered')}</option>
              <option value="CANCELLED">{t('cancelled', 'Cancelled')}</option>
              <option value="REFUNDED">{t('refunded', 'Refunded')}</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('search', 'Search')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                placeholder={t('search_placeholder', 'Search by order ID, customer name, email...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('no_orders_found', 'No orders found')}</p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          {t('order_id', 'Order ID')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('customer', 'Customer')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('date', 'Date')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('total', 'Total')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('status', 'Status')}
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('actions', 'Actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredOrders.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              #{order.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <div className="font-medium text-gray-900">{order.user.name}</div>
                              <div className="text-gray-500">{order.user.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                              {formatPrice(order.total)} AED
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                disabled={updatingStatus === order.id}
                                className={`${getStatusClass(order.status)} border-0 rounded-full py-1 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50`}
                              >
                                <option value="NEW">{t('new', 'New')}</option>
                                <option value="PROCESSING">{t('processing', 'Processing')}</option>
                                <option value="SHIPPED">{t('shipped', 'Shipped')}</option>
                                <option value="DELIVERED">{t('delivered', 'Delivered')}</option>
                                <option value="CANCELLED">{t('cancelled', 'Cancelled')}</option>
                                <option value="REFUNDED">{t('refunded', 'Refunded')}</option>
                              </select>
                              {updatingStatus === order.id && (
                                <div className="mt-1 text-xs text-gray-500">Updating...</div>
                              )}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleOrderDetails(order.id)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                  {t('details', 'Details')}
                                  {expandedOrderId === order.id ? (
                                    <ChevronUpIcon className="ml-1 h-4 w-4" />
                                  ) : (
                                    <ChevronDownIcon className="ml-1 h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  disabled={deletingOrder === order.id}
                                  className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                  title={t('delete_order', 'Delete Order')}
                                >
                                  {deletingOrder === order.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedOrderId === order.id && (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 sm:px-6">
                                <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                                  
                                  {/* Order Summary Header */}
                                  <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {t('order_details', 'Order Details')} - #{order.id.slice(-8).toUpperCase()}
                                      </h3>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {t('created_on', 'Created on')} {formatDate(order.createdAt)}
                                        {order.updatedAt !== order.createdAt && (
                                          <span> • {t('last_updated', 'Last updated')} {formatDate(order.updatedAt)}</span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-gray-900">{formatPrice(order.total)} AED</div>
                                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
                                        {order.status}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customer & Shipping Information Grid */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Customer Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {t('customer_information', 'Customer Information')}
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-900">{order.customerName || order.user.name}</span>
                                          {order.user.isNewCustomer && (
                                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                              {t('new_customer', 'New Customer')}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-gray-600">
                                          <div>📧 {order.customerEmail || order.user.email}</div>
                                          {(order.customerPhone || order.user.phone) && (
                                            <div>📱 {order.customerPhone || order.user.phone}</div>
                                          )}
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                          <div className="text-xs text-gray-500">
                                            {t('email_verified', 'Email Verified')}: {order.user.emailVerified ? '✅ Yes' : '❌ No'}
                                          </div>
                                          {order.user.lastLoginAt && (
                                            <div className="text-xs text-gray-500">
                                              {t('last_login', 'Last Login')}: {formatDate(order.user.lastLoginAt)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Shipping Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {t('shipping_information', 'Shipping Information')}
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-900">{t('city_region', 'City/Region')}</span>
                                          <div className="text-gray-600">{order.city || order.user.city || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-900">{t('shipping_address', 'Shipping Address')}</span>
                                          <div className="text-gray-600">{order.shippingAddress || order.user.address || '-'}</div>
                                        </div>
                                        {order.trackingNumber && (
                                          <div>
                                            <span className="font-medium text-gray-900">{t('tracking_number', 'Tracking Number')}</span>
                                            <div className="text-gray-600 font-mono">{order.trackingNumber}</div>
                                          </div>
                                        )}
                                        <div className="pt-2 border-t border-gray-100">
                                          <div className="text-xs text-gray-500">
                                            {t('shipping_cost', 'Shipping Cost')}: <span className="font-medium">{formatPrice(order.shippingCost)} AED</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Payment Information */}
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        {t('payment_information', 'Payment Information')}
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-900">{t('payment_method', 'Payment Method')}</span>
                                          <div className="text-gray-600">
                                            {order.paymentMethod || 'Stripe'}
                                            {order.payment && order.payment[0] && (
                                              <span className="ml-2">
                                                {order.payment[0].brand && order.payment[0].last4 
                                                  ? `${order.payment[0].brand.toUpperCase()} ****${order.payment[0].last4}`
                                                  : ''
                                                }
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {(order.stripePaymentIntentId || order.paymentId) && (
                                          <div>
                                            <span className="font-medium text-gray-900">{t('payment_id', 'Payment ID')}</span>
                                            <div className="text-gray-600 font-mono text-xs">
                                              {order.stripePaymentIntentId || order.paymentId}
                                            </div>
                                          </div>
                                        )}
                                        {order.payment && order.payment[0] && (
                                          <>
                                            <div>
                                              <span className="font-medium text-gray-900">{t('payment_status', 'Payment Status')}</span>
                                              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 ${
                                                order.payment[0].status === 'SUCCEEDED' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-yellow-100 text-yellow-800'
                                              }`}>
                                                {order.payment[0].status}
                                              </div>
                                            </div>
                                            {order.payment[0].receiptUrl && (
                                              <div>
                                                <a 
                                                  href={order.payment[0].receiptUrl} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                >
                                                  📄 {t('view_receipt', 'View Receipt')}
                                                </a>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        <div className="pt-2 border-t border-gray-100">
                                          <div className="text-xs text-gray-500">
                                            {t('email_sent', 'Email Sent')}: {order.emailSent ? '✅ Yes' : '❌ No'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Items with Enhanced Details */}
                                  <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      </svg>
                                      {t('order_items', 'Order Items')} ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product', 'Product')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('category', 'Category')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('selected_variations', 'Selected Options')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity', 'Quantity')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('unit_price', 'Unit Price')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subtotal', 'Subtotal')}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {order.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                              <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                  {item.product.imageUrl && (
                                                    <img
                                                      className="h-12 w-12 rounded-lg object-cover mr-3"
                                                      src={item.product.imageUrl}
                                                      alt={item.product.name}
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                      }}
                                                    />
                                                  )}
                                                  <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                      {contentByLang(item.product.name, item.product.nameAr || item.product.name)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">ID: {item.productId}</div>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-sm text-gray-600">
                                                {item.product.category ? (
                                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    {contentByLang(item.product.category.name, item.product.category.nameAr || item.product.category.name)}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400">-</span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-sm text-gray-600">
                                                {item.variation ? (
                                                  <div className="space-y-1">
                                                    <div className="text-xs bg-gray-100 px-2 py-1 rounded flex flex-wrap gap-1">
                                                      {item.variation.size?.displayName && (
                                                        <span className="font-medium text-blue-600">Size: {item.variation.size.displayName}</span>
                                                      )}
                                                      {item.variation.type?.name && (
                                                        <span className="font-medium text-green-600">• Type: {item.variation.type.name}</span>
                                                      )}
                                                      {item.variation.beans?.name && (
                                                        <span className="font-medium text-orange-600">• Beans: {item.variation.beans.name}</span>
                                                      )}
                                                      {item.variation.price && (
                                                        <span className="font-medium text-gray-600">• Price: {formatPrice(item.variation.price)} AED</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded">Standard Product</span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                {item.quantity}
                                              </td>
                                              <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                {formatPrice(item.unitPrice)} AED
                                              </td>
                                              <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                {formatPrice(item.subtotal)} AED
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Order Financial Summary */}
                                  <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                      </svg>
                                      {t('financial_summary', 'Financial Summary')}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500">{t('subtotal', 'Subtotal')}</div>
                                        <div className="text-lg font-semibold text-gray-900">{formatPrice(order.subtotal)} AED</div>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500">{t('tax', 'Tax')}</div>
                                        <div className="text-lg font-semibold text-gray-900">{formatPrice(order.tax)} AED</div>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500">{t('shipping', 'Shipping')}</div>
                                        <div className="text-lg font-semibold text-gray-900">{formatPrice(order.shippingCost)} AED</div>
                                      </div>
                                      {order.discount > 0 && (
                                        <div className="bg-red-50 p-3 rounded-lg">
                                          <div className="text-xs text-red-500">{t('discount', 'Discount')}</div>
                                          <div className="text-lg font-semibold text-red-600">-{formatPrice(order.discount)} AED</div>
                                        </div>
                                      )}
                                      <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-xs text-green-500">{t('total', 'Total')}</div>
                                        <div className="text-xl font-bold text-green-700">{formatPrice(order.total)} AED</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notes and Additional Information */}
                                  {order.notes && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        {t('notes', 'Notes')}
                                      </h4>
                                      <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                                        {order.notes}
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackendLayout>
  );
}
