'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TrackingEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventName: string;
  eventType: string;
  platform: string;
  eventData: any;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  pageUrl?: string;
  pageTitle?: string;
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: any;
  conversionValue?: number;
  conversionType?: string;
  timestamp: string;
  clientTimestamp?: string;
  processed: boolean;
  processingError?: string;
  config: {
    id: string;
    gtmEnabled: boolean;
    ga4Enabled: boolean;
    metaEnabled: boolean;
    googleAdsEnabled: boolean;
  };
}

interface EventsResponse {
  success: boolean;
  events: TrackingEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export default function TrackingEventsPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventName: '',
    platform: '',
    limit: 50,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.eventName) params.append('eventName', filters.eventName);
      if (filters.platform) params.append('platform', filters.platform);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/tracking/events?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EventsResponse = await response.json();

      if (data.success) {
        setEvents(data.events);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch tracking events');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error fetching tracking events: ${errorMessage}`);
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : (typeof value === 'number' ? value : 0) // Reset offset when changing other filters
    }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatEventData = (data: any) => {
    if (!data || typeof data !== 'object') return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      'PAGE_VIEW': 'bg-blue-100 text-blue-800',
      'VIEW_ITEM': 'bg-green-100 text-green-800',
      'ADD_TO_CART': 'bg-yellow-100 text-yellow-800',
      'REMOVE_FROM_CART': 'bg-red-100 text-red-800',
      'BEGIN_CHECKOUT': 'bg-purple-100 text-purple-800',
      'ADD_PAYMENT_INFO': 'bg-indigo-100 text-indigo-800',
      'PURCHASE': 'bg-emerald-100 text-emerald-800',
      'SEARCH': 'bg-gray-100 text-gray-800',
      'SIGN_UP': 'bg-pink-100 text-pink-800',
      'CUSTOM': 'bg-orange-100 text-orange-800'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'GA4': 'bg-blue-500 text-white',
      'GTM': 'bg-green-500 text-white',
      'FACEBOOK_PIXEL': 'bg-blue-600 text-white',
      'GOOGLE_ADS': 'bg-red-500 text-white',
      'SERVER_SIDE': 'bg-purple-500 text-white',
      'CUSTOM': 'bg-gray-600 text-white'
    };
    return colors[platform] || 'bg-gray-500 text-white';
  };

  if (loading && events.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('tracking_events', 'Tracking Events')}
            </h1>
            <p className="text-gray-600">
              {t('tracking_events_desc', 'Monitor and analyze all tracking events captured by the system')}
            </p>
          </div>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <select
              value={filters.eventName}
              onChange={(e) => handleFilterChange('eventName', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Events</option>
              <option value="page_view">Page View</option>
              <option value="view_item">View Item</option>
              <option value="add_to_cart">Add to Cart</option>
              <option value="remove_from_cart">Remove from Cart</option>
              <option value="begin_checkout">Begin Checkout</option>
              <option value="add_shipping_info">Add Shipping Info</option>
              <option value="add_payment_info">Add Payment Info</option>
              <option value="purchase">Purchase</option>
              <option value="search">Search</option>
              <option value="sign_up">Sign Up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Platforms</option>
              <option value="GA4">Google Analytics 4</option>
              <option value="GTM">Google Tag Manager</option>
              <option value="FACEBOOK_PIXEL">Facebook Pixel</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="SERVER_SIDE">Server Side</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ eventName: '', platform: '', limit: 50, offset: 0 })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => e.processed).length}
          </div>
          <div className="text-sm text-gray-600">Processed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-red-600">
            {events.filter(e => !e.processed).length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {events.filter(e => e.processingError).length}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-red-800">{error}</div>
            <button
              onClick={fetchEvents}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {event.eventName}
                      </div>
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getPlatformColor(event.platform)}`}>
                      {event.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.value ? `${event.value} ${event.currency || 'AED'}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.processed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.processed ? 'Processed' : 'Pending'}
                      </span>
                      {event.processingError && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mt-1">
                          Error
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        // Show event details in a modal or expand row
                        console.log('Event details:', event);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={!pagination.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{pagination.offset + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.offset + pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={!pagination.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No tracking events found</div>
          <div className="text-gray-400 text-sm mt-2">
            Events will appear here as users interact with your website
          </div>
        </div>
      )}
    </div>
  );
} 