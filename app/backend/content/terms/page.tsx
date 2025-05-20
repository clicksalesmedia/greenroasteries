'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { useRouter } from 'next/navigation';

export default function TermsConditionsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch the current terms and conditions content
  useEffect(() => {
    const fetchTermsConditions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/content/terms_conditions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch terms and conditions');
        }
        
        const data = await response.json();
        setContent(data.content || '');
        setLastUpdated(new Date(data.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
        setIsLoading(false);
      }
    };
    
    fetchTermsConditions();
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleLastUpdatedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastUpdated(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const requestBody = {
        title: 'Terms & Conditions',
        content: content,
        lastUpdated: new Date().toISOString(),
      };
      
      console.log('Sending request with body:', requestBody);
      
      const response = await fetch('/api/content/terms_conditions', {
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
        throw new Error(`Failed to save terms and conditions: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('API Success Response:', data);
      } catch (e) {
        console.error('Could not parse success response:', e);
      }
      
      setSaveMessage('Terms & Conditions updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving terms and conditions:', error);
      setSaveMessage(`Error saving terms and conditions: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // In a real implementation, you might want to save a draft first
    // For simplicity, we'll just navigate to the terms page
    router.push('/terms');
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
            <h1 className="text-2xl font-bold">{t('terms_conditions', 'Terms & Conditions')}</h1>
            <p className="text-gray-600">{t('terms_description', 'Manage your website terms and conditions content')}</p>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700 mb-2">
              {t('last_updated_date', 'Last Updated Date')}
            </label>
            <input
              type="text"
              id="lastUpdated"
              value={lastUpdated}
              onChange={handleLastUpdatedChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., May 15, 2025"
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('policy_content', 'Policy Content')} (HTML)
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
        </div>
      </div>
    </BackendLayout>
  );
} 