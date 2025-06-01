'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { motion } from 'framer-motion';
import { PencilIcon, EyeIcon, XMarkIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';

interface EidBanner {
  id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EidBannerPage() {
  const { t, language } = useLanguage();
  const [banner, setBanner] = useState<EidBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Form state
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  // Fetch banner data
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/eid-banner');
        
        if (response.ok) {
          const data = await response.json();
          setBanner(data);
        } else if (response.status !== 404) {
          console.log('No EID banner found, will create new one');
        }
      } catch (err) {
        console.error('Error fetching banner:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBanner();
  }, []);

  // Handle opening the modal for editing
  const handleOpenModal = () => {
    setNewImageUrl(banner?.imageUrl || '');
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsPreviewMode(false);
    setError(null);
    setSuccess(null);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setNewImageUrl(data.url);
      setSuccess('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!newImageUrl) {
        throw new Error('Please upload an image');
      }

      const method = banner ? 'PUT' : 'POST';
      const url = banner ? `/api/eid-banner/${banner.id}` : '/api/eid-banner';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save banner');
      }

      const data = await response.json();
      setBanner(data);
      setSuccess('EID banner updated successfully!');
      setIsModalOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <BackendLayout activePage="content">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
        </div>
      </BackendLayout>
    );
  }

  return (
    <BackendLayout activePage="content">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{language === 'ar' ? 'بانر عيد الأضحى' : 'EID AL ADHA Banner'}</h1>
            <p className="text-gray-600 mt-2">
              {language === 'ar' 
                ? 'إدارة بانر فئة عيد الأضحى - كتالوج' 
                : 'Manage the banner for EID AL ADHA - CATALOG category'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {banner && (
              <button
                onClick={() => window.open('https://thegreenroasteries.com/shop?category=EID%20AL%20ADHA%20-%20CATALOG', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <EyeIcon className="w-4 h-4" />
                {language === 'ar' ? 'عرض الصفحة' : 'View Live Page'}
              </button>
            )}
            
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <PencilIcon className="w-4 h-4" />
              {banner ? (language === 'ar' ? 'تحديث البانر' : 'Update Banner') : (language === 'ar' ? 'إنشاء بانر' : 'Create Banner')}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </motion.div>
        )}

        {/* Current Banner Display */}
        {banner ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="relative aspect-[21/9] sm:aspect-[16/6] md:aspect-[21/7] lg:aspect-[21/6] max-h-80">
              <Image
                src={banner.imageUrl}
                alt={language === 'ar' ? 'بانر عيد الأضحى' : 'EID AL ADHA Banner'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px"
              />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  banner.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {banner.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}</span>
                  <span className="ml-2">{new Date(banner.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium">{language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}</span>
                  <span className="ml-2">{new Date(banner.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا يوجد بانر' : 'No Banner Created'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'ar' 
                ? 'قم بإنشاء بانر جديد لفئة عيد الأضحى - كتالوج' 
                : 'Create a new banner for the EID AL ADHA - CATALOG category'}
            </p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إنشاء بانر' : 'Create Banner'}
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {banner ? (language === 'ar' ? 'تحديث بانر عيد الأضحى' : 'Update EID Banner') : (language === 'ar' ? 'إنشاء بانر عيد الأضحى' : 'Create EID Banner')}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-800 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-800 text-sm font-medium">{success}</span>
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'صورة البانر *' : 'Banner Image *'}
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {newImageUrl ? (
                      <div className="relative aspect-[21/6] mb-4">
                        <Image
                          src={newImageUrl}
                          alt="Banner preview"
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, 600px"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          {language === 'ar' ? 'قم بتحميل صورة البانر' : 'Upload banner image'}
                        </p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      disabled={isUploading}
                    />
                    
                    {isUploading && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600 mr-2"></div>
                        {language === 'ar' ? 'جاري التحميل...' : 'Uploading...'}
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500">
                    {language === 'ar' 
                      ? 'أفضل حجم: 1200×400 بكسل، الحد الأقصى: 10 ميجابايت' 
                      : 'Recommended size: 1200×400px, Max size: 10MB'}
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !newImageUrl}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                      </div>
                    ) : (
                      banner ? (language === 'ar' ? 'تحديث البانر' : 'Update Banner') : (language === 'ar' ? 'إنشاء البانر' : 'Create Banner')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </BackendLayout>
  );
} 