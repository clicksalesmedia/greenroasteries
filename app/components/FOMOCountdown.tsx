'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ClockIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface FOMOCountdownProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showMessage?: boolean;
  className?: string;
}

interface FOMOSettings {
  isActive: boolean;
  title: string;
  titleAr: string;
  hours: number;
  message: string;
  messageAr: string;
  endTime?: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function FOMOCountdown({ 
  size = 'medium', 
  showIcon = true, 
  showMessage = true,
  className = ''
}: FOMOCountdownProps) {
  const { t, language, contentByLang } = useLanguage();
  const [settings, setSettings] = useState<FOMOSettings | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch FOMO settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/content/fomo-offers');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching FOMO settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!settings || !settings.isActive || !settings.endTime) {
      setIsLoading(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(settings.endTime!).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({
          hours,
          minutes,
          seconds,
          isExpired: false
        });
      } else {
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    setIsLoading(false);

    return () => clearInterval(interval);
  }, [settings]);

  // Don't render if loading, no settings, inactive, or expired
  if (isLoading || !settings || !settings.isActive || timeRemaining.isExpired) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'text-sm',
      message: 'text-xs',
      timer: 'text-sm font-bold',
      icon: 'h-3 w-3',
      padding: 'px-2 py-1',
      gap: 'gap-1'
    },
    medium: {
      container: 'text-base',
      message: 'text-sm',
      timer: 'text-lg font-bold',
      icon: 'h-4 w-4',
      padding: 'px-3 py-2',
      gap: 'gap-2'
    },
    large: {
      container: 'text-lg',
      message: 'text-base',
      timer: 'text-2xl font-bold',
      icon: 'h-5 w-5',
      padding: 'px-4 py-3',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  // Format time components with leading zeros
  const formatTime = (value: number) => value.toString().padStart(2, '0');

  // Get localized text
  const getMessage = () => {
    return contentByLang(settings.message, settings.messageAr);
  };

  const getTitle = () => {
    return contentByLang(settings.title, settings.titleAr);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`
          inline-flex items-center ${config.gap} 
          bg-gradient-to-r from-orange-100 to-red-100 
          text-orange-800 border border-orange-200 
          rounded-lg ${config.padding} ${config.container}
          ${className}
        `}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {showIcon && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ClockIcon className={`${config.icon} text-orange-600`} />
          </motion.div>
        )}
        
        <div className={`flex items-center ${config.gap}`}>
          {showMessage && (
            <span className={`${config.message} text-orange-700 whitespace-nowrap`}>
              {getMessage()}
            </span>
          )}
          
          <div className={`${config.timer} text-orange-800 font-mono whitespace-nowrap`}>
            <motion.span
              key={timeRemaining.hours}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              {formatTime(timeRemaining.hours)}
            </motion.span>
            :
            <motion.span
              key={timeRemaining.minutes}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              {formatTime(timeRemaining.minutes)}
            </motion.span>
            :
            <motion.span
              key={timeRemaining.seconds}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
              className="text-red-600"
            >
              {formatTime(timeRemaining.seconds)}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export a hook for getting FOMO settings in other components
export function useFOMOSettings() {
  const [settings, setSettings] = useState<FOMOSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/content/fomo-offers');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching FOMO settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
} 