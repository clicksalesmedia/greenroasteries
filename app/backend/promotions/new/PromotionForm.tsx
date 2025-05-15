'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductSelector from '@/app/backend/promotions/new/ProductSelector';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  sku?: string;
  category?: string | { name: string };
}

interface FormData {
  name: string;
  description: string;
  code: string;
  type: string;
  value: string;
  minOrderAmount: string;
  maxUses: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productIds: string[];
  
  // For Buy X Get Y
  buyQuantity: string;
  getQuantity: string;
  
  // For bundle
  bundleDiscount: string;
  
  // For upsell/cross-sell/downsell
  targetProductIds: string[];
  relationshipType: string;
}

interface PromotionFormProps {
  promotion?: any;
  isEditing?: boolean;
}

export default function PromotionForm({ promotion, isEditing = false }: PromotionFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxUses: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
    isActive: true,
    productIds: [],
    buyQuantity: '1',
    getQuantity: '1',
    bundleDiscount: '10',
    targetProductIds: [],
    relationshipType: 'RECOMMENDED'
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [targetProducts, setTargetProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showTargetProductSelector, setShowTargetProductSelector] = useState(false);
  
  // Populate form with existing promotion data when editing
  useEffect(() => {
    if (isEditing && promotion) {
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        code: promotion.code || '',
        type: promotion.type || 'PERCENTAGE',
        value: promotion.value?.toString() || '',
        minOrderAmount: promotion.minOrderAmount?.toString() || '',
        maxUses: promotion.maxUses?.toString() || '',
        startDate: new Date(promotion.startDate).toISOString().split('T')[0],
        endDate: new Date(promotion.endDate).toISOString().split('T')[0],
        isActive: promotion.isActive ?? true,
        productIds: promotion.products?.map((p: any) => p.productId || p.id) || [],
        buyQuantity: promotion.buyQuantity?.toString() || '1',
        getQuantity: promotion.getQuantity?.toString() || '1',
        bundleDiscount: promotion.bundleDiscount?.toString() || '10',
        targetProductIds: promotion.targetProducts?.map((p: any) => p.productId || p.id) || [],
        relationshipType: promotion.relationshipType || 'RECOMMENDED'
      });
    }
  }, [isEditing, promotion]);
  
  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Update selected products when productIds change
  useEffect(() => {
    if (products.length > 0 && formData.productIds.length > 0) {
      const selected = products.filter(product => formData.productIds.includes(product.id));
      setSelectedProducts(selected);
    } else {
      setSelectedProducts([]);
    }
  }, [formData.productIds, products]);
  
  // Update target products when targetProductIds change
  useEffect(() => {
    if (products.length > 0 && formData.targetProductIds.length > 0) {
      const selected = products.filter(product => formData.targetProductIds.includes(product.id));
      setTargetProducts(selected);
    } else {
      setTargetProducts([]);
    }
  }, [formData.targetProductIds, products]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleProductSelection = (selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, productIds: selectedIds }));
    setShowProductSelector(false);
  };
  
  const handleTargetProductSelection = (selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, targetProductIds: selectedIds }));
    setShowTargetProductSelector(false);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.type || !formData.startDate || !formData.endDate) {
        setError('Name, type, start date, and end date are required');
        setSubmitting(false);
        return;
      }
      
      // Value is required for percentage and fixed amount
      if (['PERCENTAGE', 'FIXED_AMOUNT'].includes(formData.type) && !formData.value) {
        setError('Discount value is required');
        setSubmitting(false);
        return;
      }
      
      // Prepare the data to send to the API
      const apiData: any = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        productIds: formData.productIds.length > 0 ? formData.productIds : undefined,
      };
      
      // Add conditional fields based on promotion type
      if (formData.minOrderAmount) {
        apiData.minOrderAmount = parseFloat(formData.minOrderAmount);
      }
      
      if (formData.maxUses) {
        apiData.maxUses = parseInt(formData.maxUses);
      }
      
      // Add type-specific fields
      if (formData.type === 'BUY_X_GET_Y') {
        apiData.buyQuantity = parseInt(formData.buyQuantity);
        apiData.getQuantity = parseInt(formData.getQuantity);
      } else if (formData.type === 'BUNDLE') {
        apiData.bundleDiscount = parseFloat(formData.bundleDiscount);
      } else if (['UPSELL', 'CROSS_SELL', 'DOWNSELL'].includes(formData.type)) {
        apiData.targetProductIds = formData.targetProductIds;
        apiData.relationshipType = formData.relationshipType;
      }
      
      // Determine if we're creating or updating
      const url = isEditing 
        ? `/api/promotions/${promotion.id}` 
        : '/api/promotions';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Send the data to the API
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} promotion`);
      }
      
      // Redirect to the promotions list
      router.push('/backend/promotions');
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} promotion:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} promotion`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Helper to format a product's category (could be string or object)
  const getCategoryName = (category: string | { name: string } | undefined) => {
    if (!category) return 'Uncategorized';
    return typeof category === 'string' ? category : category.name;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{isEditing ? t('edit_promotion', 'Edit Promotion') : t('new_promotion', 'New Promotion')}</h1>
        <Link 
          href="/backend/promotions" 
          className="text-green-700 hover:underline"
        >
          &larr; {t('back_to_promotions', 'Back to Promotions')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">{t('basic_information', 'Basic Information')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('promotion_name', 'Promotion Name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder={t('promotion_name_placeholder', 'e.g. Summer Sale')}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('coupon_code', 'Coupon Code')}
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder={t('coupon_code_placeholder', 'e.g. SUMMER20')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('coupon_code_help', 'Leave empty if no code is required (automatic discount)')}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description', 'Description')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder={t('describe_promotion', 'Describe the promotion...')}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Promotion Type & Value */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">{t('promotion_details', 'Promotion Details')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('promotion_type', 'Promotion Type')} *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="PERCENTAGE">{t('percentage_discount', 'Percentage Discount')}</option>
                  <option value="FIXED_AMOUNT">{t('fixed_amount_discount', 'Fixed Amount Discount')}</option>
                  <option value="FREE_SHIPPING">{t('free_shipping', 'Free Shipping')}</option>
                  <option value="BUY_X_GET_Y">{t('buy_x_get_y', 'Buy X Get Y')}</option>
                  <option value="BUNDLE">{t('bundle_discount', 'Bundle Discount')}</option>
                  <option value="UPSELL">{t('upsell', 'Upsell')}</option>
                  <option value="CROSS_SELL">{t('cross_sell', 'Cross-sell')}</option>
                  <option value="DOWNSELL">{t('downsell', 'Downsell')}</option>
                </select>
              </div>
              
              {/* Show value field for percentage and fixed amount */}
              {['PERCENTAGE', 'FIXED_AMOUNT'].includes(formData.type) && (
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'PERCENTAGE' 
                      ? t('discount_percentage', 'Discount Percentage (%)') 
                      : t('discount_amount', 'Discount Amount (D)')}
                  </label>
                  <input
                    type="number"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder={formData.type === 'PERCENTAGE' ? t('percentage_placeholder', 'e.g. 20') : t('amount_placeholder', 'e.g. 10.00')}
                    min={0}
                    max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                    step={formData.type === 'PERCENTAGE' ? 1 : 0.01}
                    required
                  />
                </div>
              )}
              
              {/* Show Buy X Get Y fields */}
              {formData.type === 'BUY_X_GET_Y' && (
                <>
                  <div>
                    <label htmlFor="buyQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Buy Quantity
                    </label>
                    <input
                      type="number"
                      id="buyQuantity"
                      name="buyQuantity"
                      value={formData.buyQuantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                      placeholder="e.g. 2"
                      min={1}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="getQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Get Quantity (Free)
                    </label>
                    <input
                      type="number"
                      id="getQuantity"
                      name="getQuantity"
                      value={formData.getQuantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                      placeholder="e.g. 1"
                      min={1}
                      required
                    />
                  </div>
                </>
              )}
              
              {/* Show Bundle Discount fields */}
              {formData.type === 'BUNDLE' && (
                <div>
                  <label htmlFor="bundleDiscount" className="block text-sm font-medium text-gray-700 mb-1">
                    Bundle Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    id="bundleDiscount"
                    name="bundleDiscount"
                    value={formData.bundleDiscount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. 10"
                    min={0}
                    max={100}
                    required
                  />
                </div>
              )}
              
              {/* Show relationship type for upsell/cross-sell/downsell */}
              {['UPSELL', 'CROSS_SELL', 'DOWNSELL'].includes(formData.type) && (
                <div>
                  <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Type
                  </label>
                  <select
                    id="relationshipType"
                    name="relationshipType"
                    value={formData.relationshipType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="RECOMMENDED">Recommended Products</option>
                    <option value="RELATED">Related Products</option>
                    <option value="ALTERNATIVE">Alternative Products</option>
                    <option value="COMPLEMENTARY">Complementary Products</option>
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount (D)
                </label>
                <input
                  type="number"
                  id="minOrderAmount"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. 50.00"
                  min={0}
                  step={0.01}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty if no minimum order amount is required
                </p>
              </div>
              
              <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. 100"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>
            </div>
          </div>
          
          {/* Duration */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Promotion Duration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Product Selection */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Apply to Products</h2>
              <button 
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="text-sm bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition"
              >
                Select Products
              </button>
            </div>
            
            {selectedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedProducts.map(product => (
                  <div key={product.id} className="border rounded-md p-2 flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <div className="ml-2 overflow-hidden">
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {getCategoryName(product.category)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-md border border-dashed border-gray-300">
                <p className="text-gray-500">
                  No products selected. This promotion will apply to all products.
                </p>
              </div>
            )}
          </div>
          
          {/* Target Product Selection for upsell/cross-sell/downsell */}
          {['UPSELL', 'CROSS_SELL', 'DOWNSELL'].includes(formData.type) && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Target Products</h2>
                <button 
                  type="button"
                  onClick={() => setShowTargetProductSelector(true)}
                  className="text-sm bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition"
                >
                  Select Target Products
                </button>
              </div>
              
              {targetProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {targetProducts.map(product => (
                    <div key={product.id} className="border rounded-md p-2 flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="ml-2 overflow-hidden">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {getCategoryName(product.category)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white rounded-md border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    No target products selected. Please select products to 
                    {formData.type === 'UPSELL' ? ' upsell' : 
                     formData.type === 'CROSS_SELL' ? ' cross-sell' : ' downsell'}.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Settings */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Activate this promotion
              </label>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              If unchecked, this promotion will be saved but not active
            </p>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Link 
              href="/backend/promotions" 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t('cancel', 'Cancel')}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting 
                ? isEditing ? t('updating', 'Updating...') : t('creating', 'Creating...') 
                : isEditing ? t('update_promotion', 'Update Promotion') : t('create_promotion', 'Create Promotion')}
            </button>
          </div>
        </form>
      )}
      
      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelector
          products={products}
          selectedProductIds={formData.productIds}
          onSelect={handleProductSelection}
          onCancel={() => setShowProductSelector(false)}
          title={t('select_products', 'Select Products')}
        />
      )}
      
      {/* Target Product Selector Modal */}
      {showTargetProductSelector && (
        <ProductSelector
          products={products.filter(p => !formData.productIds.includes(p.id))}
          selectedProductIds={formData.targetProductIds}
          onSelect={handleTargetProductSelection}
          onCancel={() => setShowTargetProductSelector(false)}
          title={t('select_target_products', 'Select Target Products')}
        />
      )}
    </div>
  );
} 