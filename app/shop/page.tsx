import React, { useEffect, useState } from 'react';

interface ProductVariation {
  size?: string;
  beans?: string;
  [key: string]: any;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | { name: string };
  variations?: ProductVariation[] | { size?: string[]; beans?: string[] };
}

interface Filters {
  category: string[];
  size: string[];
  beans: string[];
  price: {
    min: number;
    max: number;
  };
}

interface ShopPageProps {
  initialProducts: Product[];
  initialFilters: Filters;
}

const extractValue = (value: any): string => {
  return typeof value === 'string' ? value : '';
};

const ShopPage: React.FC<ShopPageProps> = ({ initialProducts, initialFilters }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [visibleProducts, setVisibleProducts] = useState<number>(12);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

  // Apply filters and sorting
  useEffect(() => {
    // Create a debounced version of the filtering logic with a longer delay
    const timeoutId = setTimeout(() => {
      let filteredProducts = [...products];
      
      // Apply category filter first since it's causing the issue
      if (filters.category.length > 0) {
        console.log('Filtering by categories:', filters.category);
        console.log('Before filtering:', filteredProducts.length);
        
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
            
            // Exact match only, case-insensitive
            return filters.category.some((cat: string) => 
              categoryName.toLowerCase() === cat.toLowerCase()
            );
          } catch (error) {
            console.error("Error filtering product by category:", error);
            return false;
          }
        });
        
        console.log('After filtering:', filteredProducts.length);
      }
      
      // Apply other filters only if there are products left
      if (filteredProducts.length > 0) {
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
        
        // Apply price filter
        filteredProducts = filteredProducts.filter(
          product => product.price >= filters.price.min && product.price <= filters.price.max
        );
      }
      
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
      
      // Compare current and new results before updating state
      const currentIds = new Set(displayedProducts.map(p => p.id));
      const newProducts = filteredProducts.slice(0, visibleProducts);
      const newIds = new Set(newProducts.map(p => p.id));
      
      // Only update if the results are different
      if (currentIds.size !== newIds.size || 
          ![...currentIds].every(id => newIds.has(id))) {
        setDisplayedProducts(newProducts);
      }
    }, 500); // Increased debounce delay to 500ms for better performance
    
    return () => clearTimeout(timeoutId);
  }, [products, filters, sortOption, visibleProducts, displayedProducts]);

  return (
    <div>
      {/* Add your JSX for rendering products and filters here */}
    </div>
  );
};

export default ShopPage; 