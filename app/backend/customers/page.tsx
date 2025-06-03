'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Order {
  id: string;
  total: number;
  status: 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  isActive?: boolean;
  isNewCustomer?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string; // This is joinedDate in the frontend
  totalSpent: number;
  totalOrders: number;
  lastOrderDate?: string;
  orders: Order[];
}

type CustomerStatus = 'active' | 'inactive' | 'new' | 'returned' | 'refunded';
type CustomerStatusFilter = CustomerStatus | 'all';

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'orders' | 'recent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0
  });
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          ...(searchQuery && { search: searchQuery })
        });

        const response = await fetch(`/api/customers?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        
        const data = await response.json();
        
        // Map API response to our Customer interface
        const mappedCustomers: Customer[] = (data.customers || []).map((customer: any) => ({
          ...customer,
          // API already includes totalSpent, totalOrders, lastOrderDate from the response
        }));
        
        setCustomers(mappedCustomers);
        calculateStats(mappedCustomers);
        
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again.');
        
        // Create dummy customers for development if API fails
        const dummyData = createDummyCustomers();
        setCustomers(dummyData);
        calculateStats(dummyData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [searchQuery]);
  
  // Calculate customer stats
  const calculateStats = (customerData: Customer[]) => {
    const activeCustomers = customerData.filter(c => c.isActive !== false).length;
    
    // Assuming customers joined in the last 30 days are considered "new"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCustomers = customerData.filter(c => {
      const joinDate = new Date(c.createdAt);
      return joinDate >= thirtyDaysAgo || c.isNewCustomer;
    }).length;
    
    // Customers who have made more than one order
    const returningCustomers = customerData.filter(c => c.totalOrders > 1).length;
    
    setStats({
      totalCustomers: customerData.length,
      activeCustomers,
      newCustomers,
      returningCustomers
    });
  };
  
  const createDummyCustomers = (): Customer[] => {
    const orderStatuses: Order['status'][] = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const isActive = Math.random() > 0.2;
      const isNewCustomer = Math.random() > 0.7;
      const totalOrders = Math.floor(Math.random() * 10) + (isNewCustomer ? 0 : 1);
      
      // Generate join date between 1 year ago and now
      const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Generate orders
      const orders: Order[] = Array.from({ length: totalOrders }, (_, j) => {
        const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        // Orders should be after join date
        const joinDate = new Date(createdAt);
        const orderDate = new Date(joinDate.getTime() + Math.random() * (Date.now() - joinDate.getTime()));
        
        return {
          id: `order-${i}-${j}`,
          total: Math.floor(Math.random() * 200) + 50,
          status: orderStatus,
          createdAt: orderDate.toISOString()
        };
      });
      
      // Sort orders by date (newest first)
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Calculate total spent based on orders
      const totalSpent = orders.reduce((sum, order) => {
        // Only include completed orders in total spent
        if (['DELIVERED', 'SHIPPED'].includes(order.status)) {
          return sum + order.total;
        }
        return sum;
      }, 0);
      
      // Latest order date
      const lastOrderDate = orders.length > 0 ? orders[0].createdAt : undefined;
      
      return {
        id: `cust-${i + 1}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: Math.random() > 0.3 ? `+1-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}` : undefined,
        address: Math.random() > 0.4 ? `${Math.floor(Math.random() * 1000) + 1} Main St, City, Country` : undefined,
        city: Math.random() > 0.5 ? `City ${i + 1}` : undefined,
        createdAt,
        isActive,
        isNewCustomer,
        emailVerified: Math.random() > 0.3,
        totalSpent,
        totalOrders,
        lastOrderDate,
        orders
      };
    });
  };
  
  // Apply filters and sorting
  const filteredCustomers = customers
    // Apply status filter
    .filter(customer => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return customer.isActive !== false;
      if (statusFilter === 'inactive') return customer.isActive === false;
      if (statusFilter === 'new') return customer.isNewCustomer === true;
      return true; // For other filters that might not be implemented yet
    })
    // Apply search filter
    .filter(customer => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        (customer.phone && customer.phone.toLowerCase().includes(query))
      );
    })
    // Apply sorting
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        case 'spend':
          return sortOrder === 'asc' 
            ? a.totalSpent - b.totalSpent 
            : b.totalSpent - a.totalSpent;
        case 'orders':
          return sortOrder === 'asc' 
            ? a.totalOrders - b.totalOrders 
            : b.totalOrders - a.totalOrders;
        case 'recent':
          // Sort by last order date or join date if no orders
          const aDate = a.lastOrderDate ? new Date(a.lastOrderDate) : new Date(a.createdAt);
          const bDate = b.lastOrderDate ? new Date(b.lastOrderDate) : new Date(b.createdAt);
          return sortOrder === 'asc' 
            ? aDate.getTime() - bDate.getTime() 
            : bDate.getTime() - aDate.getTime();
        default:
          return 0;
      }
    });
  
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      // Toggle order if already sorting by this field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default desc order
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  const getSortIndicator = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  const getStatusClass = (status: CustomerStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleViewCustomer = (customerId: string) => {
    // For now, just show customer details in an alert or expand inline
    // Could be replaced with a modal or dedicated customer detail page later
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      alert(`Customer Details:\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'N/A'}\nTotal Orders: ${customer.totalOrders}\nTotal Spent: ${formatCurrency(customer.totalSpent)}\nStatus: ${customer.isActive ? 'Active' : 'Inactive'}`);
    }
  };
  
  return (
    <BackendLayout activePage="customers">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">{t('customers', 'Customers')}</h1>
            <p className="mt-2 text-sm text-gray-700">
              {t('customers_management_description', 'A list of all customers including their name, status, and purchase history.')}
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('total_customers', 'Total Customers')}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('active_customers', 'Active Customers')}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold">
                        {stats.totalCustomers > 0 ? (Math.round((stats.activeCustomers / stats.totalCustomers) * 100)) : 0}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* New Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('new_customers', 'New Customers (30d)')}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.newCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Returning Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <ArrowPathIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('returning_customers', 'Returning Customers')}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.returningCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatusFilter)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              <option value="all">{t('all_statuses', 'All Statuses')}</option>
              <option value="active">{t('active', 'Active')}</option>
              <option value="inactive">{t('inactive', 'Inactive')}</option>
              <option value="new">{t('new', 'New Customers')}</option>
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
                placeholder={t('search_placeholder', 'Search by name, email, or phone...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Customers Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('no_customers_found', 'No customers found')}</p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                          onClick={() => toggleSort('name')}
                        >
                          <div className="flex items-center">
                            {t('customer', 'Customer')}
                            <span className="ml-1">{getSortIndicator('name')}</span>
                          </div>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('contact', 'Contact')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('status', 'Status')}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => toggleSort('spend')}
                        >
                          <div className="flex items-center">
                            {t('total_spent', 'Total Spent')}
                            <span className="ml-1">{getSortIndicator('spend')}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => toggleSort('orders')}
                        >
                          <div className="flex items-center">
                            {t('orders', 'Orders')}
                            <span className="ml-1">{getSortIndicator('orders')}</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => toggleSort('recent')}
                        >
                          <div className="flex items-center">
                            {t('last_order', 'Last Order')}
                            <span className="ml-1">{getSortIndicator('recent')}</span>
                          </div>
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('actions', 'Actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {customer.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>{customer.email}</div>
                            {customer.phone && <div>{customer.phone}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClass(customer.isActive ? 'active' : 'inactive')}`}>
                              {t(customer.isActive ? 'active' : 'inactive', customer.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatCurrency(customer.totalSpent)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {customer.totalOrders}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(customer.lastOrderDate)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleViewCustomer(customer.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {t('view', 'View')}
                            </button>
                          </td>
                        </tr>
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
