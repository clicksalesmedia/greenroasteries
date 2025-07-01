'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import ProductVariationModal from './ProductVariationModal';
import UAEDirhamSymbol from './UAEDirhamSymbol';
import CategoryBanner from './CategoryBanner';

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
    // Return null if no discount or discount is 0 or invalid
    if (!product.discount || product.discount <= 0) return null;
    
    if (product.discountType === 'PERCENTAGE') {
      const discountValue = Math.round(product.discount);
      return discountValue > 0 ? `-${discountValue}%` : null;
    } else if (product.discountType === 'FIXED_AMOUNT') {
      return product.discount > 0 ? (
        <span className="flex items-center gap-1">
          -{product.discount}
          <UAEDirhamSymbol size={10} />
        </span>
      ) : null;
    }
    return null;
  };

  // Function to get the background color for product image based on category
  const getImageBackgroundColor = (product: Product) => {
    const categoryName = typeof product.category === 'string' 
      ? product.category 
      : product.category?.name || '';
    
    // Check if it's NUTS & DRIED FRUITS category in English or Arabic
    const isNutsCategory = categoryName === 'NUTS & DRIED FRUITS' || 
                          categoryName === 'المكسرات والفواكه المجففة' ||
                          categoryName === 'مكسرات وفواكه مجففة' ||
                          categoryName === 'NUTS & DRIED FOOD';
    
    return isNutsCategory ? '#f6f6f6' : '#e9e9e9';
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
      
      {/* Category-specific banner */}
      <CategoryBanner category={categoryParam} />
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {products.map(product => (
          <div 
            key={product.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:shadow-md hover:-translate-y-1"
          >
            <Link href={`/product/${product.id}`} className="block">
              <div 
                className="aspect-square relative overflow-hidden"
                style={{ backgroundColor: getImageBackgroundColor(product) }}
              >
                <Image 
                  src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '')}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-contain transition-all duration-500 hover:scale-105"
                  loading="lazy"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    console.warn('Failed to load image:', product.imageUrl);
                  }}
                  priority={false}
                  quality={85}
                />
                {product.discount && product.discount > 0 && getDiscountDisplay(product) && (
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
                  <p className="font-semibold flex items-center gap-1">
                    {product.price.toFixed(2)}
                    <UAEDirhamSymbol size={14} />
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