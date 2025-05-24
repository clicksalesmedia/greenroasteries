'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getDirection } from '@/app/utils/i18n';
import ErrorBoundary from '@/app/components/ErrorBoundary';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Add abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Successful login - redirect immediately
        window.location.href = '/backend';
        return;
      }

      // Handle error responses
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned invalid response');
      }

      if (response.status === 401) {
        setErrorMessage('Invalid email or password. Please try again.');
        setShowTip(true);
      } else if (response.status === 403) {
        setErrorMessage(data.error || 'Access denied. Please contact support.');
      } else {
        setErrorMessage(data.error || 'Login failed. Please try again.');
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setErrorMessage('Request timed out. Please check your connection and try again.');
        } else {
          setErrorMessage('Network error. Please check your connection and try again.');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      setShowTip(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                  placeholder={t('email_placeholder', 'email@example.com')}
                  required
                  disabled={isLoading}
                  autoComplete="email"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <div className={`mt-1 text-${language === 'ar' ? 'left' : 'right'}`}>
                  <Link 
                    href="/backend/forgot-password"
                    className="text-sm text-green-700 hover:text-green-900 transition-colors"
                  >
                    {t('forgot_password', 'Forgot password?')}
                  </Link>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-green-800 active:bg-green-900 transform active:scale-95'
                }`}
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
              
              {!showTip && (
                <div className="mt-4 text-center">
                  <button 
                    type="button"
                    onClick={() => setShowTip(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('show_login_tips', 'Show login tips')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 