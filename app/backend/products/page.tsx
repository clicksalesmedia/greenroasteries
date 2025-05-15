'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  isActive?: boolean; // For backwards compatibility
  stockQuantity: number;
  category: {
    name: string;
    nameAr?: string;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const { t, contentByLang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete', 'Are you sure you want to delete this product?'))) {
      return;
    }
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Remove the deleted product from the state
      setProducts(products.filter(product => product.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
    }
  };
  
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product status');
      }
      
      // Update the local state
      setProducts(products.map(product => {
        if (product.id === id) {
          return { ...product, isActive: !currentStatus };
        }
        return product;
      }));
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product status');
    }
  };
  
  return (
    <BackendLayout activePage="products">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t('manage_products', 'Manage Products')}</h1>
          <Link 
            href="/backend/products/new" 
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
          >
            {t('add_new_product', 'Add New Product')}
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
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">{t('image', 'Image')}</th>
                  <th className="py-3 px-4 text-left">{t('name', 'Name')}</th>
                  <th className="py-3 px-4 text-left">{t('category', 'Category')}</th>
                  <th className="py-3 px-4 text-left">{t('price', 'Price')}</th>
                  <th className="py-3 px-4 text-left">{t('stock', 'Stock')}</th>
                  <th className="py-3 px-4 text-left">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 relative">
                          {product.imageUrl ? (
                            <Image 
                              src={product.imageUrl} 
                              alt={contentByLang(product.name, product.nameAr || product.name)}
                              layout="fill" 
                              objectFit="cover"
                              className="rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-500 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {contentByLang(product.name, product.nameAr || product.name)}
                      </td>
                      <td className="py-3 px-4">
                        {contentByLang(
                          product.category?.name || 'Uncategorized', 
                          product.category?.nameAr || product.category?.name || 'غير مصنف'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        AED {product.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {product.stockQuantity > 0 ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {t('in_stock', 'In Stock')} ({product.stockQuantity})
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            {t('out_of_stock', 'Out of Stock')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(product.id, product.isActive || product.inStock)}
                            className={`px-3 py-1 rounded text-xs ${
                              product.isActive || product.inStock
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {(product.isActive || product.inStock) ? t('deactivate', 'Deactivate') : t('activate', 'Activate')}
                          </button>
                          <button
                            onClick={() => router.push(`/backend/products/edit/${product.id}`)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs"
                          >
                            {t('edit', 'Edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs"
                          >
                            {t('delete', 'Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      {t('no_products_found', 'No products found. Click "Add New Product" to create one.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BackendLayout>
  );
} 