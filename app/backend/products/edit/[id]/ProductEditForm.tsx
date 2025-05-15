'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProductVariations from '../../new/ProductVariations';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface ProductVariation {
  id: string;
  productId: string;
  sizeId: string;
  size: {
    id: string;
    name: string;
    value: number;
    displayName: string;
    isActive: boolean;
  };
  typeId?: string;
  type?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  beansId?: string;
  beans?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  price: number;
  sku?: string;
  stockQuantity: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string | null;
  categoryId: string;
  subcategoryId?: string;
  origin: string | null;
  inStock: boolean;
  stockQuantity: number;
  sku: string | null;
  weight: number | null;
  dimensions: string | null;
  roastLevel?: string | null;
  category: Category;
  images: ProductImage[];
  variations: ProductVariation[];
  slug?: string;
  isActive: boolean;
  isFeatured?: boolean;
}

interface UploadResults {
  mainImageUrl?: string;
  galleryUrls?: string[];
}

interface ProductEditFormProps {
  productId: string;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  // Form state - English fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  
  // Form state - Arabic fields
  const [nameAr, setNameAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [roastLevel, setRoastLevel] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Image handling
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data state
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  // Add variations state
  const [productVariations, setProductVariations] = useState<ProductVariation[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data);
        
        // Initialize form data from product
        setName(data.name || '');
        setNameAr(data.nameAr || '');
        setSlug(data.slug || '');
        setDescription(data.description || '');
        setDescriptionAr(data.descriptionAr || '');
        setPrice(data.price?.toString() || '');
        setDiscountPrice(data.discountPrice?.toString() || '');
        setSku(data.sku || '');
        setStockQuantity(data.stockQuantity?.toString() || '0');
        setCategoryId(data.categoryId || '');
        setSubcategoryId(data.subcategoryId || '');
        setWeight(data.weight?.toString() || '');
        setOrigin(data.origin || '');
        setRoastLevel(data.roastLevel || '');
        setDimensions(data.dimensions || '');
        setIsActive(data.isActive !== undefined ? data.isActive : true);
        setIsFeatured(data.isFeatured || false);
        
        // Initialize image previews
        if (data.imageUrl) {
          setMainImagePreview(data.imageUrl);
        }
        
        // Initialize gallery previews
        if (data.images && data.images.length > 0) {
          const nonMainImages = data.images.filter((img: ProductImage) => !img.isMain).map((img: ProductImage) => img.url);
          setGalleryPreviews(nonMainImages);
        }
        
        // Initialize variations if they exist
        if (data.variations && data.variations.length > 0) {
          setProductVariations(data.variations);
          setShowVariations(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const selectedCategory = categories.find(cat => cat.id === categoryId);
      if (selectedCategory && selectedCategory.children) {
        setSubcategories(selectedCategory.children);
      }
    } else {
      setSubcategories([]);
    }
  }, [categoryId, categories]);

  // Generate slug from name if slug is empty
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [name, slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      if (name === 'isActive') {
        setIsActive(target.checked);
      } else if (name === 'isFeatured') {
        setIsFeatured(target.checked);
      }
    } else {
      if (name === 'name') {
        setName(value);
      } else if (name === 'nameAr') {
        setNameAr(value);
      } else if (name === 'slug') {
        setSlug(value);
      } else if (name === 'description') {
        setDescription(value);
      } else if (name === 'descriptionAr') {
        setDescriptionAr(value);
      } else if (name === 'price') {
        setPrice(value);
      } else if (name === 'discountPrice') {
        setDiscountPrice(value);
      } else if (name === 'sku') {
        setSku(value);
      } else if (name === 'stockQuantity') {
        setStockQuantity(value);
      } else if (name === 'categoryId') {
        setCategoryId(value);
      } else if (name === 'subcategoryId') {
        setSubcategoryId(value);
      } else if (name === 'weight') {
        setWeight(value);
      } else if (name === 'origin') {
        setOrigin(value);
      } else if (name === 'roastLevel') {
        setRoastLevel(value);
      } else if (name === 'dimensions') {
        setDimensions(value);
      }
    }
  };
  
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setGalleryFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews
      const newPreviews: string[] = [];
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === newFiles.length) {
            setGalleryPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleVariationsChange = (variations: ProductVariation[]) => {
    setProductVariations(variations);
  };
  
  const uploadImages = async (): Promise<UploadResults> => {
    setIsUploading(true);
    const results: UploadResults = {};
    
    try {
      // Upload main image if a new one was selected
      if (mainImageFile) {
        const formData = new FormData();
        formData.append('file', mainImageFile);
        formData.append('folder', 'products');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload main image');
        }
        
        const data = await response.json();
        results.mainImageUrl = data.url;
      }
      
      // Upload gallery images if new ones were added
      if (galleryFiles.length > 0) {
        const uploadedUrls: string[] = [];
        
        for (const file of galleryFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'products/gallery');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload gallery image');
          }
          
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
        
        results.galleryUrls = uploadedUrls;
      }
      
      return results;
    } catch (err) {
      console.error('Error uploading images:', err);
      throw new Error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  // Additional validation before submitting
  const validateForm = () => {
    // Check required fields
    if (!name || !slug || !price || !categoryId) {
      setError(t('required_fields_error', 'Name, slug, price and category are required'));
      return false;
    }
    
    // Check price format
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError(t('invalid_price', 'Price must be a positive number'));
      return false;
    }
    
    // Check discount price format if provided
    if (discountPrice && (isNaN(parseFloat(discountPrice)) || parseFloat(discountPrice) <= 0)) {
      setError(t('invalid_discount_price', 'Discount price must be a positive number'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }
      
      // Upload images if any were selected
      let uploadResults: UploadResults = {};
      if (mainImageFile || galleryFiles.length > 0) {
        uploadResults = await uploadImages();
      }
      
      // Prepare data for API
      const productData = {
        name,
        nameAr,
        slug,
        description,
        descriptionAr,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        sku,
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        weight: weight ? parseFloat(weight) : null,
        origin,
        roastLevel,
        dimensions,
        imageUrl: uploadResults.mainImageUrl || mainImagePreview,
        isActive,
        isFeatured,
        newGalleryImages: uploadResults.galleryUrls || [],
        variations: productVariations.map(v => ({
          id: v.id && !v.id.startsWith('temp_') ? v.id : undefined,
          sizeId: v.sizeId,
          typeId: v.typeId,
          beansId: v.beansId,
          price: v.price,
          sku: v.sku,
          stockQuantity: v.stockQuantity,
          isActive: v.isActive
        }))
      };
      
      // Call API to update product
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error Response:", errorData);
        const errorMessage = errorData.error || 'Failed to update product';
        const errorDetails = errorData.details || '';
        
        // Handle specific errors
        if (errorMessage.includes('SKU')) {
          setError(`${errorMessage} Please check your product and variation SKUs for duplicates.`);
        } else if (errorMessage.includes('slug')) {
          setError(`${errorMessage} Please change the slug to a unique value.`);
        } else {
          setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
        }
        
        // Don't throw the error, handle it locally
        console.error('Error response from API:', errorMessage, errorDetails);
        setIsSubmitting(false);
        return; // Exit the function early
      }
      
      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      setSuccessMessage('Product updated successfully');
      
      // Reset file state after successful upload
      setMainImageFile(null);
      setGalleryFiles([]);
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return the UI for the form
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('edit_product', 'Edit Product')}</h1>
        <Link 
          href="/backend/products" 
          className="text-green-700 hover:underline"
        >
          &larr; {t('back_to_products', 'Back to Products')}
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="w-full flex justify-center py-8">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">{t('basic_information', 'Basic Information')}</h2>
              
              {/* Name fields - English and Arabic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('product_name_en', 'Product Name (English)')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. Colombian Coffee Beans"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('product_name_ar', 'Product Name (Arabic)')}
                  </label>
                  <input
                    type="text"
                    id="nameAr"
                    name="nameAr"
                    value={nameAr}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="اسم المنتج بالعربية"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('slug', 'Slug')} *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. colombian-coffee-beans"
                  required
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('slug_description', 'Used in URL. Auto-generated from English name but can be edited.')}
                </p>
              </div>
              
              {/* Description fields - English and Arabic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description_en', 'Description (English)')}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Describe the product in English..."
                    rows={5}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="descriptionAr" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description_ar', 'Description (Arabic)')}
                  </label>
                  <textarea
                    id="descriptionAr"
                    name="descriptionAr"
                    value={descriptionAr}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="وصف المنتج بالعربية..."
                    rows={5}
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (AED) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. 29.99"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price (AED)
                  </label>
                  <input
                    type="number"
                    id="discountPrice"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. 24.99"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. COFFEE-COL-001"
                  />
                </div>
                
                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    id="stockQuantity"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g. 100"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Categories and Images */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Categories & Media</h2>
              
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {subcategories.length > 0 && (
                <div>
                  <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    id="subcategoryId"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Product Image
                </label>
                <div className="mt-1 border-2 border-gray-300 border-dashed rounded-md p-4">
                  {mainImagePreview ? (
                    <div className="mb-3 text-center">
                      <img
                        src={mainImagePreview}
                        alt="Product preview"
                        className="mx-auto h-40 w-40 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMainImageFile(null);
                          setMainImagePreview(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-gray-600">
                        Click to upload main product image
                      </p>
                    </div>
                  )}
                  <input
                    id="main-image"
                    type="file"
                    className="sr-only"
                    onChange={handleMainImageChange}
                    accept="image/*"
                  />
                  <label
                    htmlFor="main-image"
                    className="cursor-pointer block text-center text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    {mainImagePreview ? "Change image" : "Upload image"}
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Images
                </label>
                <div className="mt-1 border-2 border-gray-300 border-dashed rounded-md p-4">
                  {galleryPreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Gallery ${index + 1}`}
                            className="h-20 w-full object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="text-center p-2">
                    <input
                      id="gallery-images"
                      type="file"
                      className="sr-only"
                      onChange={handleGalleryImageChange}
                      accept="image/*"
                      multiple
                    />
                    <label
                      htmlFor="gallery-images"
                      className="cursor-pointer block text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      Add gallery images
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Product Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (g)
                </label>
                <input
                  type="number"
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. 250"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. Colombia"
                />
              </div>
              
              <div>
                <label htmlFor="roastLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Roast Level
                </label>
                <select
                  id="roastLevel"
                  value={roastLevel}
                  onChange={(e) => setRoastLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select roast level</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="dark">Dark</option>
                  <option value="espresso">Espresso</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              <input
                type="text"
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="e.g. 10x5x2 cm"
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active (visible on store)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                  Featured product
                </label>
              </div>
            </div>
          </div>
          
          {/* Product Variations Section */}
          <div className="border rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('product_variations', 'Product Variations')}</h2>
              <button
                type="button"
                onClick={() => setShowVariations(!showVariations)}
                className="text-green-700 hover:text-green-900"
              >
                {showVariations ? t('hide_variations', 'Hide Variations') : t('show_variations', 'Show Variations')}
              </button>
            </div>
            
            {showVariations ? (
              <ProductVariations
                productId={productId}
                onChange={handleVariationsChange}
                variations={productVariations}
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 text-sm">
                  {t('variations_help', 'You can add variations to this product (different sizes, types, etc.). Click "Show Variations" to manage them.')}
                </p>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t flex justify-end">
            <Link
              href="/backend/products"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className={`bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition ${
                (isSubmitting || isUploading) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 