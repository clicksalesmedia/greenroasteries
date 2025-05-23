'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import ProductVariationModal from './ProductVariationModal';

// Define Product interface
interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string | { name: string; nameAr?: string };
  slug?: string;
  discount?: number;
  discountType?: string;
  hasVariationDiscount?: boolean;
}

export default function ShopContent() {
  const { t, language, contentByLang } = useLanguage();
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the variation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        let url = '/api/products';
        if (categoryParam) {
          url += `?category=${encodeURIComponent(categoryParam)}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryParam]);

  // Function to open the variation modal
  const openVariationModal = (productId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Prevent event bubbling
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  // Function to close the variation modal
  const closeVariationModal = () => {
    setIsModalOpen(false);
  };

  // Function to format discount display
  const getDiscountDisplay = (product: Product) => {
    if (!product.discount || product.discount === 0) return null;
    
    if (product.discountType === 'PERCENTAGE') {
      return `-${Math.round(product.discount)}%`;
    } else if (product.discountType === 'FIXED_AMOUNT') {
      return `-${product.discount}D`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
       {categoryParam && <span className="font-normal"> {categoryParam}</span>}
      </h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map(product => (
          <div 
            key={product.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:shadow-md hover:-translate-y-1"
          >
            <Link href={`/product/${product.id}`} className="block">
              <div className="aspect-square bg-[#e9e9e9] relative overflow-hidden">
                <img 
                  src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '')}
                  alt={product.name}
                  className="object-contain w-full h-full transition-all duration-500 hover:scale-105"
                  style={{ objectPosition: 'center', width: '100%', height: '100%' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    // The parent already has a gray background
                  }}
                />
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {getDiscountDisplay(product)}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-sm sm:text-base mb-1 hover:text-gray-700 transition-colors">
                  {language === 'ar' && product.nameAr ? product.nameAr : product.name}
                </h3>
                
                <div className="flex justify-between items-center mt-2">
                  <p className="font-semibold">
                    {product.price.toFixed(2)} {contentByLang('AED', 'د.إ')}
                  </p>
                  
                  <button 
                    onClick={(e) => openVariationModal(product.id, e)}
                    className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                    aria-label={t('add_to_cart', 'Add to Cart')}
                  >
                    <ShoppingCartIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Variation selection modal */}
      <ProductVariationModal 
        isOpen={isModalOpen}
        onClose={closeVariationModal}
        productId={selectedProductId}
      />
    </div>
  );
} 