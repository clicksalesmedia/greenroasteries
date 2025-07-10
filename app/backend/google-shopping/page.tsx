'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
  category: {
    name: string;
    nameAr?: string;
  };
}

interface SyncResult {
  success?: boolean;
  totalProducts?: number;
  totalLanguages?: number;
  syncMode?: string;
  languages?: string[];
  successCount?: number;
  errorCount?: number;
  skippedCount?: number;
  dryRun?: boolean;
  message?: string;
  errors?: Array<{
    productId: string;
    productName: string;
    error: string;
    language?: string;
  }>;
  syncedProducts?: Array<{
    productId: string;
    productName: string;
    googleProductId?: string;
    variations?: number;
    status: string;
    language?: string;
  }>;
  languageResults?: Record<string, {
    successCount: number;
    errorCount: number;
    syncedProducts: any[];
    errors: any[];
  }>;
}

interface LanguageConfig {
  code: string;
  country: string;
  currency: string;
  name: string;
  configured: boolean;
}

export default function GoogleShoppingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [configuration, setConfiguration] = useState({
    isConfigured: false,
    merchantId: '',
    baseUrl: '',
    supportedLanguages: {} as Record<string, LanguageConfig>,
    arabicContent: {
      productsWithArabicNames: 0,
      productsWithArabicDescriptions: 0,
      arabicReadiness: 0
    }
  });

  // Enhanced form states with language support
  const [includeVariations, setIncludeVariations] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [syncAll, setSyncAll] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [syncMode, setSyncMode] = useState<'single' | 'multi'>('single');

  useEffect(() => {
    checkConfiguration();
    fetchProducts();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/google-shopping/sync');
      const data = await response.json();
      setConfiguration({
        isConfigured: data.configured || false,
        merchantId: data.configuration?.merchantId || '',
        baseUrl: data.configuration?.baseUrl || '',
        supportedLanguages: data.supportedLanguages || {},
        arabicContent: data.arabicContent || {
          productsWithArabicNames: 0,
          productsWithArabicDescriptions: 0,
          arabicReadiness: 0
        }
      });

      // Set default selected languages based on available languages
      const availableLanguages = Object.keys(data.supportedLanguages || {});
      if (availableLanguages.length > 0) {
        setSelectedLanguages([availableLanguages[0]]);
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
      toast.error('Failed to check Google Shopping configuration');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const syncProducts = async () => {
    setLoading(true);
    setSyncResults(null);

    try {
      const payload = {
        syncAll,
        productIds: syncAll ? [] : selectedProducts,
        includeVariations,
        dryRun,
        batchSize: 50,
        languages: selectedLanguages,
        syncMode
      };

      console.log('🚀 Enhanced Sync payload:', payload);

      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📊 Enhanced Sync response:', data);
      setSyncResults(data);

      if (data.successCount > 0) {
        const languageInfo = data.languages ? ` in ${data.languages.join(', ').toUpperCase()}` : '';
        const message = data.message || 
          `${dryRun ? 'Validated' : 'Synced'} ${data.successCount} products successfully${languageInfo}!`;
        toast.success(message);
      } else if (data.errorCount > 0) {
        toast.error(`Sync failed with ${data.errorCount} errors across ${data.totalLanguages || 1} language(s)`);
      } else {
        toast.success('No products were processed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync products');
      setSyncResults({
        success: false,
        totalProducts: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ productId: 'unknown', productName: 'Unknown', error: 'Network error' }]
      });
    } finally {
      setLoading(false);
    }
  };

  const syncIndividualProduct = async (productId: string) => {
    try {
      const primaryLanguage = selectedLanguages[0] || 'en';
      const response = await fetch(`/api/google-shopping/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          includeVariations,
          dryRun,
          language: primaryLanguage
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Product ${data.productName} ${dryRun ? 'validated' : 'synced'} successfully in ${primaryLanguage.toUpperCase()}!`);
      } else {
        toast.error(`Failed to sync ${data.productName}: ${data.error}`);
      }
    } catch (error) {
      console.error('Individual sync error:', error);
      toast.error('Failed to sync product');
    }
  };

  const testConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-shopping/sync', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      if (data.configured) {
        const configuredLanguages = Object.entries(data.supportedLanguages || {})
          .filter(([_, config]: [string, any]) => config.configured)
          .map(([code]) => code.toUpperCase());
          
        toast.success(`Google Shopping configuration is valid for: ${configuredLanguages.join(', ')}!`);
      } else {
        toast.error('Google Shopping configuration is incomplete');
      }
      
      setConfiguration(prev => ({
        ...prev,
        isConfigured: data.configured,
        supportedLanguages: data.supportedLanguages || {}
      }));
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguageSelection = (language: string) => {
    if (syncMode === 'single') {
      setSelectedLanguages([language]);
    } else {
      setSelectedLanguages(prev =>
        prev.includes(language)
          ? prev.filter(lang => lang !== language)
          : [...prev, language]
      );
    }
  };

  const selectAllLanguages = () => {
    const availableLanguages = Object.keys(configuration.supportedLanguages);
    setSelectedLanguages(availableLanguages);
  };

  const clearLanguageSelection = () => {
    const firstLanguage = Object.keys(configuration.supportedLanguages)[0];
    setSelectedLanguages(firstLanguage ? [firstLanguage] : []);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(products.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Get language statistics for display
  const getLanguageStats = () => {
    if (!syncResults?.languageResults) return null;
    
    return Object.entries(syncResults.languageResults).map(([lang, stats]) => ({
      language: lang,
      name: configuration.supportedLanguages[lang]?.name || lang,
      ...stats
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Google Shopping Integration</h1>
          <p className="text-gray-600 mt-2">
            Manage your products on Google Shopping Merchant Center with multi-language support
          </p>
          {configuration.arabicContent.arabicReadiness > 0 && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              🌐 Arabic Content: {configuration.arabicContent.arabicReadiness}% ready
            </div>
          )}
        </div>

        {/* Enhanced Configuration Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuration Status</h2>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${configuration.isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${configuration.isConfigured ? 'text-green-700' : 'text-red-700'}`}>
                  {configuration.isConfigured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
            </div>
            <button
              onClick={testConfiguration}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Language Support Status */}
          {Object.keys(configuration.supportedLanguages).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Supported Languages</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(configuration.supportedLanguages).map(([code, config]) => (
                  <div key={code} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${config.configured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">
                      {config.name} ({code.toUpperCase()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arabic Content Statistics */}
          {configuration.arabicContent.arabicReadiness > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Arabic Content Analysis</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Products with Arabic Names:</span>
                  <p className="font-medium text-blue-600">{configuration.arabicContent.productsWithArabicNames}</p>
                </div>
                <div>
                  <span className="text-gray-500">Products with Arabic Descriptions:</span>
                  <p className="font-medium text-blue-600">{configuration.arabicContent.productsWithArabicDescriptions}</p>
                </div>
                <div>
                  <span className="text-gray-500">Arabic Readiness:</span>
                  <p className="font-medium text-green-600">{configuration.arabicContent.arabicReadiness}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'sync', 'results'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{products.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">In Stock</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {products.filter(p => p.inStock && p.stockQuantity > 0).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Arabic Ready</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {products.filter(p => p.nameAr || p.category.nameAr).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Products with Arabic content</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Language Features</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">English Support</span>
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                      ✓ Available
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Arabic Support</span>
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                      ✓ Available
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Multi-Language Sync</span>
                    <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                      Enhanced
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Language-Specific SKUs</span>
                    <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                      Automatic
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-6">
            {/* Enhanced Sync Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Sync Options</h3>
              
              {/* Language Selection */}
              <div className="mb-6 border-b pb-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Language Configuration</h4>
                
                {/* Sync Mode Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sync Mode</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="single"
                        checked={syncMode === 'single'}
                        onChange={(e) => setSyncMode(e.target.value as 'single' | 'multi')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Single Language</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="multi"
                        checked={syncMode === 'multi'}
                        onChange={(e) => setSyncMode(e.target.value as 'single' | 'multi')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Multi-Language</span>
                    </label>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Select Languages {syncMode === 'single' ? '(Choose One)' : '(Choose Multiple)'}
                    </label>
                    {syncMode === 'multi' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={selectAllLanguages}
                          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearLanguageSelection}
                          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(configuration.supportedLanguages).map(([code, config]) => (
                      <label key={code} className="flex items-center">
                        <input
                          type={syncMode === 'single' ? 'radio' : 'checkbox'}
                          name={syncMode === 'single' ? 'language' : undefined}
                          checked={selectedLanguages.includes(code)}
                          onChange={() => toggleLanguageSelection(code)}
                          disabled={!config.configured}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`ml-2 text-sm ${!config.configured ? 'text-gray-400' : 'text-gray-700'}`}>
                          {config.name} ({code.toUpperCase()})
                          {!config.configured && ' - Not configured'}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {selectedLanguages.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedLanguages.map(lang => 
                        configuration.supportedLanguages[lang]?.name || lang
                      ).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Standard Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncAll}
                      onChange={(e) => setSyncAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Sync all products</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeVariations}
                      onChange={(e) => setIncludeVariations(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Include variations</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Validation mode (dry run)</span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={syncProducts}
                    disabled={loading || !configuration.isConfigured || selectedLanguages.length === 0 || (!syncAll && selectedProducts.length === 0)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 
                      `${dryRun ? 'Validate' : 'Sync'} Products ${syncMode === 'multi' ? `(${selectedLanguages.length} Languages)` : ''}`
                    }
                  </button>
                  
                  {!syncAll && (
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllProducts}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Select All Products
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>

                {!syncAll && (
                  <p className="text-sm text-gray-600">
                    {selectedProducts.length} of {products.length} products selected
                  </p>
                )}
                
                {selectedLanguages.length > 1 && syncMode === 'multi' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Multi-Language Mode:</strong> Each product will be synced in {selectedLanguages.length} languages with language-specific SKUs and content.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Product List */}
            {!syncAll && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Products</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Arabic Content
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                {product.nameAr && (
                                  <div className="text-sm text-gray-600 mt-1" dir="rtl">{product.nameAr}</div>
                                )}
                                <div className="text-sm text-gray-500">{product.category.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-1">
                                {product.nameAr && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    AR Name
                                  </span>
                                )}
                                {product.category.nameAr && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    AR Category
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.sku || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.price} AED
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.inStock && product.stockQuantity > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.inStock && product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => syncIndividualProduct(product.id)}
                                disabled={loading || !configuration.isConfigured || selectedLanguages.length === 0}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              >
                                {dryRun ? 'Validate' : 'Sync'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && syncResults && (
          <div className="space-y-6">
            {/* Enhanced Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sync Results Summary 
                {syncResults.syncMode === 'multi' && ` (Multi-Language)`}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{syncResults.totalProducts || 0}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncResults.totalLanguages || 1}</div>
                  <div className="text-sm text-gray-600">Languages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{syncResults.successCount || 0}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{syncResults.errorCount || 0}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${syncResults.success !== false ? 'text-green-600' : 'text-red-600'}`}>
                    {syncResults.success !== false ? 'Success' : 'Failed'}
                  </div>
                  <div className="text-sm text-gray-600">Overall Status</div>
                </div>
              </div>
            </div>

            {/* Language-Specific Results */}
            {getLanguageStats() && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Results by Language</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getLanguageStats()!.map((langStat) => (
                      <div key={langStat.language} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {langStat.name} ({langStat.language.toUpperCase()})
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Success:</span>
                            <span className="font-medium text-green-600">{langStat.successCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Errors:</span>
                            <span className="font-medium text-red-600">{langStat.errorCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Results Table (existing functionality enhanced) */}
            {syncResults.syncedProducts && syncResults.syncedProducts.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Language
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Google Product ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variations
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {syncResults.syncedProducts.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.productName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {(result.language || 'EN').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {result.status || 'Success'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.googleProductId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.variations || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Errors Section */}
            {syncResults.errors && syncResults.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Errors by Language</h3>
                  <div className="space-y-3">
                    {syncResults.errors.map((error, index) => (
                      <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-1">
                            <div className="font-medium text-red-800">
                              {error.productName}
                              {error.language && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  {error.language.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-red-700 text-sm mt-1">{error.error}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 