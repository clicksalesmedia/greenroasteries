'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import UAEDirhamSymbol from './UAEDirhamSymbol';

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
  price: number;
  discountPrice?: number;
  images: string[];
  imageUrl?: string;
  variations?: ProductVariation[];
}

interface ProductVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
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

const ProductVariationModal: React.FC<ProductVariationModalProps> = ({ isOpen, onClose, productId }) => {
  const { language, t, contentByLang } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedBeans, setSelectedBeans] = useState<string>('');
  const [selectedAdditions, setSelectedAdditions] = useState<string>('');
  const [availableWeights, setAvailableWeights] = useState<string[]>([]);
  const [availableBeans, setAvailableBeans] = useState<string[]>([]);
  const [availableAdditions, setAvailableAdditions] = useState<string[]>([]);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }
  }, [isOpen, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      console.log('ProductVariationModal - Fetched product:', data);
      console.log('ProductVariationModal - Raw variations:', data.variations);
      
      // Handle backward compatibility for variations
      if (data.variations && data.variations.length > 0) {
        // Convert old 'size' field to 'weight' and 'type' to 'additions' for backwards compatibility
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
      
      // Extract unique variation options
      if (data.variations && data.variations.length > 0) {
        const weights = new Set<string>();
        const beans = new Set<string>();
        const additions = new Set<string>();
        
        data.variations.forEach((variation: ProductVariation, index: number) => {
          console.log(`ProductVariationModal - Processing variation ${index + 1}:`, variation);
          
          // Handle weight/size backwards compatibility
          if (variation.weight) {
            const weightValue = extractValue(variation.weight, language);
            weights.add(weightValue);
            console.log(`  Added weight: ${weightValue}`);
          } else if (variation.size) {
            const sizeValue = extractValue(variation.size, language);
            weights.add(sizeValue);
            console.log(`  Added size as weight: ${sizeValue}`);
          }
          
          if (variation.beans) {
            const beansValue = extractValue(variation.beans, language);
            beans.add(beansValue);
            console.log(`  Added beans: ${beansValue}`);
          }
          
          // Handle additions/type backwards compatibility
          if (variation.additions) {
            const additionsValue = extractValue(variation.additions, language);
            additions.add(additionsValue);
            console.log(`  Added additions: ${additionsValue}`);
          } else if (variation.type) {
            const typeValue = extractValue(variation.type, language);
            additions.add(typeValue);
            console.log(`  Added type as additions: ${typeValue}`);
          }
        });
        
        const weightArray = Array.from(weights);
        const beansArray = Array.from(beans);
        const additionsArray = Array.from(additions);
        
        console.log('ProductVariationModal - Available options:', {
          weights: weightArray,
          beans: beansArray,
          additions: additionsArray
        });
        
        // Sort weights in the specific order: 250g, 500g, 1kg
        const weightOrder: Record<string, number> = {'250g': 1, '500g': 2, '1kg': 3};
        const sortedWeights = [...weightArray].sort((a, b) => {
          // Exact match with predefined order
          const orderA = weightOrder[a] || 999;
          const orderB = weightOrder[b] || 999;
          return orderA - orderB;
        });
        
        // Create a new array for additions with "Normal" always first
        let sortedAdditions: string[] = [];
        
        // Always add "Normal" as the first option
        sortedAdditions.push('Normal');
        
        // Add other additions that aren't "Normal"
        additionsArray.forEach(addition => {
          if (addition && addition.toLowerCase() !== 'normal') {
            sortedAdditions.push(addition);
          }
        });
        
        console.log('ProductVariationModal - Sorted weights:', sortedWeights);
        console.log('ProductVariationModal - Additions with Normal first:', sortedAdditions);
        
        setAvailableWeights(sortedWeights);
        setAvailableBeans(beansArray);
        setAvailableAdditions(sortedAdditions);
        
        // Select first options by default
        if (weights.size > 0) setSelectedWeight(sortedWeights[0]);
        if (beans.size > 0) setSelectedBeans(beansArray[0]);
        if (sortedAdditions.length > 0) setSelectedAdditions(sortedAdditions[0]); // This will be "Normal"
        
        // Find matching variation
        updateSelectedVariation(
          sortedWeights[0] || '',
          beansArray[0] || '',
          sortedAdditions[0] || '',
          data.variations
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to match variation values
  const isMatch = (variationProp: any, selectionValue: string): boolean => {
    if (!selectionValue) return true; // No selection means any value matches
    
    const extractedValue = extractValue(variationProp, language);
    // Use case-insensitive comparison to make matching more reliable
    return extractedValue.toLowerCase() === selectionValue.toLowerCase();
  };

  const updateSelectedVariation = (
    weight: string,
    beans: string,
    additions: string,
    variations: ProductVariation[]
  ) => {
    console.log('ProductVariationModal - Updating variation with criteria:', { weight, beans, additions });
    
    // Find a matching variation based on selected options
    const matchingVariation = variations.find(variation => {
      // Check for weight/size match
      const weightMatch = !weight || 
        isMatch(variation.weight, weight) || 
        isMatch(variation.size, weight);
      
      // Check for beans match
      const beansMatch = !beans || 
        isMatch(variation.beans, beans);
      
      // Check for additions/type match
      const additionsMatch = !additions || 
        isMatch(variation.additions, additions) || 
        isMatch(variation.type, additions);
      
      const match = weightMatch && beansMatch && additionsMatch;
      console.log('  Checking variation:', {
        id: variation.id,
        weight: extractValue(variation.weight, language) || extractValue(variation.size, language),
        beans: extractValue(variation.beans, language),
        additions: extractValue(variation.additions, language) || extractValue(variation.type, language),
        matches: { weightMatch, beansMatch, additionsMatch, match }
      });
      
      return match;
    });
    
    if (matchingVariation) {
      console.log('ProductVariationModal - Selected variation:', matchingVariation);
      setSelectedVariation(matchingVariation);
    } else {
      console.log('ProductVariationModal - No matching variation found');
      
      // Special handling for "Normal" additions
      if (additions && additions.toLowerCase() === 'normal') {
        console.log('ProductVariationModal - Special handling for Normal addition selection');
        
        // Look for a variation with matching weight and beans
        const baseVariation = variations.find(variation => {
          const variationWeight = extractValue(variation.weight || variation.size, language);
          const variationBeans = extractValue(variation.beans, language);
          
          return (
            (!weight || variationWeight.toLowerCase() === weight.toLowerCase()) &&
            (!beans || variationBeans.toLowerCase() === beans.toLowerCase())
          );
        });
        
        if (baseVariation) {
          console.log('ProductVariationModal - Creating modified variation with Normal addition');
          
          // Create a modified version with Normal addition
          const modifiedVariation = {
            ...baseVariation,
            additions: 'Normal',
            id: `${baseVariation.id}-normal`
          };
          
          setSelectedVariation(modifiedVariation);
          return;
        }
      }
      
      // If we reach here, no variation matched and no special handling was applied
      setSelectedVariation(null);
    }
  };

  const handleVariationChange = (type: 'weight' | 'beans' | 'additions', value: string) => {
    if (!product || !product.variations) return;
    
    console.log(`ProductVariationModal - Changing ${type} to "${value}" (Language: ${language})`);
    
    // For additions, special handling when switching to "Normal"
    if (type === 'additions' && value.toLowerCase() === 'normal') {
      console.log('ProductVariationModal - Special handling for Normal addition selection');
      
      // First try to find an exact match variation with current weight/beans and Normal addition
      const exactMatch = product.variations.find(variation => {
        const variationWeight = extractValue(variation.weight || variation.size, language);
        const variationBeans = extractValue(variation.beans, language);
        const variationAdditions = extractValue(variation.additions || variation.type, language);
        
        return (
          (!selectedWeight || variationWeight.toLowerCase() === selectedWeight.toLowerCase()) &&
          (!selectedBeans || variationBeans.toLowerCase() === selectedBeans.toLowerCase()) &&
          variationAdditions.toLowerCase() === 'normal'
        );
      });
      
      if (exactMatch) {
        console.log('ProductVariationModal - Found exact matching variation with Normal addition');
        setSelectedAdditions(value);
        setSelectedVariation(exactMatch);
        return;
      }
      
      // If no exact match, find a variation with matching weight and beans to use as base
      const baseVariation = product.variations.find(variation => {
        const variationWeight = extractValue(variation.weight || variation.size, language);
        const variationBeans = extractValue(variation.beans, language);
        
        return (
          (!selectedWeight || variationWeight.toLowerCase() === selectedWeight.toLowerCase()) &&
          (!selectedBeans || variationBeans.toLowerCase() === selectedBeans.toLowerCase())
        );
      });
      
      if (baseVariation) {
        console.log('ProductVariationModal - Creating modified variation with Normal addition');
        
        // Create a modified variation with Normal addition
        const modifiedVariation = {
          ...baseVariation,
          additions: 'Normal',
          id: `${baseVariation.id}-normal`
        };
        
        setSelectedAdditions(value);
        setSelectedVariation(modifiedVariation);
        return;
      }
    }
    
    // Standard variation change for all other cases
    let newWeight = selectedWeight;
    let newBeans = selectedBeans;
    let newAdditions = selectedAdditions;
    
    if (type === 'weight') {
      newWeight = value;
      setSelectedWeight(value);
    } else if (type === 'beans') {
      newBeans = value;
      setSelectedBeans(value);
    } else if (type === 'additions') {
      newAdditions = value;
      setSelectedAdditions(value);
    }
    
    console.log('ProductVariationModal - New selection:', { 
      weight: newWeight, beans: newBeans, additions: newAdditions 
    });
    
    updateSelectedVariation(newWeight, newBeans, newAdditions, product.variations);
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);
  };

  const getCurrentPrice = () => {
    if (selectedVariation) {
      return selectedVariation.discountPrice || selectedVariation.price;
    }
    return product?.discountPrice || product?.price || 0;
  };

  const handleAddToCart = () => {
    if (!selectedVariation || !product) {
      return;
    }
    
    // Format the selected variation options for display
    const variationOptions = [
      selectedWeight,
      selectedBeans,
      selectedAdditions
    ].filter(Boolean).join(', ');
    
    // Add item to cart using our cart context
    addItem({
      id: `${product.id}-${selectedVariation.id}`,
      productId: product.id,
      name: language === 'ar' && product.nameAr ? product.nameAr : product.name,
      price: getCurrentPrice(),
      quantity: quantity,
      image: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : ''),
      variation: {
        weight: selectedWeight,
        beans: selectedBeans,
        additions: selectedAdditions
      }
    });
    
    // Show success message with toast
    showToast(`${quantity} × ${language === 'ar' && product.nameAr ? product.nameAr : product.name} ${t('added_to_cart', 'added to cart')}`, 'success');
    
    // Close the modal
    onClose();
  };

  // Format price to 2 decimal places with UAE Dirham symbol
  const formatPrice = (price: number) => {
    return (
      <span className="flex items-center gap-1">
        {price.toFixed(2)}
        <UAEDirhamSymbol size={14} />
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg">
            {t('select_options', 'Select Options')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : product ? (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative mr-3">
                <Image 
                  src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : '')}
                  alt={product.name}
                  fill
                  sizes="64px"
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    // The parent already has a gray background
                  }}
                />
              </div>
              <div>
                <h3 className="font-medium">
                  {language === 'ar' && product.nameAr ? product.nameAr : product.name}
                </h3>
                <p className="text-lg font-bold">{formatPrice(getCurrentPrice())}</p>
              </div>
            </div>
            
            {/* Weight Selection */}
            {availableWeights.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {t('weight', 'Weight')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableWeights.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handleVariationChange('weight', weight)}
                      className={`px-3 py-1.5 border rounded-md text-sm ${
                        selectedWeight === weight
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Beans Selection */}
            {availableBeans.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {t('beans', 'Beans')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableBeans.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleVariationChange('beans', type)}
                      className={`px-3 py-1.5 border rounded-md text-sm ${
                        selectedBeans === type
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additions Selection */}
            {availableAdditions.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {t('additions', 'Additions')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableAdditions.map((addition) => (
                    <button
                      key={addition}
                      onClick={() => handleVariationChange('additions', addition)}
                      className={`px-3 py-1.5 border rounded-md text-sm ${
                        selectedAdditions === addition
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {addition}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {t('quantity', 'Quantity')}
              </label>
              <div className="flex border border-gray-300 rounded-md w-min">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 border-x border-gray-300 min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariation}
              className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('add_to_cart', 'Add to Cart')}
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-red-500">
            {t('product_not_found', 'Product not found')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariationModal; 