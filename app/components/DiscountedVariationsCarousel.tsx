'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import UAEDirhamSymbol from './UAEDirhamSymbol';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  price: number;
  images: string[];
  imageUrl?: string;
  category: string;
  rating?: number;
  discount?: number;
  discountType?: string;
  hasVariationDiscount?: boolean;
}

interface DiscountedVariationsCarouselProps {
  onOpenVariationModal: (productId: string, e: React.MouseEvent) => void;
}

const DiscountedVariationsCarousel: React.FC<DiscountedVariationsCarouselProps> = ({ onOpenVariationModal }) => {
  const { language, t, contentByLang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 768) {
        setItemsPerView(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Fetch products with discounted variations
  useEffect(() => {
    const fetchDiscountedVariationProducts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/products?variationDiscounts=true&limit=12', {
          next: { revalidate: 3600 },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const processedProducts = data.map((product: any) => {
              const imageUrl = product.imageUrl || 
                (product.images && product.images.length > 0 ? 
                  (typeof product.images[0] === 'string' ? product.images[0] : 
                   product.images[0]?.url || '') : 
                '/images/coffee-placeholder.jpg');
              
              return {
                id: product.id,
                name: product.name || '',
                nameAr: product.nameAr || '',
                price: product.price || 0,
                discount: product.discount || 0,
                discountType: product.discountType || 'PERCENTAGE',
                images: product.images || [],
                imageUrl,
                slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || 'product',
                rating: product.rating || 0,
                category: product.category || '',
                hasVariationDiscount: product.hasVariationDiscount || false
              };
            });

            setProducts(processedProducts);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching discounted variation products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountedVariationProducts();
  }, []);

  const getProductName = (product: Product) => {
    return contentByLang(product.name, product.nameAr || product.name);
  };

  const getCategoryName = (categoryData: any) => {
    if (typeof categoryData === 'string') {
      return categoryData;
    }
    return contentByLang(categoryData?.name || '', categoryData?.nameAr || categoryData?.name || '');
  };

  const formatPrice = (price: number) => {
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
  };

  const getDiscountedPrice = (price: number, discount: number, discountType: string) => {
    if (!discount || discount <= 0) return price;
    
    if (discountType === 'PERCENTAGE') {
      return price * (1 - discount / 100);
    } else if (discountType === 'FIXED_AMOUNT') {
      return Math.max(0, price - discount);
    }
    return price;
  };

  const getDiscountDisplay = (product: Product) => {
    if (!product.discount || product.discount <= 0) return null;
    
    if (product.discountType === 'PERCENTAGE') {
      return `-${Math.round(product.discount)}%`;
    } else if (product.discountType === 'FIXED_AMOUNT') {
      return `-${product.discount}D`;
    }
    return 'Sale';
  };

  const maxIndex = Math.max(0, products.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const visibleProducts = useMemo(() => {
    return products.slice(currentIndex, currentIndex + itemsPerView);
  }, [products, currentIndex, itemsPerView]);

  if (loading) {
    return (
      <section className="section bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-red-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't render if no discounted variation products
  }

  return (
    <section className="section bg-gradient-to-r from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header text-center"
        >
          <h2 className="section-title flex items-center justify-center gap-2 text-red-700">
            <SparklesIcon className="w-8 h-8 text-red-500" />
            {t('variation_deals', 'Variation Deals')}
            <SparklesIcon className="w-8 h-8 text-red-500" />
          </h2>
          <p className="section-description text-red-600">
            {t('discounted_variations_desc', 'Discover amazing deals on different sizes and types')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation buttons */}
          {products.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Previous products"
              >
                <ChevronLeftIcon className="w-6 h-6 text-red-600" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Next products"
              >
                <ChevronRightIcon className="w-6 h-6 text-red-600" />
              </button>
            </>
          )}

          {/* Carousel container */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className={`grid gap-6 ${
                  itemsPerView === 1 ? 'grid-cols-1' : 
                  itemsPerView === 2 ? 'grid-cols-2' :
                  itemsPerView === 3 ? 'grid-cols-3' : 'grid-cols-4'
                }`}
              >
                {visibleProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="group"
                  >
                    <Link href={`/product/${product.slug}`} className="product-card block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="product-image-wrapper relative aspect-square overflow-hidden">
                        <Image
                          src={product.imageUrl || '/images/coffee-placeholder.jpg'}
                          alt={getProductName(product)}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="product-image object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          quality={80}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
                          unoptimized={product.imageUrl?.startsWith('/uploads/') || false}
                        />
                        {/* Discount badge */}
                        {getDiscountDisplay(product) && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            {getDiscountDisplay(product)}
                          </div>
                        )}
                        {/* Variation deals indicator */}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {t('size_deals', 'Size Deals')}
                        </div>
                      </div>
                      
                      <div className="product-content p-4">
                        <p className="product-category text-sm text-red-600 mb-1 font-medium">
                          {getCategoryName(product.category)}
                        </p>
                        <h3 className="product-name text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
                          {getProductName(product)}
                        </h3>
                        
                        <div className="product-footer flex justify-between items-center">
                          <div className="product-price-wrapper">
                            {product.discount ? (
                              <div className="flex flex-col">
                                <span className="product-price text-xl font-bold text-red-600 flex items-center">
                                  {formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType || 'PERCENTAGE'))}
                                </span>
                                <span className="product-price-original text-sm text-gray-500 line-through flex items-center">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="product-price text-xl font-bold text-gray-900 flex items-center">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          
                          <button 
                            onClick={(e) => onOpenVariationModal(product.id, e)}
                            className="product-action bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
                            aria-label={t('view_options', 'View Options')}
                          >
                            <ShoppingCartIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination dots */}
          {products.length > itemsPerView && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === currentIndex 
                      ? 'bg-red-500 scale-125' 
                      : 'bg-red-200 hover:bg-red-300'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {t('explore_all_deals', 'Explore All Deals')}
            <ChevronRightIcon className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DiscountedVariationsCarousel; 