'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BackendLayout from '../../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch parent categories
    const fetchParentCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setParentCategories(data);
      } catch (err) {
        console.error('Error fetching parent categories:', err);
        setError('Failed to load parent categories');
      }
    };

    fetchParentCategories();
  }, []);

  // Generate slug from name
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [name]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    
    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folder', 'categories');
      
      // Send the image to your upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.url; // Return the URL of the uploaded image
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
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
      
      // Upload image if one is selected
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      // Create category
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          parentId: parentId || null,
          imageUrl,
          isActive,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }
      
      // Redirect to categories list
      router.push('/backend/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BackendLayout activePage="categories">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('add_new_category', 'Add New Category')}</h1>
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
                  {t('category_name', 'Category Name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="e.g. Coffee Beans"
                  required
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
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('slug_description', 'Used in URL. Auto-generated from name but can be edited.')}
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description', 'Description')}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder={t('describe_category', 'Describe this category')}
                  rows={4}
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
                      <div className="mb-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          {t('remove', 'Remove')}
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
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">{t('or_drag_drop', 'or drag and drop')}</p>
                    </div>
                    <p className="text-xs text-gray-500">{t('image_formats', 'PNG, JPG, GIF up to 5MB')}</p>
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
              {isSubmitting ? t('creating', 'Creating...') : t('create_category', 'Create Category')}
            </button>
          </div>
        </form>
      </div>
    </BackendLayout>
  );
}
