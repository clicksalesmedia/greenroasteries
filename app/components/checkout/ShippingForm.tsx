'use client';

import { useState, FormEvent } from 'react';

interface ShippingFormProps {
  initialValues: {
    city: string;
    address: string;
  };
  onSubmit: (values: { city: string; address: string }) => void;
  onBack: () => void;
}

export default function ShippingForm({ initialValues, onSubmit, onBack }: ShippingFormProps) {
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const cities = [
    { value: '', label: 'Select a city' },
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Sharjah', label: 'Sharjah' },
    { value: 'Al Dhaid', label: 'Al Dhaid' }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    
    // Validate city
    if (!formValues.city) {
      newErrors.city = 'Please select a city';
    }
    
    // Validate address
    if (!formValues.address.trim()) {
      newErrors.address = 'Delivery address is required';
    } else if (formValues.address.trim().length < 10) {
      newErrors.address = 'Please provide a complete address';
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
    <div>
      <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* City dropdown */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City*
            </label>
            <select
              id="city"
              name="city"
              value={formValues.city}
              onChange={handleChange}
              className={`w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
            >
              {cities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
          
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address*
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formValues.address}
              onChange={handleChange}
              className={`w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
              placeholder="Building name/number, street, area, landmark"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Please provide complete details to ensure smooth delivery
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row-reverse gap-4">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              Continue to Payment
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-1/2 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 