'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { trackAddToCart } from '../lib/tracking-integration';
import Image from 'next/image';

// Helper function to extract display values from variation objects or strings
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

interface ProductVariation {
  id: string;
  productId?: string;
  weightId?: string;
  weight?: string | { id: string; name: string; value: number; displayName: string; [key: string]: any };
  beansId?: string;
  beans?: string | { id: string; name: string; [key: string]: any };
  additionsId?: string;
  additions?: string | { id: string; name: string; [key: string]: any };
  price: number;
  discount?: number;
  discountType?: string;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  images: string[];
  additions?: string;
  category?: string | { id: string; name: string; slug?: string };
  variations?: ProductVariation[] | {
    weight?: string[];
    beans?: string[];
    additions?: string[];
    _original?: ProductVariation[];
  };
}

interface SelectedVariations {
  weight: string;
  beans: string;
  additions: string;
}

interface VariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: (product: Product, quantity: number, variations: SelectedVariations) => void;
}

export default function VariationModal({ isOpen, onClose, product, onAddToCart }: VariationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariations>({
    weight: '',
    beans: '',
    additions: '',
  });
  const [loading, setLoading] = useState(false);
  const [actualVariations, setActualVariations] = useState<ProductVariation[]>([]);
  const [selectedVariationImage, setSelectedVariationImage] = useState<string | null>(null);
  
  // Get cart context and toast context
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Initialize selected variations based on product
  useEffect(() => {
    if (!isOpen || !product) return;
    
    // Fetch the actual variations from the API when the modal opens
    const fetchProductVariations = async () => {
      try {
        setLoading(true);
        // Fetch the product data with variations
        const response = await fetch(`/api/variations/products?productId=${product.id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched product variations:", data);
          setActualVariations(data);
          
          // Initialize with first options if available
          const newVariations: SelectedVariations = { weight: '', beans: '', additions: '' };
          
          // Get unique weight values
          const weights = [...new Set(data.map((v: ProductVariation) => extractValue(v.weight)).filter(Boolean))] as string[];
          if (weights.length > 0) newVariations.weight = weights[0];
          
          // Get unique beans values
          const beans = [...new Set(data.map((v: ProductVariation) => extractValue(v.beans)).filter(Boolean))] as string[];
          if (beans.length > 0) newVariations.beans = beans[0];
          
          // Get unique additions values
          const additions = [...new Set(data.map((v: ProductVariation) => extractValue(v.additions)).filter(Boolean))] as string[];
          if (additions.length > 0) newVariations.additions = additions[0];
          
          setSelectedVariations(newVariations);
        } else {
          // If API fails, fall back to the provided variations
          fallbackToProvidedVariations();
        }
      } catch (error) {
        console.error("Error fetching product variations:", error);
        fallbackToProvidedVariations();
      } finally {
        setLoading(false);
      }
    };
    
    const fallbackToProvidedVariations = () => {
      // Initialize with first options from provided variations
      const newVariations: SelectedVariations = { weight: '', beans: '', additions: '' };
      
      // Handle both array and object variations
      if (Array.isArray(product.variations)) {
        // If variations is an array of ProductVariation objects
        const variationsArray = product.variations as ProductVariation[];
        setActualVariations(variationsArray);
        
        // Get unique weight values
        const weights = [...new Set(variationsArray.map(v => extractValue(v.weight)).filter(Boolean))];
        if (weights.length > 0) newVariations.weight = weights[0];
        
        // Get unique beans values
        const beans = [...new Set(variationsArray.map(v => extractValue(v.beans)).filter(Boolean))];
        if (beans.length > 0) newVariations.beans = beans[0];
        
        // Get unique additions values
        const additions = [...new Set(variationsArray.map(v => extractValue(v.additions)).filter(Boolean))];
        if (additions.length > 0) newVariations.additions = additions[0];
      } else if (product.variations) {
        // If variations is an object with arrays for weight, beans, additions
        const obj = product.variations as { weight?: string[], beans?: string[], additions?: string[], _original?: ProductVariation[] };
        
        // Use _original variations if available
        if (obj._original) {
          setActualVariations(obj._original);
        }
        
        if (obj.weight && obj.weight.length > 0) newVariations.weight = obj.weight[0];
        if (obj.beans && obj.beans.length > 0) newVariations.beans = obj.beans[0];
        if (obj.additions && obj.additions.length > 0) newVariations.additions = obj.additions[0];
      }
      
      setSelectedVariations(newVariations);
    };
    
    // If the product has an ID, fetch variations from API
    if (product.id) {
      fetchProductVariations();
    } else {
      fallbackToProvidedVariations();
    }
  }, [isOpen, product]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleVariationChange = (type: keyof SelectedVariations, value: string) => {
    console.log(`Changing ${type} to ${value}`);
    
    setSelectedVariations(prev => {
      const newSelection = {
        ...prev,
        [type]: value
      };
      
      console.log('New selection:', newSelection);
      
      // If we have actual variations, try to find a matching price
      if (actualVariations.length > 0) {
        // Find the best matching variation
        const bestMatch = actualVariations.find(variation => {
          const variationWeight = extractValue(variation.weight);
          const variationBeans = extractValue(variation.beans);
          const variationAdditions = extractValue(variation.additions);
          
          const matchWeight = !newSelection.weight || variationWeight.toLowerCase() === newSelection.weight.toLowerCase();
          const matchBeans = !newSelection.beans || variationBeans.toLowerCase() === newSelection.beans.toLowerCase();
          const matchAdditions = !newSelection.additions || variationAdditions.toLowerCase() === newSelection.additions.toLowerCase();
          
          return matchWeight && matchBeans && matchAdditions;
        });
        
        if (bestMatch) {
          console.log('Found matching variation:', bestMatch);
          // Set the variation image if available
          if (bestMatch.imageUrl) {
            setSelectedVariationImage(bestMatch.imageUrl);
          } else {
            setSelectedVariationImage(null);
          }
        } else {
          setSelectedVariationImage(null);
        }
      }
      
      return newSelection;
    });
  };

  const handleSubmit = () => {
    // Get available variation options
    const availableOptions = getAvailableVariationOptions();
    
    // Check if all required variations are selected
    const requiredVariations = Object.keys(availableOptions).filter(
      key => availableOptions[key as keyof typeof availableOptions].length > 0
    );
    
    const missingVariations = requiredVariations.filter(
      variationType => !selectedVariations[variationType as keyof SelectedVariations]
    );
    
    if (missingVariations.length > 0) {
      showToast(`Please select: ${missingVariations.join(', ')}`, 'error');
      return;
    }
    
    // Find the matching variation to get the correct price
    let productToAdd = { ...product };
    let finalPrice = product.price;
    
    if (actualVariations.length > 0) {
      const matchingVariation = findMatchingVariation();
      
      if (matchingVariation) {
        console.log(`Found matching variation with price: ${matchingVariation.price}`, matchingVariation);
        
        // Calculate final price with discount if applicable
        finalPrice = matchingVariation.price;
        if (matchingVariation.discount && matchingVariation.discount > 0) {
          if (matchingVariation.discountType === 'PERCENTAGE') {
            finalPrice = matchingVariation.price * (1 - matchingVariation.discount);
          } else if (matchingVariation.discountType === 'FIXED_AMOUNT') {
            finalPrice = Math.max(0, matchingVariation.price - matchingVariation.discount);
          }
        }
        
        productToAdd = {
          ...product,
          price: finalPrice,
          // Use type assertion to avoid TypeScript error
        } as typeof product & { selectedVariationId: string };
        (productToAdd as any).selectedVariationId = matchingVariation.id;
      }
    }
    
    // Track add to cart
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      quantity: quantity,
      category: typeof product.category === 'string' 
        ? product.category 
        : (typeof product.category === 'object' && product.category && 'name' in product.category 
           ? (product.category as { name: string }).name 
           : 'Unknown')
    });

    // Add to cart
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: finalPrice,
      quantity: quantity,
      image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      variation: selectedVariations
    });
    
    // Show success toast
    showToast(`${quantity} × ${product.name} added to cart`, 'success');
    
    // Call the original onAddToCart for any additional handling
    onAddToCart(productToAdd, quantity, selectedVariations);
    
    // Close the modal
    onClose();
  };

  const findMatchingVariation = () => {
    const match = actualVariations.find(variation => {
      const variationWeight = extractValue(variation.weight);
      const variationBeans = extractValue(variation.beans);
      const variationAdditions = extractValue(variation.additions);
      
      const matchWeight = !selectedVariations.weight || variationWeight.toLowerCase() === selectedVariations.weight.toLowerCase();
      const matchBeans = !selectedVariations.beans || variationBeans.toLowerCase() === selectedVariations.beans.toLowerCase();
      const matchAdditions = !selectedVariations.additions || variationAdditions.toLowerCase() === selectedVariations.additions.toLowerCase();
      
      return matchWeight && matchBeans && matchAdditions;
    });

    // Set the variation image if available
    if (match && match.imageUrl) {
      setSelectedVariationImage(match.imageUrl);
    } else {
      setSelectedVariationImage(null);
    }

    return match;
  };

  // Call findMatchingVariation whenever selectedVariations changes
  useEffect(() => {
    findMatchingVariation();
  }, [selectedVariations]);

  const getAvailableVariationOptions = () => {
    const options: { weight: string[], beans: string[], additions: string[] } = {
      weight: [],
      beans: [],
      additions: []
    };
    
    if (actualVariations.length > 0) {
      // Extract from fetched variations
      options.weight = [...new Set(actualVariations.map(v => extractValue(v.weight)).filter(Boolean))];
      options.beans = [...new Set(actualVariations.map(v => extractValue(v.beans)).filter(Boolean))];
      options.additions = [...new Set(actualVariations.map(v => extractValue(v.additions)).filter(Boolean))];
    } else if (product.variations) {
      if (Array.isArray(product.variations)) {
        // Extract from array of variations
        const variationsArray = product.variations as ProductVariation[];
        options.weight = [...new Set(variationsArray.map(v => extractValue(v.weight)).filter(Boolean))];
        options.beans = [...new Set(variationsArray.map(v => extractValue(v.beans)).filter(Boolean))];
        options.additions = [...new Set(variationsArray.map(v => extractValue(v.additions)).filter(Boolean))];
      } else {
        // Extract from object with arrays
        const obj = product.variations as { weight?: string[], beans?: string[], additions?: string[] };
        if (obj.weight) options.weight = obj.weight;
        if (obj.beans) options.beans = obj.beans;
        if (obj.additions) options.additions = obj.additions;
      }
    }
    
    return options;
  };

  const getVariationOptions = (type: keyof SelectedVariations): string[] => {
    const options = getAvailableVariationOptions();
    return options[type as keyof typeof options];
  };

  if (!isOpen) return null;

  const showLoadingState = loading && actualVariations.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{product.name}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {showLoadingState ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Image */}
              <div className="relative rounded-lg overflow-hidden mb-4 aspect-square w-full max-w-xs mx-auto">
                {selectedVariationImage ? (
                  <Image 
                    src={selectedVariationImage} 
                    alt={product.name}
                    width={250}
                    height={250}
                    className="object-contain w-full h-full"
                  />
                ) : product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name}
                    width={250}
                    height={250}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>

              {/* Weight Variation */}
              {getVariationOptions('weight').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Weight</h3>
                  <div className="flex flex-wrap gap-2">
                    {getVariationOptions('weight').map((weight) => (
                      <button 
                        key={weight}
                        onClick={() => handleVariationChange('weight', weight)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                          ${selectedVariations.weight === weight 
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
              {getVariationOptions('beans').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Beans</h3>
                  <div className="flex flex-wrap gap-2">
                    {getVariationOptions('beans').map((bean) => (
                      <button 
                        key={bean}
                        onClick={() => handleVariationChange('beans', bean)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                          ${selectedVariations.beans === bean 
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
              {getVariationOptions('additions').length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Additions</h3>
                  <div className="flex flex-wrap gap-2">
                    {getVariationOptions('additions').map((addition) => (
                      <button 
                        key={addition}
                        onClick={() => handleVariationChange('additions', addition)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
                          ${selectedVariations.additions === addition 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {addition}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected variation price */}
              {actualVariations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Price</h3>
                  <div className="text-xl font-bold">
                    {(() => {
                      const matchingVariation = findMatchingVariation();
                      if (matchingVariation) {
                        // Calculate price with discount if applicable
                        let finalPrice = matchingVariation.price;
                        if (matchingVariation.discount && matchingVariation.discount > 0) {
                          if (matchingVariation.discountType === 'PERCENTAGE') {
                            finalPrice = matchingVariation.price * (1 - matchingVariation.discount);
                          } else if (matchingVariation.discountType === 'FIXED_AMOUNT') {
                            finalPrice = Math.max(0, matchingVariation.price - matchingVariation.discount);
                          }
                        }
                        return `${finalPrice.toFixed(2)} AED`;
                      }
                      return `${product.price.toFixed(2)} AED`;
                    })()}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-l-md"
                  >
                    -
                  </button>
                  <div className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-200">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-r-md"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleSubmit}
                className="w-full bg-black text-white p-3 rounded-md flex items-center justify-center hover:bg-gray-800 transition"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 