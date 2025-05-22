import { useState, useEffect } from 'react';

interface VariationSize {
  id: string;
  name: string;
  value: number;
  displayName: string;
  isActive: boolean;
}

interface VariationType {
  id: string;
  name: string;
  arabicName?: string;
  isActive: boolean;
}

interface VariationBeans {
  id: string;
  name: string;
  arabicName?: string;
  description?: string;
  isActive: boolean;
}

interface ProductVariation {
  id: string;
  productId: string;
  sizeId: string;
  size: VariationSize;
  typeId?: string;
  type?: VariationType;
  beansId?: string;
  beans?: VariationBeans;
  price: number;
  sku?: string;
  stockQuantity: number;
  isActive: boolean;
  imageUrl?: string;
}

interface ProductVariationsProps {
  productId?: string; // Optional for new products
  variations?: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
  onClose?: () => void;
}

export default function ProductVariations({ 
  productId, 
  variations: initialVariations = [], 
  onChange, 
  onClose 
}: ProductVariationsProps) {
  // Data state
  const [sizes, setSizes] = useState<VariationSize[]>([]);
  const [types, setTypes] = useState<VariationType[]>([]);
  const [beans, setBeans] = useState<VariationBeans[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>(initialVariations);
  
  // Form state for new variation
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedBeansId, setSelectedBeansId] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [variationImageFile, setVariationImageFile] = useState<File | null>(null);
  const [variationImagePreview, setVariationImagePreview] = useState<string | null>(null);

  // Edit state
  const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
  const [editSizeId, setEditSizeId] = useState('');
  const [editTypeId, setEditTypeId] = useState('');
  const [editBeansId, setEditBeansId] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSizesLoading, setIsSizesLoading] = useState(true);
  const [isTypesLoading, setIsTypesLoading] = useState(true);
  const [isBeansLoading, setIsBeansLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch sizes, types, and beans on load
  useEffect(() => {
    fetchSizes();
    fetchTypes();
    fetchBeans();
  }, []);

  // Fetch variations if productId is provided (editing an existing product)
  useEffect(() => {
    if (productId) {
      fetchVariations();
    } else {
      setIsLoading(false);
    }
  }, [productId]);

  // Notify parent component when variations change
  useEffect(() => {
    onChange(variations);
  }, [variations, onChange]);

  const fetchSizes = async () => {
    try {
      setIsSizesLoading(true);
      const response = await fetch('/api/variations/sizes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sizes');
      }
      
      const data = await response.json();
      setSizes(data.filter((size: VariationSize) => size.isActive));
    } catch (err) {
      console.error('Error fetching sizes:', err);
      setError('Failed to load variation sizes');
    } finally {
      setIsSizesLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      setIsTypesLoading(true);
      const response = await fetch('/api/variations/types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch types');
      }
      
      const data = await response.json();
      setTypes(data.filter((type: VariationType) => type.isActive));
    } catch (err) {
      console.error('Error fetching types:', err);
      setError('Failed to load variation types');
    } finally {
      setIsTypesLoading(false);
    }
  };

  const fetchBeans = async () => {
    try {
      setIsBeansLoading(true);
      const response = await fetch('/api/variations/beans');
      
      if (!response.ok) {
        throw new Error('Failed to fetch beans');
      }
      
      const data = await response.json();
      setBeans(data.filter((bean: VariationBeans) => bean.isActive));
    } catch (err) {
      console.error('Error fetching beans:', err);
      setError('Failed to load bean variations');
    } finally {
      setIsBeansLoading(false);
    }
  };

  const fetchVariations = async () => {
    if (!productId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/variations/products?productId=${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch variations');
      }
      
      const data = await response.json();
      setVariations(data);
    } catch (err) {
      console.error('Error fetching variations:', err);
      setError('Failed to load product variations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariation = async () => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!selectedSizeId) {
        setFormError('Size is required');
        return;
      }

      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setFormError('Valid price is required');
        return;
      }

      // Upload image if provided
      let imageUrl: string | undefined = undefined;
      if (variationImageFile) {
        try {
          imageUrl = await uploadImage(variationImageFile);
        } catch (error) {
          setFormError('Failed to upload variation image');
          return;
        }
      }

      // If editing an existing product, send API request
      if (productId) {
        const response = await fetch('/api/variations/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            sizeId: selectedSizeId,
            typeId: selectedTypeId || undefined,
            beansId: selectedBeansId || undefined,
            price: parseFloat(price),
            sku: sku || undefined,
            stockQuantity: parseInt(stockQuantity, 10) || 0,
            isActive,
            imageUrl
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || 'Failed to add variation';
          
          // Handle specific errors
          if (errorMessage.includes('already exists')) {
            throw new Error('A variation with this combination already exists or the SKU is already in use');
          }
          
          throw new Error(errorMessage);
        }

        const newVariation = await response.json();
        setVariations([...variations, newVariation]);
      } else {
        // For new products, check for duplicate SKUs or combinations in local state
        if (sku) {
          const duplicateSku = variations.some(v => v.sku === sku);
          if (duplicateSku) {
            throw new Error('A variation with this SKU already exists');
          }
        }
        
        // Check for duplicate combination
        const duplicateCombination = variations.some(v => 
          v.sizeId === selectedSizeId && 
          v.typeId === selectedTypeId &&
          v.beansId === selectedBeansId
        );
        
        if (duplicateCombination) {
          throw new Error('A variation with this combination of size, type, and beans already exists');
        }
        
        // Generate a temporary ID
        const tempId = `temp_${Date.now()}`;
        
        // Find the selected size, type, and beans
        const selectedSize = sizes.find(size => size.id === selectedSizeId);
        const selectedType = selectedTypeId ? types.find(type => type.id === selectedTypeId) : undefined;
        const selectedBeans = selectedBeansId ? beans.find(bean => bean.id === selectedBeansId) : undefined;
        
        if (!selectedSize) {
          throw new Error('Selected size not found');
        }
        
        const newVariation: ProductVariation = {
          id: tempId,
          productId: 'temp',
          sizeId: selectedSizeId,
          size: selectedSize,
          typeId: selectedTypeId || undefined,
          type: selectedType,
          beansId: selectedBeansId || undefined,
          beans: selectedBeans,
          price: parseFloat(price),
          sku: sku || undefined,
          stockQuantity: parseInt(stockQuantity, 10) || 0,
          isActive,
          imageUrl: imageUrl || variationImagePreview || undefined
        };
        
        setVariations([...variations, newVariation]);
      }

      // Reset form
      setSelectedSizeId('');
      setSelectedTypeId('');
      setSelectedBeansId('');
      setPrice('');
      setSku('');
      setStockQuantity('0');
      setVariationImageFile(null);
      setVariationImagePreview(null);
    } catch (err) {
      console.error('Error adding variation:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to add variation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVariation = async (id: string) => {
    if (productId && !id.startsWith('temp_')) {
      // For existing variations, make API call to delete
      try {
        const response = await fetch(`/api/variations/products/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete variation');
        }
      } catch (err) {
        console.error('Error deleting variation:', err);
        alert('Failed to delete variation');
        return;
      }
    }

    // Remove from local state
    setVariations(variations.filter(v => v.id !== id));
  };

  const handleDuplicateVariation = (variation: ProductVariation) => {
    // Create a new duplicate variation with a temporary ID
    const tempId = `temp_${Date.now()}`;
    
    const duplicatedVariation: ProductVariation = {
      ...variation,
      id: tempId,
      // If editing an existing product, we'll need to create a new variation on the server
      // when the form is submitted, so we don't include the original id
      productId: 'temp',
      sku: variation.sku ? `${variation.sku}_copy` : undefined,
    };
    
    setVariations([...variations, duplicatedVariation]);
  };

  const handleEditClick = (variation: ProductVariation) => {
    setEditingVariationId(variation.id);
    setEditSizeId(variation.sizeId);
    setEditTypeId(variation.typeId || '');
    setEditBeansId(variation.beansId || '');
    setEditPrice(variation.price.toString());
    setEditSku(variation.sku || '');
    setEditStock(variation.stockQuantity.toString());
    setEditIsActive(variation.isActive);
    setEditImagePreview(variation.imageUrl || null);
  };

  const handleCancelEdit = () => {
    setEditingVariationId(null);
    setEditSizeId('');
    setEditTypeId('');
    setEditBeansId('');
    setEditPrice('');
    setEditSku('');
    setEditStock('');
    setEditIsActive(true);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleSaveEdit = async (id: string) => {
    setIsEditSubmitting(true);
    
    try {
      // Validate 
      if (!editSizeId) {
        alert('Weight is required');
        return;
      }

      if (!editPrice || isNaN(parseFloat(editPrice)) || parseFloat(editPrice) <= 0) {
        alert('Valid price is required');
        return;
      }

      // Find the variation being edited
      const variationToEdit = variations.find(v => v.id === id);
      if (!variationToEdit) return;
      
      // Upload image if a new one was selected
      let imageUrl = variationToEdit.imageUrl;
      if (editImageFile) {
        try {
          imageUrl = await uploadImage(editImageFile);
        } catch (error) {
          alert('Failed to upload variation image');
          return;
        }
      }
      
      // For existing products, make API call
      if (productId && !id.startsWith('temp_')) {
      // API call to update the variation
      const response = await fetch(`/api/variations/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sizeId: editSizeId,
            typeId: editTypeId || undefined,
            beansId: editBeansId || undefined,
          price: parseFloat(editPrice),
            sku: editSku || undefined,
          stockQuantity: parseInt(editStock, 10) || 0,
            isActive: editIsActive,
          imageUrl: imageUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to update variation';
        
        if (errorMessage.includes('Unique constraint')) {
          throw new Error('This SKU is already in use by another variation');
        }
        
        throw new Error(errorMessage);
      }

      const updatedVariation = await response.json();
      
      // Update variations in state
      setVariations(variations.map(v => v.id === id ? updatedVariation : v));
      } else {
        // For new products or temporary variations, update in local state
        // Find selected size, type, and beans
        const selectedSize = sizes.find(size => size.id === editSizeId);
        const selectedType = editTypeId ? types.find(type => type.id === editTypeId) : undefined;
        const selectedBeans = editBeansId ? beans.find(bean => bean.id === editBeansId) : undefined;
        
        if (!selectedSize) {
          throw new Error('Selected size not found');
        }

        // Check for duplicate combination (excluding the current variation)
        const duplicateCombination = variations.some(v => 
          v.id !== id &&
          v.sizeId === editSizeId && 
          v.typeId === editTypeId &&
          v.beansId === editBeansId
        );
        
        if (duplicateCombination) {
          throw new Error('A variation with this combination of size, type, and beans already exists');
        }
        
        // Check for duplicate SKU (excluding the current variation)
        if (editSku) {
          const duplicateSku = variations.some(v => v.id !== id && v.sku === editSku);
          if (duplicateSku) {
            throw new Error('A variation with this SKU already exists');
          }
        }
        
        const updatedVariation: ProductVariation = {
          ...variationToEdit,
          sizeId: editSizeId,
          size: selectedSize,
          typeId: editTypeId || undefined,
          type: selectedType,
          beansId: editBeansId || undefined,
          beans: selectedBeans,
          price: parseFloat(editPrice),
          sku: editSku || undefined,
          stockQuantity: parseInt(editStock, 10) || 0,
          isActive: editIsActive,
          imageUrl: imageUrl
        };
        
        // Update variations in state
        setVariations(variations.map(v => v.id === id ? updatedVariation : v));
      }
      
      // Reset edit state
      setEditingVariationId(null);
      setEditSizeId('');
      setEditTypeId('');
      setEditBeansId('');
      setEditPrice('');
      setEditSku('');
      setEditStock('');
      setEditIsActive(true);
      setEditImageFile(null);
      setEditImagePreview(null);
    } catch (err) {
      console.error('Error updating variation:', err);
      alert(err instanceof Error ? err.message : 'Failed to update variation');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleVariationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
      if (!validTypes.includes(file.type)) {
        setFormError(`Invalid file type: ${file.type}. Please use JPG, PNG, WEBP, or AVIF.`);
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('File size exceeds 5MB limit.');
        return;
      }
      
      setVariationImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariationImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.type}. Please use JPG, PNG, WEBP, or AVIF.`);
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload an image and return the URL
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Please use JPG, PNG, WEBP, or AVIF.`);
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit.');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'products/variations'); // Use consistent path format with slashes
      
      console.log('Uploading variation image:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });
      
      // Add authorization header for debugging
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer temp-auth-for-upload'
        }
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Server returned an invalid response' };
        }
        console.error('Variation upload API Error:', errorData);
        throw new Error(errorData.error || 'Failed to upload variation image');
      }
      
      const data = await response.json();
      console.log('Variation upload successful, response:', data);
      
      // Get the URL of the uploaded image
      let imageUrl = data.url || data.file;
      
      // Ensure the URL starts with a slash
      if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `/${imageUrl}`;
      }
      
      console.log('Using variation image URL:', imageUrl);
      
      // Save the raw file data to localStorage for recovery if needed
      if (data.fileData) {
        try {
          const key = `file_data_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
          localStorage.setItem(key, data.fileData);
          console.log('Variation file data saved to localStorage for recovery if needed');
        } catch (e) {
          console.warn('Could not save variation file data to localStorage:', e);
        }
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading variation image:', error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading && isSizesLoading && isTypesLoading && isBeansLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Product Variations</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      {/* Form to add new variation */}
      <div className="p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-3">Add Variation</h3>
        
        {formError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-3 text-sm">
            {formError}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Weight *</label>
            <select
              id="size"
              value={selectedSizeId}
              onChange={(e) => setSelectedSizeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              disabled={isSizesLoading}
            >
              <option value="">Select Weight</option>
              {sizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.displayName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Additions</label>
            <select
              id="type"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              disabled={isTypesLoading}
            >
              <option value="">None</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="beans" className="block text-sm font-medium text-gray-700 mb-1">Beans</label>
            <select
              id="beans"
              value={selectedBeansId}
              onChange={(e) => setSelectedBeansId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              disabled={isBeansLoading}
            >
              <option value="">None</option>
              {beans.map((bean) => (
                <option key={bean.id} value={bean.id}>
                  {bean.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (AED) *</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Auto-generated if empty"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              id="stock"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="0"
              min="0"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="variationImage" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="relative">
              <input
                type="file"
                id="variationImage"
                onChange={handleVariationImageChange}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              />
              <label
                htmlFor="variationImage"
                className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center h-10"
              >
                {variationImagePreview ? (
                  <div className="absolute -top-16 left-0 w-full">
                    <img 
                      src={variationImagePreview} 
                      alt="Variation preview" 
                      className="h-14 w-14 object-cover mx-auto rounded-md border"
                      onError={(e) => {
                        console.error(`Failed to load image preview`);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const container = target.parentElement;
                        if (container) {
                          const fallback = document.createElement('div');
                          fallback.className = 'h-14 w-14 bg-gray-200 flex items-center justify-center rounded-md border mx-auto';
                          fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          container.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Upload</span>
                )}
              </label>
            </div>
          </div>
          
          <div className="md:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleAddVariation}
              disabled={isSubmitting || isUploadingImage}
              className={`w-full bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition ${
                (isSubmitting || isUploadingImage) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Adding...' : isUploadingImage ? 'Uploading...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
      
      {/* List of variations */}
      {variations.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Weight</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Additions</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Beans</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">SKU</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Image</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Group variations by size */}
              {['250 g', '500 g', '1 kg'].map(sizeGroup => {
                const sizeVariations = variations.filter(v => 
                  v.size.displayName.toLowerCase().includes(sizeGroup.toLowerCase())
                ).sort((a, b) => {
                  // Sort by type first, then by beans
                  const typeA = a.type?.name || '';
                  const typeB = b.type?.name || '';
                  const beansA = a.beans?.name || '';
                  const beansB = b.beans?.name || '';
                  
                  if (typeA !== typeB) return typeA.localeCompare(typeB);
                  return beansA.localeCompare(beansB);
                });
                
                if (sizeVariations.length === 0) return null;
                
                return sizeVariations.map((variation, index) => (
                  <tr 
                    key={variation.id} 
                    className={`hover:bg-gray-50 ${index === 0 ? 'border-t-2 border-gray-300' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {editingVariationId === variation.id ? (
                        <select
                          value={editSizeId}
                          onChange={(e) => setEditSizeId(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.displayName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        variation.size.displayName
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {editingVariationId === variation.id ? (
                        <select
                          value={editTypeId}
                          onChange={(e) => setEditTypeId(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">None</option>
                          {types.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        variation.type?.name || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {editingVariationId === variation.id ? (
                        <select
                          value={editBeansId}
                          onChange={(e) => setEditBeansId(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">None</option>
                          {beans.map((bean) => (
                            <option key={bean.id} value={bean.id}>
                              {bean.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        variation.beans?.name || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingVariationId === variation.id ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                          step="0.01"
                          min="0.01"
                        />
                      ) : (
                        `${variation.price.toFixed(2)} AED`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingVariationId === variation.id ? (
                        <input
                          type="text"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                          placeholder="Auto-generated if empty"
                        />
                      ) : (
                        variation.sku || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {editingVariationId === variation.id ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          min="0"
                        />
                      ) : (
                        variation.stockQuantity
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editingVariationId === variation.id ? (
                        <div className="relative">
                          <input
                            type="file"
                            id={`edit-image-${variation.id}`}
                            onChange={handleEditImageChange}
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                          />
                          <label
                            htmlFor={`edit-image-${variation.id}`}
                            className="cursor-pointer block text-center"
                          >
                            {editImagePreview ? (
                              <img 
                                src={editImagePreview} 
                                alt="Variation" 
                                className="h-12 w-12 object-cover mx-auto rounded-md border hover:opacity-80"
                                onError={(e) => {
                                  console.error(`Failed to load image preview`);
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.style.display = 'none';
                                  const container = target.parentElement;
                                  if (container) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'h-12 w-12 bg-gray-200 flex items-center justify-center rounded-md border mx-auto hover:opacity-80';
                                    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                    container.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : variation.imageUrl ? (
                              <img 
                                src={variation.imageUrl} 
                                alt="Variation" 
                                className="h-12 w-12 object-cover mx-auto rounded-md border hover:opacity-80"
                                onError={(e) => {
                                  console.error(`Failed to load variation image: ${variation.imageUrl}`);
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.style.display = 'none';
                                  const container = target.parentElement;
                                  if (container) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'h-12 w-12 bg-gray-200 flex items-center justify-center rounded-md border mx-auto hover:opacity-80';
                                    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                    container.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded-md border mx-auto hover:bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            )}
                          </label>
                        </div>
                      ) : variation.imageUrl ? (
                        <img 
                          src={variation.imageUrl} 
                          alt="Variation" 
                          className="h-12 w-12 object-cover mx-auto rounded-md border"
                          onError={(e) => {
                            console.error(`Failed to load variation image: ${variation.imageUrl}`);
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = 'none';
                            const container = target.parentElement;
                            if (container) {
                              const fallback = document.createElement('div');
                              fallback.className = 'h-12 w-12 bg-gray-200 flex items-center justify-center rounded-md border mx-auto';
                              fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                              container.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">No image</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        variation.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {editingVariationId === variation.id ? (
                          <select
                            value={editIsActive ? 'true' : 'false'}
                            onChange={(e) => setEditIsActive(e.target.value === 'true')}
                            className="bg-transparent border-none text-xs font-semibold focus:ring-0"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          variation.isActive ? 'Active' : 'Inactive'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {editingVariationId === variation.id ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => handleSaveEdit(variation.id)}
                            disabled={isEditSubmitting || isUploadingImage}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            {isEditSubmitting ? 'Saving...' : isUploadingImage ? 'Uploading...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-4 justify-center">
                          <button
                            onClick={() => handleEditClick(variation)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateVariation(variation)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleRemoveVariation(variation.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          No variations added yet. Add at least one variation above.
        </div>
      )}
    </div>
  );
} 