'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VariationAddition {
  id: string;
  name: string;
  arabicName?: string;
  isActive: boolean;
}

export default function VariationAdditionsPage() {
  const [additions, setAdditions] = useState<VariationAddition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New addition form state
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdditions();
  }, []);

  const fetchAdditions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/variations/types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch variation additions');
      }
      
      const data = await response.json();
      setAdditions(data);
      
      // Check if "Normal" option exists, if not, suggest creating it
      const hasNormalOption = data.some((addition: VariationAddition) => 
        addition.name.toLowerCase() === 'normal'
      );
      
      if (!hasNormalOption) {
        setFormSuccess('Tip: You might want to create a "Normal" option to use as the default selection for variations.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching variation additions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      const response = await fetch(`/api/variations/types/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update addition status');
      }

      // Update local state
      setAdditions(additions.map(addition => {
        if (addition.id === id) {
          return { ...addition, isActive: !currentIsActive };
        }
        return addition;
      }));
    } catch (err) {
      console.error('Error updating addition:', err);
      alert('Failed to update addition status');
    }
  };
  
  const handleEdit = (addition: VariationAddition) => {
    setEditMode(true);
    setEditId(addition.id);
    setName(addition.name);
    setArabicName(addition.arabicName || '');
    setIsActive(addition.isActive);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addition? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/variations/types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete addition');
      }

      // Update local state
      setAdditions(additions.filter(addition => addition.id !== id));
      setFormSuccess('Addition deleted successfully');
    } catch (err) {
      console.error('Error deleting addition:', err);
      setFormError('Failed to delete addition');
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
        // Update existing addition
        const response = await fetch(`/api/variations/types/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            arabicName: arabicName || undefined,
            isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update addition');
        }
        
        setFormSuccess('Addition updated successfully');
        
        // Reset edit mode
        setEditMode(false);
        setEditId(null);
      } else {
        // Create new addition
        const response = await fetch('/api/variations/types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            arabicName: arabicName || undefined,
            isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create addition');
        }
        
        setFormSuccess('Addition created successfully');
      }

      // Reset form on success
      setName('');
      setArabicName('');
      setIsActive(true);
      
      // Refresh the list
      fetchAdditions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error submitting addition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setEditId(null);
    setName('');
    setArabicName('');
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
        {/* Add/Edit addition form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Addition' : 'Add New Addition'}</h2>
          
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g. Whole Beans"
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
                  placeholder="e.g. حبوب كاملة"
                />
              </div>
              
              <div className="flex items-center space-x-2 h-full pt-8">
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
                    {isSubmitting ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Addition' : 'Add Addition')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Additions list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="px-6 py-4 text-xl font-bold border-b border-gray-200">All Additions</h2>
          
          {additions.length === 0 ? (
            <div className="p-6 text-gray-500">
              No additions found. Add your first addition using the form above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arabic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {additions.map((addition) => (
                  <tr key={addition.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{addition.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{addition.arabicName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        addition.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {addition.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(addition)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(addition.id, addition.isActive)}
                          className={`px-3 py-1 rounded text-xs ${
                            addition.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {addition.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(addition.id)}
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
                <a href="/backend/variation" className="block py-2 px-4 rounded hover:bg-green-800">
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
              <h1 className="text-2xl font-bold mb-1">Addition Variations</h1>
              <p className="text-gray-600">Manage product addition options</p>
            </div>
            <Link href="/backend/variation" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition">
              Back to Variations
            </Link>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 