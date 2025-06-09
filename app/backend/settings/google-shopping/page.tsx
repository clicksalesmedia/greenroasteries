'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import BackendLayout from '../../components/BackendLayout';
import Link from 'next/link';

interface SyncResult {
  totalProducts: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
  syncedProducts: Array<{
    productId: string;
    productName: string;
    googleProductId: string;
    variations: number;
    status: string;
  }>;
  dryRun: boolean;
}

interface ConfigStatus {
  configured: boolean;
  totalProducts: number;
  productsWithVariations: number;
  configuration?: {
    merchantId: string;
    serviceAccount: string;
    country: string;
    language: string;
    currency: string;
  };
}

export default function GoogleShoppingPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [includeVariations, setIncludeVariations] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'results'>('overview');

  useEffect(() => {
    fetchConfigStatus();
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const response = await fetch('/api/google-shopping/sync');
      if (!response.ok) throw new Error('Failed to fetch config status');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      toast.error('Failed to load Google Shopping configuration');
      console.error('Config fetch error:', error);
    }
  };

  const handleSyncAll = async (dryRun: boolean = false) => {
    if (!configStatus?.configured) {
      toast.error('Google Shopping not configured');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncAll: true,
          includeVariations,
          dryRun
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const results = await response.json();
      setSyncResults(results);
      setActiveTab('results');

      if (dryRun) {
        toast.success(`Validation completed! ${results.successCount} products validated successfully`);
      } else {
        toast.success(`Sync completed! ${results.successCount} products synced successfully`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSelected = async (dryRun: boolean = false) => {
    if (!configStatus?.configured) {
      toast.error('Google Shopping not configured');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please select products to sync');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          includeVariations,
          dryRun
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const results = await response.json();
      setSyncResults(results);
      setActiveTab('results');

      if (dryRun) {
        toast.success(`Validation completed! ${results.successCount} products validated successfully`);
      } else {
        toast.success(`Sync completed! ${results.successCount} products synced successfully`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConfigurationStatus = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            configStatus?.configured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {configStatus?.configured ? 'Configured' : 'Not Configured'}
          </div>
        </div>

        {configStatus?.configuration && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Merchant Center ID</span>
              <span className="text-sm text-gray-900">{configStatus.configuration.merchantId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Service Account</span>
              <span className="text-sm text-gray-900">{configStatus.configuration.serviceAccount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Country</span>
              <span className="text-sm text-gray-900">{configStatus.configuration.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Language</span>
              <span className="text-sm text-gray-900">{configStatus.configuration.language}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Currency</span>
              <span className="text-sm text-gray-900">{configStatus.configuration.currency}</span>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Products</span>
            <span className="text-sm text-gray-900">{configStatus?.totalProducts || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Products with Variations</span>
            <span className="text-sm text-gray-900">{configStatus?.productsWithVariations || 0}</span>
          </div>
        </div>
      </div>

      {!configStatus?.configured && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Configuration Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please configure your Google Shopping integration by setting up the required environment variables.
                  See the documentation for detailed setup instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSyncControls = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Products</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeVariations"
            checked={includeVariations}
            onChange={(e) => setIncludeVariations(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="includeVariations" className="ml-2 text-sm text-gray-700">
            Include product variations
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleSyncAll(true)}
            disabled={loading || !configStatus?.configured}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Validate All Products'}
          </button>
          
          <button
            onClick={() => handleSyncAll(false)}
            disabled={loading || !configStatus?.configured}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Syncing...' : 'Sync All Products'}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Sync specific products by entering product IDs (comma-separated):
          </p>
          
          <textarea
            value={selectedProducts.join(', ')}
            onChange={(e) => setSelectedProducts(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
            placeholder="Enter product IDs separated by commas"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
          
          <div className="flex space-x-4 mt-3">
            <button
              onClick={() => handleSyncSelected(true)}
              disabled={loading || !configStatus?.configured || selectedProducts.length === 0}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Validate Selected
            </button>
            
            <button
              onClick={() => handleSyncSelected(false)}
              disabled={loading || !configStatus?.configured || selectedProducts.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sync Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSyncResults = () => {
    if (!syncResults) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sync Results {syncResults.dryRun && '(Validation Only)'}
          </h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{syncResults.totalProducts}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.successCount}</div>
              <div className="text-sm text-gray-500">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{syncResults.errorCount}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{syncResults.skippedCount}</div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
          </div>

          {syncResults.syncedProducts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Successfully Synced Products</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Google ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncResults.syncedProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.googleProductId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.variations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.status === 'synced' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {syncResults.errors.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Errors</h4>
              <div className="space-y-2">
                {syncResults.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm font-medium text-red-800">{error.productName}</div>
                    <div className="text-sm text-red-600">{error.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <BackendLayout activePage="settings">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link href="/backend/settings" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10v8a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H8a1 1 0 00-1 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 01.293-.707l7-7z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">Settings</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/backend/settings" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Settings
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-900">Google Shopping</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Shopping Management</h1>
          <p className="mt-2 text-gray-600">
            Sync your products to Google Shopping Merchant Center
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'sync', label: 'Sync Products' },
              { id: 'results', label: 'Results' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderConfigurationStatus()}
          {activeTab === 'sync' && renderSyncControls()}
          {activeTab === 'results' && renderSyncResults()}
        </div>
      </div>
    </BackendLayout>
  );
} 