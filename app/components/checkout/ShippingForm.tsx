'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShippingFormProps {
  initialValues: {
    emirate: string;
    city: string;
    address: string;
  };
  onSubmit: (values: { emirate: string; city: string; address: string }) => void;
  onBack: () => void;
}

export default function ShippingForm({ initialValues, onSubmit, onBack }: ShippingFormProps) {
  const { t, language } = useLanguage();
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const emirates = [
    { value: '', label: t('select_emirate', 'Select an Emirate') },
    { value: 'abu-dhabi', label: language === 'ar' ? 'أبوظبي' : 'Abu Dhabi' },
    { value: 'dubai', label: language === 'ar' ? 'دبي' : 'Dubai' },
    { value: 'sharjah', label: language === 'ar' ? 'الشارقة' : 'Sharjah' },
    { value: 'ajman', label: language === 'ar' ? 'عجمان' : 'Ajman' },
    { value: 'umm-al-quwain', label: language === 'ar' ? 'أم القيوين' : 'Umm Al Quwain' },
    { value: 'ras-al-khaimah', label: language === 'ar' ? 'رأس الخيمة' : 'Ras Al Khaimah' },
    { value: 'fujairah', label: language === 'ar' ? 'الفجيرة' : 'Fujairah' }
  ];

  const citiesByEmirate: { [key: string]: { value: string; label: string }[] } = {
    'abu-dhabi': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Abu Dhabi', label: language === 'ar' ? 'أبوظبي' : 'Abu Dhabi' },
      { value: 'Al Ain', label: language === 'ar' ? 'العين' : 'Al Ain' },
      { value: 'Zayed City', label: language === 'ar' ? 'مدينة زايد' : 'Zayed City' },
      { value: 'Ruwais', label: language === 'ar' ? 'الرويس' : 'Ruwais' },
      { value: 'Liwa', label: language === 'ar' ? 'ليوا' : 'Liwa' },
      { value: 'Madinat Zayed', label: language === 'ar' ? 'مدينة زايد' : 'Madinat Zayed' },
      { value: 'Ghayathi', label: language === 'ar' ? 'غياثي' : 'Ghayathi' }
    ],
    'dubai': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Dubai', label: language === 'ar' ? 'دبي' : 'Dubai' },
      { value: 'Deira', label: language === 'ar' ? 'ديرة' : 'Deira' },
      { value: 'Bur Dubai', label: language === 'ar' ? 'بر دبي' : 'Bur Dubai' },
      { value: 'Jumeirah', label: language === 'ar' ? 'جميرا' : 'Jumeirah' },
      { value: 'Downtown Dubai', label: language === 'ar' ? 'وسط مدينة دبي' : 'Downtown Dubai' },
      { value: 'Dubai Marina', label: language === 'ar' ? 'مرسى دبي' : 'Dubai Marina' },
      { value: 'Business Bay', label: language === 'ar' ? 'الخليج التجاري' : 'Business Bay' },
      { value: 'JBR', label: language === 'ar' ? 'شاطئ الجميرا' : 'JBR (Jumeirah Beach Residence)' },
      { value: 'DIFC', label: language === 'ar' ? 'مركز دبي المالي العالمي' : 'DIFC (Dubai International Financial Centre)' },
      { value: 'Dubai Silicon Oasis', label: language === 'ar' ? 'واحة دبي للسيليكون' : 'Dubai Silicon Oasis' },
      { value: 'Dubai Investment Park', label: language === 'ar' ? 'مجمع دبي للاستثمار' : 'Dubai Investment Park' },
      { value: 'Hatta', label: language === 'ar' ? 'حتا' : 'Hatta' }
    ],
    'sharjah': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Sharjah', label: language === 'ar' ? 'الشارقة' : 'Sharjah' },
      { value: 'Kalba', label: language === 'ar' ? 'كلباء' : 'Kalba' },
      { value: 'Khor Fakkan', label: language === 'ar' ? 'خورفكان' : 'Khor Fakkan' },
      { value: 'Dibba Al-Hisn', label: language === 'ar' ? 'دبا الحصن' : 'Dibba Al-Hisn' },
      { value: 'Al Dhaid', label: language === 'ar' ? 'الذيد' : 'Al Dhaid' },
      { value: 'Mleiha', label: language === 'ar' ? 'مليحة' : 'Mleiha' }
    ],
    'ajman': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Ajman', label: language === 'ar' ? 'عجمان' : 'Ajman' },
      { value: 'Manama', label: language === 'ar' ? 'المنامة' : 'Manama' },
      { value: 'Masfout', label: language === 'ar' ? 'مصفوت' : 'Masfout' }
    ],
    'umm-al-quwain': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Umm Al Quwain', label: language === 'ar' ? 'أم القيوين' : 'Umm Al Quwain' },
      { value: 'Falaj Al Mualla', label: language === 'ar' ? 'فلج المعلا' : 'Falaj Al Mualla' }
    ],
    'ras-al-khaimah': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Ras Al Khaimah', label: language === 'ar' ? 'رأس الخيمة' : 'Ras Al Khaimah' },
      { value: 'Julfar', label: language === 'ar' ? 'جلفار' : 'Julfar' },
      { value: 'Digdaga', label: language === 'ar' ? 'دقداقة' : 'Digdaga' },
      { value: 'Khatt', label: language === 'ar' ? 'خت' : 'Khatt' }
    ],
    'fujairah': [
      { value: '', label: t('select_city', 'Select a city') },
      { value: 'Fujairah', label: language === 'ar' ? 'الفجيرة' : 'Fujairah' },
      { value: 'Dibba Al-Fujairah', label: language === 'ar' ? 'دبا الفجيرة' : 'Dibba Al-Fujairah' },
      { value: 'Al Bidiyah', label: language === 'ar' ? 'البدية' : 'Al Bidiyah' },
      { value: 'Masafi', label: language === 'ar' ? 'مسافي' : 'Masafi' }
    ]
  };

  const availableCities = formValues.emirate ? citiesByEmirate[formValues.emirate] || [] : [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If emirate changes, reset city
    if (name === 'emirate') {
      setFormValues(prev => ({ ...prev, [name]: value, city: '' }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
    
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
    
    // Validate emirate
    if (!formValues.emirate) {
      newErrors.emirate = t('select_emirate_required', 'Please select an emirate');
    }
    
    // Validate city
    if (!formValues.city) {
      newErrors.city = t('select_city_required', 'Please select a city');
    }
    
    // Validate address
    if (!formValues.address.trim()) {
      newErrors.address = t('address_required', 'Delivery address is required');
    } else if (formValues.address.trim().length < 10) {
      newErrors.address = t('complete_address', 'Please provide a complete address');
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
        {t('shipping_info', 'Shipping Information')}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Emirate dropdown */}
          <div>
            <label htmlFor="emirate" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('emirate', 'Emirate')}*
            </label>
            <select
              id="emirate"
              name="emirate"
              value={formValues.emirate}
              onChange={handleChange}
              className={`w-full border ${errors.emirate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {emirates.map(emirate => (
                <option key={emirate.value} value={emirate.value}>
                  {emirate.label}
                </option>
              ))}
            </select>
            {errors.emirate && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.emirate}</p>
            )}
          </div>

          {/* City dropdown */}
          <div>
            <label htmlFor="city" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('city', 'City')}*
            </label>
            <select
              id="city"
              name="city"
              value={formValues.city}
              onChange={handleChange}
              disabled={!formValues.emirate}
              className={`w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black ${!formValues.emirate ? 'bg-gray-100 cursor-not-allowed' : ''} ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {availableCities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.city}</p>
            )}
            {!formValues.emirate && (
              <p className={`mt-1 text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
                {t('select_emirate_first', 'Please select an emirate first')}
              </p>
            )}
          </div>
          
          {/* Address */}
          <div>
            <label htmlFor="address" className={`block text-sm font-medium text-gray-700 mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('delivery_address', 'Delivery Address')}*
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formValues.address}
              onChange={handleChange}
              className={`w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black ${language === 'ar' ? 'text-right' : ''}`}
              placeholder={t('building_street_area', 'Building name/number, street, area, landmark')}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.address && (
              <p className={`mt-1 text-sm text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{errors.address}</p>
            )}
            <p className={`mt-1 text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
              {t('complete_delivery_details', 'Please provide complete details to ensure smooth delivery')}
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className={`pt-4 flex flex-col sm:flex-row gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : 'sm:flex-row-reverse'}`}>
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              {t('continue_to_payment', 'Continue to Payment')}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-1/2 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {t('back', 'Back')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 