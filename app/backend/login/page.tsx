'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getDirection } from '@/app/utils/i18n';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setDebugInfo('');

    try {
      setDebugInfo('Sending login request...');
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/auth/login?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });

      const responseText = await response.text();
      setDebugInfo(`Response status: ${response.status}\nResponse headers: ${JSON.stringify([...response.headers.entries()])}\nResponse body: ${responseText}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setDebugInfo(prev => `${prev}\nFailed to parse JSON: ${e}`);
        throw new Error('Invalid response format from server');
      }

      if (response.ok) {
        setDebugInfo(prev => `${prev}\nLogin successful, checking cookies...`);
        
        // Check for cookie
        const cookies = document.cookie;
        setDebugInfo(prev => `${prev}\nCookies: ${cookies}`);
        
        // Use client-side navigation to manually reload the page
        setTimeout(() => {
          window.location.href = '/backend';
        }, 1000);
      } else {
        setErrorMessage(data.error || 'Login failed. Please check your credentials.');
        setShowTip(true);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Login error:', error);
      setDebugInfo(prev => `${prev}\nError: ${error instanceof Error ? error.message : String(error)}`);
      setShowTip(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={getDirection(language)}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-800 text-white py-4 px-6">
          <h2 className="text-2xl font-bold text-center">Green Roasteries</h2>
          <p className="text-center text-green-100">{t('admin_dashboard', 'Admin Dashboard')}</p>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">{t('sign_in', 'Sign In')}</h3>
          
          {errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border border-red-200">
              {errorMessage}
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                className="ml-2 text-blue-600 underline"
              >
                {showDebug ? t('hide_debug_info', 'Hide Debug Info') : t('show_debug_info', 'Show Debug Info')}
              </button>
            </div>
          )}

          {showTip && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4 text-sm border border-yellow-200">
              <p><strong>{t('available_admin_accounts', 'Available admin accounts:')}</strong></p>
              <ul className="list-disc pl-5 mt-1">
                <li>Email: admin@thegreenroasteries.com</li>
                <li>Password: Admin@123</li>
              </ul>
              <p className="mt-1 text-xs">{t('account_created_note', 'Note: This account was created by the system repair tool')}</p>
            </div>
          )}

          {(showDebug && debugInfo) && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md mb-4 text-xs border border-blue-200 overflow-auto max-h-48">
              <pre>{debugInfo}</pre>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                {t('email_address', 'Email Address')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder={t('email_placeholder', 'email@example.com')}
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                {t('password', 'Password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <div className={`mt-1 text-${language === 'ar' ? 'left' : 'right'}`}>
                <Link 
                  href="/backend/forgot-password"
                  className="text-sm text-green-700 hover:text-green-900"
                >
                  {t('forgot_password', 'Forgot password?')}
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-800'} 
                transition duration-200`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('signing_in', 'Signing in...')}
                </span>
              ) : (
                t('sign_in', 'Sign In')
              )}
            </button>
            
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => setShowTip(!showTip)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showTip ? t('hide_login_tips', 'Hide login tips') : t('show_login_tips', 'Show login tips')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 