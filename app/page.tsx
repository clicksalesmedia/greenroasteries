'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  imageUrl?: string;
  slug: string;
  rating?: number;
  category?: string | { name: string };
}

// Hero banner slide interface
interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  backgroundColor: string;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderLoading, setSliderLoading] = useState(true);
  
  // Hero slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

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
            subtitle: slide.subtitle,
            buttonText: slide.buttonText,
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
              subtitle: "Experience the true art of coffee with our handcrafted blends.",
              buttonText: "Explore Collection",
              buttonLink: "/shop",
              image: "/images/packages.png",
              backgroundColor: "#f4f6f8"
            },
            {
              id: 2,
              title: "Single Origin Excellence",
              subtitle: "Discover unique flavors from the world's best coffee regions.",
              buttonText: "View Origins",
              buttonLink: "/shop",
              image: "/images/packages.png",
              backgroundColor: "#f8f4f4"
            },
            {
              id: 3,
              title: "Your Perfect Morning Ritual",
              subtitle: "Start your day with the exceptional taste of Green Roasteries.",
              buttonText: "Shop Bestsellers",
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
            subtitle: "Experience the true art of coffee with our handcrafted blends.",
            buttonText: "Explore Collection",
            buttonLink: "/shop",
            image: "/images/packages.png",
            backgroundColor: "#f4f6f8"
          },
          {
            id: 2,
            title: "Single Origin Excellence",
            subtitle: "Discover unique flavors from the world's best coffee regions.",
            buttonText: "View Origins",
            buttonLink: "/shop",
            image: "/images/packages.png",
            backgroundColor: "#f8f4f4"
          },
          {
            id: 3,
            title: "Your Perfect Morning Ritual",
            subtitle: "Start your day with the exceptional taste of Green Roasteries.",
            buttonText: "Shop Bestsellers",
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
              price: 24.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'ethiopian-yirgacheffe',
              rating: 4.8,
              category: 'Single Origin'
            },
            {
              id: 'prod-2',
              name: 'Colombian Supremo',
              price: 19.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'colombian-supremo',
              rating: 4.6,
              category: 'Medium Roast'
            },
            {
              id: 'prod-3',
              name: 'Espresso Blend',
              price: 22.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'espresso-blend',
              rating: 4.9,
              category: 'Espresso Roast'
            },
            {
              id: 'prod-4',
              name: 'Sumatra Mandheling',
              price: 26.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'sumatra-mandheling',
              rating: 4.7,
              category: 'Dark Roast'
            },
            {
              id: 'prod-5',
              name: 'Guatemalan Antigua',
              price: 23.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'guatemalan-antigua',
              rating: 4.5,
              category: 'Medium Roast'
            },
            {
              id: 'prod-6',
              name: 'Kenya AA',
              price: 27.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'kenya-aa',
              rating: 4.8,
              category: 'Light Roast'
            },
            {
              id: 'prod-7',
              name: 'Costa Rican Tarrazu',
              price: 25.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'costa-rican-tarrazu',
              rating: 4.7,
              category: 'Medium Roast'
            },
            {
              id: 'prod-8',
              name: 'French Roast',
              price: 21.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'french-roast',
              rating: 4.5,
              category: 'Dark Roast'
            },
            {
              id: 'prod-9',
              name: 'Jamaican Blue Mountain',
              price: 39.99,
              images: ['/images/coffee-1.jpg'],
              imageUrl: '/images/coffee-1.jpg',
              slug: 'jamaican-blue-mountain',
              rating: 4.9,
              category: 'Premium'
            },
            {
              id: 'prod-10',
              name: 'Breakfast Blend',
              price: 18.99,
              images: ['/images/coffee-2.jpg'],
              imageUrl: '/images/coffee-2.jpg',
              slug: 'breakfast-blend',
              rating: 4.4,
              category: 'Light Roast'
            },
            {
              id: 'prod-11',
              name: 'Mexican Chiapas',
              price: 22.99,
              images: ['/images/coffee-3.jpg'],
              imageUrl: '/images/coffee-3.jpg',
              slug: 'mexican-chiapas',
              rating: 4.6,
              category: 'Medium Roast'
            },
            {
              id: 'prod-12',
              name: 'Italian Espresso',
              price: 23.99,
              images: ['/images/coffee-4.jpg'],
              imageUrl: '/images/coffee-4.jpg',
              slug: 'italian-espresso',
              rating: 4.8,
              category: 'Espresso'
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
            price: 24.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'ethiopian-yirgacheffe',
            rating: 4.8,
            category: 'Single Origin'
          },
          {
            id: 'prod-2',
            name: 'Colombian Supremo',
            price: 19.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'colombian-supremo',
            rating: 4.6,
            category: 'Medium Roast'
          },
          {
            id: 'prod-3',
            name: 'Espresso Blend',
            price: 22.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'espresso-blend',
            rating: 4.9,
            category: 'Espresso Roast'
          },
          {
            id: 'prod-4',
            name: 'Sumatra Mandheling',
            price: 26.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'sumatra-mandheling',
            rating: 4.7,
            category: 'Dark Roast'
          },
          {
            id: 'prod-5',
            name: 'Brazilian Santos',
            price: 21.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'brazilian-santos',
            rating: 4.5,
            category: 'Medium Roast'
          },
          {
            id: 'prod-6',
            name: 'Kenya AA',
            price: 27.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'kenya-aa',
            rating: 4.8,
            category: 'Light Roast'
          },
          {
            id: 'prod-7',
            name: 'Costa Rican Tarrazu',
            price: 25.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'costa-rican-tarrazu',
            rating: 4.7,
            category: 'Medium Roast'
          },
          {
            id: 'prod-8',
            name: 'French Roast',
            price: 21.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'french-roast',
            rating: 4.5,
            category: 'Dark Roast'
          },
          {
            id: 'prod-9',
            name: 'Jamaican Blue Mountain',
            price: 39.99,
            images: ['/images/coffee-1.jpg'],
            imageUrl: '/images/coffee-1.jpg',
            slug: 'jamaican-blue-mountain',
            rating: 4.9,
            category: 'Premium'
          },
          {
            id: 'prod-10',
            name: 'Breakfast Blend',
            price: 18.99,
            images: ['/images/coffee-2.jpg'],
            imageUrl: '/images/coffee-2.jpg',
            slug: 'breakfast-blend',
            rating: 4.4,
            category: 'Light Roast'
          },
          {
            id: 'prod-11',
            name: 'Mexican Chiapas',
            price: 22.99,
            images: ['/images/coffee-3.jpg'],
            imageUrl: '/images/coffee-3.jpg',
            slug: 'mexican-chiapas',
            rating: 4.6,
            category: 'Medium Roast'
          },
          {
            id: 'prod-12',
            name: 'Italian Espresso',
            price: 23.99,
            images: ['/images/coffee-4.jpg'],
            imageUrl: '/images/coffee-4.jpg',
            slug: 'italian-espresso',
            rating: 4.8,
            category: 'Espresso'
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

  // Format price to 2 decimal places with AED currency (D)
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}D`;
  };

  // Get category name (handles both string and object formats)
  const getCategoryName = (category: string | { name: string } | undefined) => {
    if (!category) return '';
    return typeof category === 'string' ? category : category.name;
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
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
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

  return (
    <div className="bg-white">
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
            background-color: #2c3e50; /* Consistent dark color */
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
            background-color: #fff;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            transform: scale(1.05) translateY(-50%); 
        }
         .slide-arrow svg {
            width: 18px;
            height: 18px;
            color: #333;
        }

        .slide-title {
            font-size: 2.6rem; 
            line-height: 1.2;
            font-weight: 700; /* Bold for emphasis */
            color: #1f2937; /* Dark grey, almost black */
            margin-bottom: 1rem;
        }
        .slide-subtitle {
            font-size: 1.05rem; 
            line-height: 1.65;
            color: #4b5563; /* Softer grey for subtitle */
            margin-bottom: 1.75rem;
        }
        .slide-button {
            background-color: #1f2937; /* Match title for strong CTA */
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
            background-color: #374151; 
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
            transition: transform 0.3s ease;
        }
        .featured-item:hover {
            transform: translateY(-5px);
        }
        .sale-badge {
            background-color: #ff6b6b;
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
            background-color: #333;
        }
        .newsletter-box {
            background-color: #f8f8f8;
            border: 1px solid #eee;
            padding: 40px;
        }
      `}</style>

      {/* Hero Banner Slider */}
      <section className="hero-banner">
        {sliderLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No sliders available</p>
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
                    {heroSlides[currentSlide].title}
                  </motion.h1>
                  
                  <motion.p variants={textLineVariants} className="slide-subtitle">
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>
                  
                  <motion.div variants={textLineVariants}>
                    <Link href={heroSlides[currentSlide].buttonLink} className="slide-button">
                      {heroSlides[currentSlide].buttonText}
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
                    alt={heroSlides[currentSlide].title}
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

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="mb-4 text-3xl">
                <i className="fas fa-shipping-fast"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Free shipping</h3>
              <p className="text-gray-600">Free shipping on orders over 65D.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="mb-4 text-3xl">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Returns</h3>
              <p className="text-gray-600">30-days free return policy</p>
            </div>
            
            <div className="text-center p-6">
              <div className="mb-4 text-3xl">
                <i className="fas fa-credit-card"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secured Payments</h3>
              <p className="text-gray-600">We accept all major credit cards</p>
            </div>
            
            <div className="text-center p-6">
              <div className="mb-4 text-3xl">
                <i className="fas fa-headset"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Online Support</h3>
              <p className="text-gray-600">Customer support available anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold section-heading">Green Roasteries</h2>
            <p className="text-gray-600 mt-6">Handpicked premium coffee beans for the true connoisseur</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-800"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <div key={product.id} className="featured-item group">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative rounded-lg overflow-hidden aspect-square mb-4">
                      {product.imageUrl ? (
                        <Image 
                          src={product.imageUrl} 
                          alt={product.name} 
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : product.images && product.images.length > 0 ? (
                        <Image 
                          src={product.images[0]} 
                          alt={product.name} 
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="mb-1">
                    <span className="text-xs text-gray-500">{getCategoryName(product.category)}</span>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-1">
                    <Link href={`/product/${product.id}`} className="text-black hover:text-gray-700 transition">
                      {product.name}
                    </Link>
                  </h3>
                  
                  {renderRating(product.rating)}
                  
                  <div className="font-bold text-lg text-black mt-2">{formatPrice(product.price)}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/shop" className="bg-black text-white px-8 py-3 inline-block hover:bg-gray-800 transition">VIEW ALL PRODUCTS</Link>
          </div>
        </div>
      </section>
      
      {/* Footer will be added later */}
      
      {/* External Scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" strategy="beforeInteractive" />
    </div>
  );
} 