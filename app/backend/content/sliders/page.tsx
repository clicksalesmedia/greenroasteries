'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowPathIcon, CheckIcon, XMarkIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  textAnimation?: string;
  imageAnimation?: string;
  transitionSpeed?: 'slow' | 'medium' | 'fast';
  layout?: string;
  accentColor?: string;
  createdAt: string;
  updatedAt: string;
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

// Enhanced layout options
const LAYOUT_OPTIONS = [
  { value: 'default', label: 'Default (Side by Side)' },
  { value: 'centered', label: 'Centered (Hero Style)' },
  { value: 'split', label: 'Split Screen' },
  { value: 'fullwidth', label: 'Full Width' },
  { value: 'minimal', label: 'Minimal' }
];

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: 'Classic', bg: '#ffffff', text: '#000000', button: '#000000', accent: '#c9a961' },
  { name: 'Dark', bg: '#1a1a1a', text: '#ffffff', button: '#c9a961', accent: '#c9a961' },
  { name: 'Coffee', bg: '#3e2723', text: '#ffffff', button: '#8d6e63', accent: '#d7ccc8' },
  { name: 'Cream', bg: '#f5f5dc', text: '#3e2723', button: '#3e2723', accent: '#8d6e63' },
  { name: 'Modern', bg: '#f8f9fa', text: '#212529', button: '#212529', accent: '#0066cc' }
];

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [editingSlider, setEditingSlider] = useState<Partial<SliderItem>>({
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
    overlayColor: 'rgba(0,0,0,0)',
    overlayOpacity: 0,
    overlayImageUrl: '',
    isActive: true,
    order: 0,
    textAnimation: 'fade-up',
    imageAnimation: 'fade-in',
    transitionSpeed: 'medium',
    layout: 'default',
    accentColor: '#c9a961'
  });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

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
        hidden: editingSlider.textAnimation === 'fade-up' ? { opacity: 0, y: 30 } :
                editingSlider.textAnimation === 'fade-down' ? { opacity: 0, y: -30 } :
                editingSlider.textAnimation === 'fade-left' ? { opacity: 0, x: -30 } :
                editingSlider.textAnimation === 'fade-right' ? { opacity: 0, x: 30 } :
                editingSlider.textAnimation === 'zoom-in' ? { opacity: 0, scale: 0.9 } :
                editingSlider.textAnimation === 'slide-up' ? { opacity: 0, y: 50 } :
                { opacity: 0 },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: {
            duration: editingSlider.transitionSpeed === 'slow' ? 0.8 : editingSlider.transitionSpeed === 'medium' ? 0.5 : 0.3,
            ease: [0.4, 0, 0.2, 1]
          }
        }
      },
      imageVariants: {
        hidden: editingSlider.imageAnimation === 'fade-in' ? { opacity: 0 } :
                editingSlider.imageAnimation === 'zoom-in' ? { opacity: 0, scale: 0.8 } :
                editingSlider.imageAnimation === 'slide-up' ? { opacity: 0, y: 40 } :
                editingSlider.imageAnimation === 'slide-in-right' ? { opacity: 0, x: 50 } :
                editingSlider.imageAnimation === 'slide-in-left' ? { opacity: 0, x: -50 } :
                editingSlider.imageAnimation === 'bounce' ? { opacity: 0, y: 50 } :
                { opacity: 0 },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: {
            type: editingSlider.imageAnimation === 'bounce' ? 'spring' : 'tween',
            bounce: editingSlider.imageAnimation === 'bounce' ? 0.5 : undefined,
            duration: editingSlider.transitionSpeed === 'slow' ? 0.9 : editingSlider.transitionSpeed === 'medium' ? 0.6 : 0.4,
            delay: editingSlider.transitionSpeed === 'slow' ? 0.3 : editingSlider.transitionSpeed === 'medium' ? 0.2 : 0.1,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }
      }
    };
  }, [editingSlider.textAnimation, editingSlider.imageAnimation, editingSlider.transitionSpeed, currentSlider, isModalOpen]);

  // Handle opening the modal for adding/editing
  const handleOpenModal = (slider: SliderItem | null = null) => {
    if (slider) {
      // Editing existing slider
      setCurrentSlider(slider);
      setEditingSlider({
        title: slider.title,
        titleAr: slider.titleAr || '',
        subtitle: slider.subtitle,
        subtitleAr: slider.subtitleAr || '',
        buttonText: slider.buttonText,
        buttonTextAr: slider.buttonTextAr || '',
        buttonLink: slider.buttonLink,
        imageUrl: slider.imageUrl,
        backgroundColor: slider.backgroundColor,
        textColor: slider.textColor || '#111111',
        buttonColor: slider.buttonColor || '#111111',
        overlayColor: slider.overlayColor || 'rgba(0,0,0,0)',
        overlayOpacity: slider.overlayOpacity || 0,
        overlayImageUrl: slider.overlayImageUrl || '',
        order: slider.order,
        isActive: slider.isActive,
        textAnimation: slider.textAnimation || 'fade-up',
        imageAnimation: slider.imageAnimation || 'fade-in',
        transitionSpeed: slider.transitionSpeed || 'medium',
        layout: slider.layout || 'default',
        accentColor: slider.accentColor || '#c9a961'
      });
    } else {
      // Adding new slider
      setCurrentSlider(null);
      setEditingSlider({
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
        overlayColor: 'rgba(0,0,0,0)',
        overlayOpacity: 0,
        overlayImageUrl: '',
        order: sliders.length,
        isActive: true,
        textAnimation: 'fade-up',
        imageAnimation: 'fade-in',
        transitionSpeed: 'medium',
        layout: 'default',
        accentColor: '#c9a961'
      });
    }
    
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSlider({...editingSlider, imageUrl: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle overlay image change
  const handleOverlayImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSlider({...editingSlider, overlayImageUrl: reader.result as string});
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
      let imageUrl = editingSlider.imageUrl || '';
      
      if (currentSlider && currentSlider.imageUrl !== editingSlider.imageUrl) {
        const formData = new FormData();
        formData.append('file', new File([], ''), currentSlider.imageUrl);
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
      let overlayImageUrl = editingSlider.overlayImageUrl || '';
      
      if (currentSlider && currentSlider.overlayImageUrl !== editingSlider.overlayImageUrl) {
        const overlayFormData = new FormData();
        overlayFormData.append('file', new File([], ''), currentSlider.overlayImageUrl);
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
        title: editingSlider.title,
        titleAr: editingSlider.titleAr,
        subtitle: editingSlider.subtitle,
        subtitleAr: editingSlider.subtitleAr,
        buttonText: editingSlider.buttonText,
        buttonTextAr: editingSlider.buttonTextAr,
        buttonLink: editingSlider.buttonLink,
        backgroundColor: editingSlider.backgroundColor,
        textColor: editingSlider.textColor || '#111111',
        buttonColor: editingSlider.buttonColor || '#111111',
        overlayColor: editingSlider.overlayColor || 'rgba(0,0,0,0)',
        overlayOpacity: editingSlider.overlayOpacity || 0,
        overlayImageUrl,
        imageUrl,
        order: editingSlider.order,
        isActive: editingSlider.isActive,
        textAnimation: editingSlider.textAnimation || 'fade-up',
        imageAnimation: editingSlider.imageAnimation || 'fade-in',
        transitionSpeed: editingSlider.transitionSpeed || 'medium',
        layout: editingSlider.layout || 'default',
        accentColor: editingSlider.accentColor || '#c9a961'
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
      <div className="min-h-screen bg-gray-50">
        <style jsx global>{`
          /* Modern Design System Variables */
          :root {
            --primary: #000000;
            --primary-hover: #1a1a1a;
            --accent: #c9a961;
            --accent-hover: #b8975a;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --bg-primary: #ffffff;
            --bg-secondary: #f9fafb;
            --bg-tertiary: #f3f4f6;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --text-tertiary: #9ca3af;
            --border: #e5e7eb;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --radius: 0.75rem;
            --radius-sm: 0.5rem;
            --radius-lg: 1rem;
            --transition: all 0.2s ease;
          }

          /* Modern Card Styles */
          .card {
            background: var(--bg-primary);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            overflow: hidden;
            transition: var(--transition);
          }

          .card:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
          }

          /* Modern Button Styles */
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            font-weight: 500;
            font-size: 0.875rem;
            line-height: 1.25rem;
            border-radius: var(--radius-sm);
            transition: var(--transition);
            cursor: pointer;
            border: 1px solid transparent;
          }

          .btn-primary {
            background-color: var(--primary);
            color: white;
            border-color: var(--primary);
          }

          .btn-primary:hover {
            background-color: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow);
          }

          .btn-secondary {
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
            border-color: var(--border);
          }

          .btn-secondary:hover {
            background-color: var(--bg-secondary);
            border-color: var(--text-secondary);
          }

          .btn-danger {
            background-color: var(--danger);
            color: white;
          }

          .btn-danger:hover {
            background-color: #dc2626;
            transform: translateY(-1px);
            box-shadow: var(--shadow);
          }

          .btn-success {
            background-color: var(--success);
            color: white;
          }

          .btn-success:hover {
            background-color: #059669;
            transform: translateY(-1px);
            box-shadow: var(--shadow);
          }

          .btn-icon {
            padding: 0.5rem;
            border-radius: var(--radius-sm);
          }

          /* Modern Form Styles */
          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
          }

          .form-input,
          .form-select,
          .form-textarea {
            width: 100%;
            padding: 0.625rem 0.875rem;
            font-size: 0.875rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background-color: var(--bg-primary);
            transition: var(--transition);
          }

          .form-input:focus,
          .form-select:focus,
          .form-textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(201, 169, 97, 0.1);
          }

          .form-helper {
            font-size: 0.75rem;
            color: var(--text-tertiary);
            margin-top: 0.25rem;
          }

          /* Modern Table Styles */
          .table-modern {
            width: 100%;
            background: var(--bg-primary);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
          }

          .table-modern th {
            background-color: var(--bg-secondary);
            padding: 0.75rem 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border);
          }

          .table-modern td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
          }

          .table-modern tr:last-child td {
            border-bottom: none;
          }

          .table-modern tr:hover td {
            background-color: var(--bg-secondary);
          }

          /* Status Badge Styles */
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 9999px;
          }

          .badge-success {
            background-color: #d1fae5;
            color: #065f46;
          }

          .badge-danger {
            background-color: #fee2e2;
            color: #991b1b;
          }

          /* Preview Styles */
          .preview-container {
            position: relative;
            border-radius: var(--radius);
            overflow: hidden;
            background: var(--bg-tertiary);
            box-shadow: var(--shadow-md);
          }

          .preview-device {
            position: relative;
            margin: 0 auto;
            background: white;
            border-radius: var(--radius-sm);
            overflow: hidden;
          }

          .preview-device.desktop {
            width: 100%;
            max-width: 800px;
            aspect-ratio: 16/9;
          }

          .preview-device.mobile {
            width: 320px;
            aspect-ratio: 9/16;
            border: 8px solid #1a1a1a;
            border-radius: 1.5rem;
          }

          /* Color Picker Styles */
          .color-picker-wrapper {
            position: relative;
            display: inline-block;
          }

          .color-picker-preview {
            width: 100%;
            height: 40px;
            border-radius: var(--radius-sm);
            border: 2px solid var(--border);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .color-picker-preview::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 6px solid var(--text-secondary);
          }

          /* Animation Preview */
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }

          @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }

          .animation-preview {
            animation-duration: 0.6s;
            animation-fill-mode: both;
          }

          /* Layout Preview Thumbnails */
          .layout-option {
            position: relative;
            padding: 0.5rem;
            border: 2px solid var(--border);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: var(--transition);
          }

          .layout-option:hover {
            border-color: var(--accent);
            background-color: var(--bg-secondary);
          }

          .layout-option.selected {
            border-color: var(--accent);
            background-color: rgba(201, 169, 97, 0.1);
          }

          .layout-thumbnail {
            width: 120px;
            height: 80px;
            border-radius: 4px;
            background: var(--bg-tertiary);
            position: relative;
            overflow: hidden;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .table-modern {
              font-size: 0.875rem;
            }

            .table-modern th,
            .table-modern td {
              padding: 0.5rem;
            }

            .preview-device.desktop {
              max-width: 100%;
            }
          }
        `}</style>

        {/* Modern Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hero Sliders</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your homepage hero banner sliders</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/backend" className="btn btn-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </Link>
                <button
                  onClick={() => handleOpenModal()}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add New Slider
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sliders</p>
                  <p className="text-2xl font-bold text-gray-900">{sliders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sliders</p>
                  <p className="text-2xl font-bold text-gray-900">{sliders.filter(s => s.isActive).length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive Sliders</p>
                  <p className="text-2xl font-bold text-gray-900">{sliders.filter(s => !s.isActive).length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {sliders.length > 0 
                      ? new Date(Math.max(...sliders.map(s => new Date(s.updatedAt).getTime()))).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Sliders Table */}
          <div className="table-modern">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Layout</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sliders.map((slider) => (
                  <tr key={slider.id}>
                    <td className="font-medium">#{slider.order + 1}</td>
                    <td>
                      <div className="relative w-32 h-20 rounded-md overflow-hidden bg-gray-100">
                        {slider.imageUrl ? (
                          <Image
                            src={slider.imageUrl}
                            alt={slider.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-3"
                          style={{ backgroundColor: slider.backgroundColor }}
                        />
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{slider.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{slider.subtitle}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {slider.layout || 'default'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${slider.isActive ? 'badge-success' : 'badge-danger'}`}>
                        <span className={`w-2 h-2 rounded-full ${slider.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {slider.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(slider.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(slider)}
                          className="btn btn-icon btn-secondary"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlider(slider.id)}
                          className="btn btn-icon btn-danger"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sliders.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No sliders created yet</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-4 btn btn-primary"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Your First Slider
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentSlider ? 'Edit Slider' : 'Create New Slider'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
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
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Title (English)</label>
                          <input
                            type="text"
                            value={editingSlider.title}
                            onChange={(e) => setEditingSlider({...editingSlider, title: e.target.value})}
                            className="form-input"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Title (Arabic)</label>
                          <input
                            type="text"
                            value={editingSlider.titleAr}
                            onChange={(e) => setEditingSlider({...editingSlider, titleAr: e.target.value})}
                            className="form-input"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Subtitle (English)</label>
                          <textarea
                            value={editingSlider.subtitle}
                            onChange={(e) => setEditingSlider({...editingSlider, subtitle: e.target.value})}
                            className="form-textarea"
                            rows={2}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Subtitle (Arabic)</label>
                          <textarea
                            value={editingSlider.subtitleAr}
                            onChange={(e) => setEditingSlider({...editingSlider, subtitleAr: e.target.value})}
                            className="form-textarea"
                            rows={2}
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Button Text (English)</label>
                          <input
                            type="text"
                            value={editingSlider.buttonText}
                            onChange={(e) => setEditingSlider({...editingSlider, buttonText: e.target.value})}
                            className="form-input"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Button Text (Arabic)</label>
                          <input
                            type="text"
                            value={editingSlider.buttonTextAr}
                            onChange={(e) => setEditingSlider({...editingSlider, buttonTextAr: e.target.value})}
                            className="form-input"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Button Link</label>
                        <input
                          type="text"
                          value={editingSlider.buttonLink}
                          onChange={(e) => setEditingSlider({...editingSlider, buttonLink: e.target.value})}
                          className="form-input"
                          placeholder="/shop"
                          required
                        />
                        <p className="form-helper">Enter the URL path (e.g., /shop, /products/coffee)</p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Image URL</label>
                        <input
                          type="text"
                          value={editingSlider.imageUrl}
                          onChange={(e) => setEditingSlider({...editingSlider, imageUrl: e.target.value})}
                          className="form-input"
                          placeholder="https://example.com/image.jpg"
                          required
                        />
                        <p className="form-helper">Upload to Cloudinary or use a direct image URL</p>
                      </div>
                    </div>

                    {/* Design & Layout */}
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-4">Design & Layout</h3>
                      
                      <div className="form-group">
                        <label className="form-label">Layout Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {LAYOUT_OPTIONS.map((layout) => (
                            <div
                              key={layout.value}
                              onClick={() => setEditingSlider({...editingSlider, layout: layout.value})}
                              className={`layout-option ${editingSlider.layout === layout.value ? 'selected' : ''}`}
                            >
                              <div className="layout-thumbnail mb-2">
                                {/* Add layout preview thumbnails here */}
                              </div>
                              <p className="text-xs text-center font-medium">{layout.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Color Presets</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setEditingSlider({
                                ...editingSlider,
                                backgroundColor: preset.bg,
                                textColor: preset.text,
                                buttonColor: preset.button,
                                accentColor: preset.accent
                              })}
                              className="p-3 border-2 border-gray-200 rounded-lg hover:border-accent transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bg }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.text }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.button }} />
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                              </div>
                              <p className="text-xs font-medium">{preset.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Background Color</label>
                          <div className="color-picker-wrapper">
                            <input
                              type="color"
                              value={editingSlider.backgroundColor}
                              onChange={(e) => setEditingSlider({...editingSlider, backgroundColor: e.target.value})}
                              className="sr-only"
                              id="bg-color"
                            />
                            <label 
                              htmlFor="bg-color" 
                              className="color-picker-preview cursor-pointer"
                              style={{ backgroundColor: editingSlider.backgroundColor }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Text Color</label>
                          <div className="color-picker-wrapper">
                            <input
                              type="color"
                              value={editingSlider.textColor}
                              onChange={(e) => setEditingSlider({...editingSlider, textColor: e.target.value})}
                              className="sr-only"
                              id="text-color"
                            />
                            <label 
                              htmlFor="text-color" 
                              className="color-picker-preview cursor-pointer"
                              style={{ backgroundColor: editingSlider.textColor }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Button Color</label>
                          <div className="color-picker-wrapper">
                            <input
                              type="color"
                              value={editingSlider.buttonColor}
                              onChange={(e) => setEditingSlider({...editingSlider, buttonColor: e.target.value})}
                              className="sr-only"
                              id="button-color"
                            />
                            <label 
                              htmlFor="button-color" 
                              className="color-picker-preview cursor-pointer"
                              style={{ backgroundColor: editingSlider.buttonColor }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Accent Color</label>
                          <div className="color-picker-wrapper">
                            <input
                              type="color"
                              value={editingSlider.accentColor}
                              onChange={(e) => setEditingSlider({...editingSlider, accentColor: e.target.value})}
                              className="sr-only"
                              id="accent-color"
                            />
                            <label 
                              htmlFor="accent-color" 
                              className="color-picker-preview cursor-pointer"
                              style={{ backgroundColor: editingSlider.accentColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animation Settings */}
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-4">Animation Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Text Animation</label>
                          <select
                            value={editingSlider.textAnimation}
                            onChange={(e) => setEditingSlider({...editingSlider, textAnimation: e.target.value})}
                            className="form-select"
                          >
                            {ANIMATION_PRESETS.text.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.name} - {option.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Image Animation</label>
                          <select
                            value={editingSlider.imageAnimation}
                            onChange={(e) => setEditingSlider({...editingSlider, imageAnimation: e.target.value})}
                            className="form-select"
                          >
                            {ANIMATION_PRESETS.image.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.name} - {option.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Transition Speed</label>
                          <select
                            value={editingSlider.transitionSpeed}
                            onChange={(e) => setEditingSlider({...editingSlider, transitionSpeed: e.target.value as 'slow' | 'medium' | 'fast'})}
                            className="form-select"
                          >
                            {ANIMATION_PRESETS.speed.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-4">Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Order</label>
                          <input
                            type="number"
                            value={editingSlider.order}
                            onChange={(e) => setEditingSlider({...editingSlider, order: parseInt(e.target.value)})}
                            className="form-input"
                            min="0"
                          />
                          <p className="form-helper">Lower numbers appear first</p>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <div className="flex items-center gap-3 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingSlider.isActive}
                                onChange={(e) => setEditingSlider({...editingSlider, isActive: e.target.checked})}
                                className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                              />
                              <span className="text-sm font-medium">Active</span>
                            </label>
                          </div>
                          <p className="form-helper">Only active sliders are shown on the homepage</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Live Preview */}
                  <div className="space-y-6">
                    <div className="card p-6 sticky top-20">
                      <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                      
                      {/* Device Selector */}
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 text-sm rounded-md ${previewDevice === 'desktop' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 text-sm rounded-md ${previewDevice === 'mobile' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Mobile
                        </button>
                      </div>

                      {/* Preview Container */}
                      <div className="preview-container p-4">
                        <div className={`preview-device ${previewDevice}`}>
                          <div 
                            className="relative h-full overflow-hidden"
                            style={{ backgroundColor: editingSlider.backgroundColor }}
                          >
                            {/* Preview content based on layout */}
                            <div className={`flex items-center justify-center h-full p-6 ${
                              editingSlider.layout === 'centered' ? 'text-center' : ''
                            }`}>
                              <div className={`${editingSlider.layout === 'split' ? 'w-1/2' : 'max-w-md'}`}>
                                <h1 
                                  className={`text-2xl font-bold mb-2 animation-preview`}
                                  style={{ 
                                    color: editingSlider.textColor,
                                    animation: editingSlider.textAnimation !== 'none' ? 'fadeUp 0.6s' : 'none'
                                  }}
                                >
                                  {editingSlider.title || 'Slider Title'}
                                </h1>
                                <p 
                                  className="text-sm mb-4 opacity-80"
                                  style={{ color: editingSlider.textColor }}
                                >
                                  {editingSlider.subtitle || 'Slider subtitle goes here'}
                                </p>
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded-full text-sm font-medium"
                                  style={{ 
                                    backgroundColor: editingSlider.buttonColor,
                                    color: editingSlider.backgroundColor
                                  }}
                                >
                                  {editingSlider.buttonText || 'Button'}
                                </button>
                              </div>
                              {editingSlider.imageUrl && (
                                <div className={`${editingSlider.layout === 'split' ? 'w-1/2' : 'absolute right-0 top-0 w-1/2 h-full'}`}>
                                  <img 
                                    src={editingSlider.imageUrl} 
                                    alt="Preview"
                                    className="h-full w-full object-contain animation-preview"
                                    style={{
                                      animation: editingSlider.imageAnimation !== 'none' ? 'fadeIn 0.8s' : 'none'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        {currentSlider ? 'Update Slider' : 'Create Slider'}
                      </>
                    )}
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