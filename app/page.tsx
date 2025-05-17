'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  images: string[];
  imageUrl?: string;
  slug: string;
  rating?: number;
  category?: string | { name: string; nameAr?: string };
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

export default function Home() {
  // Add language context
  const { language, t, contentByLang } = useLanguage();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderLoading, setSliderLoading] = useState(true);
  
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

  // Fetch sliders
  useEffect(() => {
    const fetchSliders = async () => {
      try {
        setSliderLoading(true);
        // Only fetch active sliders for the public homepage
        const response = await fetch('/api/sliders?active=true');
        
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
            backgroundColor: slide.backgroundColor
          }));
          
          setHeroSlides(slides);
        } else {
          // If API call fails, use fallback slides
          setHeroSlides([
            {
              id: 1,
              title: "Artisan Coffee Roasters",
              titleAr: "Artisan Coffee Roasters",
              subtitle: "Experience the true art of coffee with our handcrafted blends.",
              subtitleAr: "تجربة القهوة اليدوية الحقيقية مع مزيجنا اليدوي المتوازن.",
              buttonText: "Explore Collection",
              buttonTextAr: "استكشف المجموعة",
              buttonLink: "/shop",
              image: "/images/packages.png",
              backgroundColor: "#f4f6f8"
            },
            {
              id: 2,
              title: "Single Origin Excellence",
              titleAr: "Single Origin Excellence",
              subtitle: "Discover unique flavors from the world's best coffee regions.",
              subtitleAr: "اكتشف الطعم الفريد من القهوة العالمية الأفضل.",
              buttonText: "View Origins",
              buttonTextAr: "إطلع على المناطق",
              buttonLink: "/shop",
              image: "/images/packages.png",
              backgroundColor: "#f8f4f4"
            },
            {
              id: 3,
              title: "Your Perfect Morning Ritual",
              titleAr: "Your Perfect Morning Ritual",
              subtitle: "Start your day with the exceptional taste of Green Roasteries.",
              subtitleAr: "أبدأ صباحك بطعم مميز من Green Roasteries.",
              buttonText: "Shop Bestsellers",
              buttonTextAr: "اشتري المبيعات المميزة",
              buttonLink: "/shop",
              image: "/images/packages.png",
              backgroundColor: "#f3f8f4"
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
        
        // Use fallback slides on error
        setHeroSlides([
          {
            id: 1,
            title: "Artisan Coffee Roasters",
            titleAr: "Artisan Coffee Roasters",
            subtitle: "Experience the true art of coffee with our handcrafted blends.",
            subtitleAr: "تجربة القهوة اليدوية الحقيقية مع مزيجنا اليدوي المتوازن.",
            buttonText: "Explore Collection",
            buttonTextAr: "استكشف المجموعة",
            buttonLink: "/shop",
            image: "/images/packages.png",
            backgroundColor: "#f4f6f8"
          },
          {
            id: 2,
            title: "Single Origin Excellence",
            titleAr: "Single Origin Excellence",
            subtitle: "Discover unique flavors from the world's best coffee regions.",
            subtitleAr: "اكتشف الطعم الفريد من القهوة العالمية الأفضل.",
            buttonText: "View Origins",
            buttonTextAr: "إطلع على المناطق",
            buttonLink: "/shop",
            image: "/images/packages.png",
            backgroundColor: "#f8f4f4"
          },
          {
            id: 3,
            title: "Your Perfect Morning Ritual",
            titleAr: "Your Perfect Morning Ritual",
            subtitle: "Start your day with the exceptional taste of Green Roasteries.",
            subtitleAr: "أبدأ صباحك بطعم مميز من Green Roasteries.",
            buttonText: "Shop Bestsellers",
            buttonTextAr: "اشتري المبيعات المميزة",
            buttonLink: "/shop",
            image: "/images/packages.png",
            backgroundColor: "#f3f8f4"
          }
        ]);
      } finally {
        setSliderLoading(false);
      }
    };
    
    fetchSliders();
  }, []); // Empty dependency array ensures this runs once on mount

  // Auto slide change - only start once slides are loaded
  useEffect(() => {
    if (heroSlides.length > 0) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentSlide, heroSlides.length]);
  
  // Slide change handlers
  const nextSlide = () => {
    if (heroSlides.length === 0) return;
    setDirection(1);
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    if (heroSlides.length === 0) return;
    setDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        // Fetch featured products from API
        const response = await fetch('/api/products?limit=24&featured=true');
        
        if (response.ok) {
          const data = await response.json();
          
          // Ensure slugs are present or generated if missing
          const productsWithSlugs = data.map((product: Product) => ({
            ...product,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-') // Generate slug if missing
          }));

          // Shuffle products for random order on each refresh
          const shuffledProducts = [...productsWithSlugs].sort(() => Math.random() - 0.5).slice(0, 12);
          setFeaturedProducts(shuffledProducts);
        } else {
          // If API call fails, use dummy data
          const dummyProducts = [
            {
              id: 'prod-1',
              name: 'Ethiopian Yirgacheffe',
              nameAr: 'إيثيوبي صرفيتي',
              price: 24.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'ethiopian-yirgacheffe',
              rating: 4.8,
              category: { name: 'Single Origin', nameAr: 'أحادي المصدر' }
            },
            {
              id: 'prod-2',
              name: 'Colombian Supremo',
              nameAr: 'كولومبي سوبريمو',
              price: 19.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'colombian-supremo',
              rating: 4.6,
              category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
            },
            {
              id: 'prod-3',
              name: 'Espresso Blend',
              nameAr: 'مزيج إسبريسو',
              price: 22.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'espresso-blend',
              rating: 4.9,
              category: { name: 'Espresso Roast', nameAr: 'تحميص إسبريسو' }
            },
            {
              id: 'prod-4',
              name: 'Sumatra Mandheling',
              nameAr: 'سوماترا ماندهلينغ',
              price: 26.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'sumatra-mandheling',
              rating: 4.7,
              category: { name: 'Dark Roast', nameAr: 'تحميص داكن' }
            },
            {
              id: 'prod-5',
              name: 'Guatemalan Antigua',
              nameAr: 'غواتيمالي أنتيغوا',
              price: 23.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'guatemalan-antigua',
              rating: 4.5,
              category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
            },
            {
              id: 'prod-6',
              name: 'Kenya AA',
              nameAr: 'كيني أا',
              price: 27.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'kenya-aa',
              rating: 4.8,
              category: { name: 'Light Roast', nameAr: 'تحميص فاتح' }
            },
            {
              id: 'prod-7',
              name: 'Costa Rican Tarrazu',
              nameAr: 'كوستاريكان تارازو',
              price: 25.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'costa-rican-tarrazu',
              rating: 4.7,
              category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
            },
            {
              id: 'prod-8',
              name: 'French Roast',
              nameAr: 'فرنسي حبوب',
              price: 21.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'french-roast',
              rating: 4.5,
              category: { name: 'Dark Roast', nameAr: 'تحميص داكن' }
            },
            {
              id: 'prod-9',
              name: 'Jamaican Blue Mountain',
              nameAr: 'جامايكي جبل المحيط',
              price: 39.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'jamaican-blue-mountain',
              rating: 4.9,
              category: { name: 'Premium', nameAr: 'ممتاز' }
            },
            {
              id: 'prod-10',
              name: 'Breakfast Blend',
              nameAr: 'مزيج صباحي',
              price: 18.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'breakfast-blend',
              rating: 4.4,
              category: { name: 'Light Roast', nameAr: 'تحميص فاتح' }
            },
            {
              id: 'prod-11',
              name: 'Mexican Chiapas',
              nameAr: 'تشيباس مكسيكي',
              price: 22.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'mexican-chiapas',
              rating: 4.6,
              category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
            },
            {
              id: 'prod-12',
              name: 'Italian Espresso',
              nameAr: 'إسبريسو إيطالي',
              price: 23.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'italian-espresso',
              rating: 4.8,
              category: { name: 'Espresso', nameAr: 'إسبريسو' }
            }
          ];
          // Shuffle dummy products for random order
          const shuffledDummyProducts = [...dummyProducts].sort(() => Math.random() - 0.5).slice(0, 12);
          setFeaturedProducts(shuffledDummyProducts);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // Set dummy products in case of error and shuffle them
        const errorDummyProducts = [
          {
            id: 'prod-1',
            name: 'Ethiopian Yirgacheffe',
            nameAr: 'إيثيوبي صرفيتي',
            price: 24.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'ethiopian-yirgacheffe',
            rating: 4.8,
            category: { name: 'Single Origin', nameAr: 'أحادي المصدر' }
          },
          {
            id: 'prod-2',
            name: 'Colombian Supremo',
            nameAr: 'كولومبي سوبريمو',
            price: 19.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'colombian-supremo',
            rating: 4.6,
            category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
          },
          {
            id: 'prod-3',
            name: 'Espresso Blend',
            nameAr: 'مزيج إسبريسو',
            price: 22.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'espresso-blend',
            rating: 4.9,
            category: { name: 'Espresso Roast', nameAr: 'تحميص إسبريسو' }
          },
          {
            id: 'prod-4',
            name: 'Sumatra Mandheling',
            nameAr: 'سوماترا ماندهلينغ',
            price: 26.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'sumatra-mandheling',
            rating: 4.7,
            category: { name: 'Dark Roast', nameAr: 'تحميص داكن' }
          },
          {
            id: 'prod-5',
            name: 'Brazilian Santos',
            nameAr: 'سانتوس برازيلي',
            price: 21.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'brazilian-santos',
            rating: 4.5,
            category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
          },
          {
            id: 'prod-6',
            name: 'Kenya AA',
            nameAr: 'كيني أا',
            price: 27.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'kenya-aa',
            rating: 4.8,
            category: { name: 'Light Roast', nameAr: 'تحميص فاتح' }
          },
          {
            id: 'prod-7',
            name: 'Costa Rican Tarrazu',
            nameAr: 'كوستاريكان تارازو',
            price: 25.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'costa-rican-tarrazu',
            rating: 4.7,
            category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
          },
          {
            id: 'prod-8',
            name: 'French Roast',
            nameAr: 'فرنسي حبوب',
            price: 21.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'french-roast',
            rating: 4.5,
            category: { name: 'Dark Roast', nameAr: 'تحميص داكن' }
          },
          {
            id: 'prod-9',
            name: 'Jamaican Blue Mountain',
            nameAr: 'جامايكي جبل المحيط',
            price: 39.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'jamaican-blue-mountain',
            rating: 4.9,
            category: { name: 'Premium', nameAr: 'ممتاز' }
          },
          {
            id: 'prod-10',
            name: 'Breakfast Blend',
            nameAr: 'مزيج صباحي',
            price: 18.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'breakfast-blend',
            rating: 4.4,
            category: { name: 'Light Roast', nameAr: 'تحميص فاتح' }
          },
          {
            id: 'prod-11',
            name: 'Mexican Chiapas',
            nameAr: 'تشيباس مكسيكي',
            price: 22.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'mexican-chiapas',
            rating: 4.6,
            category: { name: 'Medium Roast', nameAr: 'تحميص متوسط' }
          },
          {
            id: 'prod-12',
            name: 'Italian Espresso',
            nameAr: 'إسبريسو إيطالي',
            price: 23.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'italian-espresso',
            rating: 4.8,
            category: { name: 'Espresso', nameAr: 'إسبريسو' }
          }
        ];
        // Shuffle error fallback products
        const shuffledErrorProducts = [...errorDummyProducts].sort(() => Math.random() - 0.5).slice(0, 12);
        setFeaturedProducts(shuffledErrorProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Fetch Promotion Banners
  useEffect(() => {
    const fetchPromotionBanners = async () => {
      try {
        setBannersLoading(true);
        // Placeholder: Replace with actual API call to /api/promotions
        // const response = await fetch('/api/promotions?active=true');
        // if (response.ok) {
        //   const data = await response.json();
        //   setPromotionBanners(data);
        // } else {
        // Fallback dummy data for banners
        setPromotionBanners([
          {
            id: 'banner-1',
            title: 'Weekend Coffee Special',
            titleAr: 'Special Coffee Weekend',
            description: 'Get your favorite blends delivered fresh for the perfect weekend brunch.',
            descriptionAr: 'احصل على مزيجك المفضل توصيله مباشرة لكيفية الإفطار المثالية الأسبوعية.',
            imageUrl: '/images/banner-coffee-beans.jpg', // Replace with actual image path
            buttonText: 'Shop Now',
            buttonTextAr: 'اشتري الآن',
            buttonLink: '/shop',
            alignment: 'left',
          },
          {
            id: 'banner-2',
            title: 'New Arrival: Single Origin Subscription',
            titleAr: 'إضافة جديدة: اشتراك جوي أحادي',
            description: 'Explore the world of coffee, one origin at a time. Delivered to your door.',
            descriptionAr: 'استكشف عالم القهوة، جويًا واحدًا في المرة الواحدة. توصيل إلى بابك.',
            imageUrl: '/images/banner-subscription.jpg', // Replace with actual image path
            buttonText: 'Learn More',
            buttonTextAr: 'إطلع على المزيد',
            buttonLink: '/subscriptions',
            alignment: 'right',
          },
        ]);
        // }
      } catch (error) {
        console.error('Error fetching promotion banners:', error);
        // Fallback dummy data on error
        setPromotionBanners([
          {
            id: 'banner-1',
            title: 'Weekend Coffee Special',
            titleAr: 'Special Coffee Weekend',
            description: 'Get your favorite blends delivered fresh for the perfect weekend brunch.',
            descriptionAr: 'احصل على مزيجك المفضل توصيله مباشرة لكيفية الإفطار المثالية الأسبوعية.',
            imageUrl: '/images/banner-coffee-beans.jpg',
            buttonText: 'Shop Now',
            buttonTextAr: 'اشتري الآن',
            buttonLink: '/shop',
            alignment: 'left',
          },
        ]);
      } finally {
        setBannersLoading(false);
      }
    };
    fetchPromotionBanners();
  }, []);

  // Fetch Offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setOffersLoading(true);
        // Placeholder: Replace with actual API call to /api/offers or /api/promotions
        // const response = await fetch('/api/offers?active=true');
        // if (response.ok) {
        //   const data = await response.json();
        //   setOffers(data);
        // } else {
        // Fallback dummy data for offers
        setOffers([
          {
            id: 'offer-1',
            title: 'First Time Order Discount',
            titleAr: 'خصم طلب جديد',
            discount: '15% OFF',
            code: 'NEW15',
            description: 'Enjoy 15% off your first coffee order with us. Taste the difference!',
            descriptionAr: 'احصل على خصم 15% على طلبك الأول معنا. استمتع بالفرق!',
            validity: 'Limited time offer',
            validityAr: 'عرض محدود',
            imageUrl: '/images/offer-cup.jpg', // Replace with actual image
          },
          {
            id: 'offer-2',
            title: 'Bulk Buy & Save',
            titleAr: 'شراء بكميات كبيرة وتوفير',
            discount: 'Save 25D',
            description: 'Get 25D off when you buy any 3 bags of coffee.',
            descriptionAr: 'احصل على 25D عند شراء أي 3 أكياس من القهوة.',
            validity: 'Ends this month',
            validityAr: 'ينتهي في نهاية الشهر',
          },
          {
            id: 'offer-3',
            title: 'Free Grinding Service',
            titleAr: 'خدمة طحن مجانية',
            discount: 'FREE',
            description: 'Get your beans ground pobreza, medium, or fine, on us!',
            descriptionAr: 'احصل على حبوبك طحنها إلى pobreza, medium, أو fine, علينا!',
            validity: 'Always available',
            validityAr: 'متاح دائما',
            imageUrl: '/images/offer-grinder.jpg', // Replace with actual image
          },
        ]);
        // }
      } catch (error) {
        console.error('Error fetching offers:', error);
        // Fallback dummy data on error
        setOffers([
          {
            id: 'offer-1',
            title: 'First Time Order Discount',
            titleAr: 'خصم طلب جديد',
            discount: '15% OFF',
            code: 'NEW15',
            description: 'Enjoy 15% off your first coffee order with us.',
            descriptionAr: 'احصل على خصم 15% على طلبك الأول معنا.',
            validity: 'Limited time offer',
            validityAr: 'عرض محدود',
          },
        ]);
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, []);

  // Format price to 2 decimal places with AED currency (D)
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}D`;
  };

  // Get product name based on current language
  const getProductName = (product: Product) => {
    return contentByLang(product.name, product.nameAr || product.name);
  };

  // Get category name based on current language
  const getCategoryName = (category: string | { name: string; nameAr?: string } | undefined) => {
    if (!category) return '';
    
    if (typeof category === 'string') {
      // For string categories, use the translation function to look up matching translations
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
        'Decaf': 'منزوع الكافيين'
      };
      
      // If in Arabic mode and we have a translation, return it, otherwise return the original
      return language === 'ar' && categoryTranslations[category] 
        ? categoryTranslations[category] 
        : category;
    }
    
    return contentByLang(category.name, category.nameAr || category.name);
  };

  // Render rating stars
  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center mt-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Slider variants for animations
  const sliderVariants = {
    incoming: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    active: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.7 }, // Custom cubic-bezier
        opacity: { duration: 0.5, ease: "easeIn" }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.7 },
        opacity: { duration: 0.4, ease: "easeOut" }
      }
    })
  };

  const contentBlockVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 } // Faster stagger
    }
  };

  const textLineVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, x: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      x: 0, 
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 }
    },
    exit: { // Added exit variant for image fade-out
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  // Add this function to handle category display names with proper translation
  const getCategoryDisplayName = (categoryName: string) => {
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
  };

  return (
    <div className="bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style jsx global>{`
        .hero-banner {
            min-height: 650px;
            height: 70vh; 
            max-height: 750px;
            position: relative;
            overflow: hidden;
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
            /* Subtle grid background */
            background-image: 
              linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
              linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .slide-content-container { 
            position: absolute;
            left: 5%; /* Moved to left */
            top: 50%;
            transform: translateY(-50%);
            width: auto;
            max-width: 42%; /* Adjusted width */
            text-align: left; /* Text align left */
            z-index: 10;
            padding: 20px;
        }

        .slide-image-container { 
            position: absolute;
            right: 4%; /* Moved to right */
            left: auto; /* Clear left */
            bottom: 0; /* Aligned to bottom of slide */
            width: 52%; 
            height: 90%; /* Image takes more height from bottom */
            display: flex;
            align-items: flex-end; 
            justify-content: center; 
            z-index: 5;
        }

        .slide-image { 
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; 
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.07)); /* Softer shadow */
        }

        .slide-dots {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 20;
        }
        .slide-dot {
            width: 11px;
            height: 11px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.15);
            cursor: pointer;
            transition: background-color 0.3s ease, width 0.3s ease;
        }
        .slide-dot.active {
            background-color: #000000; /* Consistent dark color - Changed to black */
            width: 30px;
            border-radius: 5.5px;
        }
        .slide-arrows {
            position: absolute;
            top: 50%;
            width: calc(100% - 50px); 
            left: 25px; 
            display: flex;
            justify-content: space-between;
            transform: translateY(-50%);
            z-index: 20;
            pointer-events: none;
        }
        .slide-arrow {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
            pointer-events: auto;
        }
        .slide-arrow:hover {
            background-color: #333333; /* Changed to a darker gray */
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transform: scale(1.05) translateY(-50%); 
        }
         .slide-arrow svg {
            width: 18px;
            height: 18px;
            color: #000000; /* Changed to black */
        }

        .slide-title {
            font-size: 2.6rem; 
            line-height: 1.2;
            font-weight: 700; 
            color: #000000; /* Dark grey, almost black - Changed to black */
            margin-bottom: 1rem;
        }
        .slide-subtitle {
            font-size: 1.05rem; 
            line-height: 1.65;
            color: #333333; /* Softer grey for subtitle - Changed to darker gray */
            margin-bottom: 1.75rem;
        }
        .slide-button {
            background-color: #000000; /* Match title for strong CTA - Changed to black */
            color: white;
            padding: 0.75rem 1.75rem;
            border-radius: 5px; 
            font-weight: 500; 
            letter-spacing: 0.2px;
            display: inline-block;
            transition: background-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            text-transform: none; 
            font-size: 0.875rem;
        }
        .slide-button:hover {
            background-color: #333333; /* Changed to a darker gray */
            transform: translateY(-2px);
            box-shadow: 0 3px 7px rgba(0,0,0,0.12);
        }

        @media (max-width: 1024px) { /* Tablet */
            .hero-banner {
                height: 60vh;
                min-height: 500px;
            }
            .slide-content-container {
                max-width: 45%;
                left: 4%;
            }
            .slide-image-container {
                width: 48%;
                height: 85%;
                right: 3%;
            }
            .slide-title {
                font-size: 2.2rem;
            }
            .slide-subtitle {
                font-size: 0.95rem;
            }
        }

        @media (max-width: 768px) { /* Mobile */
             .hero-banner {
                height: auto; 
                min-height: 85vh; 
            }
            .slider-slide {
                flex-direction: column-reverse; /* Text above image on mobile */
                justify-content: center; /* Center content stack */
                padding: 20px;
                padding-bottom: 70px; /* Space for dots */
            }
            .slide-image-container {
                position: relative; 
                width: 80%; 
                height: auto; 
                max-height: 40vh; 
                order: 2; /* Image below text */
                bottom: auto; left: auto; right: auto; /* Reset positioning */
                margin-top: 1.5rem; /* Space between text and image */
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
                font-size: 1.9rem;
                margin-bottom: 0.75rem;
            }
            .slide-subtitle {
                font-size: 0.9rem;
                margin-bottom: 1.25rem;
            }
            .slide-button {
                padding: 0.7rem 1.4rem;
                font-size: 0.8rem;
            }
            .slide-arrows {
                display: none; 
            }
        }

        .featured-item {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e5e7eb; /* Light border for definition */
            border-radius: 0.5rem; /* Rounded corners */
            overflow: hidden; /* Ensure image corners are also rounded */
        }
        .featured-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* Enhanced shadow on hover */
        }
        .sale-badge {
            background-color: #000000; /* Black sale badge */
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
            background-color: #000000; /* Black underline for section heading */
        }
        .newsletter-box {
            background-color: #f9fafb; /* Lighter gray for newsletter */
            border: 1px solid #e5e7eb; /* Light border */
            padding: 40px;
            border-radius: 0.5rem; /* Added border radius */
        }
        .promotion-banner {
            background-color: #111827; /* Dark background for banners */
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
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={sliderVariants}
                initial="incoming"
                animate="active"
                exit="exit"
                className="slider-slide"
                style={{ backgroundColor: heroSlides[currentSlide].backgroundColor }}
              >
                <motion.div 
                  className="slide-content-container"
                  variants={contentBlockVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <motion.h1 variants={textLineVariants} className="slide-title">
                    {contentByLang(
                      heroSlides[currentSlide].title,
                      heroSlides[currentSlide].titleAr || heroSlides[currentSlide].title
                    )}
                  </motion.h1>
                  
                  <motion.p variants={textLineVariants} className="slide-subtitle">
                    {contentByLang(
                      heroSlides[currentSlide].subtitle,
                      heroSlides[currentSlide].subtitleAr || heroSlides[currentSlide].subtitle
                    )}
                  </motion.p>
                  
                  <motion.div variants={textLineVariants}>
                    <Link href={heroSlides[currentSlide].buttonLink} className="slide-button">
                      {contentByLang(
                        heroSlides[currentSlide].buttonText,
                        heroSlides[currentSlide].buttonTextAr || heroSlides[currentSlide].buttonText
                      )}
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="slide-image-container"
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
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
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; 
                      target.style.display = 'none';
                    }}
                  />
                </motion.div>
              </motion.div>
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
                    />
                  ))}
                </div>
                
                <div className="slide-arrows">
                  <motion.div 
                    className="slide-arrow"
                    onClick={prevSlide}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  
                  <motion.div 
                    className="slide-arrow"
                    onClick={nextSlide}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Promotion Banners Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          {bannersLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
              </div>
          ) : promotionBanners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {promotionBanners.map((banner) => (
                <div key={banner.id} className="promotion-banner">
                  <div className={`flex flex-col md:flex-row ${banner.alignment === 'right' ? 'md:flex-row-reverse' : ''} items-center`}>
                    <div className="md:w-1/2 h-64 md:h-auto">
                      <Image
                        src={banner.imageUrl}
                        alt={contentByLang(banner.title, banner.titleAr || banner.title)}
                        width={500}
                        height={400}
                        className="promotion-banner-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; target.src = '/images/placeholder-banner.jpg'; // Fallback image
                        }}
                      />
            </div>
                    <div className="md:w-1/2 p-8 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-3">
                        {contentByLang(banner.title, banner.titleAr || banner.title)}
                      </h3>
                      <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                        {contentByLang(banner.description, banner.descriptionAr || banner.description)}
                      </p>
                      <Link href={banner.buttonLink} className="bg-white text-black px-6 py-2.5 inline-block hover:bg-gray-200 transition rounded font-medium text-sm">
                        {contentByLang(banner.buttonText, banner.buttonTextAr || banner.buttonText)}
                      </Link>
              </div>
            </div>
              </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">{t('no_promotions', 'No promotions at the moment.')}</p>
          )}
        </div>
      </section>

      {/* Featured Products Section - Modern Design */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="section-title text-black">{t('discover_collection', 'Discover Our Collection')}</h2>
            <p className="section-subtitle">{t('premium_coffee_beans', 'Handpicked premium coffee beans from around the world, roasted to perfection')}</p>
          </div>
          
          {/* Add category header filtering option - ensure this is translated */}
          <div className="flex justify-center mb-10 flex-wrap gap-3">
            <button className="px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors">
              {t('all_products', 'All Products')}
            </button>
            <button className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
              {t('coffee_beans', 'COFFEE BEANS')}
            </button>
            <button className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
              {t('single_origin_header', 'SINGLE ORIGIN')}
            </button>
            <button className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
              {t('espresso_header', 'ESPRESSO')}
            </button>
            <button className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
              {t('nuts_dried_fruits', 'NUTS & DRIED FRUITS')}
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {featuredProducts.map(product => (
                <div key={product.id}>
                  <Link href={`/product/${product.id}`} className="product-card block">
                    <div className="product-image-container">
                      {product.imageUrl ? (
                        <Image 
                          src={product.imageUrl} 
                          alt={getProductName(product)} 
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="product-image"
                          priority={false}
                        />
                      ) : product.images && product.images.length > 0 ? (
                        <Image 
                          src={product.images[0]} 
                          alt={getProductName(product)} 
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="product-image"
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-category">
                        {getCategoryDisplayName(getCategoryName(product.category))}
                      </div>
                      <h3 className="product-title">{getProductName(product)}</h3>
                      <div className="product-price">{formatPrice(product.price)}</div>
                    </div>
                  </Link>
                  </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/shop" className="inline-block px-10 py-3.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
              {t('view_all_products', 'View All Products')}
                    </Link>
          </div>
        </div>
      </section>
                  
      {/* Offers Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold section-heading text-black">{t('special_offers', 'Special Offers')}</h2>
            <p className="text-gray-700 mt-6">{t('exclusive_deals', 'Don\'t miss out on our exclusive deals and discounts!')}</p>
          </div>
          {offersLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map(offer => (
                <div key={offer.id} className="offer-card flex flex-col">
                  {offer.imageUrl && (
                    <div className="relative h-48 w-full mb-4 rounded-t-md overflow-hidden">
                      <Image 
                        src={offer.imageUrl} 
                        alt={contentByLang(offer.title, offer.titleAr || offer.title)} 
                        fill
                        className="object-cover"
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.onerror = null; target.style.display = 'none'; // Hide if image fails
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-black">
                        {contentByLang(offer.title, offer.titleAr || offer.title)}
                      </h3>
                      <span className="offer-discount">{offer.discount}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 flex-grow">
                      {contentByLang(offer.description, offer.descriptionAr || offer.description)}
                    </p>
                  </div>
                  <div className="mt-auto">
                    {offer.code && (
                      <p className="text-sm text-gray-500 mb-1">{t('use_code', 'Use code')}: <strong className="text-black">{offer.code}</strong></p>
                    )}
                    <p className="text-xs text-gray-400">{contentByLang(offer.validity, offer.validityAr || offer.validity)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-gray-500">{t('no_offers', 'No special offers available right now.')}</p>
          )}
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
    </div>
  );
} 