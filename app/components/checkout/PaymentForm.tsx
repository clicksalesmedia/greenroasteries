'use client';

import { useState, FormEvent } from 'react';

interface PaymentFormProps {
  initialValues: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
  onSubmit: (values: { cardNumber: string; cardHolder: string; expiryDate: string; cvv: string }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function PaymentForm({ initialValues, onSubmit, onBack, isSubmitting }: PaymentFormProps) {
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, '');
      // Add spaces every 4 digits
      formattedValue = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      // Limit to 19 characters (16 digits + 3 spaces)
      formattedValue = formattedValue.substring(0, 19);
    }
    
    // Format expiry date as MM/YY
    if (name === 'expiryDate') {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 2) {
        formattedValue = digits;
      } else {
        // Format as MM/YY
        formattedValue = `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
      }
    }
    
    // Limit CVV to 3-4 digits
    if (name === 'cvv') {
      // Remove all non-digit characters
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setFormValues(prev => ({ ...prev, [name]: formattedValue }));
    
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
    
    // Validate card number (mock validation for demo)
    const cardNumber = formValues.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 16 || !/^\d+$/.test(cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    // Validate card holder
    if (!formValues.cardHolder.trim()) {
      newErrors.cardHolder = 'Cardholder name is required';
    }
    
    // Validate expiry date
    if (!formValues.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = formValues.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of year
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
      
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        newErrors.expiryDate = 'Please enter a valid date in MM/YY format';
      } else {
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);
        
        if (numMonth < 1 || numMonth > 12) {
          newErrors.expiryDate = 'Month must be between 01 and 12';
        } else if (numYear < currentYear || (numYear === currentYear && numMonth < currentMonth)) {
          newErrors.expiryDate = 'Card has expired';
        }
      }
    }
    
    // Validate CVV
    if (!formValues.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formValues.cvv.length < 3) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
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
      <h2 className="text-xl font-bold mb-6">Payment Information</h2>
      
      <div className="mb-6 bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between">
        <div className="flex space-x-3 mb-2 sm:mb-0">
          <img src="/images/payment-methods.svg" alt="Payment Methods" className="h-8" />
        </div>
        <p className="text-sm text-gray-600 text-center sm:text-left">
          All transactions are secure and encrypted.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Card Number */}
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Card Number*
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formValues.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              className={`w-full border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
              disabled={isSubmitting}
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>
          
          {/* Card Holder */}
          <div>
            <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name*
            </label>
            <input
              type="text"
              id="cardHolder"
              name="cardHolder"
              value={formValues.cardHolder}
              onChange={handleChange}
              placeholder="John Smith"
              className={`w-full border ${errors.cardHolder ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
              disabled={isSubmitting}
            />
            {errors.cardHolder && (
              <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
            )}
          </div>
          
          {/* Expiry Date and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date*
              </label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={formValues.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                className={`w-full border ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
                disabled={isSubmitting}
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                CVV*
              </label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={formValues.cvv}
                onChange={handleChange}
                placeholder="123"
                className={`w-full border ${errors.cvv ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black`}
                disabled={isSubmitting}
              />
              {errors.cvv && (
                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Note: This is a mock payment form for AED currency. No real payment will be processed.
          </p>
          
          {/* Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row-reverse gap-4">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Complete Purchase'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-1/2 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 