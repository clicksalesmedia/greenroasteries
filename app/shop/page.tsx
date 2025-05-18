'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingCartIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

interface ProductVariation {
  size?: string;
  beans?: string;
  additions?: string;
  weight?: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  category?: string | { name: string; nameAr?: string };
  variations?: ProductVariation[] | { 
    size?: string[]; 
    beans?: string[];
    additions?: string[];
    weight?: string[];
  };
  images?: string[];
  imageUrl?: string;
  gallery?: string[];
  slug: string;
}

interface Filters {
  category: string[];
  size: string[];
  beans: string[];
  additions: string[];
  weight: string[];
  price: {
    min: number;
    max: number;
  };
}

const extractValue = (value: any): string => {
  return typeof value === 'string' ? value : '';
};

// Helper function to normalize category names to English for filtering consistency
const getCategoryNameForFiltering = (categoryName: string): string => {
  // Map of Arabic category names to their English equivalents for filters
  const categoryMappings: Record<string, string> = {
    'المكسرات والفواكه المجففة': 'NUTS & DRIED FRUITS',
    'مكسرات وفواكه مجففة': 'NUTS & DRIED FRUITS',
    'قهوة عربية': 'ARABIC COFFEE',
    'القهوة العربية': 'ARABIC COFFEE',
    'قهوة مختصة': 'SPECIALTY COFFEE',
    'قهوة متخصصة': 'SPECIALTY COFFEE',
    'قهوة مطحونة': 'GROUND COFFEE',
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
    'قهوة تركية': 'TURKISH COFFEE'
  };
  
  // If the category name exists in our mapping, return the English version
  if (categoryMappings[categoryName]) {
    return categoryMappings[categoryName];
  }
  
  // Otherwise, return the original name
  return categoryName;
};

// Function to get display name for a category based on current language
const getCategoryDisplayName = (categoryName: string, currentLanguage: string): string => {
  // Map of English category names to their Arabic translations for display
  const categoryDisplayMappings: Record<string, string> = {
    'NUTS & DRIED FRUITS': 'المكسرات والفواكه المجففة',
    'ARABIC COFFEE': 'قهوة عربية',
    'SPECIALTY COFFEE': 'قهوة مختصة',
    'GROUND COFFEE': 'قهوة مطحونة',
    'ESPRESSO ROAST': 'قهوة اسبريسو',
    'MEDIUM ROAST': 'قهوة متوسطة التحميص',
    'DARK ROAST': 'قهوة داكنة التحميص',
    'LIGHT ROAST': 'قهوة فاتحة التحميص',
    'COFFEE ACCESSORIES': 'أكسسوارات القهوة',
    'TURKISH ROAST': 'تحميص تركي',
    'TURKISH COFFEE': 'قهوة تركية',
    'ARABICA': 'أرابيكا',
    'ROBUSTA': 'روبوستا',
    'BLEND': 'خلطات',
    'SPECIALTY': 'قهوة مختصة',
    'SINGLE ORIGIN': 'أصل واحد',
    'ESPRESSO': 'إسبريسو',
    'DECAF': 'خالية من الكافيين'
  };
  
  // If in Arabic mode and the category name exists in our mapping, return the Arabic version
  if (currentLanguage === 'ar' && categoryDisplayMappings[categoryName]) {
    return categoryDisplayMappings[categoryName];
  }
  
  // Otherwise, return the original name
  return categoryName;
};

export default function ShopPage() {
  const { t, language, contentByLang } = useLanguage();
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  
  // Get category from URL and normalize it to English immediately
  const categoryParamRaw = searchParams.get('category');
  const categoryParam = categoryParamRaw ? getCategoryNameForFiltering(categoryParamRaw) : null;
  
  console.log(`Raw category from URL: ${categoryParamRaw}`);
  console.log(`Normalized category: ${categoryParam}`);
  
  // Update URL if needed (when the category is in Arabic)
  useEffect(() => {
    if (categoryParamRaw && categoryParam && categoryParamRaw !== categoryParam) {
      console.log(`Normalizing URL from ${categoryParamRaw} to ${categoryParam}`);
      // We have an Arabic category name in URL that needs to be converted to English
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('category', categoryParam);
        window.history.pushState({}, '', newUrl.toString());
        console.log(`Updated URL to: ${window.location.href}`);
      }
    }
  }, [categoryParamRaw, categoryParam]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({
    category: categoryParam ? [categoryParam] : [],
    size: [],
    beans: [],
    additions: [],
    weight: [],
    price: { min: 0, max: 1000 }
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableBeans, setAvailableBeans] = useState<string[]>([]);
  const [availableAdditions, setAvailableAdditions] = useState<string[]>([]);
  const [availableWeights, setAvailableWeights] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [sortOption, setSortOption] = useState<string>('newest');
  const [visibleProducts, setVisibleProducts] = useState<number>(12);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverImageIndex, setHoverImageIndex] = useState<Record<string, number>>({});

  // Handle image hover
  const handleImageHover = (productId: string, index: number) => {
    setHoverImageIndex(prev => ({
      ...prev,
      [productId]: index
    }));
  };

  // Reset hover state
  const handleImageLeave = (productId: string) => {
    setHoverImageIndex(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Handle adding item to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: language === 'ar' && product.nameAr ? product.nameAr : product.name,
      price: product.price,
      quantity: 1,
      image: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : ''),
      variation: {}
    });
  };

  // Toggle filter menu on mobile
  const toggleFilterMenu = () => {
    setFilterMenuOpen(!filterMenuOpen);
  };

  // Update filter function to ensure consistent URL parameters regardless of language
  const updateFilter = (type: keyof Filters, value: string) => {
    // Get consistent English category name for URL when dealing with categories
    const normalizedValue = type === 'category' ? getCategoryNameForFiltering(value) : value;

    // Update filters state only, don't update URL here
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };
      if (type === 'price') return updatedFilters;
      
      // Toggle the value
      const index = updatedFilters[type].indexOf(normalizedValue);
      if (index === -1) {
        updatedFilters[type] = [...updatedFilters[type], normalizedValue];
      } else {
        updatedFilters[type] = updatedFilters[type].filter(v => v !== normalizedValue);
      }
      
      return updatedFilters;
    });
  };

  // Watch for category filter changes and update URL accordingly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (filters.category.length > 0) {
        const categoryParam = filters.category[0];
        url.searchParams.set('category', categoryParam);
        window.history.pushState({}, '', url.toString());
        console.log(`Updated URL with category: ${categoryParam}`);
      } else {
        url.searchParams.delete('category');
        window.history.pushState({}, '', url.toString());
        console.log('Removed category from URL');
      }
    }
  }, [filters.category]);

  // Update price range
  const handlePriceChange = (value: number, isMin: boolean) => {
    if (isMin) {
      setPriceRange(prev => ({ ...prev, min: value }));
    } else {
      setPriceRange(prev => ({ ...prev, max: value }));
    }
  };

  // Apply price filter when range changes
  useEffect(() => {
    // Debounce price changes
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        price: { min: priceRange.min, max: priceRange.max }
      }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: [],
      size: [],
      beans: [],
      additions: [],
      weight: [],
      price: {
        min: priceRange.min,
        max: priceRange.max
      }
    });
    
    // Reset price range sliders to default values
    setPriceRange({
      min: 0,
      max: 1000
    });
    
    // Clear category parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.pushState({}, '', url.toString());
  };

  // Helper function to get product image appropriate for the current language
  const getProductImage = (product: Product) => {
    // Special case for Arabic coffee - if category contains "ARABIC" or "ARABIC COFFEE"
    const isArabicCoffee = 
      (typeof product.category === 'string' && 
        (product.category.toUpperCase().includes('ARABIC') || 
         product.category.toUpperCase().includes('قهوة عربية'))) ||
      (typeof product.category === 'object' && product.category?.name && 
        (product.category.name.toUpperCase().includes('ARABIC') || 
         product.category.name.toUpperCase().includes('قهوة عربية')));

    // Check if product has a valid imageUrl
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }

    // Check for gallery images first
    const images = product.gallery || product.images || [];
    
    // Filter out any invalid image URLs
    const validImages = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
    
    // If we have valid images, return the first one
    if (validImages.length > 0) {
      // If in Arabic mode, try to find Arabic-specific images
      if (language === 'ar') {
        // Look for images that might contain 'ar', 'arabic', etc. in their URLs
        const arabicImages = validImages.filter(img => 
          img.toLowerCase().includes('ar') || 
          img.toLowerCase().includes('arab')
        );
        
        if (arabicImages.length > 0) {
          return arabicImages[0];
        }
      }
      
      // Fallback to first available valid image
      return validImages[0];
    }
    
    // If no valid images found and it's Arabic coffee, use a default image
    if (isArabicCoffee) {
      return '/images/nuts.webp';
    }
    
    // Fallback to a default image for the product category
    if (typeof product.category === 'object' && product.category?.name) {
      const categoryName = product.category.name.toUpperCase();
      if (categoryName.includes('ESPRESSO')) {
        return '/images/coffee-beans.jpg';
      } else if (categoryName.includes('MEDIUM')) {
        return '/images/coffee-medium.jpg';
      } else if (categoryName.includes('DARK')) {
        return '/images/coffee-dark.jpg';
      } else if (categoryName.includes('LIGHT')) {
        return '/images/coffee-light.jpg';
      }
    }
    
    // Final fallback
    return '/images/nuts.png';
  };

  // Fetch products on component mount or when category param changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Always fetch all products regardless of category initially
        let url = '/api/products';
        
        // If a category parameter exists, add it to the URL (using normalized English name)
        if (categoryParam) {
          url += `?category=${encodeURIComponent(categoryParam)}`;
          
          // Update the filters state to reflect the current category
          if (!filters.category.includes(categoryParam)) {
            setFilters(prev => ({
              ...prev,
              category: [categoryParam]
            }));
          }
        }
        
        console.log(`Fetching products with URL: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Fetched ${data.length} products`);
          
          setProducts(data);
          
          // Extract available filters from products
          const sizes = new Set<string>();
          const beans = new Set<string>();
          const additions = new Set<string>();
          const weights = new Set<string>();
          const categories = new Set<string>();
          let minPrice = Infinity;
          let maxPrice = 0;
          
          data.forEach((product: Product) => {
            // Update price range
            if (product.price < minPrice) minPrice = product.price;
            if (product.price > maxPrice) maxPrice = product.price;
            
            // Extract category and normalize to English
            if (product.category) {
              if (typeof product.category === 'string') {
                categories.add(getCategoryNameForFiltering(product.category));
              } else if (product.category && 'name' in product.category) {
                categories.add(getCategoryNameForFiltering(product.category.name));
              }
            }
            
            // Extract variation options from variations
            if (product.variations) {
              if (Array.isArray(product.variations)) {
                product.variations.forEach(variation => {
                  if (variation.size) sizes.add(variation.size);
                  if (variation.beans) beans.add(variation.beans);
                  if (variation.additions) additions.add(variation.additions);
                  if (variation.weight) weights.add(variation.weight);
                });
              } else {
                if (product.variations.size) {
                  product.variations.size.forEach((size: string) => sizes.add(size));
                }
                if (product.variations.beans) {
                  product.variations.beans.forEach((bean: string) => beans.add(bean));
                }
                if (product.variations.additions) {
                  product.variations.additions.forEach((addition: string) => additions.add(addition));
                }
                if (product.variations.weight) {
                  product.variations.weight.forEach((weight: string) => weights.add(weight));
                }
              }
            }
          });
          
          // Update state with extracted filters
          setAvailableSizes(Array.from(sizes));
          setAvailableBeans(Array.from(beans));
          setAvailableAdditions(Array.from(additions));
          setAvailableWeights(Array.from(weights));
          setAvailableCategories(Array.from(categories));
          
          // Set price range with some padding
          const min = Math.max(0, Math.floor(minPrice) - 10);
          const max = Math.ceil(maxPrice) + 10;
          setPriceRange({ min, max });
          setFilters(prev => ({
            ...prev,
            price: { min, max }
          }));
          
          // Initialize displayed products
          setDisplayedProducts(data.slice(0, visibleProducts));
        } else {
          console.error('Failed to fetch products:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryParam, visibleProducts]);

  // Apply filters and sorting
  useEffect(() => {
    // Create a debounced version of the filtering logic
    const timeoutId = setTimeout(() => {
      console.log(`Filtering products with categories: ${filters.category.join(', ')}`);
      let filteredProducts = [...products];
      
      // Apply category filter
      if (filters.category.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          try {
            // Handle different category formats
            let categoryName: string;
            
            if (product.category === undefined || product.category === null) {
              return false;
            } else if (typeof product.category === 'string') {
              categoryName = product.category;
            } else if (typeof product.category === 'object' && product.category !== null && 'name' in product.category) {
              categoryName = product.category.name;
            } else {
              return false;
            }
            
            // Case-insensitive match, using normalized category names
            return filters.category.some((cat: string) => {
              const normalizedCat = getCategoryNameForFiltering(cat);
              const match = categoryName.toLowerCase() === normalizedCat.toLowerCase();
              return match;
            });
          } catch (error) {
            console.error("Error filtering product by category:", error);
            return false;
          }
        });
        console.log(`After category filtering: ${filteredProducts.length} products remaining`);
      }
      
      // Apply size filter
      if (filters.size.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.variations) return false;
          
          if (Array.isArray(product.variations)) {
            const variationsArray = product.variations as ProductVariation[];
            const sizes = [...new Set(variationsArray.map(v => extractValue(v.size)).filter(Boolean))];
            return sizes.some((size: string) => filters.size.includes(size));
          } else {
            return product.variations.size?.some((size: string) => filters.size.includes(size)) || false;
          }
        });
      }
      
      // Apply beans filter
      if (filters.beans.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.variations) return false;
          
          if (Array.isArray(product.variations)) {
            const variationsArray = product.variations as ProductVariation[];
            const beans = [...new Set(variationsArray.map(v => extractValue(v.beans)).filter(Boolean))];
            return beans.some(bean => filters.beans.includes(bean));
          } else {
            return product.variations.beans?.some(bean => filters.beans.includes(bean)) || false;
          }
        });
      }
      
      // Apply additions filter
      if (filters.additions.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.variations) return false;
          
          if (Array.isArray(product.variations)) {
            const variationsArray = product.variations as ProductVariation[];
            const additions = [...new Set(variationsArray.map(v => extractValue(v.additions)).filter(Boolean))];
            return additions.some(addition => filters.additions.includes(addition));
          } else {
            return product.variations.additions?.some(addition => filters.additions.includes(addition)) || false;
          }
        });
      }
      
      // Apply weight filter
      if (filters.weight.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.variations) return false;
          
          if (Array.isArray(product.variations)) {
            const variationsArray = product.variations as ProductVariation[];
            const weights = [...new Set(variationsArray.map(v => extractValue(v.weight)).filter(Boolean))];
            return weights.some(weight => filters.weight.includes(weight));
          } else {
            return product.variations.weight?.some(weight => filters.weight.includes(weight)) || false;
          }
        });
      }
      
      // Apply price filter
      filteredProducts = filteredProducts.filter(
        product => product.price >= filters.price.min && product.price <= filters.price.max
      );
      
      // Apply sorting
      switch (sortOption) {
        case 'price-low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
        default:
          filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
          break;
      }
      
      // Update displayed products
      setDisplayedProducts(filteredProducts.slice(0, visibleProducts));
      
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [products, filters, sortOption, visibleProducts]);

  // Load more products
  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 8);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('shop', 'Shop')}
      </h1>
      
      {/* Filter button (mobile) */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <button 
          onClick={toggleFilterMenu}
          className="flex items-center space-x-2 text-black border border-gray-300 rounded-md px-3 py-2"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>{t('filters', 'Filters')}</span>
        </button>
        
        <select 
          className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="newest">{t('newest', 'Newest')}</option>
          <option value="price-low">{t('price_low_high', 'Price: Low to High')}</option>
          <option value="price-high">{t('price_high_low', 'Price: High to Low')}</option>
          <option value="name-asc">{t('name_a_z', 'Name: A to Z')}</option>
          <option value="name-desc">{t('name_z_a', 'Name: Z to A')}</option>
        </select>
      </div>
      
      <div className={`flex flex-col md:flex-row ${language === 'ar' ? 'md:flex-row-reverse md:space-x-reverse md:space-x-5' : 'md:space-x-5'}`}>
        {/* Filters - Mobile Overlay */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
          filterMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full w-80 max-w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            filterMenuOpen 
              ? 'translate-x-0' 
              : language === 'ar' 
                ? 'translate-x-full' 
                : '-translate-x-full'
          }`}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{t('filters', 'Filters')}</h2>
              <button 
                onClick={toggleFilterMenu}
                className="text-gray-500 hover:text-black"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('category', 'Category')}</h3>
                <div className="space-y-2">
                  {availableCategories.map(category => (
                    <label key={category} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={filters.category.includes(category)}
                        onChange={() => updateFilter('category', category)}
                        className={`rounded border-gray-300 text-black focus:ring-black ${language === 'ar' ? 'ml-0 mr-0' : ''}`}
                      />
                      <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{getCategoryDisplayName(category, language)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Weight Filter */}
              {availableWeights.length > 0 && (
                <div className="mb-6">
                  <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('weight', 'Weight')}</h3>
                  <div className="space-y-2">
                    {availableWeights.map(weight => (
                      <label key={weight} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={filters.weight.includes(weight)}
                          onChange={() => updateFilter('weight', weight)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{weight}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('size', 'Size')}</h3>
                  <div className="space-y-2">
                    {availableSizes.map(size => (
                      <label key={size} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={filters.size.includes(size)}
                          onChange={() => updateFilter('size', size)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Beans Filter */}
              {availableBeans.length > 0 && (
                <div className="mb-6">
                  <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('beans', 'Beans')}</h3>
                  <div className="space-y-2">
                    {availableBeans.map(bean => (
                      <label key={bean} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={filters.beans.includes(bean)}
                          onChange={() => updateFilter('beans', bean)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{bean}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additions Filter */}
              {availableAdditions.length > 0 && (
                <div className="mb-6">
                  <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('additions', 'Additions')}</h3>
                  <div className="space-y-2">
                    {availableAdditions.map(addition => (
                      <label key={addition} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={filters.additions.includes(addition)}
                          onChange={() => updateFilter('additions', addition)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{addition}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Price Range Slider */}
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('price', 'Price')}</h3>
                <div className="px-2">
                  <div className={`flex justify-between text-xs text-gray-500 mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span>{priceRange.min}</span>
                    <span>{priceRange.max}</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value), true)}
                    className="w-full mb-2 accent-black"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <input 
                    type="range"
                    min={priceRange.min}
                    max={1000}
                    step={10}
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value), false)}
                    className="w-full accent-black"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <div className={`flex items-center justify-between mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="text-sm">
                      {language === 'ar' 
                        ? `${contentByLang('AED', 'د.إ')} ${priceRange.max} - ${priceRange.min}`
                        : `${priceRange.min} - ${priceRange.max} ${contentByLang('AED', 'د.إ')}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters - Desktop Sidebar */}
        <aside className={`hidden md:block w-64 flex-shrink-0 ${language === 'ar' ? 'ml-16' : 'mr-16'}`}>
          <div className="bg-white rounded-lg shadow p-5">
            <div className={`flex justify-between items-center mb-5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <h2 className="text-lg font-semibold">{t('filters', 'Filters')}</h2>
              {(filters.category.length > 0 || filters.size.length > 0 || filters.beans.length > 0 || 
                filters.additions.length > 0 || filters.weight.length > 0 ||
                filters.price.min > priceRange.min || filters.price.max < priceRange.max) && (
                <button 
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-black"
                >
                  {t('clear_all', 'Clear all')}
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('category', 'Category')}</h3>
              <div className="space-y-2">
                {availableCategories.map(category => (
                  <label key={category} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                    <input 
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => updateFilter('category', category)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{getCategoryDisplayName(category, language)}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Weight Filter */}
            {availableWeights.length > 0 && (
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('weight', 'Weight')}</h3>
                <div className="space-y-2">
                  {availableWeights.map(weight => (
                    <label key={weight} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={filters.weight.includes(weight)}
                        onChange={() => updateFilter('weight', weight)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{weight}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Filter */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('size', 'Size')}</h3>
                <div className="space-y-2">
                  {availableSizes.map(size => (
                    <label key={size} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={filters.size.includes(size)}
                        onChange={() => updateFilter('size', size)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Beans Filter */}
            {availableBeans.length > 0 && (
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('beans', 'Beans')}</h3>
                <div className="space-y-2">
                  {availableBeans.map(bean => (
                    <label key={bean} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={filters.beans.includes(bean)}
                        onChange={() => updateFilter('beans', bean)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{bean}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additions Filter */}
            {availableAdditions.length > 0 && (
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('additions', 'Additions')}</h3>
                <div className="space-y-2">
                  {availableAdditions.map(addition => (
                    <label key={addition} className={`flex items-center cursor-pointer ${language === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={filters.additions.includes(addition)}
                        onChange={() => updateFilter('additions', addition)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className={`text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{addition}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Price Range Slider */}
            <div className="mb-6">
              <h3 className={`font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('price', 'Price')}</h3>
              <div className="px-2">
                <div className={`flex justify-between text-xs text-gray-500 mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span>{priceRange.min}</span>
                  <span>{priceRange.max}</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={1000}
                  step={10}
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange(parseInt(e.target.value), true)}
                  className="w-full mb-2 accent-black"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <input 
                  type="range"
                  min={priceRange.min}
                  max={1000}
                  step={10}
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange(parseInt(e.target.value), false)}
                  className="w-full accent-black"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <div className={`flex items-center justify-between mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="text-sm">
                    {language === 'ar' 
                      ? `${contentByLang('AED', 'د.إ')} ${priceRange.max} - ${priceRange.min}`
                      : `${priceRange.min} - ${priceRange.max} ${contentByLang('AED', 'د.إ')}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Products Section */}
        <div className={`flex-1 ${language === 'ar' ? 'pr-4' : 'pl-4'}`}>
          {/* Sort dropdown - Desktop */}
          <div className={`hidden md:flex justify-between items-center mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <p className={`text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' 
                ? `${contentByLang('products', 'منتج')} ${displayedProducts.length}`
                : `${displayedProducts.length} ${contentByLang('products', 'منتج')}`
              }
            </p>
            <select 
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="newest">{t('newest', 'Newest')}</option>
              <option value="price-low">{t('price_low_high', 'Price: Low to High')}</option>
              <option value="price-high">{t('price_high_low', 'Price: High to Low')}</option>
              <option value="name-asc">{t('name_a_z', 'Name: A to Z')}</option>
              <option value="name-desc">{t('name_z_a', 'Name: Z to A')}</option>
            </select>
          </div>
          
          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <>
              {displayedProducts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">{t('no_products', 'No products found')}</h3>
                  <p className="text-gray-500 mb-4">{t('try_different_filters', 'Try different filters or clear current filters')}</p>
                  <button
                    onClick={clearFilters}
                    className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    {t('clear_filters', 'Clear Filters')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {displayedProducts.map(product => {
                      const productSlug = product.slug || product.id;
                      const productImages = (product.gallery || product.images || []).filter(img => img && typeof img === 'string' && img.trim() !== '');
                      
                      // Check if it's an Arabic coffee product
                      const isArabicCoffee = 
                        (typeof product.category === 'string' && 
                          (product.category.toUpperCase().includes('ARABIC') || 
                           product.category.toUpperCase().includes('قهوة عربية'))) ||
                        (typeof product.category === 'object' && product.category?.name && 
                          (product.category.name.toUpperCase().includes('ARABIC') || 
                           product.category.name.toUpperCase().includes('قهوة عربية')));
                      
                      const defaultImage = getProductImage(product);
                      const displayImage = productImages.length > 0 ? 
                        (hoverImageIndex[product.id] !== undefined && productImages[hoverImageIndex[product.id]] 
                          ? productImages[hoverImageIndex[product.id]] 
                          : defaultImage) 
                        : defaultImage;
                      
                      return (
                        <div 
                          key={product.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden group transition-transform hover:shadow-md hover:-translate-y-1"
                        >
                          {/* Product Image with Hover Effect */}
                          <Link href={`/product/${productSlug}`} prefetch={false}>
                            <div 
                              className="aspect-square bg-gray-100 relative overflow-hidden"
                              onMouseLeave={() => handleImageLeave(product.id)}
                            >
                              {displayImage ? (
                                <img 
                                  src={displayImage}
                                  alt={language === 'ar' && product.nameAr ? product.nameAr : product.name}
                                  className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
                                  style={{ objectPosition: 'center', width: '100%', height: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    
                                    // Determine fallback based on product category
                                    let fallbackImg = '/images/nuts.png';
                                    
                                    if (isArabicCoffee) {
                                      fallbackImg = '/images/nuts.webp';
                                    } else if (typeof product.category === 'object' && product.category?.name) {
                                      const categoryName = product.category.name.toUpperCase();
                                      if (categoryName.includes('ESPRESSO')) {
                                        fallbackImg = '/images/coffee-beans.jpg';
                                      } else if (categoryName.includes('MEDIUM')) {
                                        fallbackImg = '/images/coffee-medium.jpg';
                                      } else if (categoryName.includes('DARK')) {
                                        fallbackImg = '/images/coffee-dark.jpg';
                                      } else if (categoryName.includes('LIGHT')) {
                                        fallbackImg = '/images/coffee-light.jpg';
                                      }
                                    }
                                    
                                    target.src = fallbackImg;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                  {isArabicCoffee ? (
                                    <img 
                                      src="/images/nuts.webp" 
                                      alt="Arabic Coffee"
                                      className="object-cover w-full h-full"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = '/images/nuts.png';
                                      }}
                                    />
                                  ) : (
                                    t('no_image', 'No Image')
                                  )}
                                </div>
                              )}
                              
                              {/* Image Thumbnails on Hover */}
                              {productImages.length > 1 && (
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex space-x-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                                    {productImages.slice(0, 4).map((img, index) => (
                                      <button 
                                        key={index}
                                        className={`w-3 h-3 rounded-full ${hoverImageIndex[product.id] === index ? 'bg-black' : 'bg-gray-300'}`}
                                        onMouseEnter={() => handleImageHover(product.id, index)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Quick Shop Button */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/70 text-white p-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                  <ShoppingCartIcon 
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleAddToCart(product);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Product Details */}
                          <div className="p-4">
                            <Link href={`/product/${productSlug}`} prefetch={false} className="block">
                              <h3 className="font-medium text-sm sm:text-base mb-1 hover:text-gray-700 transition-colors">
                                {language === 'ar' && product.nameAr ? product.nameAr : product.name}
                              </h3>
                            </Link>
                            
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-semibold">
                                {product.price.toFixed(2)} {contentByLang('AED', 'د.إ')}
                              </p>
                              
                              <button 
                                onClick={() => handleAddToCart(product)}
                                className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                                aria-label={t('add_to_cart', 'Add to Cart')}
                              >
                                <ShoppingCartIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Load More Button */}
                  {products.length > visibleProducts && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMoreProducts}
                        className="bg-white border border-black text-black px-6 py-2 rounded-md hover:bg-black hover:text-white transition duration-300"
                      >
                        {t('load_more', 'Load More')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 