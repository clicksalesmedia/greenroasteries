'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from './contexts/LanguageContext';
import MaintenanceMode from './components/MaintenanceMode';
import ProductVariationModal from './components/ProductVariationModal';
import { ShoppingCartIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import UAEDirhamSymbol from './components/UAEDirhamSymbol';
import CategoryBanner from './components/CategoryBanner';

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
  layout?: 'default' | 'centered' | 'split' | 'fullwidth' | 'minimal';
  accentColor?: string;
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
  
  // Add state for slider pause
  const [sliderPaused, setSliderPaused] = useState(false);

  // Newsletter state
  const [email, setEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterError, setNewsletterError] = useState('');

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
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
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

  // Fetch sliders - optimized with better error handling and caching
  useEffect(() => {
    const fetchSliders = async () => {
      try {
        setSliderLoading(true);
        
        // Add abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        // Use cache busting for fresh data - especially important for dynamic content like sliders
        const response = await fetch('/api/sliders', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            // Map API response to HeroSlide interface with validation
            const slides: HeroSlide[] = data
              .filter(slide => slide && slide.title && slide.imageUrl) // Filter out invalid slides
              .map((slide: any) => ({
                id: slide.id || Math.random(),
                title: slide.title || 'Welcome',
                titleAr: slide.titleAr || slide.title || 'مرحباً',
                subtitle: slide.subtitle || 'Discover premium coffee',
                subtitleAr: slide.subtitleAr || slide.subtitle || 'اكتشف القهوة المميزة',
                buttonText: slide.buttonText || 'Shop Now',
                buttonTextAr: slide.buttonTextAr || slide.buttonText || 'تسوق الآن',
                buttonLink: slide.buttonLink || '/shop',
                image: slide.imageUrl, // This is the critical mapping
                backgroundColor: slide.backgroundColor || '#ffffff',
                textColor: slide.textColor || '#ffffff',
                buttonColor: slide.buttonColor || '#c9a961',
                overlayColor: slide.overlayColor || 'rgba(0,0,0,0.4)',
                overlayOpacity: typeof slide.overlayOpacity === 'number' ? slide.overlayOpacity : 40,
                overlayImageUrl: slide.overlayImageUrl || undefined,
                textAnimation: slide.textAnimation || 'fade-up',
                imageAnimation: slide.imageAnimation || 'fade-in',
                transitionSpeed: slide.transitionSpeed || 'medium',
                layout: slide.layout || 'default',
                accentColor: slide.accentColor || '#c9a961',
              }));
            
            setHeroSlides(slides);
            console.log('Loaded sliders:', slides.length); // Debug log
          } else {
            console.warn('No valid sliders found, using fallback');
            // Set fallback slide if no valid sliders
            setHeroSlides([{
              id: 1,
              title: 'Welcome to Green Roasteries',
              titleAr: 'مرحباً بكم في غرين روستيريز',
              subtitle: 'Premium Coffee Experience',
              subtitleAr: 'تجربة قهوة مميزة',
              buttonText: 'Shop Now',
              buttonTextAr: 'تسوق الآن',
              buttonLink: '/shop',
              image: '/images/hero-coffee.jpg',
              backgroundColor: '#ffffff',
              textColor: '#ffffff',
              buttonColor: '#c9a961',
              overlayColor: 'rgba(0,0,0,0.4)',
              overlayOpacity: 40,
              overlayImageUrl: undefined,
              textAnimation: 'fade-up',
              imageAnimation: 'fade-in',
              transitionSpeed: 'medium',
              layout: 'default',
              accentColor: '#c9a961',
            }]);
          }
        } else {
          console.error('Failed to fetch sliders:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
        
        // Set fallback slide on error
        setHeroSlides([{
          id: 1,
          title: 'Welcome to Green Roasteries',
          titleAr: 'مرحباً بكم في غرين روستيريز',
          subtitle: 'Premium Coffee Experience',
          subtitleAr: 'تجربة قهوة مميزة',
          buttonText: 'Shop Now',
          buttonTextAr: 'تسوق الآن',
          buttonLink: '/shop',
          image: '/images/hero-coffee.jpg',
          backgroundColor: '#ffffff',
          textColor: '#ffffff',
          buttonColor: '#c9a961',
          overlayColor: 'rgba(0,0,0,0.4)',
          overlayOpacity: 40,
          overlayImageUrl: undefined,
          textAnimation: 'fade-up',
          imageAnimation: 'fade-in',
          transitionSpeed: 'medium',
          layout: 'default',
          accentColor: '#c9a961',
        }]);
      } finally {
        setSliderLoading(false);
      }
    };
    
    fetchSliders();
  }, []);

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
    if (!product.discount || product.discount <= 0) return null;
    
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

  // Auto-slide functionality - optimized with pause on hover
  useEffect(() => {
    if (heroSlides.length <= 1 || sliderPaused) return; // Don't auto-slide if only one slide or paused

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroSlides.length, sliderPaused]);

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
              <div className="product-image-container relative aspect-square">
                <Image 
                  src={product.imageUrl || ''} 
                  alt={getProductName(product)} 
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="product-image object-contain"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
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
                  <div className="product-price flex items-center">{formatPrice(product.price)}</div>
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
                      <span className="font-bold text-black flex items-center">{formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType))}</span>
                      {product.discount && (
                        <span className="ml-2 text-sm text-gray-500 line-through flex items-center">{formatPrice(product.price)}</span>
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

  // Add refs for parallax effects
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.6]);

  // Newsletter subscription function
  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setNewsletterError(t('valid_email', 'Please enter a valid email address'));
      return;
    }

    try {
      setNewsletterLoading(true);
      setNewsletterError('');
      setNewsletterMessage('');

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterMessage(data.message || t('newsletter_success', 'Successfully subscribed to newsletter!'));
        setEmail(''); // Clear the form
      } else {
        setNewsletterError(data.error || t('newsletter_error', 'Failed to subscribe. Please try again.'));
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterError(t('network_error', 'Network error. Please try again.'));
    } finally {
      setNewsletterLoading(false);
    }
  }, [email, t]);

  return (
    <div className="bg-white min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style jsx global>{`
        /* Modern Design System */
        :root {
          --primary-color: #000000;
          --accent-color: #c9a961;
          --text-primary: #1a1a1a;
          --text-secondary: #6b7280;
          --bg-primary: #ffffff;
          --bg-secondary: #fafafa;
          --border-color: #e5e7eb;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
          --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
          --shadow-xl: 0 20px 40px rgba(0,0,0,0.15);
          --transition-base: cubic-bezier(0.4, 0, 0.2, 1);
          --transition-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Modern Hero Slider Styles */
        .hero-slider {
          position: relative;
          height: 100vh;
          min-height: 600px;
          max-height: 1080px;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        @media (max-width: 768px) {
          .hero-slider {
            height: 85vh;
            min-height: 500px;
          }
        }

        @media (max-width: 480px) {
          .hero-slider {
            height: 80vh;
            min-height: 450px;
          }
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive Typography */
        .hero-title-responsive {
          font-size: clamp(2rem, 8vw, 5rem);
          line-height: 1.1;
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
        }

        @media (min-width: 768px) {
          .hero-title-responsive {
            font-size: clamp(3rem, 6vw, 6rem);
          }
        }

        @media (min-width: 1024px) {
          .hero-title-responsive {
            font-size: clamp(4rem, 5vw, 7rem);
          }
        }

        .hero-subtitle-responsive {
          font-size: clamp(1rem, 3vw, 1.5rem);
          line-height: 1.4;
          margin-bottom: clamp(0.75rem, 2vw, 1.5rem);
          max-width: 90%;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 768px) {
          .hero-subtitle-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2rem);
            max-width: 80%;
          }
        }

        @media (min-width: 1024px) {
          .hero-subtitle-responsive {
            font-size: clamp(1.5rem, 2vw, 2.5rem);
            max-width: 70%;
          }
        }

        .hero-description-responsive {
          font-size: clamp(0.875rem, 2vw, 1.125rem);
          line-height: 1.6;
          max-width: 95%;
          margin-bottom: clamp(1rem, 3vw, 2rem);
        }

        @media (min-width: 768px) {
          .hero-description-responsive {
            font-size: clamp(1rem, 1.5vw, 1.25rem);
            max-width: 85%;
          }
        }

        @media (min-width: 1024px) {
          .hero-description-responsive {
            font-size: clamp(1.125rem, 1.25vw, 1.375rem);
            max-width: 75%;
          }
        }

        /* Responsive Button Styles */
        .hero-button-responsive {
          padding: clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem);
          font-size: clamp(0.875rem, 2vw, 1.125rem);
          min-height: 48px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .hero-button-responsive:hover {
          backdrop-filter: blur(15px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
          transform: scale(1.05) translateY(-2px);
        }

        .hero-button-responsive:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(201, 169, 97, 0.3);
        }

        @media (min-width: 768px) {
          .hero-button-responsive {
            padding: clamp(1rem, 2vw, 1.25rem) clamp(2rem, 4vw, 2.5rem);
            font-size: clamp(1rem, 1.5vw, 1.25rem);
          }
        }

        .button-icon-responsive {
          width: clamp(1rem, 2vw, 1.25rem);
          height: clamp(1rem, 2vw, 1.25rem);
        }

        /* Responsive Scroll Indicator */
        .scroll-indicator-responsive {
          display: none;
        }

        @media (min-width: 768px) {
          .scroll-indicator-responsive {
            display: block;
          }
        }

        .scroll-mouse {
          width: clamp(20px, 3vw, 24px);
          height: clamp(32px, 5vw, 40px);
          border: 2px solid;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .scroll-mouse:hover {
          opacity: 1;
        }

        .scroll-wheel {
          width: clamp(2px, 0.5vw, 4px);
          height: clamp(8px, 1.5vw, 12px);
          margin-top: clamp(4px, 1vw, 8px);
        }

        .scroll-text {
          font-size: clamp(0.625rem, 1vw, 0.75rem);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Background Image Container */
        .hero-slide .absolute.inset-0 img {
          transition: transform 0.6s ease-out;
        }

        .hero-slide:hover .absolute.inset-0 img {
          transform: scale(1.02);
        }

        /* Enhanced Content Overlay */
        .hero-slide .z-10 {
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        /* Modern Navigation Dots - Responsive */
        .hero-dots {
          position: absolute;
          bottom: clamp(1.5rem, 4vw, 3rem);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: clamp(0.5rem, 2vw, 1rem);
          z-index: 20;
        }

        .hero-dot {
          width: clamp(8px, 2vw, 12px);
          height: clamp(8px, 2vw, 12px);
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: 2px solid rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.3s var(--transition-base);
          position: relative;
        }

        .hero-dot.active {
          transform: scale(1.2);
        }

        .hero-dot:hover:not(.active) {
          background: rgba(255,255,255,0.6);
          transform: scale(1.1);
        }

        /* Modern Navigation Arrows - Responsive */
        .hero-nav {
          position: absolute;
          top: 50%;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 clamp(1rem, 3vw, 2rem);
          transform: translateY(-50%);
          z-index: 20;
          pointer-events: none;
        }

        .hero-nav-button {
          width: clamp(40px, 8vw, 56px);
          height: clamp(40px, 8vw, 56px);
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s var(--transition-base);
          box-shadow: var(--shadow-md);
          border: none;
        }

        .hero-nav-button:hover {
          background: rgba(255,255,255,1);
          transform: scale(1.1);
          box-shadow: var(--shadow-lg);
        }

        .hero-nav-button svg {
          width: clamp(16px, 4vw, 24px);
          height: clamp(16px, 4vw, 24px);
          transition: transform 0.3s var(--transition-base);
        }

        .hero-nav-button:hover svg {
          transform: scale(1.1);
        }

        /* Hide navigation on very small screens */
        @media (max-width: 480px) {
          .hero-nav {
            display: none;
          }
        }

        /* Layout Variations - Keeping for backwards compatibility */
        .hero-slide.layout-default {
          padding: 0 5%;
        }

        .hero-slide.layout-centered {
          text-align: center;
        }

        .hero-slide.layout-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          padding: 0 5%;
        }

        .hero-slide.layout-fullwidth {
          padding: 0;
        }

        .hero-slide.layout-minimal {
          padding: 0 10%;
        }

        /* Ultra responsive adjustments */
        @media (max-width: 320px) {
          .hero-title-responsive {
            font-size: 1.75rem;
          }
          
          .hero-subtitle-responsive {
            font-size: 0.9rem;
          }
          
          .hero-description-responsive {
            font-size: 0.8rem;
          }
          
          .hero-button-responsive {
            padding: 0.6rem 1.2rem;
            font-size: 0.8rem;
          }
        }

        /* Large screen optimizations */
        @media (min-width: 1440px) {
          .hero-title-responsive {
            font-size: 6rem;
          }
          
          .hero-subtitle-responsive {
            font-size: 2.25rem;
          }
          
          .hero-description-responsive {
            font-size: 1.375rem;
          }
        }

        @media (min-width: 1920px) {
          .hero-title-responsive {
            font-size: 7rem;
          }
        }

        /* Product Card Modern Design */
        .product-card {
          background: var(--bg-primary);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s var(--transition-base);
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .product-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.03));
          opacity: 0;
          transition: opacity 0.3s var(--transition-base);
          pointer-events: none;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
        }

        .product-card:hover::before {
          opacity: 1;
        }

        .product-image-wrapper {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .product-image {
          object-fit: cover;
          transition: transform 0.6s var(--transition-base);
        }

        .product-card:hover .product-image {
          transform: scale(1.1);
        }

        .product-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.4rem 0.8rem;
          background: var(--accent-color);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 20px;
          box-shadow: var(--shadow-md);
        }

        .product-content {
          padding: 1.5rem;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .product-category {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .product-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .product-price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .product-price-original {
          font-size: 1rem;
          color: var(--text-secondary);
          text-decoration: line-through;
        }

        .product-action {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s var(--transition-base);
          position: relative;
          overflow: hidden;
        }

        .product-action::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent-color);
          transform: scale(0);
          transition: transform 0.3s var(--transition-base);
          border-radius: 50%;
        }

        .product-action:hover::before {
          transform: scale(1);
        }

        .product-action svg {
          width: 20px;
          height: 20px;
          position: relative;
          z-index: 1;
          transition: transform 0.3s var(--transition-spring);
        }

        .product-action:hover svg {
          transform: scale(1.2);
        }

        /* Modern Section Styles */
        .section {
          padding: 6rem 0;
          position: relative;
          overflow: hidden;
        }

        .section-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.02;
          background-image: 
            radial-gradient(circle at 25% 25%, var(--primary-color) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, var(--accent-color) 0%, transparent 50%);
          background-size: 100px 100px;
          pointer-events: none;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
          position: relative;
        }

        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          color: var(--text-primary);
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -0.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: var(--accent-color);
          border-radius: 2px;
        }

        .section-description {
          font-size: clamp(1rem, 2vw, 1.125rem);
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Category Grid Modern */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .category-card {
          position: relative;
          height: 280px;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s var(--transition-base);
          box-shadow: var(--shadow-md);
        }

        .category-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%);
          opacity: 0.7;
          transition: opacity 0.3s var(--transition-base);
        }

        .category-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: var(--shadow-xl);
        }

        .category-card:hover::before {
          opacity: 0.9;
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s var(--transition-base);
        }

        .category-card:hover .category-image {
          transform: scale(1.1);
        }

        .category-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem;
          color: white;
          z-index: 2;
        }

        .category-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          transition: transform 0.3s var(--transition-base);
        }

        .category-card:hover .category-name {
          transform: translateY(-4px);
        }

        .category-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 0.9;
          transition: all 0.3s var(--transition-base);
        }

        .category-link svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s var(--transition-base);
        }

        .category-card:hover .category-link {
          opacity: 1;
          gap: 0.75rem;
        }

        .category-card:hover .category-link svg {
          transform: translateX(4px);
        }

        /* Feature Cards Modern */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          text-align: center;
          padding: 2rem;
          border-radius: 20px;
          background: var(--bg-secondary);
          transition: all 0.3s var(--transition-base);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, var(--accent-color) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s var(--transition-base);
          pointer-events: none;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .feature-card:hover::before {
          opacity: 0.05;
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          background: var(--primary-color);
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s var(--transition-base);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(5deg);
          background: var(--accent-color);
        }

        .feature-icon svg {
          width: 28px;
          height: 28px;
        }

        .feature-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .feature-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Newsletter Modern */
        .newsletter-section {
          background: linear-gradient(135deg, var(--primary-color) 0%, #333 100%);
          color: white;
          padding: 5rem 0;
          position: relative;
          overflow: hidden;
        }

        .newsletter-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px);
          pointer-events: none;
        }

        .newsletter-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .newsletter-title {
          font-size: clamp(2rem, 4vw, 2.5rem);
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .newsletter-description {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: 2.5rem;
        }

        .newsletter-form {
          display: flex;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .newsletter-input {
          flex: 1;
          padding: 1rem 1.5rem;
          border-radius: 50px;
          border: 2px solid transparent;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 1rem;
          transition: all 0.3s var(--transition-base);
        }

        .newsletter-input::placeholder {
          color: rgba(255,255,255,0.7);
        }

        .newsletter-input:focus {
          outline: none;
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.3);
        }

        .newsletter-button {
          padding: 1rem 2rem;
          border-radius: 50px;
          background: white;
          color: var(--primary-color);
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s var(--transition-base);
          white-space: nowrap;
        }

        .newsletter-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: clamp(2rem, 6vw, 3rem);
          }

          .hero-nav {
            display: none;
          }

          .hero-dots {
            bottom: 2rem;
          }

          .section {
            padding: 4rem 0;
          }

          .newsletter-form {
            flex-direction: column;
          }

          .newsletter-input,
          .newsletter-button {
            width: 100%;
          }
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Modern carousel */
        .modern-carousel {
          position: relative;
          overflow: hidden;
        }

        .modern-carousel-track {
          display: flex;
          gap: 1.5rem;
          transition: transform 0.5s var(--transition-base);
        }

        .modern-carousel-controls {
          position: absolute;
          top: 50%;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 1rem;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 10;
        }

        .modern-carousel-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s var(--transition-base);
        }

        .modern-carousel-button:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: var(--shadow-lg);
        }

        .modern-carousel-button svg {
          width: 20px;
          height: 20px;
          color: var(--primary-color);
        }

        .newsletter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .newsletter-message {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }

        .newsletter-success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .newsletter-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Enhanced Hero Slider with Background Image + Overlay + Centered Content */}
      <section 
        ref={heroRef} 
        className="hero-slider"
        onMouseEnter={() => setSliderPaused(true)}
        onMouseLeave={() => setSliderPaused(false)}
      >
        {sliderLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-black border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            {heroSlides[currentSlide] && (
              <motion.div
                key={currentSlide}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 1000 : -1000 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -1000 : 1000 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.6 
                }}
                className="hero-slide absolute inset-0"
              >
                {/* Background Image with Optimization */}
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].title}
                    fill
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                    priority={true} // Always prioritize hero images for faster LCP
                    quality={75} // Reduce quality for faster loading
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
                    onError={(e) => {
                      console.warn('Slider image failed to load:', heroSlides[currentSlide].image);
                      // Set fallback image source
                      (e.target as HTMLImageElement).src = '/images/hero-coffee.jpg';
                    }}
                  />
                </div>

                {/* Dynamic Overlay */}
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    backgroundColor: heroSlides[currentSlide].overlayColor || 'rgba(0,0,0,0.4)',
                    opacity: heroSlides[currentSlide].overlayOpacity !== undefined 
                      ? heroSlides[currentSlide].overlayOpacity / 100 
                      : 0.4
                  }}
                />

                {/* Overlay Image Pattern (if provided) */}
                {heroSlides[currentSlide].overlayImageUrl && (
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url(${heroSlides[currentSlide].overlayImageUrl})`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: 'clamp(50px, 5vw, 100px) clamp(50px, 5vw, 100px)'
                    }}
                  />
                )}

                {/* Responsive Centered Content */}
                <div className="absolute inset-0 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
                  <div className="text-center w-full max-w-7xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="space-y-4 sm:space-y-6 lg:space-y-8"
                    >
                      {/* H1 - Main Title - Fully Responsive */}
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="hero-title-responsive font-black leading-tight tracking-tight"
                        style={{ 
                          color: heroSlides[currentSlide].textColor || '#ffffff',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {contentByLang(
                          heroSlides[currentSlide].title,
                          heroSlides[currentSlide].titleAr || heroSlides[currentSlide].title
                        )}
                      </motion.h1>

                      {/* H2 - Subtitle - Responsive */}
                      {heroSlides[currentSlide].subtitle && (
                        <motion.h2 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                          className="hero-subtitle-responsive font-semibold leading-relaxed"
                          style={{ 
                            color: heroSlides[currentSlide].textColor || '#ffffff',
                            opacity: 0.95,
                            textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                          }}
                        >
                          {contentByLang(
                            heroSlides[currentSlide].subtitle,
                            heroSlides[currentSlide].subtitleAr || heroSlides[currentSlide].subtitle
                          )}
                        </motion.h2>
                      )}

                      {/* Paragraph - Description - Responsive */}
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="hero-description-responsive leading-relaxed mx-auto"
                        style={{ 
                          color: heroSlides[currentSlide].textColor || '#ffffff',
                          opacity: 0.9,
                          textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                        }}
                      >
                        {t('hero_description', 'Discover premium coffee beans roasted to perfection. Experience exceptional quality and flavor in every cup.')}
                      </motion.p>

                      {/* Call-to-Action Button - Responsive */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="pt-2 sm:pt-4"
                      >
                        <Link 
                          href={heroSlides[currentSlide].buttonLink}
                          className="hero-button-responsive group inline-flex items-center justify-center gap-2 sm:gap-3 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-opacity-50"
                          style={{ 
                            backgroundColor: heroSlides[currentSlide].buttonColor || heroSlides[currentSlide].accentColor || '#c9a961',
                            color: heroSlides[currentSlide].backgroundColor || '#ffffff'
                          }}
                        >
                          <span>{contentByLang(
                            heroSlides[currentSlide].buttonText,
                            heroSlides[currentSlide].buttonTextAr || heroSlides[currentSlide].buttonText
                          )}</span>
                          <ArrowRightIcon className="button-icon-responsive transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </motion.div>

                      {/* Optional: Scroll indicator - Responsive */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.6 }}
                        className="scroll-indicator-responsive pt-8 sm:pt-12 lg:pt-16"
                      >
                        <div className="scroll-mouse mx-auto rounded-full flex justify-center" style={{ borderColor: heroSlides[currentSlide].textColor || '#ffffff' }}>
                          <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1 h-3 rounded-full mt-2"
                            style={{ backgroundColor: heroSlides[currentSlide].textColor || '#ffffff' }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {/* Navigation */}
        {heroSlides.length > 1 && (
          <>
            <div className="hero-nav">
              <button 
                onClick={prevSlide}
                className="hero-nav-button"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="hero-nav-button"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="hero-dots">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className={`hero-dot ${currentSlide === index ? 'active' : ''}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* EID Banner Section - Dynamic based on category 
      <CategoryBanner category="EID AL ADHA - CATALOG" />*/}

      {/* Modern Categories Section */}
      <section className="section bg-white">
        <div className="section-pattern" />
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">{t('shop_by_category', 'Shop by Category')}</h2>
            <p className="section-description">{t('explore_categories', 'Explore our carefully curated collection of premium products')}</p>
          </motion.div>
          
          <div className="category-grid">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/shop?category=${encodeURIComponent(getCategorySlug(category.name))}`} className="category-card block relative aspect-[4/3]">
                  <Image
                    src={category.imageUrl || '/images/coffee-beans.jpg'}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="category-image object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
                  />
                  <div className="category-content absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="category-name text-white font-semibold text-lg mb-2">{contentByLang(category.name, category.nameAr || category.name)}</h3>
                    <span className="category-link text-white/80 text-sm flex items-center gap-1">
                      {t('explore_now', 'Explore Now')}
                      <ArrowRightIcon className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Featured Products */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">{t('featured_products', 'Featured Products')}</h2>
            <p className="section-description">{t('handpicked_selection', 'Handpicked selection of our finest coffee beans and products')}</p>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-black border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" style={{ minHeight: loading ? 'auto' : '600px' }}>
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02, duration: 0.4 }} // Reduce delay and duration for faster rendering
                >
                  <Link href={`/product/${product.id}`} className="product-card">
                    <div className="product-image-wrapper relative aspect-square">
                      <Image
                        src={product.imageUrl || ''}
                        alt={getProductName(product)}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="product-image object-contain"
                        loading="lazy"
                        quality={60}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
                      />
                      {product.discount && product.discount > 0 && (
                        <span className="product-badge">
                          {getDiscountDisplay(product)}
                        </span>
                      )}
                    </div>
                    <div className="product-content">
                      <p className="product-category">{getCategoryDisplayName(getCategoryName(product.category))}</p>
                      <h3 className="product-name">{getProductName(product)}</h3>
                      <div className="product-footer">
                        <div className="product-price-wrapper">
                          {product.discount ? (
                            <>
                              <span className="product-price flex items-center">{formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType))}</span>
                              <span className="product-price-original flex items-center">{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span className="product-price flex items-center">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => openVariationModal(product.id, e)}
                          className="product-action"
                        >
                          <ShoppingCartIcon />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-300 hover:gap-3"
            >
              {t('view_all_products', 'View All Products')}
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Modern Special Offers Section */}
      {discountedProducts.length > 0 && (
        <section className="section bg-white">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-header"
            >
              <h2 className="section-title">
                <SparklesIcon className="inline-block w-8 h-8 mr-2 text-yellow-500" />
                {t('special_offers', 'Special Offers')}
              </h2>
              <p className="section-description">{t('limited_time_deals', 'Don\'t miss out on these limited-time deals')}</p>
            </motion.div>
            
            <div className="modern-carousel">
              <div className="modern-carousel-controls">
                <button 
                  onClick={() => document.getElementById('offers-track')?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className="modern-carousel-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => document.getElementById('offers-track')?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className="modern-carousel-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div 
                id="offers-track"
                className="flex overflow-x-auto gap-6 snap-x snap-mandatory scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {discountedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-none w-[280px] snap-start"
                  >
                    <Link href={`/product/${product.id}`} className="product-card">
                      <div className="product-image-wrapper relative aspect-square">
                        <Image
                          src={product.imageUrl || ''}
                          alt={getProductName(product)}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="product-image object-contain"
                          loading="lazy"
                          quality={60}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR8f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3xv+tH8WjQJeU7Hv8AhiNySsFJV8krkzAOjfvMV2pq1Lqf4GiJwbUY6c7nEKi/ztKk7KYHS8dkr9X4zRc/DWPMHx5WKnD8cNSbzqPCLhJ6/FdKrQJnN9j6A=="
                        />
                        {product.discount && product.discount > 0 && (
                          <span className="product-badge">
                            {getDiscountDisplay(product)}
                          </span>
                        )}
                      </div>
                      <div className="product-content">
                        <p className="product-category">{getCategoryDisplayName(getCategoryName(product.category))}</p>
                        <h3 className="product-name">{getProductName(product)}</h3>
                        <div className="product-footer">
                          <div className="product-price-wrapper">
                            <span className="product-price flex items-center">{formatPrice(getDiscountedPrice(product.price, product.discount, product.discountType))}</span>
                            <span className="product-price-original flex items-center">{formatPrice(product.price)}</span>
                          </div>
                          <button 
                            onClick={(e) => openVariationModal(product.id, e)}
                            className="product-action"
                          >
                            <ShoppingCartIcon />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modern Features Section */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="feature-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="feature-card"
            >
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="feature-title">{t('free_shipping', 'Free Shipping')}</h3>
              <p className="feature-description">{t('free_shipping_desc', 'On orders over 200 AED')}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="feature-card"
            >
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="feature-title">{t('secure_payment', 'Secure Payment')}</h3>
              <p className="feature-description">{t('secure_payment_desc', '100% secure transactions')}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="feature-card"
            >
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="feature-title">{t('easy_returns', 'Easy Returns')}</h3>
              <p className="feature-description">{t('easy_returns_desc', '30-day return policy')}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="feature-card"
            >
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="feature-title">{t('support_24_7', '24/7 Support')}</h3>
              <p className="feature-description">{t('support_24_7_desc', 'Always here to help')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modern Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-pattern" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="newsletter-content"
          >
            <h2 className="newsletter-title">{t('stay_updated', 'Stay Updated')}</h2>
            <p className="newsletter-description">{t('newsletter_desc', 'Get exclusive offers and the latest updates delivered to your inbox')}</p>
            
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder={t('enter_email', 'Enter your email')}
                className="newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={newsletterLoading}
                required
              />
              <button 
                type="submit" 
                className="newsletter-button"
                disabled={newsletterLoading}
              >
                {newsletterLoading ? t('subscribing', 'Subscribing...') : t('subscribe', 'Subscribe')}
              </button>
            </form>
            
            {/* Success/Error Messages */}
            {newsletterMessage && (
              <div className="newsletter-message newsletter-success">
                {newsletterMessage}
              </div>
            )}
            {newsletterError && (
              <div className="newsletter-message newsletter-error">
                {newsletterError}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Product Variation Modal */}
      <ProductVariationModal 
        isOpen={isModalOpen}
        onClose={closeVariationModal}
        productId={selectedProductId}
      />
    </div>
  );
} 