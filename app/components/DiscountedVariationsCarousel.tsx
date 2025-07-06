'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon, SparklesIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile devices (phones only)
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 640;
      console.log('Desktop Carousel - Screen width:', window.innerWidth, 'isMobile:', mobile);
      setIsMobile(mobile); // Only phones are mobile, tablets and up show desktop view
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
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

  // Auto-play functionality for desktop
  useEffect(() => {
    if (!isMobile && isAutoPlaying && products.length > 4 && !isPaused) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const maxIndex = products.length - 4; // Show 4 cards, so max index is products.length - 4
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }, 3000); // Auto advance every 3 seconds
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isMobile, isAutoPlaying, products.length, isPaused]);

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

  const nextSlide = useCallback(() => {
    if (isMobile) return; // No manual navigation on mobile
    setCurrentIndex(prev => {
      const maxIndex = products.length - 4;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  }, [isMobile, products.length]);

  const prevSlide = useCallback(() => {
    if (isMobile) return; // No manual navigation on mobile
    setCurrentIndex(prev => {
      const maxIndex = products.length - 4;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }, [isMobile, products.length]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Mobile scroll functionality
  const scrollToProduct = (index: number) => {
    if (scrollContainerRef.current && isMobile) {
      const cardWidth = scrollContainerRef.current.scrollWidth / products.length;
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const renderProductCard = (product: Product, index: number) => (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group w-full"
    >
      <Link href={`/product/${product.slug}`} className="product-card block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="product-image-wrapper relative aspect-square overflow-hidden">
          <Image
            src={product.imageUrl || '/images/coffee-placeholder.jpg'}
            alt={getProductName(product)}
            fill
            sizes="(max-width: 768px) 280px, 300px"
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
          <h3 className="product-name text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-700 transition-colors line-clamp-2">
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
  );

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

        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Desktop: Carousel with navigation and auto-play */}
          {!isMobile ? (
            <>
              {console.log('Desktop Carousel - Products count:', products.length, 'Using desktop view')}
              {/* Auto-play controls - only show if we have more than 4 products */}
              {products.length > 4 && (
                <div className="absolute top-0 right-0 z-20 flex items-center gap-2">
                  <button
                    onClick={toggleAutoPlay}
                    className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300"
                    aria-label={isAutoPlaying ? 'Pause autoplay' : 'Start autoplay'}
                  >
                    {isAutoPlaying ? (
                      <PauseIcon className="w-4 h-4 text-red-600" />
                    ) : (
                      <PlayIcon className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              )}

              {/* Navigation buttons */}
              {products.length > 4 && (
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

              {/* Products display */}
          <div className="overflow-hidden">
                {products.length <= 4 ? (
                                    /* Static display for 4 or fewer products */
                  <>
                    {console.log('Desktop Carousel - Using static display for', products.length, 'products')}
                    <div className="grid grid-cols-4 gap-6">
                      {products.map((product, index) => (
                        <div key={product.id}>
                          {renderProductCard(product, index)}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Sliding display for more than 4 products */
                  <>
                    {console.log('Desktop Carousel - Using sliding display for', products.length, 'products, currentIndex:', currentIndex)}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                      initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="grid grid-cols-4 gap-6"
                    >
                      {products.slice(currentIndex, currentIndex + 4).map((product, index) => (
                        <div key={product.id}>
                          {renderProductCard(product, index)}
                        </div>
                ))}
              </motion.div>
            </AnimatePresence>
                  </>
                )}
          </div>

          {/* Pagination dots */}
              {products.length > 4 && (
            <div className="flex justify-center mt-8 gap-2">
                  {Array.from({ length: products.length - 3 }, (_, index) => (
                <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                      ? 'bg-red-500 scale-125' 
                      : 'bg-red-200 hover:bg-red-300'
                  }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Mobile: Horizontal scroll with 3 visible cards */
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory px-4 -mx-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {products.map((product, index) => (
                  <div key={product.id} className="snap-start flex-none w-72">
                    {renderProductCard(product, index)}
                  </div>
                ))}
              </div>

              {/* Mobile scroll indicators */}
              <div className="flex justify-center mt-6 gap-1">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToProduct(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === Math.round(currentIndex) 
                        ? 'bg-red-500 scale-125' 
                        : 'bg-red-200'
                    }`}
                    aria-label={`Scroll to product ${index + 1}`}
                />
              ))}
              </div>
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

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default DiscountedVariationsCarousel; 