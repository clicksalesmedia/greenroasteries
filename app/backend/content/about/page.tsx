'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AboutUsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [title, setTitle] = useState('Our Story');
  const [titleAr, setTitleAr] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroTitleAr, setHeroTitleAr] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [heroTaglineAr, setHeroTaglineAr] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [contentImage, setContentImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('english');

  // Fetch the current about us content
  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/content/about_us');
        
        if (!response.ok) {
          throw new Error('Failed to fetch about us content');
        }
        
        const data = await response.json();
        setContent(data.content || '');
        setContentAr(data.contentAr || '');
        setTitle(data.title || 'Our Story');
        setTitleAr(data.titleAr || '');
        
        // If we have metadata, use it for the hero section
        if (data.metadata) {
          const metadata = data.metadata as any;
          setHeroTitle(metadata.heroTitle || 'Our Story');
          setHeroTitleAr(metadata.heroTitleAr || '');
          setHeroTagline(metadata.heroTagline || 'From bean to cup, our passion fuels every step of the journey.');
          setHeroTaglineAr(metadata.heroTaglineAr || '');
          setHeroImage(metadata.heroImage || '/images/coffee-beans-bg.jpg');
          setContentImage(metadata.contentImage || '/images/coffee-roasting-process.jpg');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching about us content:', error);
        setIsLoading(false);
      }
    };
    
    fetchAboutUs();
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleContentArChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentAr(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleArChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleAr(e.target.value);
  };

  const handleHeroTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroTitle(e.target.value);
  };

  const handleHeroTitleArChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroTitleAr(e.target.value);
  };

  const handleHeroTaglineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroTagline(e.target.value);
  };

  const handleHeroTaglineArChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroTaglineAr(e.target.value);
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroImage(e.target.value);
  };

  const handleContentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContentImage(e.target.value);
  };

  // Add a helper function to handle image paths with format conversion for HEIC
  const getImagePath = (path: string) => {
    if (!path) return '';
    
    // Handle data URLs directly (for previews)
    if (path.startsWith('data:')) {
      return path;
    }
    
    // If the image is a HEIC, we need to check if the converted JPG exists
    if (path.toLowerCase().endsWith('.heic')) {
      // Convert to the expected JPG path our API now generates
      return path.substring(0, path.lastIndexOf('.')) + '.jpg';
    }
    
    return path;
  };

  const uploadImage = async (file: File, type: 'hero' | 'content') => {
    try {
      setIsSaving(true);
      setSaveMessage(`Uploading ${type} image...`);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      console.log(`Uploading ${type} image...`, {
        filename: file.name,
        size: file.size,
        type: file.type
      });
      
      // Use the upload-file endpoint for both environments for consistency
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
        
        // Set the image URL in the state based on the type
        if (type === 'hero') {
          setHeroImage(data.file);
          setSaveMessage('Hero image uploaded successfully');
        } else if (type === 'content') {
          setContentImage(data.file);
          setSaveMessage('Content image uploaded successfully');
        }
        
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timed out. Please try again with a smaller image.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setSaveMessage(`Error uploading image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Refs for the file inputs
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'content') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.includes('image/')) {
        setSaveMessage('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage('Image size should be less than 5MB');
        return;
      }
      
      uploadImage(file, type);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const requestBody = {
        title: title,
        titleAr: titleAr,
        content: content,
        contentAr: contentAr,
        metadata: {
          heroTitle: heroTitle,
          heroTitleAr: heroTitleAr,
          heroTagline: heroTagline,
          heroTaglineAr: heroTaglineAr,
          heroImage: heroImage,
          contentImage: contentImage
        },
        lastUpdated: new Date().toISOString(),
      };
      
      console.log('Sending request to save About Us content:', requestBody);
      
      // Use a more explicit content type
      const response = await fetch('/api/content/about_us', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: 'Could not parse error response' };
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to save about us content: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('API Success Response:', data);
      } catch (e) {
        console.error('Could not parse success response:', e);
      }
      
      setSaveMessage('About Us page updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving about us content:', error);
      setSaveMessage(`Error saving about us content: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // In a real implementation, you might want to save a draft first
    // For simplicity, we'll just navigate to the about page
    router.push('/about');
  };

  // Add this useEffect to load previews from localStorage in development
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Check if we have stored preview images in localStorage
      const heroPreview = localStorage.getItem('hero_image_preview');
      const contentPreview = localStorage.getItem('content_image_preview');
      
      if (heroPreview && !heroImage) {
        setHeroImage(heroPreview);
      }
      
      if (contentPreview && !contentImage) {
        setContentImage(contentPreview);
      }
    }
  }, []);

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
            <h1 className="text-2xl font-bold">{t('about_us', 'About Us')}</h1>
            <p className="text-gray-600">{t('about_description', 'Manage your about us page content')}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              {t('preview', 'Preview')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition flex items-center disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving', 'Saving...')}
                </>
              ) : t('save', 'Save')}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`p-4 mb-6 rounded-md ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {saveMessage}
          </div>
        )}

        {/* Language tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('english')}
            className={`py-2 px-4 font-medium ${activeTab === 'english' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-500'}`}
          >
            English
          </button>
          <button
            onClick={() => setActiveTab('arabic')}
            className={`py-2 px-4 font-medium ${activeTab === 'arabic' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-500'}`}
          >
            العربية (Arabic)
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('page_title', 'Page Title')}</h2>
          
          {activeTab === 'english' && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                {t('title', 'Title')}
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
          
          {activeTab === 'arabic' && (
            <div>
              <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700 mb-2">
                {t('title_arabic', 'Title (Arabic)')}
              </label>
              <input
                type="text"
                id="titleAr"
                value={titleAr}
                onChange={handleTitleArChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 text-right"
                dir="rtl"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('hero_section', 'Hero Section')}</h2>
          
          {activeTab === 'english' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hero_title', 'Hero Title')}
                  </label>
                  <input
                    type="text"
                    id="heroTitle"
                    value={heroTitle}
                    onChange={handleHeroTitleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="heroImage" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hero_image', 'Hero Background Image')}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      id="heroImage"
                      value={heroImage}
                      onChange={handleHeroImageChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="/images/your-image.jpg"
                    />
                    
                    <button
                      type="button"
                      onClick={() => heroImageInputRef.current?.click()}
                      className="flex-shrink-0 bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Upload
                    </button>
                    <input
                      type="file"
                      ref={heroImageInputRef}
                      onChange={(e) => handleFileSelect(e, 'hero')}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  {heroImage ? (
                    <div className="relative h-20 w-full mt-2 overflow-hidden rounded-md border border-gray-200">
                      <img 
                        src={getImagePath(heroImage)}
                        alt="Hero image preview" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Error loading hero image:', heroImage);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="heroTagline" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('hero_tagline', 'Hero Tagline')}
                </label>
                <input
                  type="text"
                  id="heroTagline"
                  value={heroTagline}
                  onChange={handleHeroTaglineChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </>
          )}
          
          {activeTab === 'arabic' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="heroTitleAr" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hero_title_arabic', 'Hero Title (Arabic)')}
                  </label>
                  <input
                    type="text"
                    id="heroTitleAr"
                    value={heroTitleAr}
                    onChange={handleHeroTitleArChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="heroTaglineAr" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('hero_tagline_arabic', 'Hero Tagline (Arabic)')}
                </label>
                <input
                  type="text"
                  id="heroTaglineAr"
                  value={heroTaglineAr}
                  onChange={handleHeroTaglineArChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 text-right"
                  dir="rtl"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('page_content', 'Page Content')}</h2>
          
          <div className="mb-6">
            <label htmlFor="contentImage" className="block text-sm font-medium text-gray-700 mb-2">
              {t('content_image', 'Content Section Image')}
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="text"
                    id="contentImage"
                    value={contentImage}
                    onChange={handleContentImageChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="/images/your-image.jpg"
                  />
                  
                  <button
                    type="button"
                    onClick={() => contentImageInputRef.current?.click()}
                    className="flex-shrink-0 bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Upload
                  </button>
                  <input
                    type="file"
                    ref={contentImageInputRef}
                    onChange={(e) => handleFileSelect(e, 'content')}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {t('content_image_desc', 'This image will appear alongside your content in the About page.')}
                </p>
              </div>
              
              {contentImage ? (
                <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={getImagePath(contentImage)}
                    alt="Content preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Error loading content image:', contentImage);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
          
          {activeTab === 'english' && (
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                {t('content', 'Content')} (HTML)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={handleContentChange}
                rows={20}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-green-500 focus:border-green-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                {t('html_allowed', 'HTML formatting is allowed. Use proper heading tags (h2, h3) for section titles.')}
              </p>
              
              {/* HTML Example Section */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">HTML Example:</h4>
                <pre className="text-xs overflow-x-auto p-2 bg-gray-100 rounded">
                  {`<h2>Our Journey</h2>
<p>Green Roasteries was founded in 2012 with a simple mission: to bring the finest specialty coffee to coffee lovers across the UAE.</p>

<h3>Our Commitment to Quality</h3>
<p>We source our beans directly from farmers around the world, ensuring the highest quality and ethical practices.</p>

<ul>
  <li>Single-origin beans from Ethiopia, Colombia, and Brazil</li>
  <li>Small-batch roasting for maximum freshness</li>
  <li>Sustainable and fair-trade practices</li>
</ul>`}
                </pre>
                <button
                  type="button"
                  onClick={() => setContent(prevContent => 
                    prevContent + (prevContent ? '\n\n' : '') + 
                    `<h2>Our Journey</h2>
<p>Green Roasteries was founded in 2012 with a simple mission: to bring the finest specialty coffee to coffee lovers across the UAE.</p>

<h3>Our Commitment to Quality</h3>
<p>We source our beans directly from farmers around the world, ensuring the highest quality and ethical practices.</p>

<ul>
  <li>Single-origin beans from Ethiopia, Colombia, and Brazil</li>
  <li>Small-batch roasting for maximum freshness</li>
  <li>Sustainable and fair-trade practices</li>
</ul>`
                  )}
                  className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
                >
                  {t('add_example', 'Add this example to content')}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'arabic' && (
            <div>
              <label htmlFor="contentAr" className="block text-sm font-medium text-gray-700 mb-2">
                {t('content_arabic', 'Content (Arabic)')} (HTML)
              </label>
              <textarea
                id="contentAr"
                value={contentAr}
                onChange={handleContentArChange}
                rows={20}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-green-500 focus:border-green-500 text-right"
                dir="rtl"
              />
              <p className="mt-2 text-sm text-gray-500">
                {t('html_allowed', 'HTML formatting is allowed. Use proper heading tags (h2, h3) for section titles.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </BackendLayout>
  );
} 