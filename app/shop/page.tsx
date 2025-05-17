'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ChevronDownIcon, 
  AdjustmentsHorizontalIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import VariationModal from '../components/VariationModal';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

// Add helper function to extract values from variation objects
const extractValue = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    // If it's an object with a name property, use that
    if ('name' in value) return value.name;
    // If it's an object with a displayName property, use that (for sizes)
    if ('displayName' in value) return value.displayName;
    // Otherwise, try to convert it to a string
    return String(value);
  }
  return String(value);
};

// Interfaces for type safety
interface ProductVariation {
  id: string;
  productId?: string;
  sizeId?: string;
  size?: string | { id: string; name: string; value: number; displayName: string; [key: string]: any };
  beansId?: string;
  beans?: string | { id: string; name: string; [key: string]: any };
  typeId?: string;
  type?: string | { id: string; name: string; [key: string]: any };
  price: number;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  type: string;
  price: number;
  images: string[];
  imageUrl?: string;
  category: string | { id: string; name: string; nameAr?: string; slug?: string };
  slug?: string;
  variations?: ProductVariation[] | {
    size?: string[];
    beans?: string[];
    type?: string[];
  };
}

// Filter state interface
interface FilterState {
  size: string[];
  beans: string[];
  category: string[];
  price: {
    min: number;
    max: number;
  };
}

// Component that uses search params wrapped in Suspense
function SearchParamsHandler({ onCategoryChange }: { onCategoryChange: (category: string | null) => void }) {
  const searchParams = useSearchParams();
  const processedCategory = useRef<string | null>(null);
  
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    
    // Only call onCategoryChange if the category is different from what we've already processed
    if (categoryParam !== processedCategory.current) {
      processedCategory.current = categoryParam;
      onCategoryChange(categoryParam);
    }
  }, [searchParams, onCategoryChange]);
  
  return null; // This component doesn't render anything
}

// Add this before the ShopPage component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Shop page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry, but there was an error loading the shop page.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the export with the ErrorBoundary
export default function ShopPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ShopPage />
    </ErrorBoundary>
  );
}

function ShopPage() {
  const { language, contentByLang, t } = useLanguage();
  
  // State for products and loading
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleProducts, setVisibleProducts] = useState(12);
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    size: [],
    beans: [],
    category: [],
    price: { min: 0, max: 1000 }
  });
  
  // Size and bean options from backend
  const [sizeOptions, setSizeOptions] = useState<{id: string, name: string, displayName: string}[]>([]);
  const [beanOptions, setBeanOptions] = useState<{id: string, name: string}[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{id: string, name: string}[]>([]);
  
  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Sort options
  const [sortOption, setSortOption] = useState('newest');
  
  // Add states for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { showToast } = useToast();
  
  // Handle category from URL
  const handleCategoryFromParams = (category: string | null) => {
    if (category) {
      // Only update if the category is not already in filters
      setFilters(prev => {
        // Check if category is already in the filters
        if (prev.category.includes(category)) {
          return prev; // Return the same object to avoid re-render
        }
        
        // Return a new object with the updated category
        return {
          ...prev,
          category: [category] // Replace categories instead of adding
        };
      });
    }
  };
  
  // Get the page title based on selected category
  const getPageTitle = () => {
    if (filters.category.length === 1) {
      // Transform to title case and add Coffee suffix
      const categoryName = filters.category[0];
      return `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Coffee`;
    } else if (filters.category.length > 1) {
      return `Filtered Coffee Selection`;
    }
    return "Our Coffee Collection";
  };
  
  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        
        // Process the data to ensure all products have the expected structure
        const processedData = data.map((product: Product) => {
          // Ensure product has images array
          if (!product.images) {
            product.images = [];
          }
          
          // If product has images from ProductImage relation, format them
          if (product.images && Array.isArray(product.images) && product.images.length > 0 && 
              typeof product.images[0] === 'object' && 'url' in product.images[0]) {
            // Convert images from object format to URL strings
            const formattedImages = product.images.map((img: any) => img.url);
            
            // Set the main image as imageUrl if not already set
            if (!product.imageUrl && formattedImages.length > 0) {
              product.imageUrl = formattedImages[0];
            }
            
            product.images = formattedImages;
          }
          
          // If product has imageUrl but no images, add imageUrl to images array
          if (product.imageUrl && (!product.images || product.images.length === 0)) {
            product.images = [product.imageUrl];
          }
          
          // Process variations
          if (Array.isArray(product.variations)) {
            const variationsArray = product.variations as ProductVariation[];
            // Extract unique values for each variation type
            const sizes = [...new Set(variationsArray.map(v => extractValue(v.size)).filter(Boolean))];
            const beans = [...new Set(variationsArray.map(v => extractValue(v.beans)).filter(Boolean))];
            const types = [...new Set(variationsArray.map(v => extractValue(v.type)).filter(Boolean))];

            // Create a new object with both the original array and the formatted objects
            return {
              ...product,
              variations: {
                size: sizes,
                beans: beans,
                type: types,
                _original: variationsArray // Keep the original data for reference
              }
            };
          }
          
          return product;
        });
        
        setProducts(processedData);
        setDisplayedProducts(processedData.slice(0, visibleProducts));
      } catch (error) {
        console.error('Error fetching products:', error);
        // Show dummy products for development
        
        // Preset categories to ensure they match the filter options
        const categories = ['Arabica', 'Robusta', 'Blend', 'Specialty', 'Single Origin', 'Espresso', 'Decaf'];
        
        const dummyProducts = Array.from({ length: 20 }, (_, i) => {
          // Get a consistent category based on index
          const categoryIndex = i % categories.length;
          const category = String(categories[categoryIndex]); // Ensure it's a string
          
          return {
            id: `prod-${i}`,
            name: `${category} Coffee Blend ${i + 1}`,
            type: i % 3 === 0 ? 'Ground' : 'Whole Beans',
            price: 12.99 + (i % 5) * 2,
            images: [
              `/images/coffee-${(i % 5) + 1}.jpg`, 
              `/images/coffee-${((i + 2) % 5) + 1}.jpg`
            ],
            category: category,
            slug: `${category.toLowerCase().replace(/\s+/g, '-')}-coffee-blend-${i + 1}`,
            variations: {
              size: ['250g', '500g', '1kg'],
              beans: ['Arabica', 'Robusta', 'Blend'],
              type: ['Whole Beans', 'Ground', 'Capsules']
            }
          };
        });
        
        setProducts(dummyProducts);
        setDisplayedProducts(dummyProducts.slice(0, visibleProducts));
        
        // Set the filter options to match the categories used in products
        setCategoryOptions(
          categories.map((name, index) => ({ id: `cat-${index+1}`, name }))
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchFilters = async () => {
      try {
        // Fetch sizes
        const sizesResponse = await fetch('/api/variations/sizes');
        if (sizesResponse.ok) {
          const sizesData = await sizesResponse.json();
          setSizeOptions(sizesData);
        }
        
        // Fetch beans
        const beansResponse = await fetch('/api/variations/beans');
        if (beansResponse.ok) {
          const beansData = await beansResponse.json();
          setBeanOptions(beansData);
        }
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log("Fetched categories:", categoriesData);
          
          // Make sure we're using the correct category format from the API
          if (Array.isArray(categoriesData)) {
            // If the data is an array, map to ensure each category has id and name
            const processedCategories = categoriesData.map(cat => {
              if (typeof cat === 'object' && cat !== null) {
                // If it's already an object, make sure it has id and name
                return {
                  id: cat.id || `cat-${Math.random().toString(36).substr(2, 9)}`,
                  name: cat.name || 'Unnamed Category'
                };
              } else if (typeof cat === 'string') {
                // If it's a string, create an object with id and name
                return {
                  id: `cat-${Math.random().toString(36).substr(2, 9)}`,
                  name: cat
                };
              } else {
                // Default case
                return {
                  id: `cat-${Math.random().toString(36).substr(2, 9)}`,
                  name: 'Unnamed Category'
                };
              }
            });
            setCategoryOptions(processedCategories);
          } else {
            // If the data is not an array, use our default categories
            setCategoryOptions([
              { id: 'cat-1', name: 'Single Origin' },
              { id: 'cat-2', name: 'Espresso' },
              { id: 'cat-3', name: 'Specialty' },
              { id: 'cat-4', name: 'Decaf' },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Set dummy filter options
        setSizeOptions([
          { id: 'size-1', name: '250g', displayName: '250g' },
          { id: 'size-2', name: '500g', displayName: '500g' },
          { id: 'size-3', name: '1kg', displayName: '1kg' },
        ]);
        
        setBeanOptions([
          { id: 'bean-1', name: 'Arabica' },
          { id: 'bean-2', name: 'Robusta' },
          { id: 'bean-3', name: 'Blend' },
        ]);
        
        setCategoryOptions([
          { id: 'cat-1', name: 'Single Origin' },
          { id: 'cat-2', name: 'Espresso' },
          { id: 'cat-3', name: 'Specialty' },
          { id: 'cat-4', name: 'Decaf' },
        ]);
      }
    };

    fetchProducts();
    fetchFilters();
  }, []);

  // Add this at the top level of the component, before useEffect hooks
  const memoizedFilterProducts = useCallback((
    products: Product[],
    filters: FilterState,
    sortOption: string,
    visibleProducts: number
  ) => {
    let filteredProducts = [...products];
    
    // Apply category filter first since it's the most selective
    if (filters.category.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        try {
          // Handle different category formats
          let categoryName: string;
          
          if (!product.category) return false;
          
          if (typeof product.category === 'string') {
            categoryName = product.category;
          } else if (typeof product.category === 'object' && 'name' in product.category) {
            categoryName = product.category.name;
          } else {
            return false;
          }
          
          // Case-insensitive exact match
          return filters.category.some(cat => 
            categoryName.toLowerCase() === String(cat).toLowerCase()
          );
        } catch (error) {
          console.error("Error filtering product by category:", error);
          return false;
        }
      });
    }
    
    // Apply other filters
    if (filters.size.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product.variations) return false;
        
        const sizes = Array.isArray(product.variations)
          ? [...new Set(product.variations.map(v => extractValue(v.size)).filter(Boolean))]
          : product.variations.size || [];
          
        return sizes.some(size => filters.size.includes(size));
      });
    }
    
    if (filters.beans.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product.variations) return false;
        
        const beans = Array.isArray(product.variations)
          ? [...new Set(product.variations.map(v => extractValue(v.beans)).filter(Boolean))]
          : product.variations.beans || [];
          
        return beans.some(bean => filters.beans.includes(bean));
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
    
    return filteredProducts.slice(0, visibleProducts);
  }, []);

  // Replace the existing filtering useEffect with this optimized version
  useEffect(() => {
    const newDisplayedProducts = memoizedFilterProducts(products, filters, sortOption, visibleProducts);
    
    // Only update if the products have actually changed
    const hasProductsChanged = newDisplayedProducts.length !== displayedProducts.length ||
      newDisplayedProducts.some((product, index) => product.id !== displayedProducts[index]?.id);
    
    if (hasProductsChanged) {
      setDisplayedProducts(newDisplayedProducts);
    }
  }, [products, filters, sortOption, visibleProducts, memoizedFilterProducts]);

  // Load more products
  const handleLoadMore = () => {
    setVisibleProducts(prev => prev + 12);
  };
  
  // Toggle filter option
  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      if (type === 'price') return prev; // Handle price separately
      
      const currentFilters = [...prev[type]];
      const index = currentFilters.indexOf(value);
      
      if (index >= 0) {
        currentFilters.splice(index, 1);
      } else {
        currentFilters.push(value);
      }
      
      return {
        ...prev,
        [type]: currentFilters
      };
    });
  };
  
  // Update price range
  const handlePriceChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      price: { min, max }
    }));
  };
  
  // Handle click on Add to Cart button
  const handleAddToCartClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };
  
  // Handle adding to cart after modal selection
  const handleAddToCart = (product: Product, quantity: number, variations: any) => {
    console.log('Adding to cart:', {
      product: product.name,
      quantity,
      variations
    });
    showToast(`${quantity} × ${product.name} added to cart`, 'success');
  };
  
  // Get product name based on current language
  const getProductName = (product: Product) => {
    return contentByLang(product.name, product.nameAr || product.name);
  };

  // Get category name based on current language
  const getCategoryName = (category: string | { name: string; nameAr?: string } | undefined) => {
    if (!category) return '';
    
    if (typeof category === 'string') {
      return category;
    }
    
    return contentByLang(category.name, category.nameAr || category.name);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Search params handler with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler onCategoryChange={handleCategoryFromParams} />
      </Suspense>
      
      <h1 className="text-3xl font-bold mb-8 text-center">{getPageTitle()}</h1>
      
      {/* Filters button for mobile */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-md"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          Filters & Sorting
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Filters */}
        <div className={`w-full md:w-1/4 pr-0 md:pr-8 ${mobileFiltersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="bg-gray-50 p-6 rounded-md sticky top-24">
            <h2 className="text-xl font-semibold mb-6 text-black">Filters</h2>
            
            {/* Size Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-black">Size</h3>
              <div className="space-y-2">
                {sizeOptions.map(size => (
                  <div key={size.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`size-${size.id}`}
                      checked={filters.size.includes(size.name)}
                      onChange={() => toggleFilter('size', size.name)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label htmlFor={`size-${size.id}`} className="ml-2 text-gray-700">
                      {size.displayName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bean Type Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-black">Bean Type</h3>
              <div className="space-y-2">
                {beanOptions.map(bean => (
                  <div key={bean.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`bean-${bean.id}`}
                      checked={filters.beans.includes(bean.name)}
                      onChange={() => toggleFilter('beans', bean.name)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label htmlFor={`bean-${bean.id}`} className="ml-2 text-gray-700">
                      {bean.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-black">Category</h3>
              <div className="space-y-2">
                {categoryOptions.map(category => {
                  // Get the category name regardless of whether it's an object or string
                  const categoryName = typeof category === 'object' ? category.name : category;
                  
                  return (
                    <div key={category.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`category-${category.id}`}
                        checked={filters.category.includes(categoryName)}
                        onChange={() => toggleFilter('category', categoryName)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-2 text-gray-700">
                        {categoryName}
                      </label>
                    </div>
                  );
                })}
              </div>
              {filters.category.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="text-green-700">Selected: {filters.category.join(', ')}</p>
                </div>
              )}
            </div>
            
            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-black">Price Range</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">{filters.price.min}D</span>
                <span className="text-gray-700">{filters.price.max}D</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min-price" className="sr-only">Minimum Price</label>
                  <input 
                    type="number" 
                    id="min-price" 
                    value={filters.price.min}
                    onChange={(e) => handlePriceChange(Number(e.target.value), filters.price.max)}
                    min="0"
                    max={filters.price.max}
                    step="5"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="sr-only">Maximum Price</label>
                  <input 
                    type="number" 
                    id="max-price" 
                    value={filters.price.max}
                    onChange={(e) => handlePriceChange(filters.price.min, Number(e.target.value))}
                    min={filters.price.min}
                    step="5"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setFilters({
                size: [],
                beans: [],
                category: [],
                price: { min: 0, max: 1000 }
              })}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="w-full md:w-3/4">
          {/* Sorting */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <p className="text-gray-700 mb-4 md:mb-0">
              Showing <span className="font-semibold">{displayedProducts.length}</span> of <span className="font-semibold">{products.length}</span> products
            </p>
            
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md shadow-sm focus:outline-none focus:border-black focus:ring-black"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          {/* Products Grid */}
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="h-96 flex items-center justify-center flex-col">
              <div className="text-2xl font-medium text-gray-500 mb-4">No products found</div>
              <p className="text-gray-500 mb-6 text-center">
                We couldn't find any products that match your selected filters.
              </p>
              <button 
                onClick={() => setFilters({
                  size: [],
                  beans: [],
                  category: [],
                  price: { min: 0, max: 1000 }
                })}
                className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-102 flex flex-col h-full">
                    <Link href={`/product/${product.slug || product.id}`}>
                      <div className="relative h-64 bg-gray-100">
                        {product.imageUrl ? (
                          <Image 
                            src={product.imageUrl} 
                            alt={getProductName(product)} 
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-contain"
                          />
                        ) : product.images && product.images.length > 0 ? (
                          <Image 
                            src={product.images[0]} 
                            alt={getProductName(product)} 
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-contain" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-4 flex flex-col flex-grow">
                      <span className="text-gray-500 text-sm">{getCategoryName(product.category)}</span>
                      <h3 className="font-semibold text-lg mt-1 h-14 line-clamp-2">
                        <Link href={`/product/${product.slug || product.id}`} className="hover:text-green-700">
                          {getProductName(product)}
                        </Link>
                      </h3>
                      <div className="flex justify-between items-center mt-auto pt-3">
                        <span className="text-black font-bold">{product.price.toFixed(2)}D</span>
                        <button 
                          onClick={() => handleAddToCartClick(product)}
                          className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition"
                          aria-label={t('add_to_cart', 'Add to Cart')}
                        >
                          <ShoppingCartIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {visibleProducts < products.length && (
                <div className="text-center mt-12">
                  <button 
                    onClick={handleLoadMore}
                    className="bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Variation Modal */}
      {selectedProduct && (
        <VariationModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          product={{
            ...selectedProduct,
            // If variations are already present, don't override them
            variations: selectedProduct.variations || {
              size: ['250g', '500g', '1kg'],
              beans: ['Arabica', 'Robusta', 'Blend'],
              type: ['Whole Beans', 'Ground', 'Capsules']
            }
          }}
          onAddToCart={(product, quantity, variations) => {
            // Type assertions to handle compatibility between different Product types
            handleAddToCart(product as any, quantity, variations);
          }}
        />
      )}
    </div>
  );
} 