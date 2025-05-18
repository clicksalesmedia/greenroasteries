'use client';

import { useState, FormEvent } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ContactPage() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = language === 'ar' ? 'يرجى إدخال عنوان بريد إلكتروني صالح' : 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would send the form data to your backend
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // if (!response.ok) throw new Error('Failed to submit form');
      
      showToast(
        language === 'ar' 
          ? 'تم إرسال رسالتك بنجاح!' 
          : 'Your message has been sent successfully!', 
        'success'
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast(
        language === 'ar'
          ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقًا.'
          : 'Failed to send message. Please try again later.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className={`text-3xl font-bold mb-12 text-center`}>{t('contact', 'Contact Us')}</h1>
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12`}>
        {/* Contact information */}
        <div className={language === 'ar' ? 'lg:order-2' : 'lg:order-1'}>
          <h2 className={`text-2xl font-bold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>{t('get_in_touch', 'Get in Touch')}</h2>
          <p className={`text-gray-600 mb-8 ${language === 'ar' ? 'text-right' : ''}`}>
            {t('contact_intro', "We'd love to hear from you! Whether you have a question about our products, want to place a bulk order, or just want to say hello, our team is here to help.")}
          </p>
          
          <div className="space-y-6">
            <div className={`flex items-start ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <div className={`flex-shrink-0 mt-1 ${language === 'ar' ? 'ml-4' : 'mr-4'}`}>
                <MapPinIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <h3 className="text-lg font-medium">{t('visit_us', 'Visit Us')}</h3>
                <p className="text-gray-600 mt-1">
                  {t('green_roasteries_coffee_house', 'Green Roasteries Coffee House')}<br />
                  {t('sheikh_zayed_road', 'Sheikh Zayed Road')}<br />
                  {t('dubai_uae', 'Dubai, UAE')}
                </p>
              </div>
            </div>
            
            <div className={`flex items-start ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <div className={`flex-shrink-0 mt-1 ${language === 'ar' ? 'ml-4' : 'mr-4'}`}>
                <PhoneIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <h3 className="text-lg font-medium">{t('call_us', 'Call Us')}</h3>
                <p className="text-gray-600 mt-1">
                  +971 4 123 4567<br />
                  {t('mon_fri', 'Mon-Fri')}: {t('8am_8pm', '8am-8pm')}<br />
                  {t('sat_sun', 'Sat-Sun')}: {t('9am_6pm', '9am-6pm')}
                </p>
              </div>
            </div>
            
            <div className={`flex items-start ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <div className={`flex-shrink-0 mt-1 ${language === 'ar' ? 'ml-4' : 'mr-4'}`}>
                <EnvelopeIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <h3 className="text-lg font-medium">{t('email_us', 'Email Us')}</h3>
                <p className="text-gray-600 mt-1">
                  info@greenroasteries.com<br />
                  orders@greenroasteries.com<br />
                  support@greenroasteries.com
                </p>
              </div>
            </div>
          </div>
          
          {/* Google Maps - Main Location */}
          <div className="mt-10">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>{t('dubai_location', 'Dubai Location')}</h3>
            <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178563151027!2d55.2716175!3d25.2048493!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1ceb7e2!2sSheikh%20Zayed%20Rd%20-%20Dubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sus!4v1643212038051!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Dubai Location"
              ></iframe>
            </div>
          </div>
        </div>
        
        {/* Contact form */}
        <div className={language === 'ar' ? 'lg:order-1' : 'lg:order-2'}>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h2 className={`text-2xl font-bold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>{t('send_message', 'Send Us a Message')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('full_name', 'Full Name')}*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email_address', 'Email Address')}*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
                  placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Your email address'}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* Phone (optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone_optional', 'Phone Number (optional)')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700"
                  disabled={isSubmitting}
                  placeholder={language === 'ar' ? 'رقم الهاتف' : 'Your phone number'}
                />
              </div>
              
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subject', 'Subject')}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700"
                  disabled={isSubmitting}
                >
                  <option value="">{language === 'ar' ? 'اختر موضوعًا' : 'Select a subject'}</option>
                  <option value="Product Inquiry">{t('product_inquiry', 'Product Inquiry')}</option>
                  <option value="Order Status">{t('order_status', 'Order Status')}</option>
                  <option value="Wholesale">{t('wholesale_inquiry', 'Wholesale Inquiry')}</option>
                  <option value="Feedback">{t('feedback', 'Feedback')}</option>
                  <option value="Other">{t('other', 'Other')}</option>
                </select>
              </div>
              
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('message', 'Message')}*
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
                  placeholder={language === 'ar' ? 'رسالتك' : 'Your message'}
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-green-700 text-white py-3 px-4 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') 
                    : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
                </button>
              </div>
            </form>
          </div>
          
          {/* Google Maps - Second Location */}
          <div className="mt-8">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>{t('abu_dhabi_location', 'Abu Dhabi Location')}</h3>
            <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3631.1727448626863!2d54.36843061537967!3d24.48651198423602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5e66218494e9f5%3A0xd9159f9a59e34b77!2sAbu%20Dhabi%20Mall!5e0!3m2!1sen!2sus!4v1643212292431!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Abu Dhabi Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
      
      {/* Store Hours */}
      <div className="mt-16 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('store_hours', 'Store Hours')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div>
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>{t('dubai_location', 'Dubai Location')}</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('monday_friday', 'Monday - Friday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('8am_8pm', '8:00 AM - 8:00 PM')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('saturday', 'Saturday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('9am_6pm', '9:00 AM - 6:00 PM')}</td>
                </tr>
                <tr>
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('sunday', 'Sunday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('9am_6pm', '9:00 AM - 6:00 PM')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>{t('abu_dhabi_location', 'Abu Dhabi Location')}</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('monday_friday', 'Monday - Friday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('9am_9pm', '9:00 AM - 9:00 PM')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('saturday', 'Saturday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('10am_7pm', '10:00 AM - 7:00 PM')}</td>
                </tr>
                <tr>
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('sunday', 'Sunday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('10am_7pm', '10:00 AM - 7:00 PM')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>{t('online_support', 'Online Support')}</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('monday_friday', 'Monday - Friday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('8am_10pm', '8:00 AM - 10:00 PM')}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('saturday', 'Saturday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('9am_8pm', '9:00 AM - 8:00 PM')}</td>
                </tr>
                <tr>
                  <td className={`py-2 font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('sunday', 'Sunday')}</td>
                  <td className={`py-2 ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('9am_8pm', '9:00 AM - 8:00 PM')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
