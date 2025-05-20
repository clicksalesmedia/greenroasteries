'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowPathIcon, CheckIcon, XMarkIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface SliderItem {
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
  overlayImageUrl?: string;
  order: number;
  isActive: boolean;
  // Adding new fields for enhanced animation options
  textAnimation?: string;
  imageAnimation?: string;
  transitionSpeed?: 'slow' | 'medium' | 'fast';
}

// Animation presets for the slider
const ANIMATION_PRESETS = {
  text: [
    { name: 'fade-up', value: 'fade-up', description: 'Fade in from bottom' },
    { name: 'fade-down', value: 'fade-down', description: 'Fade in from top' },
    { name: 'fade-left', value: 'fade-left', description: 'Fade in from left' },
    { name: 'fade-right', value: 'fade-right', description: 'Fade in from right' },
    { name: 'zoom-in', value: 'zoom-in', description: 'Zoom in effect' },
    { name: 'slide-up', value: 'slide-up', description: 'Slide up effect' },
  ],
  image: [
    { name: 'fade-in', value: 'fade-in', description: 'Simple fade in' },
    { name: 'zoom-in', value: 'zoom-in', description: 'Zoom in effect' },
    { name: 'slide-up', value: 'slide-up', description: 'Slide up effect' },
    { name: 'slide-in-right', value: 'slide-in-right', description: 'Slide in from right' },
    { name: 'slide-in-left', value: 'slide-in-left', description: 'Slide in from left' },
    { name: 'bounce', value: 'bounce', description: 'Bounce effect' },
  ],
  speed: [
    { name: 'Slow', value: 'slow' },
    { name: 'Medium', value: 'medium' },
    { name: 'Fast', value: 'fast' },
  ]
};

export default function SlidersPage() {
  const { t } = useLanguage();
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<SliderItem | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewDirection, setPreviewDirection] = useState(0);
  
  // Form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonTextAr, setButtonTextAr] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#f4f6f8');
  const [textColor, setTextColor] = useState('#111111');
  const [buttonColor, setButtonColor] = useState('#111111');
  const [overlayColor, setOverlayColor] = useState('rgba(0,0,0,0)');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayImageFile, setOverlayImageFile] = useState<File | null>(null);
  const [overlayImagePreview, setOverlayImagePreview] = useState<string | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // New animation fields
  const [textAnimation, setTextAnimation] = useState('fade-up');
  const [imageAnimation, setImageAnimation] = useState('fade-in');
  const [transitionSpeed, setTransitionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');

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
        // Sort sliders by order field
        const sortedSliders = [...data].sort((a, b) => a.order - b.order);
        setSliders(sortedSliders);
      } catch (err) {
        console.error('Error fetching sliders:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSliders();
  }, []);

  // Generate animation preview settings for modal
  const previewSettings = useMemo(() => {
    if (!currentSlider && !isModalOpen) return {};
    
    return {
      textVariants: {
        hidden: textAnimation === 'fade-up' ? { opacity: 0, y: 30 } :
                textAnimation === 'fade-down' ? { opacity: 0, y: -30 } :
                textAnimation === 'fade-left' ? { opacity: 0, x: -30 } :
                textAnimation === 'fade-right' ? { opacity: 0, x: 30 } :
                textAnimation === 'zoom-in' ? { opacity: 0, scale: 0.9 } :
                textAnimation === 'slide-up' ? { opacity: 0, y: 50 } :
                { opacity: 0 },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: {
            duration: transitionSpeed === 'slow' ? 0.8 : transitionSpeed === 'medium' ? 0.5 : 0.3,
            ease: [0.4, 0, 0.2, 1]
          }
        }
      },
      imageVariants: {
        hidden: imageAnimation === 'fade-in' ? { opacity: 0 } :
                imageAnimation === 'zoom-in' ? { opacity: 0, scale: 0.8 } :
                imageAnimation === 'slide-up' ? { opacity: 0, y: 40 } :
                imageAnimation === 'slide-in-right' ? { opacity: 0, x: 50 } :
                imageAnimation === 'slide-in-left' ? { opacity: 0, x: -50 } :
                imageAnimation === 'bounce' ? { opacity: 0, y: 50 } :
                { opacity: 0 },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: {
            type: imageAnimation === 'bounce' ? 'spring' : 'tween',
            bounce: imageAnimation === 'bounce' ? 0.5 : undefined,
            duration: transitionSpeed === 'slow' ? 0.9 : transitionSpeed === 'medium' ? 0.6 : 0.4,
            delay: transitionSpeed === 'slow' ? 0.3 : transitionSpeed === 'medium' ? 0.2 : 0.1,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }
      }
    };
  }, [textAnimation, imageAnimation, transitionSpeed, currentSlider, isModalOpen]);

  // Handle opening the modal for adding/editing
  const handleOpenModal = (slider: SliderItem | null = null) => {
    if (slider) {
      // Editing existing slider
      setCurrentSlider(slider);
      setTitle(slider.title);
      setTitleAr(slider.titleAr || '');
      setSubtitle(slider.subtitle);
      setSubtitleAr(slider.subtitleAr || '');
      setButtonText(slider.buttonText);
      setButtonTextAr(slider.buttonTextAr || '');
      setButtonLink(slider.buttonLink);
      setBackgroundColor(slider.backgroundColor);
      setTextColor(slider.textColor || '#111111');
      setButtonColor(slider.buttonColor || '#111111');
      setOverlayColor(slider.overlayColor || 'rgba(0,0,0,0)');
      setOverlayOpacity(slider.overlayOpacity || 0);
      setOverlayImagePreview(slider.overlayImageUrl || null);
      setOrder(slider.order);
      setIsActive(slider.isActive);
      setImagePreview(slider.imageUrl);
      // Set animation properties with defaults if not defined
      setTextAnimation(slider.textAnimation || 'fade-up');
      setImageAnimation(slider.imageAnimation || 'fade-in');
      setTransitionSpeed(slider.transitionSpeed || 'medium');
    } else {
      // Adding new slider
      setCurrentSlider(null);
      setTitle('');
      setTitleAr('');
      setSubtitle('');
      setSubtitleAr('');
      setButtonText('');
      setButtonTextAr('');
      setButtonLink('/shop');
      setBackgroundColor('#f4f6f8');
      setTextColor('#111111');
      setButtonColor('#111111');
      setOverlayColor('rgba(0,0,0,0)');
      setOverlayOpacity(0);
      setOverlayImagePreview(null);
      setOrder(sliders.length);
      setIsActive(true);
      setImagePreview(null);
      // Set default animation settings for new sliders
      setTextAnimation('fade-up');
      setImageAnimation('fade-in');
      setTransitionSpeed('medium');
    }
    
    setImageFile(null);
    setOverlayImageFile(null);
    setIsModalOpen(true);
    setIsPreviewMode(false);
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSlider(null);
    setIsPreviewMode(false);
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
  
  // Handle overlay image change
  const handleOverlayImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOverlayImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOverlayImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle preview toggle
  const handleTogglePreview = () => {
    setIsPreviewMode(prevMode => !prevMode);
    setPreviewIndex(0);
  };
  
  // Preview navigation
  const nextPreviewSlide = () => {
    setPreviewDirection(1);
    setPreviewIndex(prev => (prev === 1 ? 0 : 1)); // Toggle between 0 and 1 for preview
  };
  
  const prevPreviewSlide = () => {
    setPreviewDirection(-1);
    setPreviewIndex(prev => (prev === 0 ? 1 : 0)); // Toggle between 0 and 1 for preview
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
      
      // Upload overlay image if selected
      let overlayImageUrl = currentSlider?.overlayImageUrl || '';
      
      if (overlayImageFile) {
        const overlayFormData = new FormData();
        overlayFormData.append('file', overlayImageFile);
        overlayFormData.append('folder', 'sliders/overlays');
        
        const overlayUploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: overlayFormData,
        });
        
        if (!overlayUploadResponse.ok) {
          throw new Error('Failed to upload overlay image');
        }
        
        const overlayUploadData = await overlayUploadResponse.json();
        overlayImageUrl = overlayUploadData.url;
      }
      
      // Prepare slider data
      const sliderData = {
        id: currentSlider?.id,
        title,
        titleAr,
        subtitle,
        subtitleAr,
        buttonText,
        buttonTextAr,
        buttonLink,
        backgroundColor,
        textColor,
        buttonColor,
        overlayColor,
        overlayOpacity,
        overlayImageUrl,
        imageUrl,
        order,
        isActive,
        // Include animation properties
        textAnimation,
        imageAnimation,
        transitionSpeed
      };
      
      console.log('Submitting slider data:', JSON.stringify(sliderData, null, 2));
      
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
        const errorData = await response.text();
        console.error('Server response:', response.status, errorData);
        throw new Error(`Failed to save slider: ${response.status} ${errorData}`);
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
          <motion.button
            onClick={() => handleOpenModal()}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition flex items-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            {t('add_slider', 'Add Slider')}
          </motion.button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-700 p-4 rounded-md mb-4 flex items-center"
          >
            <XMarkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {sliders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 p-8 rounded-lg text-center"
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">{t('no_sliders', 'No sliders have been created yet')}</h3>
            <p className="text-yellow-700 mb-4">{t('sliders_description', 'Sliders help showcase your products and promotions on the homepage.')}</p>
            <motion.button
              onClick={() => handleOpenModal()}
              className="bg-yellow-600 text-white px-5 py-2.5 rounded-lg hover:bg-yellow-700 transition font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('create_first_slider', 'Create Your First Slider')}
            </motion.button>
          </motion.div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('image', 'Image')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('title', 'Title')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('animation', 'Animation')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('order', 'Order')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status', 'Status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sliders.map((slider, index) => (
                    <motion.tr 
                      key={slider.id} 
                      className="hover:bg-gray-50 transition"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-20 w-32 bg-gray-100 rounded-md overflow-hidden">
                          {slider.imageUrl ? (
                            <Image
                              src={slider.imageUrl}
                              alt={slider.title}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-20 w-32 bg-gray-200 flex items-center justify-center rounded-md">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{slider.title}</p>
                          <p className="text-sm text-gray-500 truncate mt-1">{slider.subtitle}</p>
                          <div className="flex space-x-1 items-center mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {slider.buttonText}
                            </span>
                            <span className="text-xs text-gray-500">→</span>
                            <span className="text-xs text-gray-500 truncate">{slider.buttonLink}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center mb-1.5">
                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                            <span>Text: {slider.textAnimation || 'fade-up'}</span>
                          </div>
                          <div className="flex items-center mb-1.5">
                            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                            <span>Image: {slider.imageAnimation || 'fade-in'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                            <span>Speed: {slider.transitionSpeed || 'medium'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <div className="flex flex-col items-center space-y-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {slider.order}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300" 
                                style={{ backgroundColor: slider.backgroundColor }}
                                title="Background Color"
                              ></div>
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300" 
                                style={{ backgroundColor: slider.textColor || '#111111' }}
                                title="Text Color"
                              ></div>
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300" 
                                style={{ backgroundColor: slider.buttonColor || '#111111' }}
                                title="Button Color"
                              ></div>
                              {(slider.overlayOpacity ?? 0) > 0 && (
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center" 
                                  style={{ 
                                    backgroundColor: slider.overlayColor || 'rgba(0,0,0,0)',
                                    backgroundImage: slider.overlayImageUrl ? `url(${slider.overlayImageUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                  title={`Overlay: ${(slider.overlayOpacity ?? 0) * 100}%${slider.overlayImageUrl ? ' (with image)' : ''}`}
                                >
                                  <span className="text-white text-[8px]">{Math.round((slider.overlayOpacity ?? 0) * 100)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          slider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slider.isActive ? (
                            <><CheckIcon className="w-3 h-3 mr-1" /> {t('active', 'Active')}</>
                          ) : (
                            <><XMarkIcon className="w-3 h-3 mr-1" /> {t('inactive', 'Inactive')}</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleOpenModal(slider)}
                            className="inline-flex items-center rounded-md text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            {t('edit', 'Edit')}
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteSlider(slider.id)}
                            className="inline-flex items-center rounded-md text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            {t('delete', 'Delete')}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding/editing sliders */}
      {isModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentSlider ? t('edit_slider', 'Edit Slider') : t('add_slider', 'Add Slider')}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={handleTogglePreview}
                  className={`flex items-center text-sm px-3 py-1.5 rounded-md ${
                    isPreviewMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {isPreviewMode ? t('editing_mode', 'Edit Mode') : t('preview_mode', 'Preview')}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {isPreviewMode ? (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('slider_preview', 'Slider Preview')}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('preview_description', 'This is how your slider will appear on the homepage in both languages.')}</p>
                  
                  <div className="aspect-[16/9] rounded-xl overflow-hidden relative">
                    <AnimatePresence initial={false} custom={previewDirection} mode="wait">
                      <motion.div
                        key={previewIndex}
                        custom={previewDirection}
                        initial={{
                          x: previewDirection > 0 ? '100%' : '-100%',
                          opacity: 0
                        }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          transition: {
                            x: { duration: transitionSpeed === 'slow' ? 0.8 : transitionSpeed === 'medium' ? 0.6 : 0.4, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.5 }
                          }
                        }}
                        exit={{
                          x: previewDirection < 0 ? '100%' : '-100%',
                          opacity: 0,
                          transition: {
                            x: { duration: transitionSpeed === 'slow' ? 0.8 : transitionSpeed === 'medium' ? 0.6 : 0.4, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.3 }
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ 
                          backgroundColor,
                          backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px)',
                          backgroundSize: '20px 20px',
                          position: 'relative'
                        }}
                      >
                        {/* Background overlay */}
                        {overlayOpacity > 0 && (
                          <div 
                            className="absolute inset-0 z-0" 
                            style={{ 
                              backgroundColor: overlayColor,
                              opacity: overlayOpacity,
                              mixBlendMode: 'multiply',
                              backgroundImage: overlayImagePreview ? `url(${overlayImagePreview})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        )}
                        
                        {/* Preview slide content */}
                        <div className={`absolute ${previewIndex === 0 ? 'left-5% text-left' : 'right-5% text-right rtl'} top-1/2 transform -translate-y-1/2 max-w-[42%] z-10 p-5`}>
                          <motion.div
                            className="space-y-4"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: { 
                                opacity: 1, 
                                transition: { 
                                  staggerChildren: transitionSpeed === 'slow' ? 0.2 : transitionSpeed === 'medium' ? 0.15 : 0.1,
                                  delayChildren: 0.2
                                } 
                              }
                            }}
                          >
                            <motion.h2 
                              className="text-3xl font-bold"
                              variants={previewSettings.textVariants}
                              style={{ color: textColor }}
                            >
                              {previewIndex === 0 ? title || 'Slider Title' : titleAr || 'عنوان الشريحة'}
                            </motion.h2>
                            
                            <motion.p 
                              className="text-base"
                              variants={previewSettings.textVariants}
                              style={{ color: textColor }}
                            >
                              {previewIndex === 0 ? subtitle || 'Slider subtitle text goes here for preview. This is how it will look on your homepage.' : subtitleAr || 'نص العنوان الفرعي للشريحة يذهب هنا للمعاينة. هكذا سيبدو على صفحتك الرئيسية.'}
                            </motion.p>
                            
                            <motion.div variants={previewSettings.textVariants}>
                              <button 
                                className="px-4 py-2 rounded-md text-sm font-medium text-white"
                                style={{ backgroundColor: buttonColor }}
                              >
                                {previewIndex === 0 ? buttonText || 'Button Text' : buttonTextAr || 'نص الزر'}
                              </button>
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* Preview image */}
                        <motion.div 
                          className={`absolute ${previewIndex === 0 ? 'right-4%' : 'left-4%'} bottom-0 h-[85%] w-[45%] flex items-end justify-center`}
                          variants={previewSettings.imageVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {imagePreview ? (
                            <div className="relative h-5/6 w-5/6">
                              <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-contain drop-shadow-lg"
                              />
                            </div>
                          ) : (
                            <div className="h-64 w-64 bg-gray-200 flex items-center justify-center rounded-md">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </motion.div>

                        {/* Preview controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                          {[0, 1].map((idx) => (
                            <div 
                              key={idx}
                              className={`w-10 h-2 rounded-full cursor-pointer transition-all ${previewIndex === idx ? 'bg-black' : 'bg-gray-300'}`}
                              onClick={() => {
                                setPreviewDirection(idx > previewIndex ? 1 : -1);
                                setPreviewIndex(idx);
                              }}
                            />
                          ))}
                        </div>

                        <div className="absolute top-1/2 w-full px-4 flex justify-between transform -translate-y-1/2 z-20 pointer-events-none">
                          <button 
                            onClick={prevPreviewSlide}
                            className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center cursor-pointer shadow-sm hover:bg-white/90 pointer-events-auto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={nextPreviewSlide}
                            className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center cursor-pointer shadow-sm hover:bg-white/90 pointer-events-auto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleTogglePreview}
                    className="px-4 py-2 bg-green-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-800 focus:outline-none"
                  >
                    {t('back_to_editing', 'Back to Editing')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <h3 className="text-base font-medium text-gray-900 pb-2 border-b">{t('content_settings', 'Content Settings')}</h3>
                    
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
                      <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700">
                        {t('title_ar', 'Title (Arabic)')}
                      </label>
                      <input
                        type="text"
                        id="titleAr"
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        dir="rtl"
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
                    
                    <div>
                      <label htmlFor="subtitleAr" className="block text-sm font-medium text-gray-700">
                        {t('subtitle_ar', 'Subtitle (Arabic)')}
                      </label>
                      <textarea
                        id="subtitleAr"
                        value={subtitleAr}
                        onChange={(e) => setSubtitleAr(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        dir="rtl"
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
                        <label htmlFor="buttonTextAr" className="block text-sm font-medium text-gray-700">
                          {t('button_text_ar', 'Button Text (Arabic)')}
                        </label>
                        <input
                          type="text"
                          id="buttonTextAr"
                          value={buttonTextAr}
                          onChange={(e) => setButtonTextAr(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                          dir="rtl"
                        />
                      </div>
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

                    <h3 className="text-base font-medium text-gray-900 pt-4 pb-2 border-b">{t('appearance_settings', 'Appearance Settings')}</h3>
                    
                    <div>
                      <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                        {t('background_color', 'Background Color')} *
                      </label>
                      <div className="mt-1 flex">
                        <input
                          type="color"
                          id="backgroundColor"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-10 w-20 border border-gray-300 rounded-l-md shadow-sm p-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                          required
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1 border border-gray-300 border-l-0 rounded-r-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">
                        {t('text_color', 'Text Color')}
                      </label>
                      <div className="mt-1 flex">
                        <input
                          type="color"
                          id="textColor"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-10 w-20 border border-gray-300 rounded-l-md shadow-sm p-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1 border border-gray-300 border-l-0 rounded-r-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="buttonColor" className="block text-sm font-medium text-gray-700">
                        {t('button_color', 'Button Color')}
                      </label>
                      <div className="mt-1 flex">
                        <input
                          type="color"
                          id="buttonColor"
                          value={buttonColor}
                          onChange={(e) => setButtonColor(e.target.value)}
                          className="h-10 w-20 border border-gray-300 rounded-l-md shadow-sm p-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={buttonColor}
                          onChange={(e) => setButtonColor(e.target.value)}
                          className="flex-1 border border-gray-300 border-l-0 rounded-r-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('background_overlay', 'Background Overlay')}
                      </label>
                      
                      <div>
                        <label htmlFor="overlayColor" className="block text-sm text-gray-600 mb-1">
                          {t('overlay_color', 'Overlay Color')}
                        </label>
                        <div className="flex">
                          <input
                            type="color"
                            id="overlayColor"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            className="h-10 w-20 border border-gray-300 rounded-l-md shadow-sm p-1 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            className="flex-1 border border-gray-300 border-l-0 rounded-r-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="rgba(0,0,0,0)"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="overlayOpacity" className="block text-sm text-gray-600 mb-1">
                          {t('overlay_opacity', 'Overlay Opacity')} ({overlayOpacity})
                        </label>
                        <input
                          type="range"
                          id="overlayOpacity"
                          min="0"
                          max="1"
                          step="0.05"
                          value={overlayOpacity}
                          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          {t('overlay_image', 'Overlay Image')} ({t('optional', 'Optional')})
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                          <div className="space-y-2 text-center">
                            {overlayImagePreview ? (
                              <div className="relative h-32 w-full rounded-md overflow-hidden mb-4">
                                <Image
                                  src={overlayImagePreview}
                                  alt="Overlay Preview"
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOverlayImagePreview(null);
                                    setOverlayImageFile(null);
                                  }}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <svg
                                className="mx-auto h-10 w-10 text-gray-400"
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
                            
                            <div className="flex text-sm justify-center">
                              <label
                                htmlFor="overlay-image-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                              >
                                <span className="px-3 py-2">{t('upload_overlay_image', 'Upload overlay image')}</span>
                                <input
                                  id="overlay-image-upload"
                                  name="overlay-image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleOverlayImageChange}
                                />
                              </label>
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              {t('image_formats', 'PNG, JPG, GIF up to 5MB')}
                            </p>
                            
                            <p className="text-xs text-gray-500 pt-2">
                              {t('overlay_image_rec', 'Images will be stretched to cover the entire background')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                    
                      <div className="flex items-center h-full pt-6">
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
                    
                    <h3 className="text-base font-medium text-gray-900 pt-4 pb-2 border-b">{t('animation_settings', 'Animation Settings')}</h3>
                    
                    <div>
                      <label htmlFor="textAnimation" className="block text-sm font-medium text-gray-700">
                        {t('text_animation', 'Text Animation')}
                      </label>
                      <select
                        id="textAnimation"
                        value={textAnimation}
                        onChange={(e) => setTextAnimation(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        {ANIMATION_PRESETS.text.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.name} - {option.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="imageAnimation" className="block text-sm font-medium text-gray-700">
                        {t('image_animation', 'Image Animation')}
                      </label>
                      <select
                        id="imageAnimation"
                        value={imageAnimation}
                        onChange={(e) => setImageAnimation(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        {ANIMATION_PRESETS.image.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.name} - {option.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="transitionSpeed" className="block text-sm font-medium text-gray-700">
                        {t('transition_speed', 'Transition Speed')}
                      </label>
                      <select
                        id="transitionSpeed"
                        value={transitionSpeed}
                        onChange={(e) => setTransitionSpeed(e.target.value as 'slow' | 'medium' | 'fast')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        {ANIMATION_PRESETS.speed.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('slide_image', 'Slide Image')} *
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-2 text-center">
                          {imagePreview ? (
                            <div className="relative h-48 w-full rounded-md overflow-hidden mb-4">
                              <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview(null);
                                  setImageFile(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
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
                          
                          <div className="flex text-sm justify-center">
                            <label
                              htmlFor="image-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                            >
                              <span className="px-3 py-2">{t('upload_image', 'Upload image')}</span>
                              <input
                                id="image-upload"
                                name="image-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleImageChange}
                                required={!currentSlider || !imagePreview}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            {t('image_formats', 'PNG, JPG, GIF up to 5MB')}
                          </p>
                          
                          <p className="text-xs text-gray-500 pt-2">
                            {t('image_rec', 'Recommended dimensions: 600x600px with transparent background')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-medium text-gray-900">
                          {t('slider_preview', 'Slider Preview')}
                        </h3>
                        <button
                          type="button"
                          onClick={handleTogglePreview}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          {t('fullscreen_preview', 'Fullscreen Preview')}
                        </button>
                      </div>
                      
                      {/* Basic Preview - English */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">{t('english', 'English')}:</div>
                        <div
                          className="h-40 rounded-md flex items-center p-4 relative overflow-hidden"
                          style={{ backgroundColor }}
                        >
                          {/* Preview overlay in small English preview */}
                          {overlayOpacity > 0 && (
                            <div 
                              className="absolute inset-0" 
                              style={{ 
                                backgroundColor: overlayColor,
                                opacity: overlayOpacity,
                                mixBlendMode: 'multiply',
                                backgroundImage: overlayImagePreview ? `url(${overlayImagePreview})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                          )}
                          <div className="text-left max-w-[55%] z-10">
                            <h3 className="text-lg font-bold" style={{ color: textColor }}>{title || 'Slider Title'}</h3>
                            <p className="text-sm line-clamp-2" style={{ color: textColor }}>{subtitle || 'Slider subtitle text here'}</p>
                            <button className="mt-2 text-white text-xs px-3 py-1 rounded inline-block" style={{ backgroundColor: buttonColor }}>
                              {buttonText || 'Button'}
                            </button>
                          </div>
                          {imagePreview && (
                            <div className="absolute right-4 bottom-0 h-full w-1/2 flex items-end justify-center">
                              <div className="relative h-32 w-32">
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
                      
                      {/* Basic Preview - Arabic */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">{t('arabic', 'Arabic')}:</div>
                        <div
                          className="h-40 rounded-md flex items-center p-4 relative overflow-hidden rtl"
                          style={{ backgroundColor }}
                        >
                          {/* Preview overlay in small Arabic preview */}
                          {overlayOpacity > 0 && (
                            <div 
                              className="absolute inset-0" 
                              style={{ 
                                backgroundColor: overlayColor,
                                opacity: overlayOpacity,
                                mixBlendMode: 'multiply',
                                backgroundImage: overlayImagePreview ? `url(${overlayImagePreview})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                          )}
                          <div className="text-right max-w-[55%] z-10">
                            <h3 className="text-lg font-bold" style={{ color: textColor }}>{titleAr || 'عنوان الشريحة'}</h3>
                            <p className="text-sm line-clamp-2" style={{ color: textColor }}>{subtitleAr || 'وصف الشريحة هنا'}</p>
                            <button className="mt-2 text-white text-xs px-3 py-1 rounded inline-block" style={{ backgroundColor: buttonColor }}>
                              {buttonTextAr || 'زر'}
                            </button>
                          </div>
                          {imagePreview && (
                            <div className="absolute left-4 bottom-0 h-full w-1/2 flex items-end justify-center">
                              <div className="relative h-32 w-32">
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
                </div>
                
                <div className="mt-8 border-t pt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-700 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('saving', 'Saving...')}
                      </>
                    ) : currentSlider ? t('update', 'Update') : t('create', 'Create')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </BackendLayout>
  );
} 