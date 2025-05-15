'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';

interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  backgroundColor: string;
  order: number;
  isActive: boolean;
}

export default function SlidersPage() {
  const { t } = useLanguage();
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<SliderItem | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#f4f6f8');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch sliders
  useEffect(() => {
    const fetchSliders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/sliders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch sliders');
        }
        
        const data = await response.json();
        setSliders(data);
      } catch (err) {
        console.error('Error fetching sliders:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSliders();
  }, []);

  // Handle opening the modal for adding/editing
  const handleOpenModal = (slider: SliderItem | null = null) => {
    if (slider) {
      // Editing existing slider
      setCurrentSlider(slider);
      setTitle(slider.title);
      setSubtitle(slider.subtitle);
      setButtonText(slider.buttonText);
      setButtonLink(slider.buttonLink);
      setBackgroundColor(slider.backgroundColor);
      setOrder(slider.order);
      setIsActive(slider.isActive);
      setImagePreview(slider.imageUrl);
    } else {
      // Adding new slider
      setCurrentSlider(null);
      setTitle('');
      setSubtitle('');
      setButtonText('');
      setButtonLink('/shop');
      setBackgroundColor('#f4f6f8');
      setOrder(sliders.length);
      setIsActive(true);
      setImagePreview(null);
    }
    
    setImageFile(null);
    setIsModalOpen(true);
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSlider(null);
  };
  
  // Handle image change
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Upload image if a new one was selected
      let imageUrl = currentSlider?.imageUrl || '';
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'sliders');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }
      
      // Prepare slider data
      const sliderData = {
        id: currentSlider?.id,
        title,
        subtitle,
        buttonText,
        buttonLink,
        backgroundColor,
        imageUrl,
        order,
        isActive
      };
      
      // API endpoint and method
      const url = currentSlider ? `/api/sliders/${currentSlider.id}` : '/api/sliders';
      const method = currentSlider ? 'PUT' : 'POST';
      
      // Save slider
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sliderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save slider');
      }
      
      // Update local state
      const savedSlider = await response.json();
      
      if (currentSlider) {
        // Update existing slider in list
        setSliders(prevSliders => 
          prevSliders.map(slider => 
            slider.id === savedSlider.id ? savedSlider : slider
          )
        );
      } else {
        // Add new slider to list
        setSliders(prevSliders => [...prevSliders, savedSlider]);
      }
      
      // Close modal
      handleCloseModal();
    } catch (err) {
      console.error('Error saving slider:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle slider deletion
  const handleDeleteSlider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slider?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sliders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete slider');
      }
      
      // Remove deleted slider from list
      setSliders(prevSliders => 
        prevSliders.filter(slider => slider.id !== id)
      );
    } catch (err) {
      console.error('Error deleting slider:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <h1 className="text-2xl font-bold">{t('hero_sliders', 'Hero Sliders')}</h1>
            <p className="text-gray-600">{t('manage_hero_sliders', 'Manage the sliders that appear on your homepage')}</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('add_slider', 'Add Slider')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {sliders.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 p-8 rounded-md text-center">
            <p className="mb-4">{t('no_sliders', 'No sliders have been created yet.')}</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
            >
              {t('create_first_slider', 'Create Your First Slider')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('image', 'Image')}
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('title', 'Title')}
                  </th>
                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('button', 'Button')}
                  </th>
                  <th className="px-6 py-3 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('order', 'Order')}
                  </th>
                  <th className="px-6 py-3 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', 'Status')}
                  </th>
                  <th className="px-6 py-3 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sliders.map((slider) => (
                  <tr key={slider.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative h-16 w-24">
                        {slider.imageUrl ? (
                          <Image
                            src={slider.imageUrl}
                            alt={slider.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-24 bg-gray-200 flex items-center justify-center rounded">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{slider.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{slider.subtitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{slider.buttonText}</p>
                      <p className="text-xs text-gray-500">{slider.buttonLink}</p>
                    </td>
                    <td className="px-6 py-4 text-center">{slider.order}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        slider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slider.isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => handleOpenModal(slider)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('edit', 'Edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteSlider(slider.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('delete', 'Delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding/editing sliders */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                {currentSlider ? t('edit_slider', 'Edit Slider') : t('add_slider', 'Add Slider')}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      {t('title', 'Title')} *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700">
                      {t('subtitle', 'Subtitle')} *
                    </label>
                    <textarea
                      id="subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700">
                        {t('button_text', 'Button Text')} *
                      </label>
                      <input
                        type="text"
                        id="buttonText"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700">
                        {t('button_link', 'Button Link')} *
                      </label>
                      <input
                        type="text"
                        id="buttonLink"
                        value={buttonLink}
                        onChange={(e) => setButtonLink(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                        {t('background_color', 'Background Color')} *
                      </label>
                      <input
                        type="color"
                        id="backgroundColor"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                        {t('display_order', 'Display Order')}
                      </label>
                      <input
                        type="number"
                        id="order"
                        value={order}
                        onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  <div>
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
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('slide_image', 'Slide Image')} *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div className="relative h-40 w-full mb-4">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
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
                        )}
                        
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                          >
                            <span>{t('upload_image', 'Upload image')}</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                              required={!currentSlider}
                            />
                          </label>
                          <p className="pl-1">{t('or_drag_and_drop', 'or drag and drop')}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t('image_formats', 'PNG, JPG, GIF up to 5MB')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t('slider_preview', 'Slider Preview')}
                    </h3>
                    <div
                      className="h-32 rounded-md flex items-center justify-end p-4 relative overflow-hidden"
                      style={{ backgroundColor }}
                    >
                      <div className="text-right max-w-[60%] z-10">
                        <h3 className="text-lg font-bold">{title || 'Slider Title'}</h3>
                        <p className="text-sm">{subtitle || 'Slider subtitle text here'}</p>
                        <button className="mt-2 bg-black text-white text-xs px-3 py-1 rounded inline-block">
                          {buttonText || 'Button'}
                        </button>
                      </div>
                      {imagePreview && (
                        <div className="absolute left-4 bottom-0 h-full w-1/2 flex items-end">
                          <div className="relative h-28 w-28">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('saving', 'Saving...') : (currentSlider ? t('update', 'Update') : t('create', 'Create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BackendLayout>
  );
} 