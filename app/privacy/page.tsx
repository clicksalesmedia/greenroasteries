'use client';

import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await fetch('/api/content/privacy_policy');
        
        if (!response.ok) {
          throw new Error('Failed to fetch privacy policy');
        }
        
        const data = await response.json();
        setContent(data.content || '');
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'May 15, 2025');
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        setIsLoading(false);
      }
    };
    
    fetchPrivacyPolicy();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            At Green Roasteries, we value your privacy and are committed to protecting your personal data.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
            </div>
          ) : (
            <div className="prose prose-lg">
              <div dangerouslySetInnerHTML={{ __html: content }} />
              
              <div className="border-t border-gray-200 pt-8 mt-8">
                <p className="text-sm text-gray-500">
                  Last Updated: {lastUpdated}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 