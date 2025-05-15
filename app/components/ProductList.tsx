'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  origin?: string;
  inStock: boolean;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Error loading products. Please try again later.');
        setLoading(false);
        console.error('Error fetching products:', err);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading products...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="p-4 text-center">No products found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
        >
          {product.imageUrl && (
            <div className="h-48 overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            {product.description && (
              <p className="text-gray-600 mt-1">{product.description}</p>
            )}
            <div className="mt-2 flex justify-between items-center">
              <span className="font-medium">${product.price.toFixed(2)}</span>
              <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            {product.origin && (
              <div className="mt-1 text-sm text-gray-500">
                Origin: {product.origin}
              </div>
            )}
            <div className="mt-1">
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                {product.category}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 