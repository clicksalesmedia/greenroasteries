'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  sku?: string;
  category?: string | { name: string };
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductIds: string[];
  onSelect: (selectedIds: string[]) => void;
  onCancel: () => void;
  title?: string;
}

export default function ProductSelector({
  products,
  selectedProductIds,
  onSelect,
  onCancel,
  title = 'Select Products'
}: ProductSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedProductIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Get unique categories from products
  const categories = [...new Set(products.map(product => {
    if (!product.category) return 'Uncategorized';
    return typeof product.category === 'string' 
      ? product.category 
      : product.category.name;
  }))].sort();
  
  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const skuMatch = product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const categoryName = !product.category 
      ? 'Uncategorized' 
      : typeof product.category === 'string' 
        ? product.category 
        : product.category.name;
    
    const categoryMatch = !selectedCategory || categoryName === selectedCategory;
    
    return (nameMatch || skuMatch) && categoryMatch;
  });
  
  const handleToggleProduct = (productId: string) => {
    setSelectedIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedIds(filteredProducts.map(product => product.id));
  };
  
  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: 'auto' }}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Backdrop with higher opacity */}
        <div className="fixed inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>
        
        {/* Modal with stronger shadow and border */}
        <div 
          className="inline-block w-full max-w-4xl text-left align-middle bg-white rounded-lg shadow-2xl transform transition-all border-2 border-gray-300"
          style={{ 
            zIndex: 10000, 
            position: 'relative',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="px-6 py-5 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <tr key={product.id} onClick={() => handleToggleProduct(product.id)} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => handleToggleProduct(product.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-md bg-gray-100 flex-shrink-0 mr-3 overflow-hidden">
                                {product.imageUrl && (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                {product.sku && (
                                  <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {!product.category 
                              ? 'Uncategorized' 
                              : typeof product.category === 'string' 
                                ? product.category 
                                : product.category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {product.price.toFixed(2)} D
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No products found matching your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              {selectedIds.length} products selected
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSelect(selectedIds)}
              className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 