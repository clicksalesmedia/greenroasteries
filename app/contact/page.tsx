'use client';

import { useState, FormEvent } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

export default function ContactPage() {
  const { showToast } = useToast();
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
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
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
      
      showToast('Your message has been sent successfully!', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('Failed to send message. Please try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-12 text-center">Contact Us</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact information */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            We'd love to hear from you! Whether you have a question about our products,
            want to place a bulk order, or just want to say hello, our team is here to help.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <MapPinIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Visit Us</h3>
                <p className="text-gray-600 mt-1">
                  Green Roasteries Coffee House<br />
                  Sheikh Zayed Road<br />
                  Dubai, UAE
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <PhoneIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Call Us</h3>
                <p className="text-gray-600 mt-1">
                  +971 4 123 4567<br />
                  Mon-Fri: 8am-8pm<br />
                  Sat-Sun: 9am-6pm
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <EnvelopeIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Email Us</h3>
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
            <h3 className="text-lg font-medium mb-4">Dubai Location</h3>
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
        <div>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* Phone (optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700"
                  disabled={isSubmitting}
                >
                  <option value="">Select a subject</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Order Status">Order Status</option>
                  <option value="Wholesale">Wholesale Inquiry</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message*
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-700 focus:border-green-700`}
                  disabled={isSubmitting}
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
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Google Maps - Second Location */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Abu Dhabi Location</h3>
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
        <h2 className="text-2xl font-bold mb-6 text-center">Store Hours</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Dubai Location</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Monday - Friday</td>
                  <td className="py-2 text-right">8:00 AM - 8:00 PM</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Saturday</td>
                  <td className="py-2 text-right">9:00 AM - 6:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Sunday</td>
                  <td className="py-2 text-right">9:00 AM - 6:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Abu Dhabi Location</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Monday - Friday</td>
                  <td className="py-2 text-right">9:00 AM - 9:00 PM</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Saturday</td>
                  <td className="py-2 text-right">10:00 AM - 7:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Sunday</td>
                  <td className="py-2 text-right">10:00 AM - 7:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Online Support</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Monday - Friday</td>
                  <td className="py-2 text-right">8:00 AM - 10:00 PM</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Saturday</td>
                  <td className="py-2 text-right">9:00 AM - 8:00 PM</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Sunday</td>
                  <td className="py-2 text-right">9:00 AM - 8:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
