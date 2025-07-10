'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import BackendLayout from '../components/BackendLayout';
import Link from 'next/link';

interface SyncResult {
  totalProducts: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  message?: string;
  languageResults?: Record<string, any>;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
    language?: string;
  }>;
  syncedProducts: Array<{
    productId: string;
    productName: string;
    googleProductId: string;
    variations: number;
    status: string;
    language?: string;
  }>;
  dryRun: boolean;
}

interface ConfigStatus {
  configured: boolean;
  totalProducts: number;
  inStockProducts: number;
  productsWithVariations: number;
  arabicContent?: {
    productsWithArabicNames: number;
    productsWithArabicDescriptions: number;
    arabicReadiness: number;
  };
  supportedLanguages?: Record<string, any>;
  features?: {
    multiLanguageSupport: boolean;
    availableLanguages: string[];
    arabicSupport: boolean;
  };
  configuration?: {
    merchantId: string;
    serviceAccount: string;
    baseUrl: string;
  };
}

export default function GoogleShoppingPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [includeVariations, setIncludeVariations] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'results'>('overview');
  
  // New language support states
  const [syncMode, setSyncMode] = useState<'single' | 'multi'>('single');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [dryRun, setDryRun] = useState(true);
  const [productsToSync, setProductsToSync] = useState(10);

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

  const handleLanguageToggle = (language: string) => {
    if (syncMode === 'single') {
      setSelectedLanguage(language);
    } else {
      setSelectedLanguages(prev => 
        prev.includes(language) 
          ? prev.filter(l => l !== language)
          : [...prev, language]
      );
    }
  };

  const handleSyncAll = async () => {
    if (!configStatus?.configured) {
      toast.error('Google Shopping not configured');
      return;
    }

    const languages = syncMode === 'single' ? [selectedLanguage] : selectedLanguages;
    
    if (languages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        syncAll: true,
        includeVariations,
        dryRun,
        languages,
        syncMode,
        limit: productsToSync
      };

      console.log('Sending sync request:', requestBody);

      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const results = await response.json();
      console.log('Sync results:', results);
      
      setSyncResults(results);
      setActiveTab('results');

      const languagesList = languages.join(', ');
      if (dryRun) {
        toast.success(`Validation completed for ${languagesList}! ${results.successCount} products validated successfully`);
      } else {
        toast.success(`Sync completed for ${languagesList}! ${results.successCount} products synced successfully`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSelected = async () => {
    if (!configStatus?.configured) {
      toast.error('Google Shopping not configured');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please select products to sync');
      return;
    }

    const languages = syncMode === 'single' ? [selectedLanguage] : selectedLanguages;

    setLoading(true);
    try {
      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          includeVariations,
          dryRun,
          languages,
          syncMode
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
    }

      const results = await response.json();
      setSyncResults(results);
      setActiveTab('results');

      const languagesList = languages.join(', ');
      if (dryRun) {
        toast.success(`Validation completed for ${languagesList}! ${results.successCount} products validated successfully`);
      } else {
        toast.success(`Sync completed for ${languagesList}! ${results.successCount} products synced successfully`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConfigurationStatus = () => (
    <div className="space-y-6">
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
                <span className="text-sm font-medium text-gray-700">Base URL</span>
                <span className="text-sm text-gray-900">{configStatus.configuration.baseUrl}</span>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{configStatus?.totalProducts || 0}</div>
                <div className="text-sm text-gray-500">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{configStatus?.inStockProducts || 0}</div>
                <div className="text-sm text-gray-500">In Stock</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-bold text-green-600">{configStatus?.productsWithVariations || 0}</div>
              <div className="text-sm text-gray-500">Products with Variations</div>
            </div>
          </div>
        </div>
        </div>

      {/* Arabic Content Analysis */}
      {configStatus?.arabicContent && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Arabic Content Analysis</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{configStatus.arabicContent.productsWithArabicNames}</div>
              <div className="text-sm text-gray-500">Arabic Names</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{configStatus.arabicContent.productsWithArabicDescriptions}</div>
              <div className="text-sm text-gray-500">Arabic Descriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{configStatus.arabicContent.arabicReadiness}%</div>
              <div className="text-sm text-gray-500">Arabic Ready</div>
              </div>
              </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-amber-800">
                <strong>{configStatus.arabicContent.productsWithArabicNames}</strong> products have Arabic content and are ready for Arabic Google Shopping sync
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Language Support */}
      {configStatus?.features?.multiLanguageSupport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Support</h3>
          
                <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Multi-language Support</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Enabled</span>
                  </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Available Languages</span>
              <div className="flex space-x-2">
                {configStatus.features.availableLanguages.map(lang => (
                  <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {lang.toUpperCase()}
                    </span>
                ))}
                  </div>
                  </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Arabic Support</span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                configStatus.features.arabicSupport 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {configStatus.features.arabicSupport ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
          </div>
        </div>
      )}

      {!configStatus?.configured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Configuration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please configure your Google Shopping integration by setting up the required environment variables.</p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  const renderSyncControls = () => (
          <div className="space-y-6">
      {/* Sync Mode Selection */}
            <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Mode</h3>
        
              <div className="space-y-4">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="syncMode"
                value="single"
                checked={syncMode === 'single'}
                onChange={(e) => setSyncMode(e.target.value as 'single' | 'multi')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Single Language Mode</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="syncMode"
                value="multi"
                checked={syncMode === 'multi'}
                onChange={(e) => setSyncMode(e.target.value as 'single' | 'multi')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Multi-Language Mode</span>
            </label>
          </div>

          {/* Language Selection */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {syncMode === 'single' ? 'Select Language' : 'Select Languages'}
            </h4>
            
            <div className="space-y-2">
              {syncMode === 'single' ? (
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={selectedLanguage === 'en'}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">English</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="ar"
                      checked={selectedLanguage === 'ar'}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Arabic (العربية)</span>
                  </label>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes('en')}
                      onChange={() => handleLanguageToggle('en')}
                      className="mr-2"
                    />
                    <span className="text-sm">English</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes('ar')}
                      onChange={() => handleLanguageToggle('ar')}
                      className="mr-2"
                    />
                    <span className="text-sm">Arabic (العربية)</span>
                  </label>
                    </div>
                  )}
                </div>
          </div>
        </div>
      </div>

      {/* Sync Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Options</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products to Sync</label>
              <input
                type="number"
                value={productsToSync}
                onChange={(e) => setProductsToSync(parseInt(e.target.value) || 10)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeVariations}
                  onChange={(e) => setIncludeVariations(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Include Variations</span>
              </label>
              </div>
            </div>

          <div className="flex items-center">
                              <input
                                type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="mr-2"
                              />
            <label htmlFor="dryRun" className="text-sm text-gray-700">
              Dry Run (Test mode - doesn't actually sync to Google)
            </label>
                              </div>

          <div className="flex space-x-4 pt-4">
                              <button
              onClick={handleSyncAll}
              disabled={loading || !configStatus?.configured}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
              {loading ? 'Processing...' : (dryRun ? 'Test Sync' : 'Sync Products')}
                              </button>
                  </div>
                </div>
              </div>

      {/* Selected Products Sync */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Specific Products</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product IDs (comma-separated)
            </label>
            <textarea
              value={selectedProducts.join(', ')}
              onChange={(e) => setSelectedProducts(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
              placeholder="Enter product IDs separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
          
          <button
            onClick={handleSyncSelected}
            disabled={loading || !configStatus?.configured || selectedProducts.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (dryRun ? 'Test Selected' : 'Sync Selected')}
          </button>
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
            Sync Results {syncResults.dryRun && '(Test Mode)'}
          </h3>
          
          {syncResults.message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">{syncResults.message}</p>
          </div>
        )}

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
              <div className="text-2xl font-bold text-yellow-600">{syncResults.skippedCount || 0}</div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
          </div>

          {/* Language-specific results */}
          {syncResults.languageResults && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Results by Language</h4>
              <div className="space-y-3">
                {Object.entries(syncResults.languageResults).map(([lang, results]: [string, any]) => (
                  <div key={lang} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic (العربية)' : lang.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {results.successCount} success, {results.errorCount} errors
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {results.syncedProducts?.length || 0} products processed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Successful products */}
          {syncResults.syncedProducts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Successfully Processed Products</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Google ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {product.googleProductId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.language === 'ar' ? 'Arabic' : 'English'}
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

            {/* Errors */}
          {syncResults.errors.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Errors</h4>
              <div className="space-y-2">
                    {syncResults.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-red-800">{error.productName}</div>
                        <div className="text-sm text-red-600">{error.error}</div>
                      </div>
                      {error.language && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {error.language === 'ar' ? 'Arabic' : 'English'}
                        </span>
                      )}
                    </div>
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
                <Link href="/backend" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10v8a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H8a1 1 0 00-1 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 01.293-.707l7-7z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">Dashboard</span>
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
            Sync your products to Google Shopping Merchant Center in multiple languages
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