'use client';

import React, { useState, useEffect } from 'react';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}

interface LogData {
  logs: LogEntry[];
  description: string;
  totalLines: number;
  systemStatus: string;
  lastUpdated: string;
  type: string;
  filter: string | null;
}

export default function LogsPage() {
  const { t } = useLanguage();
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logType, setLogType] = useState('all');
  const [filter, setFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: logType,
        lines: '100'
      });
      
      if (filter.trim()) {
        params.append('filter', filter.trim());
      }

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: string) => {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        // Refresh logs after action
        setTimeout(fetchLogs, 2000);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Failed to execute action');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'webhook':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <BackendLayout activePage="logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('system_logs', 'System Logs')}
            </h1>
            <p className="text-gray-600">
              {t('monitor_system_logs', 'Monitor application logs and webhook events')}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('refreshing', 'Refreshing...') : t('refresh', 'Refresh')}
            </button>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t('auto_refresh', 'Auto Refresh')}</span>
            </label>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Log Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('log_type', 'Log Type')}
              </label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('all_logs', 'All Logs')}</option>
                <option value="webhook">{t('webhook_logs', 'Webhook Logs')}</option>
                <option value="payment">{t('payment_logs', 'Payment & Order Logs')}</option>
                <option value="error">{t('error_logs', 'Error Logs')}</option>
              </select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('search_filter', 'Search Filter')}
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t('search_logs', 'Search in logs...')}
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={fetchLogs}
                  className="bg-gray-600 text-white px-4 py-2 rounded-r-md hover:bg-gray-700"
                >
                  {t('search', 'Search')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('actions', 'Actions')}
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => executeAction('restart')}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 text-sm"
                >
                  {t('restart', 'Restart')}
                </button>
                <button
                  onClick={() => executeAction('flush')}
                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  {t('clear_logs', 'Clear')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        {logData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{t('system_status', 'System Status')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">{t('log_type', 'Log Type')}:</span> {logData.description}
              </div>
              <div>
                <span className="font-medium">{t('total_entries', 'Total Entries')}:</span> {logData.totalLines}
              </div>
              <div>
                <span className="font-medium">{t('last_updated', 'Last Updated')}:</span> {formatTimestamp(logData.lastUpdated)}
              </div>
            </div>
            <div className="mt-3">
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{logData.systemStatus}</pre>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">{t('error', 'Error')}</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Logs Display */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {logData?.description || t('application_logs', 'Application Logs')}
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">{t('loading_logs', 'Loading logs...')}</p>
              </div>
            ) : logData?.logs && logData.logs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {logData.logs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <div className="text-sm font-mono bg-gray-50 p-2 rounded overflow-x-auto">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {t('no_logs_found', 'No logs found for the selected criteria')}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-blue-800 font-medium mb-2">{t('quick_actions', 'Quick Actions')}</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>{t('webhook_test', 'Test Webhook')}:</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                curl https://thegreenroasteries.com/api/webhooks/stripe-test
              </code>
            </div>
            <div>
              <strong>{t('check_incomplete_payments', 'Check Incomplete Payments')}:</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                curl https://thegreenroasteries.com/api/payments/check-incomplete
              </code>
            </div>
          </div>
        </div>
      </div>
    </BackendLayout>
  );
} 