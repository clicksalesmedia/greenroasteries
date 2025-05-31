'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    imageUrl?: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
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
                              <td colSpan={6} className="px-4 py-4 sm:px-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  {/* Order Details */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">{t('shipping_information', 'Shipping Information')}</h4>
                                      <div className="text-sm text-gray-500">
                                        <p>{order.user.name}</p>
                                        {order.user.phone && <p>{order.user.phone}</p>}
                                        {order.shippingAddress && <p>{order.shippingAddress}</p>}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">{t('payment_information', 'Payment Information')}</h4>
                                      <div className="text-sm text-gray-500">
                                        <p>{t('payment_method', 'Payment Method')}: {order.paymentMethod || '-'}</p>
                                        {order.paymentId && <p>{t('payment_id', 'Payment ID')}: {order.paymentId}</p>}
                                        {order.trackingNumber && (
                                          <p>{t('tracking_number', 'Tracking Number')}: {order.trackingNumber}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Order Items */}
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">{t('order_items', 'Order Items')}</h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('product', 'Product')}</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('unit_price', 'Unit Price')}</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('quantity', 'Quantity')}</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('subtotal', 'Subtotal')}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {order.items.map((item) => (
                                          <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-sm text-gray-500">
                                              {contentByLang(item.product.name, item.product.nameAr || item.product.name)}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-500">
                                              {formatPrice(item.unitPrice)} AED
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-500">
                                              {item.quantity}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-500">
                                              {formatPrice(item.subtotal)} AED
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="bg-gray-50">
                                          <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{t('subtotal', 'Subtotal')}</td>
                                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatPrice(order.subtotal)} AED</td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                          <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{t('tax', 'Tax')}</td>
                                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatPrice(order.tax)} AED</td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                          <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{t('shipping', 'Shipping')}</td>
                                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatPrice(order.shippingCost)} AED</td>
                                        </tr>
                                        {order.discount > 0 && (
                                          <tr className="bg-gray-50">
                                            <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{t('discount', 'Discount')}</td>
                                            <td className="px-3 py-2 text-sm font-medium text-red-600">-{formatPrice(order.discount)} AED</td>
                                          </tr>
                                        )}
                                        <tr className="bg-gray-200">
                                          <td colSpan={3} className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{t('total', 'Total')}</td>
                                          <td className="px-3 py-2 text-sm font-bold text-gray-900">{formatPrice(order.total)} AED</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                  
                                  {/* Notes */}
                                  {order.notes && (
                                    <div className="mt-4">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">{t('notes', 'Notes')}</h4>
                                      <p className="text-sm text-gray-500">{order.notes}</p>
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
