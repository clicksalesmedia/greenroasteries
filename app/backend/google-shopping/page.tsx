'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
  category: {
    name: string;
  };
}

interface SyncResult {
  success: boolean;
  totalProducts?: number;
  successCount?: number;
  errorCount?: number;
  errors?: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
  results?: Array<{
    productId: string;
    productName: string;
    googleProductId?: string;
    variationCount?: number;
    success: boolean;
    error?: string;
  }>;
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
    country: '',
    language: '',
    currency: '',
    baseUrl: ''
  });

  // Form states
  const [includeVariations, setIncludeVariations] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [syncAll, setSyncAll] = useState(true);

  useEffect(() => {
    checkConfiguration();
    fetchProducts();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/google-shopping/test');
      const data = await response.json();
      setConfiguration(data);
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
        dryRun
      };

      const response = await fetch('/api/google-shopping/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSyncResults(data);

      if (data.success) {
        toast.success(dryRun ? 'Validation completed successfully!' : 'Products synced successfully!');
      } else {
        toast.error('Sync failed with errors');
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
      const response = await fetch(`/api/google-shopping/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          includeVariations,
          dryRun
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Product ${data.productName} ${dryRun ? 'validated' : 'synced'} successfully!`);
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
      const response = await fetch('/api/google-shopping/test');
      const data = await response.json();
      
      if (data.isConfigured) {
        toast.success('Google Shopping configuration is valid!');
      } else {
        toast.error('Google Shopping configuration is incomplete');
      }
      
      setConfiguration(data);
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test configuration');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Google Shopping Integration</h1>
          <p className="text-gray-600 mt-2">Manage your products on Google Shopping Merchant Center</p>
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
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

          {configuration.isConfigured && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Merchant ID:</span>
                <p className="font-medium">{configuration.merchantId}</p>
              </div>
              <div>
                <span className="text-gray-500">Country:</span>
                <p className="font-medium">{configuration.country}</p>
              </div>
              <div>
                <span className="text-gray-500">Currency:</span>
                <p className="font-medium">{configuration.currency}</p>
              </div>
              <div>
                <span className="text-gray-500">Language:</span>
                <p className="font-medium">{configuration.language}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
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
                <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {products.filter(p => !p.inStock || p.stockQuantity === 0).length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GOOGLE_MERCHANT_CENTER_ID</span>
                    <span className={`px-2 py-1 rounded text-sm ${configuration.merchantId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {configuration.merchantId ? 'Set' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GOOGLE_SERVICE_ACCOUNT_KEY</span>
                    <span className={`px-2 py-1 rounded text-sm ${configuration.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {configuration.isConfigured ? 'Set' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GOOGLE_SHOPPING_COUNTRY</span>
                    <span className={`px-2 py-1 rounded text-sm ${configuration.country ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {configuration.country || 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GOOGLE_SHOPPING_CURRENCY</span>
                    <span className={`px-2 py-1 rounded text-sm ${configuration.currency ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {configuration.currency || 'Missing'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-6">
            {/* Sync Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Options</h3>
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
                    disabled={loading || !configuration.isConfigured || (!syncAll && selectedProducts.length === 0)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : dryRun ? 'Validate Products' : 'Sync Products'}
                  </button>
                  
                  {!syncAll && (
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllProducts}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Select All
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
              </div>
            </div>

            {/* Product List */}
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
                                <div className="text-sm text-gray-500">{product.category.name}</div>
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
                                disabled={loading || !configuration.isConfigured}
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
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Results Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{syncResults.totalProducts || 0}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
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
                  <div className={`text-2xl font-bold ${syncResults.success ? 'text-green-600' : 'text-red-600'}`}>
                    {syncResults.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="text-sm text-gray-600">Overall Status</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            {syncResults.results && syncResults.results.length > 0 && (
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
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Google Product ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variations
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {syncResults.results.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.productName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.googleProductId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.variationCount || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-red-600">
                              {result.error || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {syncResults.errors && syncResults.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Errors</h3>
                  <div className="space-y-3">
                    {syncResults.errors.map((error, index) => (
                      <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4">
                        <div className="font-medium text-red-800">{error.productName}</div>
                        <div className="text-red-700 text-sm mt-1">{error.error}</div>
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