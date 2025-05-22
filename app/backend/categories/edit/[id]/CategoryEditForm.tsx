'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parentId?: string;
}

interface CategoryEditFormProps {
  categoryId: string;
}

export function CategoryEditForm({ categoryId }: CategoryEditFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  // English fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  
  // Arabic fields
  const [nameAr, setNameAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  
  // Other fields
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the category data
  useEffect(() => {
    if (!categoryId) {
      setError('Category ID is missing');
      setIsLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/categories/${categoryId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch category');
        }
        
        const category = await response.json();
        
        // Populate form with category data
        setName(category.name || '');
        setNameAr(category.nameAr || '');
        setSlug(category.slug || '');
        setDescription(category.description || '');
        setDescriptionAr(category.descriptionAr || '');
        setParentId(category.parentId || '');
        setIsActive(category.isActive);
        
        if (category.imageUrl) {
          // Ensure the image URL is properly formed
          let imageUrl = category.imageUrl;
          
          // If the URL doesn't start with http or /, add a leading /
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `/${imageUrl}`;
          }
          
          console.log('Category image URL:', imageUrl);
          setCurrentImageUrl(imageUrl);
          setImagePreview(imageUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching category:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  // Fetch parent categories
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        // Filter out the current category to prevent self-reference
        const filteredCategories = categoryId 
          ? data.filter((cat: Category) => cat.id !== categoryId) 
          : data;
        
        setParentCategories(filteredCategories);
      } catch (err) {
        console.error('Error fetching parent categories:', err);
        setError('Failed to load parent categories');
      }
    };

    fetchParentCategories();
  }, [categoryId]);

  // Generate slug from name (only if slug hasn't been manually edited)
  useEffect(() => {
    if (name && slug === '') {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [name, slug]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.type}. Please use JPG, PNG, WEBP, or AVIF.`);
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return currentImageUrl;
    
    setIsUploading(true);
    
    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folder', 'categories');
      
      console.log('Uploading category image:', {
        filename: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });
      
      // Try the server-side upload endpoint first
      const endpoint = '/api/upload-file';
      
      // Upload the image with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
          signal: controller.signal
      });
        
        clearTimeout(timeoutId);
        
        console.log('Upload response status:', response.status);
      
      if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: 'Server returned an invalid response' };
          }
          console.error('Upload API Error:', errorData);
          throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
        console.log('Upload successful, response:', data);
        
        // Return the URL of the uploaded image
        let imageUrl = data.url || data.file;
        
        // Ensure the URL starts with a slash
        if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
          imageUrl = `/${imageUrl}`;
        }
        
        console.log('Using image URL:', imageUrl);
        
        // Save the raw file data to localStorage for recovery if needed
        if (data.fileData) {
          try {
            const key = `file_data_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
            localStorage.setItem(key, data.fileData);
            console.log('File data saved to localStorage for recovery if needed');
          } catch (e) {
            console.warn('Could not save file data to localStorage:', e);
          }
        }
        
        return imageUrl;
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timed out. Please try again with a smaller image.');
        }
        
        // If server-side upload fails, try the edge runtime upload as fallback
        console.log('Server upload failed, trying edge runtime upload as fallback');
        const fallbackResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!fallbackResponse.ok) {
          const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Fallback upload failed:', errorData);
          throw new Error(errorData.error || 'Failed to upload image');
        }
        
        const fallbackData = await fallbackResponse.json();
        let imageUrl = fallbackData.url || fallbackData.file;
        
        // Ensure the URL starts with a slash
        if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
          imageUrl = `/${imageUrl}`;
        }
        
        console.log('Using fallback image URL:', imageUrl);
        
        // Edge runtime can't save files to disk, so we need to store the data URL
        // in localStorage for recovery later
        if (fallbackData.fileData) {
          try {
            const key = `file_data_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
            localStorage.setItem(key, fallbackData.fileData);
            console.log('File data saved to localStorage for recovery if needed');
            
            // Create a recovery file element for admin use
            const recoveryDiv = document.createElement('div');
            recoveryDiv.className = 'mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs';
            recoveryDiv.innerHTML = `
              <p class="font-semibold text-yellow-800">File uploaded using edge API</p>
              <p class="text-yellow-700">Images will appear after next server deployment</p>
            `;
            
            // Add the recovery div near the image preview
            const previewContainer = document.querySelector('.image-preview-container');
            if (previewContainer) {
              previewContainer.appendChild(recoveryDiv);
            }
          } catch (e) {
            console.warn('Could not save file data to localStorage:', e);
          }
        }
        
        return imageUrl;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!name || !slug) {
        setError('Name and slug are required');
        setIsSubmitting(false);
        return;
      }

      if (!categoryId) {
        setError('Category ID is missing');
        setIsSubmitting(false);
        return;
      }
      
      // Upload image if one is selected
      let imageUrl = currentImageUrl;
      if (imageFile) {
        try {
          imageUrl = await uploadImage();
          console.log('Successfully uploaded image, URL:', imageUrl);
          
          // Ensure the URL starts with a slash if it's a relative URL
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `/${imageUrl}`;
            console.log('Fixed image URL to:', imageUrl);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          setError(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // If current image URL is removed by the user
      if (currentImageUrl && !imageFile && !imagePreview) {
        imageUrl = null;
        console.log('Image removed by user');
      }
      
      // Create the category data object
      const categoryData = {
        name,
        nameAr,
        slug,
        description,
        descriptionAr,
        parentId: parentId || null,
        imageUrl,
        isActive,
      };
      
      console.log('Updating category with data:', categoryData);
      
      // Update category with multilingual data
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      // Redirect to categories list
      router.push('/backend/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !categoryId) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p>{error}</p>
        <Link 
          href="/backend/categories" 
          className="mt-4 inline-block text-green-700 hover:underline"
        >
          &larr; {t('back_to_categories', 'Back to Categories')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('edit_category', 'Edit Category')}</h1>
        <Link 
          href="/backend/categories" 
          className="text-green-700 hover:underline"
        >
          &larr; {t('back_to_categories', 'Back to Categories')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('category_name_en', 'Category Name (English)')} *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="e.g. Coffee Beans"
                required
                dir="ltr"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 mb-1">
                {t('category_name_ar', 'Category Name (Arabic)')}
              </label>
              <input
                type="text"
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="اسم التصنيف بالعربية"
                dir="rtl"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                {t('slug', 'Slug')} *
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="e.g. coffee-beans"
                required
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('slug_description', 'Used in URL. Auto-generated from English name but can be edited.')}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('description_en', 'Description (English)')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Describe this category in English"
                rows={3}
                dir="ltr"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="descriptionAr" className="block text-sm font-medium text-gray-700 mb-1">
                {t('description_ar', 'Description (Arabic)')}
              </label>
              <textarea
                id="descriptionAr"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="وصف التصنيف بالعربية"
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                {t('parent_category', 'Parent Category')}
              </label>
              <select
                id="parentId"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">{t('none_top_level', 'None (Top-level Category)')}</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('parent_category_help', 'Optional. Select a parent category to make this a subcategory.')}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  {t('active', 'Active')}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('inactive_category_help', 'Inactive categories won\'t be displayed on the website.')}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category_image', 'Category Image')}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="mb-4 image-preview-container">
                      {currentImageUrl && !imageFile ? (
                        <div>
                          <Image 
                            src={currentImageUrl} 
                            alt="Category image" 
                            width={128}
                            height={128}
                            className="mx-auto h-32 w-32 object-cover rounded"
                            onError={(e) => {
                              console.error(`Failed to load image: ${currentImageUrl}`);
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              // Add a colored background
                              target.style.display = 'none';
                              // Create a replacement div with background color
                              const parent = target.parentElement;
                              if (parent) {
                                const replacementDiv = document.createElement('div');
                                replacementDiv.className = 'mx-auto h-32 w-32 rounded bg-gray-200 flex items-center justify-center';
                                replacementDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                parent.appendChild(replacementDiv);
                              }
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-1">Image URL: {currentImageUrl}</p>
                        </div>
                      ) : (
                        <div>
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mx-auto h-32 w-32 object-cover rounded"
                            onError={(e) => {
                              console.error(`Failed to load preview image`);
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              // Add a colored background
                              target.style.display = 'none';
                              // Create a replacement div with background color
                              const parent = target.parentElement;
                              if (parent) {
                                const replacementDiv = document.createElement('div');
                                replacementDiv.className = 'mx-auto h-32 w-32 rounded bg-gray-200 flex items-center justify-center';
                                replacementDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                parent.appendChild(replacementDiv);
                              }
                            }}
                          />
                          {imageFile && <p className="text-xs text-gray-500 mt-1">New file: {imageFile.name}</p>}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          if (currentImageUrl) {
                            if (!imageFile) {
                              // If removing the current image without a new one
                              setImagePreview(null);
                              setCurrentImageUrl(null);
                              console.log('Current image removed');
                            } else {
                              // If canceling a new image upload, go back to current image
                              setImagePreview(currentImageUrl);
                            }
                          } else {
                            setImagePreview(null);
                          }
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        {currentImageUrl && !imageFile ? t('remove_current_image', 'Remove Current Image') : t('remove', 'Remove')}
                      </button>
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>{t('upload_image', 'Upload an image')}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">{t('or_drag_drop', 'or drag and drop')}</p>
                  </div>
                  <p className="text-xs text-gray-500">{t('image_formats', 'JPG, PNG, WEBP, AVIF up to 5MB')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/backend/categories"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-300 transition"
          >
            {t('cancel', 'Cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className={`bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition ${
              (isSubmitting || isUploading) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? t('updating', 'Updating...') : t('update_category', 'Update Category')}
          </button>
        </div>
      </form>
    </div>
  );
} 