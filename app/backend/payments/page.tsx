'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Payment {
  id: string;
  orderId: string;
  userId: string;
  paymentProvider: 'STRIPE' | 'TABBY';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  tabbyPaymentId?: string;
  tabbyCheckoutUrl?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paymentMethod?: string;
  last4?: string;
  brand?: string;
  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    customerName?: string;
    customerEmail?: string;
    status: string;
    total: number;
    createdAt: string;
  };
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalRevenue: number;
  totalRefunded: number;
  successRate: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refundModal, setRefundModal] = useState<{ paymentId: string; maxAmount: number } | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page, statusFilter, searchQuery]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/payments?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      setPayments(data.payments);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments?action=stats', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching payment stats:', err);
    }
  };

  const handleRefund = async () => {
    if (!refundModal || !refundAmount) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refund',
          paymentId: refundModal.paymentId,
          amount: parseFloat(refundAmount)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRefundModal(null);
        setRefundAmount('');
        fetchPayments();
        fetchStats();
        alert('Refund processed successfully!');
      } else {
        alert(data.error || 'Refund failed');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
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
    <BackendLayout activePage="payments">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Payment Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage payments, process refunds, and view payment analytics.
            </p>
          </div>
        </div>

        {/* Payment Statistics */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatPrice(stats.totalRevenue)} AED</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Successful Payments</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.successfulPayments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.successRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Refunded</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatPrice(stats.totalRefunded)} AED</dd>
                    </dl>
                  </div>
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
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                placeholder="Search by payment ID, customer email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No payments found</p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Payment ID
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Customer
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Method
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div>
                              <div className="font-mono text-xs text-gray-500">
                                {payment.paymentProvider === 'STRIPE' && payment.stripePaymentIntentId
                                  ? `${payment.stripePaymentIntentId.substring(0, 20)}...`
                                  : payment.paymentProvider === 'TABBY' && payment.tabbyPaymentId
                                  ? `${payment.tabbyPaymentId.substring(0, 20)}...`
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Order: {payment.order.id.substring(0, 8)}...
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {payment.paymentProvider}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>
                              <div className="font-medium text-gray-900">
                                {payment.order.customerName || payment.user.name || 'N/A'}
                              </div>
                              <div className="text-gray-500">
                                {payment.order.customerEmail || payment.user.email}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatPrice(payment.amount)} AED
                              </div>
                              {payment.refundedAmount && payment.refundedAmount > 0 && (
                                <div className="text-red-600 text-xs">
                                  Refunded: {formatPrice(payment.refundedAmount)} AED
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>
                              <div className="capitalize">
                                {payment.paymentProvider === 'TABBY' 
                                  ? 'Tabby (4 installments)' 
                                  : payment.brand || payment.paymentMethod || 'Card'}
                              </div>
                              {payment.last4 && (
                                <div className="text-xs text-gray-400">•••• {payment.last4}</div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {payment.status === 'SUCCEEDED' && (
                              <button
                                onClick={() => setRefundModal({
                                  paymentId: payment.id,
                                  maxAmount: payment.amount - (payment.refundedAmount || 0)
                                })}
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={payment.amount <= (payment.refundedAmount || 0)}
                              >
                                Refund
                              </button>
                            )}
                            {payment.receiptUrl && (
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                              >
                                Receipt
                              </a>
                            )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Refund Modal */}
        {refundModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (Max: {formatPrice(refundModal.maxAmount)} AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={refundModal.maxAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefund}
                    disabled={processing || !refundAmount || parseFloat(refundAmount) <= 0}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Process Refund'}
                  </button>
                  <button
                    onClick={() => {
                      setRefundModal(null);
                      setRefundAmount('');
                    }}
                    disabled={processing}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackendLayout>
  );
} 