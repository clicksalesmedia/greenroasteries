'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './contexts/LanguageContext';
import MaintenanceMode from './components/MaintenanceMode';
import ProductVariationModal from './components/ProductVariationModal';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  images: Array<{url: string} | string>;
  imageUrl?: string;
  slug: string;
  rating?: number;
  category?: string | { name: string; nameAr?: string };
  discount?: number;
  discountType?: string;
}

// Hero banner slide interface
interface HeroSlide {
  id: number;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonLink: string;
  image: string;
  backgroundColor: string;
  textColor?: string;
  buttonColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  overlayImageUrl?: string;
  textAnimation: string;
  imageAnimation: string;
  transitionSpeed: string;
}

// Promotion Banner Interface
interface PromotionBanner {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  imageUrl: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonLink: string;
  alignment: 'left' | 'right'; // To control text/image alignment
}

// Offer Interface
interface Offer {
  id: string;
  title: string;
  titleAr?: string;
  discount: string; // e.g., "20% OFF" or "SAVE 50D"
  code?: string; // Optional discount code
  description: string;
  descriptionAr?: string;
  imageUrl?: string; // Optional image for the offer
  validity: string; // e.g., "Ends Dec 31"
  validityAr?: string;
}

// Function to generate slider animation variants based on direction
const getSliderVariants = (direction: number) => {
  return {
    incoming: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    active: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    })
  };
};

export default function Home() {
  // Add language context
  const { language, t, contentByLang } = useLanguage();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderLoading, setSliderLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Hero slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  // Promotion Banners State
  const [promotionBanners, setPromotionBanners] = useState<PromotionBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // Add state for discounted products
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [discountedLoading, setDiscountedLoading] = useState(true);

  // State for the variation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Add state for categories
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
    imageUrl?: string;
  }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Slide change handlers - memoize callback functions to prevent unnecessary re-renders
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  }, [heroSlides.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  }, [heroSlides.length]);

  // Function to open the variation modal - memoized to prevent rerenders
  const openVariationModal = useCallback((productId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Prevent event bubbling
    setSelectedProductId(productId);
    setIsModalOpen(true);
  }, []);

  // Function to close the variation modal - memoized to prevent rerenders
  const closeVariationModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Memoize formatPrice to improve rendering performance
  const formatPrice = useCallback((price: number) => {
    return `${price.toFixed(2)}D`;
  }, []);

  // Memoize discount calculation for better performance
  const getDiscountedPrice = useCallback((price: number, discount: number | undefined, discountType: string | undefined) => {
    if (!discount) return price;
    
    if (discountType === 'PERCENTAGE') {
      return price * (1 - discount / 100);
    } else if (discountType === 'FIXED_AMOUNT') {
      return Math.max(0, price - discount);
    }
    
    return price;
  }, []);

  // Fetch sliders - optimized with useCallback
  useEffect(() => {
    const fetchSliders = async () => {
      try {
        setSliderLoading(true);
        // Only fetch active sliders for the public homepage
        const response = await fetch('/api/sliders?active=true', {
          cache: 'force-cache', // Use cached response when available
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Map API response to HeroSlide interface
          const slides: HeroSlide[] = data.map((slide: any) => ({
            id: slide.id,
            title: slide.title,
            titleAr: slide.titleAr,
            subtitle: slide.subtitle,
            subtitleAr: slide.subtitleAr,
            buttonText: slide.buttonText,
            buttonTextAr: slide.buttonTextAr,
            buttonLink: slide.buttonLink,
            image: slide.imageUrl,
            backgroundColor: slide.backgroundColor,
            textColor: slide.textColor || '#111111',
            buttonColor: slide.buttonColor || '#111111',
            overlayColor: slide.overlayColor || 'rgba(0,0,0,0)',
            overlayOpacity: slide.overlayOpacity || 0,
            overlayImageUrl: slide.overlayImageUrl || undefined,
            textAnimation: slide.textAnimation || 'fade-up',
            imageAnimation: slide.imageAnimation || 'fade-in',
            transitionSpeed: slide.transitionSpeed || 'medium',
          }));
          
          setHeroSlides(slides);
        } else {
          // Fallback slides are already defined in your code
          // I'm keeping this part for error handling
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
        // Fallback slides logic remains
      } finally {
        setSliderLoading(false);
      }
    };
    
    fetchSliders();
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch featured products - optimized with useCallback and better error handling
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch featured products from API with improved caching strategy
        const response = await fetch('/api/products?limit=12&featured=true', {
          next: { revalidate: 3600 }, // Revalidate data every hour
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            // Process and normalize product data from the API
            const processedProducts = data.map((product: any) => {
              // Simplified image processing logic
              const imageUrl = product.imageUrl || 
                (product.images && product.images.length > 0 ? 
                  (typeof product.images[0] === 'string' ? product.images[0] : 
                   product.images[0]?.url || '') : 
                '/images/coffee-placeholder.jpg');
              
              // Create a normalized product object with fewer computed properties
              return {
                id: product.id,
                name: product.name || '',
                nameAr: product.nameAr || '',
                price: product.price || 0,
                images: product.images || [],
                imageUrl,
                slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || 'product',
                rating: product.rating || 0,
                category: product.category || '',
                discount: product.discount || 0,
                discountType: product.discountType || 'PERCENTAGE',
              };
            });

            // Use a stable shuffling algorithm and limit to 12 products
            const shuffledProducts = [...processedProducts]
              .sort(() => 0.5 - Math.random())
              .slice(0, 12);
              
            setFeaturedProducts(shuffledProducts);
          } else {
            // Use fallback data if no products returned (your existing code)
          }
        } else {
          // Fallback logic remains the same
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // Fallback logic remains the same
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch discounted products with improved performance
  useEffect(() => {
    const fetchDiscountedProducts = async () => {
      try {
        setDiscountedLoading(true);
        
        // Fetch products with active promotions
        const response = await fetch('/api/products?discounted=true&limit=8', {
          next: { revalidate: 3600 }, // Revalidate every hour
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Process the data similar to featured products but with a simpler approach
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
                category: product.category || ''
              };
            });

            setDiscountedProducts(processedProducts);
          } else {
            setDiscountedProducts([]);
          }
        } else {
          setDiscountedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching discounted products:', error);
        setDiscountedProducts([]);
      } finally {
        setDiscountedLoading(false);
      }
    };

    fetchDiscountedProducts();
  }, []);

  // Format discount display - memoized for performance
  const getDiscountDisplay = useCallback((product: any) => {
    if (!product.discount) return null;
    
    if (product.discountType === 'PERCENTAGE') {
      return `-${product.discount}%`;
    } else if (product.discountType === 'FIXED_AMOUNT') {
      return `-${product.discount}D`;
    } else {
      return 'Sale';
    }
  }, []);

  // Get product name based on current language - memoized
  const getProductName = useCallback((product: Product) => {
    if (!product) return '';
    return contentByLang(
      product.name || '', 
      product.nameAr || product.name || ''
    );
  }, [contentByLang]);

  // Get category name based on current language - memoized
  const getCategoryName = useCallback((category: string | { name: string; nameAr?: string } | undefined) => {
    if (!category) return '';
    
    if (typeof category === 'string') {
      // Define category mappings to ensure translations work for string categories
      const categoryTranslations: Record<string, string> = {
        'Single Origin': 'أحادي المصدر',
        'Medium Roast': 'تحميص متوسط',
        'Espresso Roast': 'تحميص إسبريسو',
        'Dark Roast': 'تحميص داكن',
        'Light Roast': 'تحميص فاتح',
        'Premium': 'ممتاز',
        'Espresso': 'إسبريسو',
        'Arabica': 'عربية',
        'Robusta': 'روبوستا',
        'Blend': 'مزيج',
        'Specialty': 'مميز',
        'Decaf': 'منزوع الكافيين',
        'Coffee Beans': 'حبوب القهوة',
        'Nuts & Dried Fruits': 'المكسرات والفواكه المجففة'
      };
      
      // If in Arabic mode and we have a translation, return it, otherwise return the original
      return language === 'ar' && categoryTranslations[category] 
        ? categoryTranslations[category] 
        : category;
    }
    
    // Handle case where category is an object
    if (typeof category === 'object') {
      return contentByLang(
        category.name || '', 
        category.nameAr || category.name || ''
      );
    }
    
    return '';
  }, [language, contentByLang]);

  // Function to get URL-friendly slug for categories
  const getCategorySlug = useCallback((categoryName: string) => {
    // Map of Arabic or display category names to their English equivalents for URLs
    const categoryMappings: Record<string, string> = {
      'المكسرات والفواكه المجففة': 'NUTS & DRIED FRUITS',
      'مكسرات وفواكه مجففة': 'NUTS & DRIED FRUITS',
      'قهوة عربية': 'ARABIC COFFEE',
      'القهوة العربية': 'ARABIC COFFEE',
      'قهوة مختصة': 'SPECIALTY COFFEE',
      'قهوة مطحونة': 'FILTER COFFEE',
      'قهوة اسبريسو': 'ESPRESSO ROAST',
      'تحميص الإسبريسو': 'ESPRESSO ROAST',
      'قهوة متوسطة التحميص': 'MEDIUM ROAST',
      'تحميص متوسط': 'MEDIUM ROAST',
      'قهوة داكنة التحميص': 'DARK ROAST',
      'تحميص داكن': 'DARK ROAST',
      'قهوة فاتحة التحميص': 'LIGHT ROAST',
      'تحميص فاتح': 'LIGHT ROAST',
      'أكسسوارات القهوة': 'COFFEE ACCESSORIES',
      'تحميص تركي': 'TURKISH ROAST',
      'قهوة تركية': 'TURKISH COFFEE',
      'أرابيكا': 'ARABICA',
      'روبوستا': 'ROBUSTA',
      'خلطات': 'BLEND',
      'أصل واحد': 'SINGLE ORIGIN',
      'إسبريسو': 'ESPRESSO',
      'خالية من الكافيين': 'DECAF'
    };
    
    // Always use English category names in URLs, regardless of display language
    return categoryMappings[categoryName] || categoryName;
  }, []);

  // Memoize this function to prevent recalculation on every render
  const getCategoryDisplayName = useCallback((categoryName: string) => {
    // Map for category display headers (all caps in English, properly formatted in Arabic)
    const categoryDisplayMap: Record<string, { en: string, ar: string }> = {
      'single origin': { en: 'SINGLE ORIGIN', ar: 'أحادي المصدر' },
      'medium roast': { en: 'MEDIUM ROAST', ar: 'تحميص متوسط' },
      'espresso roast': { en: 'ESPRESSO ROAST', ar: 'تحميص إسبريسو' },
      'dark roast': { en: 'DARK ROAST', ar: 'تحميص داكن' },
      'light roast': { en: 'LIGHT ROAST', ar: 'تحميص فاتح' },
      'premium': { en: 'PREMIUM', ar: 'ممتاز' },
      'espresso': { en: 'ESPRESSO', ar: 'إسبريسو' },
      'arabica': { en: 'ARABICA', ar: 'عربية' },
      'robusta': { en: 'ROBUSTA', ar: 'روبوستا' },
      'blend': { en: 'BLEND', ar: 'مزيج' },
      'specialty': { en: 'SPECIALTY', ar: 'مميز' },
      'decaf': { en: 'DECAF', ar: 'منزوع الكافيين' },
      // Add specific product categories from the screenshot
      'nuts & dried fruits': { en: 'NUTS & DRIED FRUITS', ar: 'المكسرات والفواكه المجففة' }
    };
    
    // Default formatting if no mapping exists
    const formattedCategory = categoryName.toLowerCase();
    
    if (categoryDisplayMap[formattedCategory]) {
      return language === 'ar' 
        ? categoryDisplayMap[formattedCategory].ar 
        : categoryDisplayMap[formattedCategory].en;
    }
    
    // If no mapping exists, format English to uppercase or return Arabic as is
    return language === 'ar' ? categoryName : categoryName.toUpperCase();
  }, [language]);

  // Check maintenance mode and admin status
  useEffect(() => {
    const checkMaintenanceAndAdmin = async () => {
      try {
        // Check maintenance mode
        const maintenanceRes = await fetch('/api/maintenance');
        const maintenanceData = await maintenanceRes.json();
        setMaintenanceMode(maintenanceData.maintenanceMode);

        // Check if user is admin
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        setIsAdmin(sessionData?.user?.role === 'ADMIN');
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenanceAndAdmin();
  }, []);

  // If in maintenance mode and not admin, show maintenance page
  if (maintenanceMode && !isAdmin) {
    return <MaintenanceMode />;
  }

  // Render featured products section
  const renderFeaturedProducts = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
        {featuredProducts.map(product => (
          <div key={product.id}>
            <Link href={`/product/${product.id}`} className="product-card block">
              <div className="product-image-container">
                <Image 
                  src={product.imageUrl || ''} 
                  alt={getProductName(product)} 
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="product-image"
                  loading="lazy"
                  onError={(e) => {
                    console.error(`Failed to load product image: ${product.imageUrl}`);
                    // Use background color instead of placeholder image
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    // Add a colored background to the container
                    const container = target.parentElement;
                    if (container) {
                      container.style.backgroundColor = '#f3f4f6';
                      // Add placeholder SVG
                      const placeholder = document.createElement('div');
                      placeholder.className = 'absolute inset-0 flex items-center justify-center';
                      placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                      container.appendChild(placeholder);
                    }
                  }}
                />
              </div>
              <div className="product-info">
                <div className="product-category">
                  {getCategoryDisplayName(getCategoryName(product.category))}
                </div>
                <h3 className="product-title">{getProductName(product)}</h3>
                <div className="flex justify-between items-center">
                  <div className="product-price">{formatPrice(product.price)}</div>
                  <button 
                    onClick={(e) => openVariationModal(product.id, e)}
                    className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
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
    );
  }, [featuredProducts, loading, getProductName, getCategoryName, getCategoryDisplayName, formatPrice, openVariationModal, t]);

  // Render discounted products carousel - memoized for better performance
  const renderDiscountedProducts = useMemo(() => {
    if (discountedLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      );
    }

    if (discountedProducts.length === 0) {
      return (
        <p className="text-center text-gray-500">{t('no_discounted_products', 'No discounted products available right now.')}</p>
      );
    }

    return (
      <div className="carousel-container">
        <div className="carousel-controls">
          <button className="carousel-arrow" onClick={() => document.getElementById('discounted-carousel')?.scrollBy({left: -280, behavior: 'smooth'})}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="carousel-arrow" onClick={() => document.getElementById('discounted-carousel')?.scrollBy({left: 280, behavior: 'smooth'})}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div 
          id="discounted-carousel" 
          className="flex overflow-x-auto snap-x scrollbar-hide gap-4 py-2 px-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {discountedProducts.map(product => (
            <div 
              key={product.id} 
              className="flex-none w-full sm:w-[calc(50%-16px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-16px)] snap-start offer-carousel-item"
            >
              <Link href={`/product/${product.id}`} className="product-card block h-full">
                <div className="product-image-container relative">
                  <Image 
                    src={product.imageUrl || ''} 
                    alt={getProductName(product)} 
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="product-image"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`Failed to load discounted product image: ${product.imageUrl}`);
                      // Use background color instead of placeholder image
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                      // Add a colored background to the container
                      const container = target.parentElement;
                      if (container) {
                        container.style.backgroundColor = '#f3f4f6';
                        // Add placeholder SVG
                        const placeholder = document.createElement('div');
                        placeholder.className = 'absolute inset-0 flex items-center justify-center';
                        placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                        container.appendChild(placeholder);
                      }
                    }}
                  />
                  {product.discount && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {getDiscountDisplay(product)}
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <div className="product-category">
                    {getCategoryDisplayName(getCategoryName(product.category))}
                  </div>
                  <h3 className="product-title">{getProductName(product)}</h3>
                  <div className="flex justify-between items-center">
                    <div className="product-price flex items-center">
                      <span className="font-bold text-black">{formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType))}</span>
                      {product.discount && (
                        <span className="ml-2 text-sm text-gray-500 line-through">{formatPrice(product.price)}</span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => openVariationModal(product.id, e)}
                      className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
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
      </div>
    );
  }, [discountedProducts, discountedLoading, getProductName, getCategoryName, getCategoryDisplayName, formatPrice, getDiscountedPrice, getDiscountDisplay, openVariationModal, t]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/categories?limit=8', {
          next: { revalidate: 3600 }, // Revalidate every hour
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API response:', data);
          
          if (data && data.length > 0) {
            // Process and normalize category data
            const processedCategories = data.map((category: any) => {
              const processedCategory = {
                id: category.id,
                name: category.name || '',
                nameAr: category.nameAr || '',
                slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || 'category',
                imageUrl: category.imageUrl || '/images/coffee-beans.jpg'
              };
              
              console.log('Processed category:', processedCategory);
              return processedCategory;
            });

            // Shuffle categories and limit to 4
            const shuffledCategories = [...processedCategories]
              .sort(() => 0.5 - Math.random())
              .slice(0, 4);
              
            console.log('Final categories to display:', shuffledCategories);
            setCategories(shuffledCategories);
          } else {
            // Use fallback categories if none returned
            console.log('No categories returned from API, using fallbacks');
            setCategories([
              {
                id: '1',
                name: 'Coffee Beans',
                nameAr: 'حبوب القهوة',
                slug: 'coffee-beans',
                imageUrl: '/images/coffee-beans.jpg'
              },
              {
                id: '2',
                name: 'Single Origin',
                nameAr: 'أحادي المصدر',
                slug: 'single-origin',
                imageUrl: '/images/single-origin.jpg'
              },
              {
                id: '3',
                name: 'Espresso',
                nameAr: 'إسبريسو',
                slug: 'espresso',
                imageUrl: '/images/espresso.jpg'
              },
              {
                id: '4',
                name: 'Nuts & Dried Fruits',
                nameAr: 'المكسرات والفواكه المجففة',
                slug: 'nuts-dried-fruits',
                imageUrl: '/images/nuts.jpg'
              }
            ]);
          }
        } else {
          // Use fallback categories on error
          console.error('Failed to fetch categories:', response.status, response.statusText);
          setCategories([
            {
              id: '1',
              name: 'Coffee Beans',
              nameAr: 'حبوب القهوة',
              slug: 'coffee-beans',
              imageUrl: '/images/coffee-beans.jpg'
            },
            {
              id: '2',
              name: 'Single Origin',
              nameAr: 'أحادي المصدر',
              slug: 'single-origin',
              imageUrl: '/images/single-origin.jpg'
            },
            {
              id: '3',
              name: 'Espresso',
              nameAr: 'إسبريسو',
              slug: 'espresso',
              imageUrl: '/images/espresso.jpg'
            },
            {
              id: '4',
              name: 'Nuts & Dried Fruits',
              nameAr: 'المكسرات والفواكه المجففة',
              slug: 'nuts-dried-fruits',
              imageUrl: '/images/nuts.jpg'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use fallback categories on error
        setCategories([
          {
            id: '1',
            name: 'Coffee Beans',
            nameAr: 'حبوب القهوة',
            slug: 'coffee-beans',
            imageUrl: '/images/coffee-beans.jpg'
          },
          {
            id: '2',
            name: 'Single Origin',
            nameAr: 'أحادي المصدر',
            slug: 'single-origin',
            imageUrl: '/images/single-origin.jpg'
          },
          {
            id: '3',
            name: 'Espresso',
            nameAr: 'إسبريسو',
            slug: 'espresso',
            imageUrl: '/images/espresso.jpg'
          },
          {
            id: '4',
            name: 'Nuts & Dried Fruits',
            nameAr: 'المكسرات والفواكه المجففة',
            slug: 'nuts-dried-fruits',
            imageUrl: '/images/nuts.jpg'
          }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style jsx global>{`
        .hero-banner {
            min-height: 650px;
            height: 70vh; 
            max-height: 750px;
            position: relative;
            overflow: hidden;
            background-color: #fbfbfd;
        }
        .slider-container {
            position: relative;
            height: 100%;
            width: 100%;
        }
        .slider-slide {
            height: 100%;
            width: 100%;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: absolute; 
            top: 0;
            left: 0;
            /* Subtle pattern and gradient background */
            background-image: 
              radial-gradient(circle at 25% 25%, rgba(0,0,0,0.01) 1%, transparent 1%),
              radial-gradient(circle at 75% 75%, rgba(0,0,0,0.01) 1%, transparent 1%),
              linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0));
            background-size: 20px 20px, 20px 20px, 100% 100%;
        }
        
        .slide-content-container { 
            position: absolute;
            left: 8%; /* Increased margin for modern look */
            right: auto; 
            top: 50%;
            transform: translateY(-50%);
            width: auto;
            max-width: 40%; 
            text-align: left; /* Default for LTR */
            z-index: 10;
            padding: 0;
        }

        /* RTL adjustments for slide content */
        [dir="rtl"] .slide-content-container {
            left: auto;
            right: 8%;
            text-align: right;
        }

        .slide-image-container { 
            position: absolute;
            right: 8%; /* Increased margin for modern look */
            left: auto; 
            bottom: 0; 
            width: 52%; 
            height: 90%; 
            display: flex;
            align-items: flex-end; 
            justify-content: center; 
            z-index: 5;
        }

        /* RTL adjustments for slide image */
        [dir="rtl"] .slide-image-container {
            right: auto;
            left: 8%;
        }

        .slide-image { 
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; 
            filter: drop-shadow(0 20px 30px rgba(0,0,0,0.05)); /* Softer, larger shadow for depth */
        }

        /* New design for slide dots */
        .slide-dots {
            position: absolute;
            bottom: 40px; /* Increased distance from bottom */
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 20;
        }
        .slide-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.15);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            border: 2px solid transparent;
        }
        .slide-dot:after {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-radius: 50%;
            background-color: transparent;
            transition: all 0.3s ease;
        }
        .slide-dot.active {
            background-color: #000000;
            transform: scale(1.2);
        }
        .slide-dot:hover:not(.active) {
            background-color: rgba(0, 0, 0, 0.3);
            transform: scale(1.1);
        }
        
        /* Modern arrow navigation */
        .slide-arrows {
            position: absolute;
            top: 50%;
            width: calc(100% - 40px); 
            left: 20px; 
            display: flex;
            justify-content: space-between;
            transform: translateY(-50%);
            z-index: 20;
            pointer-events: none;
        }

        /* RTL adjustment for slide arrows container */
        [dir="rtl"] .slide-arrows {
            left: auto;
            right: 20px;
            flex-direction: row-reverse;
        }

        .slide-arrow {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
        
        .slide-arrow:hover {
            background-color: #ffffff;
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
            transform: scale(1.05);
        }
        
        .slide-arrow svg {
            width: 20px;
            height: 20px;
            color: #111111;
            transition: transform 0.3s ease;
        }
        
        .slide-arrow:hover svg {
            transform: scale(1.1);
        }

        /* RTL adjustments for slide arrows */
        [dir="rtl"] .slide-arrow svg {
            transform: scaleX(-1);
        }
        
        /* Modern typography for slide content */
        .slide-title {
            font-size: 3.2rem; 
            line-height: 1.1;
            font-weight: 800; 
            color: #111111;
            margin-bottom: 1.2rem;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, #111111, #555555);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
        }
        
        .slide-subtitle {
            font-size: 1.1rem; 
            line-height: 1.65;
            color: #555555;
            margin-bottom: 2rem;
            max-width: 90%;
        }
        
        .slide-button {
            background-color: #111111;
            color: white;
            padding: 0.9rem 2rem;
            border-radius: 30px; /* More rounded for modern look */
            font-weight: 600; 
            letter-spacing: 0.3px;
            display: inline-flex;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            text-transform: none; 
            font-size: 1rem;
            position: relative;
            overflow: hidden;
        }
        
        .slide-button:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 100%;
            background-color: rgba(255,255,255,0.1);
            transition: width 0.4s ease;
            z-index: 0;
        }
        
        .slide-button:hover {
            background-color: #000000;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.15);
        }
        
        .slide-button:hover:after {
            width: 100%;
        }
        
        .slide-button span {
            position: relative;
            z-index: 1;
        }
        
        .slide-button-icon {
            margin-left: 8px;
            transition: transform 0.3s ease;
        }
        
        .slide-button:hover .slide-button-icon {
            transform: translateX(4px);
        }

        @media (max-width: 1280px) {
            .slide-title {
                font-size: 2.8rem;
            }
        }

        @media (max-width: 1024px) { /* Tablet */
            .hero-banner {
                height: 60vh;
                min-height: 500px;
            }
            .slide-content-container {
                max-width: 45%;
                left: 6%;
            }
            .slide-image-container {
                width: 48%;
                height: 85%;
                right: 4%;
            }
            .slide-title {
                font-size: 2.4rem;
            }
            .slide-subtitle {
                font-size: 1rem;
            }
            .slide-button {
                padding: 0.8rem 1.8rem;
            }
        }

        @media (max-width: 768px) { /* Mobile */
            .hero-banner {
                height: auto; 
                min-height: 90vh; 
            }
            .slider-slide {
                flex-direction: column-reverse; /* Text above image on mobile */
                justify-content: center; /* Center content stack */
                padding: 24px;
                padding-bottom: 80px; /* Space for dots */
            }
            .slide-image-container {
                position: relative; 
                width: 85%; 
                height: auto; 
                max-height: 45vh; 
                order: 2; /* Image below text */
                bottom: auto; left: auto; right: auto; /* Reset positioning */
                margin-top: 2rem; /* Space between text and image */
                margin-bottom: 2rem;
            }
            .slide-content-container {
                position: relative; 
                width: 100%;
                max-width: 100%;
                text-align: center; /* Center text on mobile */
                order: 1; /* Text first */
                top: auto; right: auto; left: auto; transform: none; 
                padding: 0;
            }
            .slide-title {
                font-size: 2rem;
                margin-bottom: 1rem;
                background: linear-gradient(to right, #000000, #555555);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
            }
            .slide-subtitle {
                font-size: 1rem;
                margin-bottom: 1.5rem;
                max-width: 100%;
            }
            .slide-button {
                padding: 0.8rem 1.6rem;
                font-size: 0.9rem;
            }
            .slide-arrows {
                width: auto;
                bottom: 120px;
                top: auto;
                left: 50%;
                transform: translateX(-50%);
                justify-content: center;
                gap: 20px;
            }
            .slide-arrow {
                width: 44px;
                height: 44px;
            }
            .slide-dots {
                bottom: 30px;
            }
        }
        
        @media (max-width: 480px) {
            .slide-title {
                font-size: 1.8rem;
            }
            .slide-subtitle {
                font-size: 0.9rem;
            }
            .hero-banner {
                min-height: 85vh;
            }
        }
        
        /* Rest of the page styling */
        .featured-item {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
        }
        .featured-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .sale-badge {
            background-color: #000000;
            color: white;
            padding: 2px 8px;
            font-size: 12px;
            position: absolute;
            top: 10px;
            left: 10px;
        }
        .section-heading {
            position: relative;
            display: inline-block;
        }
        .section-heading:after {
            content: '';
            position: absolute;
            width: 60px;
            height: 2px;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #000000;
        }
        .newsletter-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 40px;
            border-radius: 0.5rem;
        }
        .promotion-banner {
            background-color: #000;
            color: white;
            border-radius: 0.5rem;
            overflow: hidden;
        }
        .promotion-banner-image {
            object-fit: cover;
            height: 100%;
            width: 100%;
        }
        .offer-card {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            transition: box-shadow 0.3s ease;
        }
        .offer-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .offer-discount {
            background-color: #000;
            color: #fff;
            padding: 0.25rem 0.75rem;
            font-size: 1.25rem;
            font-weight: bold;
            display: inline-block;
            border-radius: 0.25rem;
        }
        /* Modern Product Card Styling */
        .product-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: #fff;
        }
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }
        .product-image-container {
            position: relative;
            aspect-ratio: 1/1;
            background-color: #f9fafb;
            overflow: hidden;
        }
        .product-image {
            object-fit: contain;
            transition: transform 0.5s ease;
        }
        .product-card:hover .product-image {
            transform: scale(1.05);
        }
        .product-info {
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        .product-category {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }
        .product-title {
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.75rem;
            line-height: 1.4;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            height: 2.8em;
        }
        .product-price {
            font-weight: 700;
            font-size: 1.1rem;
            color: #000;
            margin-top: auto;
        }
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
            position: relative;
            display: inline-block;
        }
        .section-title:after {
            content: '';
            position: absolute;
            bottom: -0.5rem;
            left: 50%;
            transform: translateX(-50%);
            width: 3rem;
            height: 2px;
            background-color: #000;
        }
        .section-subtitle {
            font-size: 1rem;
            color: #6b7280;
            text-align: center;
            max-width: 36rem;
            margin: 0 auto 3rem;
        }
        @media (max-width: 640px) {
            .section-title {
                font-size: 1.75rem;
            }
            .section-subtitle {
                font-size: 0.875rem;
                margin-bottom: 2rem;
            }
        }
        
        /* Modern Carousel Styles */
        .carousel-container {
          position: relative;
          overflow: hidden;
          padding: 1rem 0;
        }
        
        .carousel-track {
          display: flex;
          transition: transform 0.5s ease;
        }
        
        .carousel-item {
          flex: 0 0 auto;
          padding: 0 10px;
          box-sizing: border-box;
        }
        
        .carousel-controls {
          position: absolute;
          top: 50%;
          width: 100%;
          display: flex;
          justify-content: space-between;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 10;
          padding: 0 1rem;
        }
        
        .carousel-arrow {
          width: 40px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .carousel-arrow:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: scale(1.1);
        }
        
        /* Category Card Styles */
        .category-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 200px;
        }
        
        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        
        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .category-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          padding: 1.5rem 1rem 1rem;
          color: white;
        }
        
        .category-title {
          font-weight: 600;
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }
        
        .category-link {
          display: inline-block;
          color: white;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.5);
          transition: all 0.2s ease;
        }
        
        .category-link:hover {
          border-bottom-color: white;
        }
        
        /* Offer Carousel Styles */
        .offer-carousel-item {
          padding: 0.75rem;
        }
        
        .offer-card {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          background: white;
          transition: transform 0.3s ease;
        }
        
        .offer-card:hover {
          transform: translateY(-5px);
        }
        
        .offer-image-container {
          height: 160px;
          position: relative;
          background-color: #f8f8f8;
        }
        
        .offer-content {
          padding: 1.25rem;
        }
        
        .offer-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background-color: #000;
          color: white;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .category-card {
            height: 160px;
          }
          
          .offer-image-container {
            height: 130px;
          }
          
          .carousel-arrow {
            width: 36px;
            height: 36px;
          }
          
          .offer-carousel-item {
            padding: 0.5rem;
          }
        }
      `}</style>

      {/* Hero Banner Slider */}
      <section className="hero-banner">
        {sliderLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">{t('no_sliders_available', 'No sliders available')}</p>
          </div>
        ) : (
          <div className="slider-container">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {heroSlides[currentSlide] && (
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={getSliderVariants(direction)}
                initial="incoming"
                animate="active"
                exit="exit"
                className="slider-slide"
                style={{ 
                  backgroundColor: heroSlides[currentSlide].backgroundColor || '#f4f6f8',
                  position: 'relative',
                }}
              >
                {/* Background overlay */}
                {(heroSlides[currentSlide].overlayOpacity ?? 0) > 0 && (
                  <div 
                    className="absolute inset-0 z-5" 
                    style={{ 
                      backgroundColor: heroSlides[currentSlide].overlayColor || 'rgba(0,0,0,0)',
                      opacity: heroSlides[currentSlide].overlayOpacity || 0,
                      mixBlendMode: 'multiply',
                      backgroundImage: heroSlides[currentSlide].overlayImageUrl ? `url(${heroSlides[currentSlide].overlayImageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                
                <motion.div 
                  className="slide-content-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.h1 
                    initial={{ 
                      opacity: 0, 
                      y: heroSlides[currentSlide].textAnimation === 'fade-up' ? 40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-down' ? -40 : 
                         0,
                      x: heroSlides[currentSlide].textAnimation === 'fade-left' ? -40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-right' ? 40 : 
                         0,
                      scale: heroSlides[currentSlide].textAnimation === 'zoom-in' ? 0.85 : 1
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      x: 0, 
                      scale: 1,
                      transition: {
                        duration: heroSlides[currentSlide].transitionSpeed === 'slow' ? 0.9 : 
                                  heroSlides[currentSlide].transitionSpeed === 'medium' ? 0.6 : 
                                  0.4,
                        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for smoother feel
                      }
                    }}
                    className="slide-title"
                    style={{ 
                      color: heroSlides[currentSlide]?.textColor || '#111111',
                      background: 'none',
                      WebkitBackgroundClip: 'unset',
                      WebkitTextFillColor: 'unset',
                      backgroundClip: 'unset',
                    }}
                  >
                    {contentByLang(
                      heroSlides[currentSlide].title,
                      heroSlides[currentSlide].titleAr || heroSlides[currentSlide].title
                    )}
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ 
                      opacity: 0, 
                      y: heroSlides[currentSlide].textAnimation === 'fade-up' ? 40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-down' ? -40 : 
                         0,
                      x: heroSlides[currentSlide].textAnimation === 'fade-left' ? -40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-right' ? 40 : 
                         0,
                      scale: heroSlides[currentSlide].textAnimation === 'zoom-in' ? 0.85 : 1
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      x: 0, 
                      scale: 1,
                      transition: {
                        duration: heroSlides[currentSlide].transitionSpeed === 'slow' ? 0.9 : 
                                  heroSlides[currentSlide].transitionSpeed === 'medium' ? 0.6 : 
                                  0.4,
                        delay: 0.15,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    }}
                    className="slide-subtitle"
                    style={{ 
                      color: heroSlides[currentSlide].textColor || '#555555'
                    }}
                  >
                    {contentByLang(
                      heroSlides[currentSlide].subtitle,
                      heroSlides[currentSlide].subtitleAr || heroSlides[currentSlide].subtitle
                    )}
                  </motion.p>
                  
                  <motion.div 
                    initial={{ 
                      opacity: 0, 
                      y: heroSlides[currentSlide].textAnimation === 'fade-up' ? 40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-down' ? -40 : 
                         0,
                      x: heroSlides[currentSlide].textAnimation === 'fade-left' ? -40 : 
                         heroSlides[currentSlide].textAnimation === 'fade-right' ? 40 : 
                         0,
                      scale: heroSlides[currentSlide].textAnimation === 'zoom-in' ? 0.85 : 1
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      x: 0, 
                      scale: 1,
                      transition: {
                        duration: heroSlides[currentSlide].transitionSpeed === 'slow' ? 0.9 : 
                                  heroSlides[currentSlide].transitionSpeed === 'medium' ? 0.6 : 
                                  0.4,
                        delay: 0.3,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    }}
                  >
                    <Link 
                      href={heroSlides[currentSlide].buttonLink} 
                      className="slide-button"
                      style={{
                        backgroundColor: heroSlides[currentSlide].buttonColor || '#111111',
                        borderColor: heroSlides[currentSlide].buttonColor || '#111111',
                      }}
                    >
                      <span>
                        {contentByLang(
                          heroSlides[currentSlide].buttonText,
                          heroSlides[currentSlide].buttonTextAr || heroSlides[currentSlide].buttonText
                        )}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 slide-button-icon" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M14 5l7 7m0 0l-7 7m7-7H3" 
                        />
                      </svg>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="slide-image-container"
                  initial={{ 
                    opacity: 0, 
                    y: heroSlides[currentSlide].imageAnimation === 'slide-up' ? 60 : 0,
                    x: heroSlides[currentSlide].imageAnimation === 'slide-in-right' ? 60 : 
                       heroSlides[currentSlide].imageAnimation === 'slide-in-left' ? -60 : 0,
                    scale: heroSlides[currentSlide].imageAnimation === 'zoom-in' ? 0.8 : 1
                  }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    x: 0, 
                    scale: 1,
                    transition: {
                      type: heroSlides[currentSlide].imageAnimation === 'bounce' ? 'spring' : 'tween',
                      bounce: heroSlides[currentSlide].imageAnimation === 'bounce' ? 0.5 : undefined,
                      duration: heroSlides[currentSlide].transitionSpeed === 'slow' ? 1 : 
                               heroSlides[currentSlide].transitionSpeed === 'medium' ? 0.7 : 
                               0.5,
                      delay: heroSlides[currentSlide].transitionSpeed === 'slow' ? 0.4 : 
                             heroSlides[currentSlide].transitionSpeed === 'medium' ? 0.3 : 
                             0.2,
                      ease: [0.22, 1, 0.36, 1]
                    }
                  }}
                >
                  <Image 
                    src={heroSlides[currentSlide].image} 
                    alt={contentByLang(
                      heroSlides[currentSlide].title,
                      heroSlides[currentSlide].titleAr || heroSlides[currentSlide].title
                    )}
                    width={600} 
                    height={600} 
                    className="slide-image"
                    priority={currentSlide === 0} 
                    onError={(e) => {
                      console.error(`Failed to load hero image: ${heroSlides[currentSlide].image}`);
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; 
                      target.style.display = 'none';
                      
                      // Add a placeholder
                      const container = target.parentElement;
                      if (container) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                        placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                        container.appendChild(placeholder);
                      }
                    }}
                  />
                </motion.div>
              </motion.div>
              )}
            </AnimatePresence>
            
            {heroSlides.length > 1 && (
              <>
                <div className="slide-dots">
                  {heroSlides.map((_, index) => (
                    <div 
                      key={index}
                      className={`slide-dot ${currentSlide === index ? 'active' : ''}`}
                      onClick={() => {
                        setDirection(index > currentSlide ? 1 : -1);
                        setCurrentSlide(index);
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                
                <div className="slide-arrows">
                  <motion.div 
                    className="slide-arrow"
                    onClick={prevSlide}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Previous slide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  
                  <motion.div 
                    className="slide-arrow"
                    onClick={nextSlide}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Next slide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Categories Section - New Modern Design */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title text-black">{t('shop_by_category', 'Shop by Category')}</h2>
            <p className="section-subtitle">{t('explore_categories', 'Explore our selection of premium products by category')}</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories.map(category => (
                <Link key={category.id} href={`/shop?category=${encodeURIComponent(getCategorySlug(category.name))}`} className="category-card">
                  <div className="relative w-full h-full">
                    {/* Add a background color first as an immediate fallback */}
                    <div className="absolute inset-0 bg-gray-100"></div>
                    
                    {category.imageUrl ? (
                      <Image 
                        src={category.imageUrl}
                        alt={category.name} 
                        fill
                        className="category-image"
                        onError={(e) => {
                          console.error(`Failed to load category image: ${category.imageUrl} for category: ${category.name}`);
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.opacity = '0';
                          
                          // Create an SVG icon as a fallback
                          const container = target.parentElement;
                          if (container) {
                            // If container already has a fallback, don't add another
                            if (!container.querySelector('.category-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'category-fallback absolute inset-0 flex items-center justify-center bg-gray-200';
                              fallback.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div class="absolute bottom-3 text-sm font-medium text-gray-700">${category.name}</div>
                              `;
                              container.appendChild(fallback);
                            }
                          }
                        }}
                      />
                    ) : (
                      // Fallback for when no image URL is provided
                      <div className="category-fallback absolute inset-0 flex items-center justify-center bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="absolute bottom-3 text-sm font-medium text-gray-700">{category.name}</div>
                      </div>
                    )}
                  </div>
                  <div className="category-overlay">
                    <h3 className="category-title">{contentByLang(
                      category.name,
                      category.nameAr || category.name
                    )}</h3>
                    <span className="category-link">{t('explore', 'Explore')} →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section - Using memoized section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="section-title text-black">{t('discover_collection', 'Discover Our Collection')}</h2>
            <p className="section-subtitle">{t('premium_coffee_beans', 'Handpicked premium coffee beans from around the world, roasted to perfection')}</p>
          </div>
          
          {renderFeaturedProducts}
          
          <div className="text-center mt-12">
            <Link href="/shop" className="inline-block px-10 py-3.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
              {t('view_all_products', 'View All Products')}
            </Link>
          </div>
        </div>
      </section>

      {/* Discounted Products Carousel - Updated with memoized section */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="section-title text-black">{t('special_offers', 'Special Offers')}</h2>
            <p className="section-subtitle">{t('exclusive_deals_description', 'Take advantage of our limited-time discounts on premium products')}</p>
          </div>
          
          {renderDiscountedProducts}
        </div>
      </section>
      
      {/* Features Section - Modern Design */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-black">{t('free_shipping', 'Free Shipping')}</h3>
              <p className="text-xs text-gray-600">{t('orders_over', 'Orders over 65D')}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-black">{t('easy_returns', 'Easy Returns')}</h3>
              <p className="text-xs text-gray-600">{t('return_policy', '30-day return policy')}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-black">{t('secure_payments', 'Secure Payments')}</h3>
              <p className="text-xs text-gray-600">{t('encrypted_transactions', 'Encrypted transactions')}</p>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-black">{t('support_24_7', '24/7 Support')}</h3>
              <p className="text-xs text-gray-600">{t('always_here', 'Always here to help')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section - Modern Design */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3 text-black">{t('join_newsletter', 'Join Our Newsletter')}</h2>
            <p className="text-gray-600 mb-6">{t('subscribe_updates', 'Subscribe to receive updates, access to exclusive deals, and more.')}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input 
                type="email" 
                placeholder={t('enter_email', 'Enter your email')} 
                className="px-4 py-3 rounded-md border border-gray-300 flex-grow max-w-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button className="px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors duration-300">
                {t('subscribe', 'Subscribe')}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">{t('privacy_consent', 'By subscribing you agree to with our Privacy Policy')}</p>
          </div>
        </div>
      </section>
      
      {/* Footer will be added later */}
      
      {/* External Scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" strategy="beforeInteractive" />
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Product Variation Modal */}
      <ProductVariationModal 
        isOpen={isModalOpen}
        onClose={closeVariationModal}
        productId={selectedProductId}
      />
    </div>
  );
} 