'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../components/BackendLayout';
import { motion } from 'framer-motion';
import { ClockIcon, TagIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface FOMOSettings {
  id?: string;
  isActive: boolean;
  title: string;
  titleAr: string;
  hours: number;
  message: string;
  messageAr: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function FOMOOffersPage() {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<FOMOSettings>({
    isActive: false,
    title: 'Limited Time Offer',
    titleAr: 'عرض لفترة محدودة',
    hours: 18,
    message: 'Hurry up! Offer ends in',
    messageAr: 'أسرع! العرض ينتهي خلال'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Load current FOMO settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/content/fomo-offers');
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else if (response.status === 404) {
          // No settings exist yet, use defaults
          console.log('No FOMO settings found, using defaults');
        }
      } catch (error) {
        console.error('Error fetching FOMO settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Calculate time remaining
  useEffect(() => {
    if (settings.isActive && settings.endTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const endTime = new Date(settings.endTime!).getTime();
        const difference = endTime - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining('Expired');
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [settings.isActive, settings.endTime]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Calculate end time based on current time + hours
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + settings.hours);
      
      const settingsToSave = {
        ...settings,
        endTime: settings.isActive ? endTime.toISOString() : null
      };
      
      const response = await fetch('/api/content/fomo-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });
      
      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
        setSaveMessage(t('save_success', 'Settings saved successfully!'));
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving FOMO settings:', error);
      setSaveMessage(t('save_error', 'Error saving settings. Please try again.'));
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const newIsActive = !settings.isActive;
    setSettings(prev => ({ ...prev, isActive: newIsActive }));
    
    // If activating, calculate new end time
    if (newIsActive) {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + settings.hours);
      setSettings(prev => ({ ...prev, endTime: endTime.toISOString() }));
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-8 w-8 text-orange-500" />
              {t('fomo_offers', 'Limited Time Offers')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('fomo_offers_description', 'Manage FOMO timing and special offers countdown to create urgency')}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                {t('saving', 'Saving...')}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                {t('save_settings', 'Save Settings')}
              </>
            )}
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              saveMessage.includes('Error') || saveMessage.includes('error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}

        {/* Main Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Status Header */}
          <div className={`px-6 py-4 border-b border-gray-200 ${settings.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.isActive ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('fomo_status', 'FOMO Timer Status')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {settings.isActive 
                      ? t('fomo_active', 'Limited time offer is currently active')
                      : t('fomo_inactive', 'Limited time offer is currently inactive')
                    }
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex items-center gap-3">
                {settings.isActive && timeRemaining && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t('time_remaining', 'Time Remaining')}</p>
                    <p className="text-lg font-bold text-orange-600">{timeRemaining}</p>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isActive}
                    onChange={handleToggleActive}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="p-6 space-y-6">
            {/* Title Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-gray-500" />
                {t('offer_title', 'Offer Title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('title_english', 'Title (English)')}
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Limited Time Offer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('title_arabic', 'Title (Arabic)')}
                  </label>
                  <input
                    type="text"
                    value={settings.titleAr}
                    onChange={(e) => setSettings(prev => ({ ...prev, titleAr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="عرض لفترة محدودة"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Timer Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                {t('timer_settings', 'Timer Settings')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('offer_duration_hours', 'Offer Duration (Hours)')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.hours}
                    onChange={(e) => setSettings(prev => ({ ...prev, hours: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hours_help', 'Maximum 168 hours (7 days)')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('quick_presets', 'Quick Presets')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[6, 12, 18, 24, 48, 72].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setSettings(prev => ({ ...prev, hours }))}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                          settings.hours === hours
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('countdown_message', 'Countdown Message')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('message_english', 'Message (English)')}
                  </label>
                  <input
                    type="text"
                    value={settings.message}
                    onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Hurry up! Offer ends in"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('message_arabic', 'Message (Arabic)')}
                  </label>
                  <input
                    type="text"
                    value={settings.messageAr}
                    onChange={(e) => setSettings(prev => ({ ...prev, messageAr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="أسرع! العرض ينتهي خلال"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('preview', 'Preview')}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'ar' ? settings.titleAr : settings.title}
                  </h4>
                  <p className="text-gray-600 mb-3">
                    {language === 'ar' ? settings.messageAr : settings.message}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-mono">
                    <ClockIcon className="h-4 w-4" />
                    {timeRemaining || `${settings.hours}h 0m 0s`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {t('fomo_info_title', 'How FOMO Timing Works')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('fomo_info_1', 'When activated, the countdown timer starts immediately')}</li>
                  <li>{t('fomo_info_2', 'Timer appears in Special Offers section on homepage')}</li>
                  <li>{t('fomo_info_3', 'Timer also appears under product prices on product pages')}</li>
                  <li>{t('fomo_info_4', 'Automatically deactivates when time expires')}</li>
                  <li>{t('fomo_info_5', 'Use this to create urgency and boost sales')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackendLayout>
  );
} 