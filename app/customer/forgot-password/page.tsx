'use client';

import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/customer/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message || 'Password reset instructions have been sent to your email.');
      } else {
        setError(data.error || 'Failed to send reset instructions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('forgot_password', 'Forgot Password')}
            </h1>
            <p className="text-gray-600">
              {t('reset_password_instructions', 'Enter your email address and we\'ll send you instructions to reset your password')}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-sm text-green-600">{message}</p>
              </div>
              <p className="text-gray-600 mb-6">
                {t('check_email', 'Please check your email for password reset instructions.')}
              </p>
              <Link
                href="/customer/login"
                className="block w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors text-center"
              >
                {t('back_to_login', 'Back to Login')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}
                >
                  {t('email_address', 'Email Address')}*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  placeholder={t('enter_email', 'Enter your email address')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('sending', 'Sending...') : t('send_reset_instructions', 'Send Reset Instructions')}
              </button>

              <div className="text-center">
                <Link
                  href="/customer/login"
                  className="text-sm text-black hover:underline"
                >
                  {t('back_to_login', 'Back to Login')}
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t('back_to_home', 'Back to Home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 