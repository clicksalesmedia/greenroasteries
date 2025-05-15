'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VariationBeans {
  id: string;
  name: string;
  arabicName?: string;
  description?: string;
  isActive: boolean;
}

export default function VariationBeansPage() {
  const [beans, setBeans] = useState<VariationBeans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New bean form state
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchBeans();
  }, []);

  const fetchBeans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/variations/beans');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bean variations');
      }
      
      const data = await response.json();
      setBeans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching bean variations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      const response = await fetch(`/api/variations/beans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bean status');
      }

      // Update local state
      setBeans(beans.map(bean => {
        if (bean.id === id) {
          return { ...bean, isActive: !currentIsActive };
        }
        return bean;
      }));
    } catch (err) {
      console.error('Error updating bean:', err);
      alert('Failed to update bean status');
    }
  };

  const handleEdit = (bean: VariationBeans) => {
    setEditMode(true);
    setEditId(bean.id);
    setName(bean.name);
    setArabicName(bean.arabicName || '');
    setDescription(bean.description || '');
    setIsActive(bean.isActive);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bean variation? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/variations/beans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bean variation');
      }

      // Update local state
      setBeans(beans.filter(bean => bean.id !== id));
      setFormSuccess('Bean variation deleted successfully');
    } catch (err) {
      console.error('Error deleting bean variation:', err);
      setFormError('Failed to delete bean variation');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!name) {
        setFormError('Name is required');
        setIsSubmitting(false);
        return;
      }

      if (editMode && editId) {
        // Update existing bean variation
        const response = await fetch(`/api/variations/beans/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            arabicName: arabicName || undefined,
            description: description || undefined,
            isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update bean variation');
        }
        
        setFormSuccess('Bean variation updated successfully');
        
        // Reset edit mode
        setEditMode(false);
        setEditId(null);
      } else {
        // Create new bean variation
        const response = await fetch('/api/variations/beans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            arabicName: arabicName || undefined,
            description: description || undefined,
            isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create bean variation');
        }
        
        setFormSuccess('Bean variation created successfully');
      }

      // Reset form on success
      setName('');
      setArabicName('');
      setDescription('');
      setIsActive(true);
      
      // Refresh the list
      fetchBeans();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error submitting bean variation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setEditId(null);
    setName('');
    setArabicName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Add new bean form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Bean Variation' : 'Add New Bean Variation'}</h2>
          
          {formError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
              {formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. Arabica"
                />
              </div>
              
              <div>
                <label htmlFor="arabicName" className="block text-sm font-medium text-gray-700 mb-1">Arabic Name (Optional)</label>
                <input
                  type="text"
                  id="arabicName"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. عربيكا"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Brief description of this bean type"
                />
              </div>
              
              <div className="flex items-center space-x-2 md:col-span-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                
                <div className="ml-auto flex space-x-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting 
                      ? (editMode ? 'Updating...' : 'Adding...') 
                      : (editMode ? 'Update Bean Variation' : 'Add Bean Variation')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Beans list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="px-6 py-4 text-xl font-bold border-b border-gray-200">All Bean Variations</h2>
          
          {beans.length === 0 ? (
            <div className="p-6 text-gray-500">
              No bean variations found. Add your first bean variation using the form above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arabic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {beans.map((bean) => (
                  <tr key={bean.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{bean.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{bean.arabicName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{bean.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bean.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bean.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(bean)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(bean.id, bean.isActive)}
                          className={`px-3 py-1 rounded text-xs ${
                            bean.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {bean.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(bean.id)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-green-900 text-white h-screen fixed">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Green Roasteries</h1>
            <p className="text-sm">Admin Dashboard</p>
          </div>
          <nav className="mt-8">
            <ul className="space-y-2 px-4">
              <li>
                <a href="/backend" className="block py-2 px-4 rounded hover:bg-green-800">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/backend/products" className="block py-2 px-4 rounded hover:bg-green-800">
                  Products
                </a>
              </li>
              <li>
                <a href="/backend/categories" className="block py-2 px-4 rounded hover:bg-green-800">
                  Categories
                </a>
              </li>
              <li>
                <a href="/backend/variation" className="block py-2 px-4 rounded bg-green-800">
                  Variations
                </a>
              </li>
              <li>
                <a href="/backend/orders" className="block py-2 px-4 rounded hover:bg-green-800">
                  Orders
                </a>
              </li>
              <li>
                <a href="/backend/users" className="block py-2 px-4 rounded hover:bg-green-800">
                  Users
                </a>
              </li>
              <li>
                <a href="/backend/promotions" className="block py-2 px-4 rounded hover:bg-green-800">
                  Promotions
                </a>
              </li>
              <li>
                <a href="/backend/settings" className="block py-2 px-4 rounded hover:bg-green-800">
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="ml-64 p-8 w-full">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Bean Variations</h1>
              <p className="text-gray-600">Manage bean variations (Arabica, Robusta, etc.)</p>
            </div>
            <div className="flex space-x-2">
              <Link 
                href="/backend/variation"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Back to Variations
              </Link>
              <Link 
                href="/backend/variation/sizes"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Manage Sizes
              </Link>
              <Link 
                href="/backend/variation/types"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Manage Types
              </Link>
            </div>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 