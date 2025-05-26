'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CustomerInfoFormProps {
  initialValues: {
    fullName: string;
    email: string;
    phone: string;
  };
  onSubmit: (values: { fullName: string; email: string; phone: string }) => void;
}

export default function CustomerInfoForm({ initialValues, onSubmit }: CustomerInfoFormProps) {
  const { t, language } = useLanguage();
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate full name
    if (!formValues.fullName.trim()) {
      newErrors.fullName = t('required_field', 'This field is required');
    }
    
    // Validate email
    if (!formValues.email.trim()) {
      newErrors.email = t('required_field', 'This field is required');
    } else if (!/^\S+@\S+\.\S+$/.test(formValues.email)) {
      newErrors.email = t('valid_email', 'Please enter a valid email address');
    }
    
    // Validate phone
    if (!formValues.phone.trim()) {
      newErrors.phone = t('required_field', 'This field is required');
    } else {
      // Remove all non-digit characters except the + sign
      const cleanPhone = formValues.phone.replace(/[-()\s]/g, '');
      
      // Check if it's a valid international phone number
      // Allows: +971501234567, 971501234567, 0501234567, 501234567
      const phoneRegex = /^(\+?\d{1,4})?[\d]{7,15}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = t('valid_phone', 'Please enter a valid phone number (e.g., +971501234567)');
      } else if (cleanPhone.length < 7 || cleanPhone.length > 20) {
        newErrors.phone = t('phone_length', 'Phone number must be between 7 and 20 digits');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={`text-xl font-bold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>
        {t('customer_info', 'Customer Information')}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('full_name', 'Full Name')}*
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formValues.fullName}
              onChange={handleChange}
              className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.fullName && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.fullName}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('email_address', 'Email Address')}*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
              dir="ltr"
            />
            {errors.email && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.email}</p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <label htmlFor="phone" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('phone_number', 'Phone Number')}*
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              placeholder="+971 50 123 4567"
              className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
              dir="ltr"
            />
            {errors.phone && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.phone}</p>
            )}
            <p className={`mt-1 text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('include_country_code', 'Include country code (e.g., +971 for UAE). Used for order updates and delivery.')}
            </p>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              {t('continue_to_shipping', 'Continue to Shipping')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 