'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface EmailSubscriber {
  id: string;
  email: string;
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'COMPLAINED';
  source: string;
  ipAddress: string;
  userAgent: string;
  confirmedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriberStats {
  active?: number;
  unsubscribed?: number;
  bounced?: number;
  complained?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EmailSubscribersPage() {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats>({});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch subscribers
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        search: searchTerm
      });

      const response = await fetch(`/api/newsletter?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscribers(data.subscribers);
        setStats(data.stats);
        setPagination(data.pagination);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch subscribers');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update subscriber status
  const updateSubscriberStatus = async (id: string, status: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/newsletter/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchSubscribers(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update subscriber');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error updating subscriber:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Delete subscriber
  const deleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      setProcessingId(id);
      const response = await fetch(`/api/newsletter/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSubscribers(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete subscriber');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error deleting subscriber:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'UNSUBSCRIBED':
        return 'bg-gray-100 text-gray-800';
      case 'BOUNCED':
        return 'bg-red-100 text-red-800';
      case 'COMPLAINED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Effects
  useEffect(() => {
    fetchSubscribers();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' || searchTerm === '') {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSubscribers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Subscribers</h1>
        <p className="text-gray-600">Manage newsletter subscribers and email marketing lists</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unsubscribed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unsubscribed || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bounced</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bounced || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Complained</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complained || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Email
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Complained</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Subscribers ({pagination.total})
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading subscribers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subscriber.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {subscriber.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscriber.status)}`}>
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscriber.source || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(subscriber.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {subscriber.status === 'ACTIVE' ? (
                            <button
                              onClick={() => updateSubscriberStatus(subscriber.id, 'UNSUBSCRIBED')}
                              disabled={processingId === subscriber.id}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              Unsubscribe
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSubscriberStatus(subscriber.id, 'ACTIVE')}
                              disabled={processingId === subscriber.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => deleteSubscriber(subscriber.id)}
                            disabled={processingId === subscriber.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-200"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 