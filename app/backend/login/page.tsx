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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100" dir={getDirection(language)}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-6 px-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌱</span>
              </div>
              <h2 className="text-2xl font-bold">Green Roasteries</h2>
              <p className="text-green-100 mt-1">{t('admin_dashboard', 'Admin Dashboard')}</p>
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">{t('sign_in', 'Sign In')}</h3>
            
            {errorMessage && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200 flex items-center">
                <span className="mr-2">⚠️</span>
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('email_address', 'Email Address')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
                  placeholder={t('email_placeholder', 'admin@thegreenroasteries.com')}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('password', 'Password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <div className={`mt-2 text-${language === 'ar' ? 'left' : 'right'}`}>
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
                className={`w-full bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:from-green-800 hover:to-green-900 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('signing_in', 'Signing in...')}
                  </span>
                ) : (
                  t('sign_in', 'Sign In')
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                {t('secure_login_notice', 'This is a secure admin area. Unauthorized access is prohibited.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 