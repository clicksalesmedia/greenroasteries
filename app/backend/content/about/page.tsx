'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { useRouter } from 'next/navigation';

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
          heroImage: heroImage
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
                    {t('hero_image', 'Hero Background Image URL')}
                  </label>
                  <input
                    type="text"
                    id="heroImage"
                    value={heroImage}
                    onChange={handleHeroImageChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="/images/your-image.jpg"
                  />
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