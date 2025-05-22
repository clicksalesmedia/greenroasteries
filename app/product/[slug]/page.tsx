'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StarIcon, ShoppingCartIcon, EyeIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductVariation {
  id: string;
  weight?: string | { id: string; name: string; value: number; displayName: string; [key: string]: any };
  beans?: string | { id: string; name: string; [key: string]: any };
  additions?: string | { id: string; name: string; [key: string]: any };
  // For backwards compatibility
  size?: string | { id: string; name: string; value: number; displayName: string; [key: string]: any };
  type?: string | { id: string; name: string; [key: string]: any };
  price: number;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  imageUrl?: string;
  category: string | { id: string; name: string; nameAr?: string; slug?: string };
  variations?: ProductVariation[];
  stockQuantity?: number;
  viewCount?: number;
  rating?: number;
  reviews?: number;
}

interface SelectedVariation extends ProductVariation {
  // Add a custom property to make the interface non-empty
  selected?: boolean; 
}

// Helper function to extract display values from variation objects or strings
const extractValue = (value: any, language = 'en'): string => {
  if (!value) return '';
  
  if (typeof value === 'string') return value;
  
  if (typeof value === 'object' && value !== null) {
    // If it's an object with language-specific name properties
    if (language === 'ar') {
      // Try different Arabic name properties in order of preference
      if ('nameAr' in value && value.nameAr) {
        return value.nameAr;
      } else if ('arabicName' in value && value.arabicName) {
        return value.arabicName;
      } else if ('displayNameAr' in value && value.displayNameAr) {
        return value.displayNameAr;
      }
    }
    
    // If no Arabic name is found or language is English, use English names
    if ('name' in value) {
      return value.name;
    } else if ('displayName' in value) {
      return value.displayName;
    }
    
    // Otherwise, try to convert it to a string
    return String(value);
  }
  
  return String(value);
};

// Helper function to match variation values
const isMatch = (variationProp: any, selectionValue: string, language = 'en'): boolean => {
  if (!selectionValue) return true; // No selection means any value matches
  
  const extractedValue = extractValue(variationProp, language);
  // Use case-insensitive comparison to make matching more reliable
  return extractedValue.toLowerCase() === selectionValue.toLowerCase();
};

interface ProductImageMagnifierProps {
  src: string;
  alt: string;
  zoomLevel?: number;
}

const ProductImageMagnifier = ({ src, alt, zoomLevel = 1.8 }: ProductImageMagnifierProps) => {
  // Use a placeholder image if src is null, not a string, or empty
  const imageSrc = (src && typeof src === 'string' && src.trim() !== '') ? src : '/images/placeholder.jpg';
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageRef.current) {
      // Get the boundaries of the image container
      const { left, top, width, height } = imageRef.current.getBoundingClientRect();
      
      // Calculate relative mouse position inside the container (0 to 1)
      const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
      const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
      
      // Set cursor position for zoom
      setMousePosition({ x, y });
    }
  };

  return (
    <div 
      className="relative w-full h-full rounded-lg overflow-hidden cursor-zoom-in" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={imageRef}
    >
      <Image 
        src={imageSrc} 
        alt={alt} 
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={90}
        priority={true}
        className={`object-contain transition-transform duration-200 ${isHovered ? 'scale-[1.8]' : 'scale-100'}`}
        style={{
          transformOrigin: `${mousePosition.x * 100}% ${mousePosition.y * 100}%`
        }}
      />
    </div>
  );
};

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { language, contentByLang, t } = useLanguage();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(-1);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<SelectedVariation | null>(null);
  const [availableWeights, setAvailableWeights] = useState<string[]>([]);
  const [availableBeans, setAvailableBeans] = useState<string[]>([]);
  const [availableAdditions, setAvailableAdditions] = useState<string[]>([]);
  const [variationImage, setVariationImage] = useState<string | null>(null);
  const [currentCarouselPage, setCurrentCarouselPage] = useState(0);
  const ITEMS_PER_PAGE = 4; // Number of recommended products to show at once on desktop
  const MOBILE_ITEMS_PER_PAGE = 2; // Number of recommended products to show at once on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  const { addItem } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  
  // Initialize view count once
  useEffect(() => {
    // Generate a random number between 45 and 130 for the initial view count
    const initialViews = Math.floor(Math.random() * (130 - 45 + 1)) + 45;
    setViewCount(initialViews);
  }, []);
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        console.log('Product data:', data);
        console.log('Language:', language);
        console.log('Arabic name:', data.nameAr);
        console.log('Arabic description:', data.descriptionAr);
        console.log('Variations:', data.variations);
        
        // Check if variations have weight and additions properly mapped
        if (data.variations && data.variations.length > 0) {
          // Log the Arabic properties of variations
          data.variations.forEach((variation: ProductVariation, index: number) => {
            console.log(`Variation ${index + 1}:`);
            if (variation.beans && typeof variation.beans === 'object') {
              console.log('  Beans:', variation.beans.name);
              console.log('  Beans (Arabic):', variation.beans.nameAr || variation.beans.arabicName);
            }
            if (variation.additions && typeof variation.additions === 'object') {
              console.log('  Additions:', variation.additions.name);
              console.log('  Additions (Arabic):', variation.additions.nameAr || variation.additions.arabicName);
            }
            if (variation.weight && typeof variation.weight === 'object') {
              console.log('  Weight:', variation.weight.displayName);
              console.log('  Weight (Arabic):', variation.weight.displayNameAr);
            }
          });
        
          // Convert old 'size' field to 'weight' if needed for backwards compatibility
          data.variations = data.variations.map((variation: any) => {
            // If we have size but not weight, use size as weight
            if (variation.size && !variation.weight) {
              variation.weight = variation.size;
            }
            // If we have type but not additions, use type as additions
            if (variation.type && !variation.additions) {
              variation.additions = variation.type;
            }
            return variation;
          });
        }
        
        setProduct(data);
        
        // Initial variation selection if available
        if (data.variations && data.variations.length > 0) {
          // Always prioritize finding a variation with "normal" additions first
          const normalVariation = data.variations.find((v: ProductVariation) => {
            const additionValue = extractValue(v.additions || v.type, language).toLowerCase();
            return additionValue === 'normal';
          });
          
          // If found, select it as the initial variation
          if (normalVariation) {
            console.log('Found and selected Normal variation as default:', normalVariation);
            setSelectedVariation(normalVariation);
            
            // Set variation image if available
            if (normalVariation.imageUrl) {
              setVariationImage(normalVariation.imageUrl);
            }
          } else {
            // If no Normal variation exists, create a modified version of the first variation
            console.log('No Normal variation found, creating one based on first variation');
            const firstVariation = data.variations[0];
            
            // Create a modified variation with Normal addition
            const modifiedVariation = {
              ...firstVariation,
              additions: 'Normal',
              id: `${firstVariation.id}-normal`
            };
            
            console.log('Created modified variation with Normal addition:', modifiedVariation);
            setSelectedVariation(modifiedVariation);
            
            // Keep the image from the original variation
            if (firstVariation.imageUrl) {
              setVariationImage(firstVariation.imageUrl);
            }
          }
        }
        
        // In a real app, this would be an API call to increment the view count
        // For now, we'll simulate it with our local state
        setViewCount(prevCount => prevCount + 1);
        
        // Fetch recommended products
        fetchRecommendedProducts(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again later.');
        
        // Create dummy product for development
        createDummyProduct();
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug, language]);
  
  // Extract available variation options and update when product or language changes
  useEffect(() => {
    if (product?.variations) {
      console.log(`Extracting variations for language: ${language}`);
      
      // Extract available options with the current language
      const weights = [...new Set(product.variations
        .map(v => extractValue(v.weight || v.size, language))
        .filter(Boolean))] as string[];
      
      // Sort weights in the specific order: 250g, 500g, 1kg
      const weightOrder: Record<string, number> = {'250g': 1, '500g': 2, '1kg': 3};
      const sortedWeights = [...weights].sort((a, b) => {
        // Exact match with predefined order
        const orderA = weightOrder[a] || 999;
        const orderB = weightOrder[b] || 999;
        return orderA - orderB;
      });
      
      const beans = [...new Set(product.variations
        .map(v => extractValue(v.beans, language))
        .filter(Boolean))] as string[];
      
      // Extract additions from variations
      let extractedAdditions = [...new Set(product.variations
        .map(v => extractValue(v.additions || v.type, language))
        .filter(Boolean))] as string[];
      
      // Create a new array with "Normal" always first, followed by other options
      let additions: string[] = [];
      
      // Always include "Normal" as the first option
      additions.push('Normal');
      
      // Add other additions that aren't "Normal"
      extractedAdditions.forEach(addition => {
        if (addition && addition.toLowerCase() !== 'normal') {
          additions.push(addition);
        }
      });
      
      console.log('Available options by language:', {
        language,
        weights: sortedWeights,
        beans,
        additions
      });
      
      // Log raw addition objects for debugging
      console.log('Raw addition objects:', product.variations.map(v => v.additions || v.type));
      
      // Update available options
      setAvailableWeights(sortedWeights);
      setAvailableBeans(beans);
      setAvailableAdditions(additions);
      
      // If there's a selected variation, update its display values
      if (selectedVariation) {
        console.log('Updating selected variation display values for language:', language);
        
        // Force a re-selection of the current variation with the new language context
        const currentVariationId = selectedVariation.id;
        const updatedVariation = product.variations.find(v => v.id === currentVariationId) || selectedVariation;
        
        // This will trigger a re-render with the proper translated values
        setSelectedVariation({...updatedVariation});
      }
    }
  }, [product, language]);
  
  const fetchRecommendedProducts = async (currentProduct: Product) => {
    try {
      // In a real application, you would fetch related products from an API
      // Here we'll just fetch some random products
      const response = await fetch('/api/products?limit=4');
      
      if (response.ok) {
        const data = await response.json();
        // Filter out the current product if it's in the results
        const filtered = data.filter((p: Product) => p.id !== currentProduct.id);
        setRecommendedProducts(filtered.slice(0, 4));
      } else {
        createDummyRecommendedProducts();
      }
    } catch (error) {
      console.error('Error fetching recommended products:', error);
      createDummyRecommendedProducts();
    }
  };
  
  const createDummyProduct = () => {
    // Create a dummy product for development
    const dummyProduct: Product = {
      id: 'dummy-1',
      name: 'Ethiopian Yirgacheffe Coffee',
      slug: 'ethiopian-yirgacheffe-coffee',
      description: 'A delicious single-origin coffee from the highlands of Ethiopia with bright, citrusy notes and a smooth, clean finish. This light-medium roast coffee is perfect for pour-over or drip methods.\n\nFlavor Profile: Citrus, Bergamot, Floral\nOrigin: Yirgacheffe, Ethiopia\nAltitude: 1,800-2,100 meters\nProcess: Washed\nRoast: Light-Medium',
      price: 24.99,
      discountPrice: 19.99,
      images: [
        '/images/coffee-1.jpg',
        '/images/coffee-2.jpg',
        '/images/coffee-3.jpg',
        '/images/coffee-4.jpg',
      ],
      imageUrl: '/images/coffee-1.jpg',
      category: { id: 'cat-single-origin', name: 'Single Origin' },
      variations: [
        // Arabica + Normal combinations with all three weights
        {
          id: 'var-1',
          weight: '250g',
          beans: 'Arabica',
          additions: 'Normal',
          price: 14.99,
          stockQuantity: 25
        },
        {
          id: 'var-2',
          weight: '500g',
          beans: 'Arabica',
          additions: 'Normal',
          price: 24.99,
          stockQuantity: 15
        },
        {
          id: 'var-3',
          weight: '1kg',
          beans: 'Arabica',
          additions: 'Normal',
          price: 42.99,
          stockQuantity: 8
        },
        
        // Arabica + Ground combinations with all three weights
        {
          id: 'var-4',
          weight: '250g',
          beans: 'Arabica',
          additions: 'Ground',
          price: 14.99,
          stockQuantity: 30
        },
        {
          id: 'var-5',
          weight: '500g',
          beans: 'Arabica',
          additions: 'Ground',
          price: 24.99,
          stockQuantity: 20
        },
        {
          id: 'var-6',
          weight: '1kg',
          beans: 'Arabica',
          additions: 'Ground',
          price: 42.99,
          stockQuantity: 12
        },
        
        // Robusta + Whole Beans combinations with all three weights
        {
          id: 'var-7',
          weight: '250g',
          beans: 'Robusta',
          additions: 'Whole Beans',
          price: 12.99,
          stockQuantity: 18
        },
        {
          id: 'var-8',
          weight: '500g',
          beans: 'Robusta',
          additions: 'Whole Beans',
          price: 22.99,
          stockQuantity: 14
        },
        {
          id: 'var-9',
          weight: '1kg',
          beans: 'Robusta',
          additions: 'Whole Beans',
          price: 38.99,
          stockQuantity: 10
        }
      ],
      rating: 4.7,
      reviews: 24
    };
    
    setProduct(dummyProduct);
    
    // Extract unique variation options
    const weights = [...new Set(dummyProduct.variations?.map(v => extractValue(v.weight, language)).filter(Boolean))] as string[];
    
    // Sort weights in the specific order: 250g, 500g, 1kg
    const weightOrder: Record<string, number> = {'250g': 1, '500g': 2, '1kg': 3};
    const sortedWeights = [...weights].sort((a, b) => {
      // Exact match with predefined order
      const orderA = weightOrder[a] || 999;
      const orderB = weightOrder[b] || 999;
      return orderA - orderB;
    });
    
    const beans = [...new Set(dummyProduct.variations?.map(v => extractValue(v.beans, language)).filter(Boolean))] as string[];
    
    // Extract additions from variations
    let extractedAdditions = [...new Set(dummyProduct.variations?.map(v => extractValue(v.additions, language)).filter(Boolean))] as string[];
    
    // Create a new array with "Normal" always first, followed by other options
    let additions: string[] = [];
    
    // Always include "Normal" as the first option
    additions.push('Normal');
    
    // Add other additions that aren't "Normal"
    extractedAdditions.forEach(addition => {
      if (addition && addition.toLowerCase() !== 'normal') {
        additions.push(addition);
      }
    });
    
    console.log('Dummy product variations options:', { weights: sortedWeights, beans, additions });
    
    setAvailableWeights(sortedWeights);
    setAvailableBeans(beans);
    setAvailableAdditions(additions);
    
    // Find a variation with "normal" additions
    if (dummyProduct.variations && dummyProduct.variations.length > 0) {
      const normalVariation = dummyProduct.variations.find((v: ProductVariation) => {
        const additionValue = extractValue(v.additions || v.type, language).toLowerCase();
        return additionValue === 'normal';
      });
      
      // Select the normal variation or create a modified version of the first variation
      if (normalVariation) {
        console.log('Found and selected Normal variation as default in dummy product:', normalVariation);
        setSelectedVariation(normalVariation);
      } else {
        console.log('No Normal variation found in dummy product, creating one based on first variation');
        const firstVariation = dummyProduct.variations[0];
        
        // Create a modified variation with Normal addition
        const modifiedVariation = {
          ...firstVariation,
          additions: 'Normal',
          id: `${firstVariation.id}-normal`
        };
        
        console.log('Created modified variation with Normal addition for dummy product:', modifiedVariation);
        setSelectedVariation(modifiedVariation);
      }
    }
  };
  
  const createDummyRecommendedProducts = () => {
    // Create dummy recommended products
    const dummyRecommended: Product[] = [
      {
        id: 'dummy-2',
        name: 'Colombian Supremo Coffee',
        slug: 'colombian-supremo-coffee',
        price: 18.99,
        images: ['/images/coffee-2.jpg'],
        imageUrl: '/images/coffee-2.jpg',
        category: 'Single Origin',
        rating: 4.5,
        reviews: 18
      },
      {
        id: 'dummy-3',
        name: 'Espresso Blend Coffee',
        slug: 'espresso-blend-coffee',
        price: 22.99,
        images: ['/images/coffee-3.jpg'],
        imageUrl: '/images/coffee-3.jpg',
        category: 'Blend',
        rating: 4.8,
        reviews: 32
      },
      {
        id: 'dummy-4',
        name: 'Sumatra Mandheling Coffee',
        slug: 'sumatra-mandheling-coffee',
        price: 23.99,
        images: ['/images/coffee-4.jpg'],
        imageUrl: '/images/coffee-4.jpg',
        category: 'Single Origin',
        rating: 4.6,
        reviews: 14
      },
      {
        id: 'dummy-5',
        name: 'Decaf House Blend Coffee',
        slug: 'decaf-house-blend-coffee',
        price: 20.99,
        images: ['/images/coffee-5.jpg'],
        imageUrl: '/images/coffee-5.jpg',
        category: 'Decaf',
        rating: 4.3,
        reviews: 9
      }
    ];
    
    setRecommendedProducts(dummyRecommended);
  };
  
  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity < 1) return;
    
    // Check against selected variation's stock quantity
    if (selectedVariation?.stockQuantity !== undefined && newQuantity > selectedVariation.stockQuantity) {
      return;
    }
    
    setQuantity(newQuantity);
  };
  
  const handleVariationChange = (type: 'weight' | 'beans' | 'additions', value: string) => {
    if (!product || !product.variations) return;
    
    console.log(`Changing ${type} to ${value} (Language: ${language})`);
    
    // Get current selections for weight and beans
    const currentWeight = selectedVariation?.weight ? extractValue(selectedVariation.weight, language) : '';
    const currentBeans = selectedVariation?.beans ? extractValue(selectedVariation.beans, language) : '';

    // For additions, we'll completely replace the value rather than trying to find an exact match
    if (type === 'additions') {
      console.log(`Switching addition to: ${value}`);
      
      // First try to find an exact match variation with current weight/beans and the new addition
      const exactMatch = product.variations.find(variation => {
        const variationWeight = extractValue(variation.weight || variation.size, language);
        const variationBeans = extractValue(variation.beans, language);
        const variationAdditions = extractValue(variation.additions || variation.type, language);
        
        return (
          (!currentWeight || variationWeight.toLowerCase() === currentWeight.toLowerCase()) &&
          (!currentBeans || variationBeans.toLowerCase() === currentBeans.toLowerCase()) &&
          variationAdditions.toLowerCase() === value.toLowerCase()
        );
      });
      
      if (exactMatch) {
        console.log('Found exact matching variation with the selected addition:', exactMatch);
        setSelectedVariation(exactMatch);
        
        // Set variation image if available
        if (exactMatch.imageUrl) {
          setVariationImage(exactMatch.imageUrl);
        } else {
          setVariationImage(null);
        }
        return;
      }
      
      // If no exact match, find a variation with matching weight and beans to use as base
      const baseVariation = product.variations.find(variation => {
        const variationWeight = extractValue(variation.weight || variation.size, language);
        const variationBeans = extractValue(variation.beans, language);
        
        return (
          (!currentWeight || variationWeight.toLowerCase() === currentWeight.toLowerCase()) &&
          (!currentBeans || variationBeans.toLowerCase() === currentBeans.toLowerCase())
        );
      });
      
      if (baseVariation) {
        // Create a modified version with the new addition
        const modifiedVariation = {
          ...baseVariation,
          additions: value,
          id: `${baseVariation.id}-${value.toLowerCase().replace(/\s+/g, '-')}`
        };
        
        console.log('Created modified variation with selected addition:', modifiedVariation);
        setSelectedVariation(modifiedVariation);
        
        // Keep the image from the base variation
        if (baseVariation.imageUrl) {
          setVariationImage(baseVariation.imageUrl);
        } else {
          setVariationImage(null);
        }
        return;
      } else {
        // If we still can't find a match, use the first variation as a base
        if (product.variations.length > 0) {
          const firstVariation = product.variations[0];
          const modifiedVariation = {
            ...firstVariation,
            additions: value,
            id: `${firstVariation.id}-${value.toLowerCase().replace(/\s+/g, '-')}`
          };
          
          console.log('Created modified variation from first variation:', modifiedVariation);
          setSelectedVariation(modifiedVariation);
          
          if (firstVariation.imageUrl) {
            setVariationImage(firstVariation.imageUrl);
          } else {
            setVariationImage(null);
          }
          return;
        }
      }
    }
    
    // For weight and beans, continue with the existing logic
    // Find a matching variation based on current selection plus the new change
    const newSelection = {
      weight: selectedVariation?.weight ? extractValue(selectedVariation.weight, language) : '',
      beans: selectedVariation?.beans ? extractValue(selectedVariation.beans, language) : '',
      additions: selectedVariation?.additions ? extractValue(selectedVariation.additions, language) : '',
      [type]: value
    };
    
    console.log('New selection criteria:', newSelection);
    
    // Special handling for "Normal" additions
    if (type === 'additions' && value.toLowerCase() === 'normal') {
      console.log('Special handling for Normal addition selection');
      
      // Check if there's a matching variation with these weight and beans but with "Normal" addition
      const normalVariation = product.variations.find(variation => {
        const variationWeight = extractValue(variation.weight || variation.size, language);
        const variationBeans = extractValue(variation.beans, language);
        const variationAdditions = extractValue(variation.additions || variation.type, language).toLowerCase();
        
        return (
          (!newSelection.weight || variationWeight.toLowerCase() === newSelection.weight.toLowerCase()) &&
          (!newSelection.beans || variationBeans.toLowerCase() === newSelection.beans.toLowerCase()) &&
          variationAdditions === 'normal'
        );
      });
      
      if (normalVariation) {
        console.log('Found matching variation with Normal addition:', normalVariation);
        setSelectedVariation(normalVariation);
        
        // Set variation image if available
        if (normalVariation.imageUrl) {
          setVariationImage(normalVariation.imageUrl);
        } else {
          setVariationImage(null);
        }
        return;
      } else {
        console.log('No matching variation with Normal addition found. Using first available with matching weight/beans.');
        
        // Look for any variation with matching weight and beans
        const closestMatch = product.variations.find(variation => {
          const variationWeight = extractValue(variation.weight || variation.size, language);
          const variationBeans = extractValue(variation.beans, language);
          
          return (
            (!newSelection.weight || variationWeight.toLowerCase() === newSelection.weight.toLowerCase()) &&
            (!newSelection.beans || variationBeans.toLowerCase() === newSelection.beans.toLowerCase())
          );
        });
        
        if (closestMatch) {
          // Create a modified version of this variation with Normal addition
          const modifiedVariation = {
            ...closestMatch,
            additions: 'Normal',
            id: `${closestMatch.id}-normal`
          };
          
          console.log('Created modified variation with Normal addition:', modifiedVariation);
          setSelectedVariation(modifiedVariation);
          
          // Keep the same image if available
          if (closestMatch.imageUrl) {
            setVariationImage(closestMatch.imageUrl);
          } else {
            setVariationImage(null);
          }
          return;
        }
      }
    }
    
    // Find the best matching variation by comparing string values or object names/displayNames
    const bestMatch = product.variations.find(variation => {
      // Extract the variation properties for easier comparison
      const variationWeight = extractValue(variation.weight || variation.size, language);
      const variationBeans = extractValue(variation.beans, language);
      const variationAdditions = extractValue(variation.additions || variation.type, language);
      
      console.log('Checking variation:', {
        variationId: variation.id,
        weight: variationWeight,
        beans: variationBeans,
        additions: variationAdditions,
        price: variation.price,
        against: newSelection
      });
      
      // Case insensitive comparison to make matching more reliable
      const matchWeight = !newSelection.weight || 
        variationWeight.toLowerCase() === newSelection.weight.toLowerCase();
      
      const matchBeans = !newSelection.beans || 
        variationBeans.toLowerCase() === newSelection.beans.toLowerCase();
      
      const matchAdditions = !newSelection.additions || 
        variationAdditions.toLowerCase() === newSelection.additions.toLowerCase();
      
      const isMatch = matchWeight && matchBeans && matchAdditions;
      console.log(`Match: ${isMatch}`, { matchWeight, matchBeans, matchAdditions });
      
      return isMatch;
    });
    
    if (bestMatch) {
      console.log('Selected variation:', bestMatch);
      setSelectedVariation(bestMatch);
      
      // Set variation image if available
      if (bestMatch.imageUrl) {
        setVariationImage(bestMatch.imageUrl);
      } else {
        setVariationImage(null);
      }
    } else {
      console.log('No exact matching variation found. Looking for partial match...');
      setVariationImage(null);
      
      // If no exact match found, try to find the best partial match
      // prioritizing the current selection type (weight, beans, or additions)
      const partialMatches = product.variations.filter(variation => {
        let variationProp;
        if (type === 'weight') {
          variationProp = extractValue(variation.weight || variation.size, language);
        } else if (type === 'additions') {
          variationProp = extractValue(variation.additions || variation.type, language);
        } else {
          variationProp = extractValue(variation[type], language);
        }
        
        // Case insensitive comparison
        return variationProp.toLowerCase() === value.toLowerCase();
      });
      
      if (partialMatches.length > 0) {
        console.log(`Found ${partialMatches.length} partial matches. Selecting first one:`, partialMatches[0]);
        setSelectedVariation(partialMatches[0]);
        
        // Set variation image if available
        if (partialMatches[0].imageUrl) {
          setVariationImage(partialMatches[0].imageUrl);
        }
      } else {
        console.log('No matching variation found for selection:', newSelection);
      }
    }
  };
  
  const getCurrentPrice = () => {
    return selectedVariation?.discountPrice || selectedVariation?.price || product?.discountPrice || product?.price || 0;
  };
  
  const getOriginalPrice = () => {
    if (selectedVariation?.discountPrice) {
      return selectedVariation.price;
    } else if (product?.discountPrice) {
      return product.price;
    }
    return null;
  };
  
  const handleAddToCart = () => {
    if (!selectedVariation || !product) {
      showToast('Please select a variation', 'error');
      return;
    }
    
    // Format the selected variation options for display
    const variationOptions = [
      extractValue(selectedVariation?.weight, language),
      extractValue(selectedVariation?.beans, language),
      extractValue(selectedVariation?.additions, language)
    ].filter(Boolean).join(', ');
    
    // Add item to cart using our cart context
    addItem({
      id: `${product.id}-${selectedVariation.id}`,
      productId: product.id,
      name: product.name,
      price: getCurrentPrice(),
      quantity: quantity,
      image: product.imageUrl || product.images[0] || '',
      variation: {
        weight: extractValue(selectedVariation?.weight, language),
        beans: extractValue(selectedVariation?.beans, language),
        additions: extractValue(selectedVariation?.additions, language)
      }
    });
    
    // Show success message with toast
    showToast(`${quantity} × ${product.name} added to cart`, 'success');
  };
  
  const handleBuyNow = () => {
    if (!selectedVariation || !product) {
      showToast('Please select a variation', 'error');
      return;
    }
    
    // Add to cart
    addItem({
      id: `${product.id}-${selectedVariation.id}`,
      productId: product.id,
      name: product.name,
      price: getCurrentPrice(),
      quantity: quantity,
      image: product.imageUrl || product.images[0] || '',
      variation: {
        weight: extractValue(selectedVariation?.weight, language),
        beans: extractValue(selectedVariation?.beans, language),
        additions: extractValue(selectedVariation?.additions, language)
      }
    });
    
    // Show success message with toast
    showToast(`${quantity} × ${product.name} added to cart`, 'success');
    
    // Redirect to checkout
    router.push('/checkout');
  };
  
  // Get category name from category (could be string or object)
  const getCategoryName = () => {
    if (!product?.category) return 'Uncategorized';
    
    if (typeof product.category === 'string') {
      return product.category;
    } else if (typeof product.category === 'object' && 'name' in product.category) {
      if (language === 'ar' && 'nameAr' in product.category && product.category.nameAr) {
        return product.category.nameAr;
      }
      return product.category.name;
    }
    
    return 'Uncategorized';
  };
  
  // Get product name based on current language
  const getProductName = () => {
    if (!product) return '';
    return contentByLang(product.name, product.nameAr || product.name);
  };
  
  // Get product description based on current language
  const getProductDescription = () => {
    if (!product) return '';
    return contentByLang(product.description || '', product.descriptionAr || product.description || '');
  };
  
  // Render rating stars
  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400" />);
      }
    }
    
    return stars;
  };
  
  // Check screen size for responsive carousel
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Carousel navigation
  const nextCarouselPage = () => {
    const totalItems = recommendedProducts.length;
    const itemsPerPage = isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    setCurrentCarouselPage((prev) => (prev + 1) % totalPages);
  };
  
  const prevCarouselPage = () => {
    const totalItems = recommendedProducts.length;
    const itemsPerPage = isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    setCurrentCarouselPage((prev) => (prev - 1 + totalPages) % totalPages);
  };
  
  // Update the handleProductClick function
  const handleProductClick = async (productSlug: string) => {
    if (productSlug && productSlug !== slug) {
      try {
        // Navigate to the new product page
        await router.push(`/product/${productSlug}`);
        // Reload the page to ensure fresh data
        window.location.reload();
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg">
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p>{error || 'Product not found'}</p>
          <Link href="/shop" className="mt-4 inline-block bg-black text-white px-6 py-2 rounded">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <ol className="flex flex-wrap">
          <li className="flex items-center">
            <Link href="/" className="text-gray-500 hover:text-black">{t('home', 'Home')}</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <Link href="/shop" className="text-gray-500 hover:text-black">{t('shop', 'Shop')}</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <Link 
              href={`/shop?category=${encodeURIComponent(getCategoryName())}`} 
              className="text-gray-500 hover:text-black"
            >
              {getCategoryName()}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="text-gray-800">{getProductName()}</li>
        </ol>
      </nav>
      
      {/* Product Detail */}
      <div className="flex flex-col md:flex-row -mx-4">
        {/* Left Column - Gallery */}
        <div className="md:w-1/2 px-4 mb-8 md:mb-0">
          {/* Main Image with Magnifier */}
          <div className="relative rounded-lg overflow-hidden mb-4 aspect-square">
            <ProductImageMagnifier 
              src={variationImage || 
                  (selectedImage === -1 && product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '' ? product.imageUrl : null) ||
                  (product.images && product.images.length > 0 && selectedImage >= 0 && 
                   typeof product.images[selectedImage] === 'string' && 
                   product.images[selectedImage].trim() !== '' 
                   ? product.images[selectedImage] 
                   : (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '' ? product.imageUrl : '/images/placeholder.jpg'))} 
              alt={getProductName()}
            />
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {/* Main product image as first thumbnail */}
            {product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '' && (
              <button 
                onClick={() => {
                  setSelectedImage(-1); // Special case for main image
                  // Clear variation image when selecting main product image
                  if (variationImage) {
                    setVariationImage(null);
                  }
                }}
                className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                  !variationImage && selectedImage === -1 ? 'border-black' : 'border-gray-200'
                } hover:border-gray-400 transition-colors`}
              >
                <Image 
                  src={product.imageUrl} 
                  alt={`${product.name} - main`} 
                  fill
                  sizes="(max-width: 768px) 20vw, 10vw"
                  className="object-contain"
                />
              </button>
            )}
            
            {/* Additional images from product.images array */}
            {product.images && 
              product.images
                .filter(img => img && typeof img === 'string' && img.trim() !== '')
                .map((image, index) => (
                  <button 
                    key={index} 
                    onClick={() => {
                      setSelectedImage(index);
                      // Clear variation image when selecting from gallery
                      if (variationImage) {
                        setVariationImage(null);
                      }
                    }}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                      !variationImage && selectedImage === index ? 'border-black' : 'border-gray-200'
                    } hover:border-gray-400 transition-colors`}
                  >
                    <Image 
                      src={image || '/images/placeholder.jpg'} 
                      alt={`${product.name} - view ${index + 1}`} 
                      fill
                      sizes="(max-width: 768px) 20vw, 10vw"
                      className="object-contain"
                    />
                  </button>
                ))}
                
            {/* Show variation image in thumbnails if available */}
            {variationImage && (
              <button 
                onClick={() => {
                  // Keep the variation image selected
                  setVariationImage(variationImage);
                }}
                className="relative aspect-square rounded-md overflow-hidden border-2 border-black"
              >
                <Image 
                  src={variationImage} 
                  alt={`${product.name} - variation`} 
                  fill
                  sizes="(max-width: 768px) 20vw, 10vw"
                  className="object-contain"
                />
              </button>
            )}
          </div>
        </div>
        
        {/* Right Column - Product Details */}
        <div className="md:w-1/2 px-4">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{getProductName()}</h1>
              <div className="text-sm text-gray-500">
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {viewCount} {t('views', 'views')}
                </span>
              </div>
            </div>
            
            {/* Category */}
            <div className="text-sm text-gray-500 mb-4">
              {t('category', 'Category')}: <Link href={`/shop?category=${encodeURIComponent(getCategoryName())}`} className="hover:text-black">{getCategoryName()}</Link>
            </div>
            
            {/* Price */}
            <div className="mb-4">
              {getOriginalPrice() ? (
                <div className="flex items-center">
                  <span className="text-xl sm:text-2xl font-bold text-black">{getCurrentPrice().toFixed(2)}D</span>
                  <span className="ml-2 text-sm text-gray-500 line-through">{getOriginalPrice()?.toFixed(2)}D</span>
                  {selectedVariation?.discountPrice && (
                    <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium rounded-md">
                      {Math.round(((selectedVariation.price - selectedVariation.discountPrice) / selectedVariation.price) * 100)}% {t('off', 'OFF')}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-black">{getCurrentPrice().toFixed(2)}D</span>
              )}
            </div>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center mb-4">
                <div className="flex">
                  {renderRatingStars(product.rating)}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviews || 0} {t('reviews', 'reviews')})
                </span>
              </div>
            )}
            
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">{t('description', 'Description')}</h2>
              <div className="text-gray-700 space-y-2 text-sm sm:text-base">
                {getProductDescription() ? (
                  getProductDescription().split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                  <p>{t('no_description', 'No description available.')}</p>
                )}
              </div>
            </div>
            
            {/* Variations */}
            <div className="mb-6 space-y-4">
              {/* Weight Variation */}
              {availableWeights.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium mb-2">{t('weight', 'Weight')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {availableWeights.map((weight) => (
                      <button 
                        key={weight}
                        onClick={() => handleVariationChange('weight', weight)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                          ${extractValue(selectedVariation?.weight, language) === weight
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Beans Variation */}
              {availableBeans.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium mb-2">{t('beans', 'Beans')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {availableBeans.map((bean) => (
                      <button 
                        key={bean}
                        onClick={() => handleVariationChange('beans', bean)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                          ${extractValue(selectedVariation?.beans, language) === bean
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {bean}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additions Variation */}
              {availableAdditions.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium mb-2">{t('additions', 'Additions')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {availableAdditions.map((addition) => {
                      // Get current selected addition
                      const currentAddition = extractValue(selectedVariation?.additions || selectedVariation?.type, language);
                      
                      // Check if this addition is selected (exact match only)
                      const isSelected = currentAddition.toLowerCase() === addition.toLowerCase();
                      
                      return (
                        <button 
                          key={addition}
                          onClick={() => handleVariationChange('additions', addition)}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                            ${isSelected
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {addition}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quantity */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">{t('quantity', 'Quantity')}</h2>
              <div className="flex items-center">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-l-md"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="w-16 h-10 flex items-center justify-center border-t border-b border-gray-200">
                  {quantity}
                </div>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-r-md"
                  disabled={selectedVariation?.stockQuantity !== undefined && quantity >= selectedVariation.stockQuantity}
                >
                  +
                </button>
                
                {selectedVariation?.stockQuantity !== undefined && selectedVariation.stockQuantity < 10 && (
                  <span className="ml-4 text-sm text-orange-500">
                    {t('only_left', 'Only')} {selectedVariation.stockQuantity} {t('left', 'left')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-white border-2 border-black text-black py-3 rounded-md flex items-center justify-center hover:bg-gray-100 transition"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                {t('add_to_cart', 'Add to Cart')}
              </button>
              <button 
                onClick={handleBuyNow}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition"
              >
                {t('buy_now', 'Buy Now')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* You May Also Like Section */}
      {recommendedProducts.length > 0 && (
        <div className="mt-16 sm:mt-24">
          <h2 className="text-2xl font-bold mb-8 text-center">{t('you_may_also_like', 'You May Also Like')}</h2>
          
          <div className="relative">
            {/* Carousel Navigation Controls */}
            <button 
              onClick={prevCarouselPage}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            
            <button 
              onClick={nextCarouselPage}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
            
            {/* Carousel Container */}
            <div className="overflow-hidden px-8">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentCarouselPage}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8"
                >
                  {recommendedProducts
                    .slice(
                      currentCarouselPage * (isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE),
                      (currentCarouselPage + 1) * (isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE)
                    )
                    .map((recommendedProduct) => (
                      <Link 
                        key={recommendedProduct.id}
                        href={`/product/${recommendedProduct.id}`}
                        className="group block cursor-pointer"
                        onClick={() => {
                          // Reset states
                          setLoading(true);
                          setProduct(null);
                          // Force page refresh
                          setTimeout(() => window.location.reload(), 100);
                        }}
                      >
                        <div className="relative rounded-lg overflow-hidden aspect-square mb-3">
                          <Image 
                            src={recommendedProduct.imageUrl || (recommendedProduct.images && recommendedProduct.images.length > 0 ? recommendedProduct.images[0] : '/images/placeholder.jpg')} 
                            alt={contentByLang(recommendedProduct.name, recommendedProduct.nameAr || recommendedProduct.name)} 
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        
                        <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors duration-200 text-sm sm:text-base">
                          {contentByLang(recommendedProduct.name, recommendedProduct.nameAr || recommendedProduct.name)}
                        </h3>
                        
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium text-black">{recommendedProduct.price.toFixed(2)}D</span>
                          
                          {recommendedProduct.rating && (
                            <div className="flex items-center">
                              <StarIconSolid className="h-3 w-3 text-yellow-400" />
                              <span className="ml-1 text-xs text-gray-600">{recommendedProduct.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Pagination Dots */}
            {recommendedProducts.length > (isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE) && (
              <div className="flex justify-center mt-6 gap-2">
                {Array.from(
                  { length: Math.ceil(recommendedProducts.length / (isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE)) }, 
                  (_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentCarouselPage(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentCarouselPage ? 'bg-black' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 