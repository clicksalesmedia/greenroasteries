'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface OfferBanner {
  id: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonLink: string;
  imageUrl: string;
  backgroundColor: string;
  textColor?: string;
  buttonColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: 'Classic', bg: '#ffffff', text: '#000000', button: '#000000', overlay: 'rgba(0,0,0,0.3)' },
  { name: 'Dark', bg: '#1a1a1a', text: '#ffffff', button: '#c9a961', overlay: 'rgba(0,0,0,0.5)' },
  { name: 'Coffee', bg: '#3e2723', text: '#ffffff', button: '#8d6e63', overlay: 'rgba(62,39,35,0.7)' },
  { name: 'Cream', bg: '#f5f5dc', text: '#3e2723', button: '#3e2723', overlay: 'rgba(0,0,0,0.4)' },
  { name: 'Modern', bg: '#f8f9fa', text: '#212529', button: '#212529', overlay: 'rgba(0,0,0,0.3)' }
];

export default function OfferBannerPage() {
  const { t } = useLanguage();
  const [banner, setBanner] = useState<OfferBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [editingBanner, setEditingBanner] = useState<Partial<OfferBanner>>({
    title: '',
    titleAr: '',
    subtitle: '',
    subtitleAr: '',
    buttonText: 'Shop Now',
    buttonTextAr: 'تسوق الآن',
    buttonLink: '/shop',
    imageUrl: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#000000',
    overlayColor: 'rgba(0,0,0,0.3)',
    overlayOpacity: 30,
    isActive: true
  });

  // Fetch banner data
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/offer-banner');
        
        if (response.ok) {
          const data = await response.json();
          setBanner(data);
        } else if (response.status !== 404) {
          throw new Error('Failed to fetch banner');
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
    if (banner) {
      // Editing existing banner
      setEditingBanner({
        title: banner.title,
        titleAr: banner.titleAr || '',
        subtitle: banner.subtitle,
        subtitleAr: banner.subtitleAr || '',
        buttonText: banner.buttonText,
        buttonTextAr: banner.buttonTextAr || '',
        buttonLink: banner.buttonLink,
        imageUrl: banner.imageUrl,
        backgroundColor: banner.backgroundColor,
        textColor: banner.textColor || '#000000',
        buttonColor: banner.buttonColor || '#000000',
        overlayColor: banner.overlayColor || 'rgba(0,0,0,0.3)',
        overlayOpacity: banner.overlayOpacity || 30,
        isActive: banner.isActive
      });
    } else {
      // Creating new banner
      setEditingBanner({
        title: '',
        titleAr: '',
        subtitle: '',
        subtitleAr: '',
        buttonText: 'Shop Now',
        buttonTextAr: 'تسوق الآن',
        buttonLink: '/shop',
        imageUrl: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#000000',
        overlayColor: 'rgba(0,0,0,0.3)',
        overlayOpacity: 30,
        isActive: true
      });
    }
    
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
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
      setEditingBanner({ ...editingBanner, imageUrl: data.url });
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
    
    try {
      // Validate required fields
      if (!editingBanner.title || !editingBanner.subtitle || !editingBanner.buttonText || !editingBanner.buttonLink) {
        throw new Error('Please fill in all required fields');
      }

      if (!editingBanner.imageUrl) {
        throw new Error('Please upload a background image');
      }

      // Prepare banner data
      const bannerData = {
        title: editingBanner.title,
        titleAr: editingBanner.titleAr,
        subtitle: editingBanner.subtitle,
        subtitleAr: editingBanner.subtitleAr,
        buttonText: editingBanner.buttonText,
        buttonTextAr: editingBanner.buttonTextAr,
        buttonLink: editingBanner.buttonLink,
        backgroundColor: editingBanner.backgroundColor,
        textColor: editingBanner.textColor || '#000000',
        buttonColor: editingBanner.buttonColor || '#000000',
        overlayColor: editingBanner.overlayColor || 'rgba(0,0,0,0.3)',
        overlayOpacity: editingBanner.overlayOpacity || 30,
        imageUrl: editingBanner.imageUrl,
        isActive: editingBanner.isActive
      };
      
      // API endpoint and method
      const url = banner ? `/api/offer-banner/${banner.id}` : '/api/offer-banner';
      const method = banner ? 'PUT' : 'POST';
      
      // Save banner
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save banner: ${response.status} ${errorData}`);
      }
      
      // Update local state
      const savedBanner = await response.json();
      setBanner(savedBanner);
      
      // Close modal
      handleCloseModal();
    } catch (err) {
      console.error('Error saving banner:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle banner deletion
  const handleDeleteBanner = async () => {
    if (!banner || !confirm('Are you sure you want to delete this banner?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/offer-banner/${banner.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }
      
      setBanner(null);
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Apply color preset
  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setEditingBanner({
      ...editingBanner,
      backgroundColor: preset.bg,
      textColor: preset.text,
      buttonColor: preset.button,
      overlayColor: preset.overlay
    });
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
            <h1 className="text-2xl font-bold">{t('home_offer_banner', 'Home Offer Banner')}</h1>
            <p className="text-gray-600">{t('offer_banner_description', 'Manage the promotional banner that appears on the homepage')}</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="btn btn-primary flex items-center gap-2"
          >
            {banner ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
            {banner ? 'Edit Banner' : 'Create Banner'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {banner ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Banner Preview */}
            <div className="relative h-64 md:h-80">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
              />
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: banner.overlayColor || 'rgba(0,0,0,0.3)',
                  opacity: (banner.overlayOpacity || 30) / 100
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center max-w-2xl">
                  <h2 
                    className="text-3xl md:text-4xl font-bold mb-4"
                    style={{ color: banner.textColor }}
                  >
                    {banner.title}
                  </h2>
                  <p 
                    className="text-lg md:text-xl mb-6 opacity-90"
                    style={{ color: banner.textColor }}
                  >
                    {banner.subtitle}
                  </p>
                  <button
                    className="px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105"
                    style={{ 
                      backgroundColor: banner.buttonColor,
                      color: banner.backgroundColor
                    }}
                  >
                    {banner.buttonText}
                  </button>
                </div>
              </div>
            </div>

            {/* Banner Details */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{banner.title}</h3>
                  <p className="text-gray-600">{banner.subtitle}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Status: <span className={`font-medium ${banner.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenModal}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    title="Edit Banner"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDeleteBanner}
                    className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                    title="Delete Banner"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Banner Created</h3>
            <p className="text-gray-500 mb-6">Create a promotional banner to showcase special offers on your homepage.</p>
            <button
              onClick={handleOpenModal}
              className="btn btn-primary flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Banner
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {banner ? 'Edit Offer Banner' : 'Create Offer Banner'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title (English) *
                          </label>
                          <input
                            type="text"
                            value={editingBanner.title}
                            onChange={(e) => setEditingBanner({...editingBanner, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                            placeholder="Special Offer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title (Arabic)
                          </label>
                          <input
                            type="text"
                            value={editingBanner.titleAr}
                            onChange={(e) => setEditingBanner({...editingBanner, titleAr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            dir="rtl"
                            placeholder="عرض خاص"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle (English) *
                          </label>
                          <textarea
                            value={editingBanner.subtitle}
                            onChange={(e) => setEditingBanner({...editingBanner, subtitle: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={2}
                            required
                            placeholder="Get up to 50% off on selected items"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle (Arabic)
                          </label>
                          <textarea
                            value={editingBanner.subtitleAr}
                            onChange={(e) => setEditingBanner({...editingBanner, subtitleAr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={2}
                            dir="rtl"
                            placeholder="احصل على خصم يصل إلى 50% على العناصر المختارة"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Button Text (English) *
                          </label>
                          <input
                            type="text"
                            value={editingBanner.buttonText}
                            onChange={(e) => setEditingBanner({...editingBanner, buttonText: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                            placeholder="Shop Now"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Button Text (Arabic)
                          </label>
                          <input
                            type="text"
                            value={editingBanner.buttonTextAr}
                            onChange={(e) => setEditingBanner({...editingBanner, buttonTextAr: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            dir="rtl"
                            placeholder="تسوق الآن"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Link *
                        </label>
                        <input
                          type="text"
                          value={editingBanner.buttonLink}
                          onChange={(e) => setEditingBanner({...editingBanner, buttonLink: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="/shop"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Enter the URL path (e.g., /shop, /products/coffee)</p>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Background Image</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Image *
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={isUploading}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Recommended size: 1920x600px. Max file size: 10MB
                          </p>
                        </div>

                        {isUploading && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm">Uploading...</span>
                          </div>
                        )}

                        {editingBanner.imageUrl && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden">
                            <Image
                              src={editingBanner.imageUrl}
                              alt="Banner preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Design Settings */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Design Settings</h3>
                      
                      {/* Color Presets */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color Presets
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => applyColorPreset(preset)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <input
                            type="color"
                            value={editingBanner.backgroundColor}
                            onChange={(e) => setEditingBanner({...editingBanner, backgroundColor: e.target.value})}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <input
                            type="color"
                            value={editingBanner.textColor}
                            onChange={(e) => setEditingBanner({...editingBanner, textColor: e.target.value})}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Button Color
                          </label>
                          <input
                            type="color"
                            value={editingBanner.buttonColor}
                            onChange={(e) => setEditingBanner({...editingBanner, buttonColor: e.target.value})}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overlay Opacity ({editingBanner.overlayOpacity}%)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingBanner.overlayOpacity}
                            onChange={(e) => setEditingBanner({...editingBanner, overlayOpacity: parseInt(e.target.value)})}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingBanner.isActive}
                            onChange={(e) => setEditingBanner({...editingBanner, isActive: e.target.checked})}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                        <p className="text-sm text-gray-500 mt-1">Only active banner will be shown on the homepage</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Live Preview */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                      
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        {editingBanner.imageUrl ? (
                          <>
                            <Image
                              src={editingBanner.imageUrl}
                              alt="Banner preview"
                              fill
                              className="object-cover"
                            />
                            <div 
                              className="absolute inset-0"
                              style={{
                                backgroundColor: editingBanner.overlayColor || 'rgba(0,0,0,0.3)',
                                opacity: (editingBanner.overlayOpacity || 30) / 100
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <div className="text-center max-w-xs">
                                <h2 
                                  className="text-lg font-bold mb-2"
                                  style={{ color: editingBanner.textColor }}
                                >
                                  {editingBanner.title || 'Banner Title'}
                                </h2>
                                <p 
                                  className="text-sm mb-3 opacity-90"
                                  style={{ color: editingBanner.textColor }}
                                >
                                  {editingBanner.subtitle || 'Banner subtitle goes here'}
                                </p>
                                <button
                                  type="button"
                                  className="px-4 py-2 text-sm rounded-full font-semibold"
                                  style={{ 
                                    backgroundColor: editingBanner.buttonColor,
                                    color: editingBanner.backgroundColor
                                  }}
                                >
                                  {editingBanner.buttonText || 'Button Text'}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <PhotoIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    {banner ? 'Update Banner' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BackendLayout>
  );
} 