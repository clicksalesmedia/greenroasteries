'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../../../components/BackendLayout';
import Link from 'next/link';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Available backend modules - same as in new user page
const availableModules = [
  { id: 'products', name: 'Products' },
  { id: 'categories', name: 'Categories' },
  { id: 'orders', name: 'Orders' },
  { id: 'customers', name: 'Customers' },
  { id: 'users', name: 'Users' },
  { id: 'promotions', name: 'Promotions' },
  { id: 'variations', name: 'Variations' },
  { id: 'settings', name: 'Settings' },
];

interface Permission {
  id: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionState {
  [key: string]: {
    id?: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  permissions: Permission[];
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const router = useRouter();
  // Properly handle params using React.use - accessing id from params with React.use
  const userId = React.use(params).id;
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Optional for updates
  const [role, setRole] = useState('TEAM');
  const [isActive, setIsActive] = useState(true);
  
  // Permissions state
  const [permissions, setPermissions] = useState<PermissionState>(() => {
    const initialPermissions: PermissionState = {};
    
    availableModules.forEach(module => {
      initialPermissions[module.id] = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      };
    });
    
    return initialPermissions;
  });
  
  // Form submission state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user');
        }
        
        const userData: User = await response.json();
        
        // Set form fields
        setName(userData.name || '');
        setEmail(userData.email);
        setRole(userData.role);
        setIsActive(userData.isActive);
        
        // Set permissions
        const permissionsData: PermissionState = {};
        
        // Initialize all modules with default permissions
        availableModules.forEach(module => {
          permissionsData[module.id] = {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false
          };
        });
        
        // Override with actual permissions
        userData.permissions.forEach(permission => {
          permissionsData[permission.module] = {
            id: permission.id,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete
          };
        });
        
        setPermissions(permissionsData);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching user:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  // Toggle a specific permission
  const togglePermission = (module: string, permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: !prev[module][permission]
      }
    }));
    
    // If enabling a higher permission, automatically enable view permission
    if (permission !== 'canView' && !permissions[module].canView) {
      setPermissions(prev => ({
        ...prev,
        [module]: {
          ...prev[module],
          canView: true
        }
      }));
    }
    
    // If disabling view permission, disable all other permissions
    if (permission === 'canView' && permissions[module].canView) {
      setPermissions(prev => ({
        ...prev,
        [module]: {
          ...prev[module],
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      }));
    }
  };
  
  // Select/deselect all permissions for a module
  const toggleAllPermissionsForModule = (module: string, enable: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        canView: enable,
        canCreate: enable,
        canEdit: enable,
        canDelete: enable
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!email) {
        throw new Error('Email is required');
      }
      
      // Prepare permission data - include IDs for existing permissions
      const permissionsList = Object.entries(permissions)
        .filter(([_, perms]) => perms.canView || perms.canCreate || perms.canEdit || perms.canDelete)
        .map(([module, perms]) => ({
          id: perms.id, // Will be undefined for new permissions
          module,
          canView: perms.canView,
          canCreate: perms.canCreate,
          canEdit: perms.canEdit,
          canDelete: perms.canDelete
        }));
      
      // Make API request to update user
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined, // Only include password if it's provided
          role,
          isActive,
          permissions: permissionsList
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
      
      // Success
      setSuccess(true);
      
      // Redirect to users list after a brief delay
      setTimeout(() => {
        router.push('/backend/users');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchLoading) {
    return (
      <BackendLayout activePage="users">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
          <p className="mt-2">{t('loading', 'Loading...')}</p>
        </div>
      </BackendLayout>
    );
  }
  
  return (
    <BackendLayout activePage="users">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('edit_user', 'Edit User')}</h1>
          <Link 
            href="/backend/users" 
            className="text-green-600 hover:text-green-800"
          >
            {t('back_to_list', 'Back to Users')}
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {t('user_updated_success', 'User updated successfully! Redirecting...')}
        </div>
      )}
      
      <div className="bg-white rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-4">{t('user_details', 'User Details')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name', 'Name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email', 'Email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('password', 'Password')} <span className="text-gray-500 text-xs">({t('leave_blank', 'Leave blank to keep current')})</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role', 'Role')}
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="ADMIN">{t('role_admin', 'Admin')}</option>
                    <option value="MANAGER">{t('role_manager', 'Manager')}</option>
                    <option value="TEAM">{t('role_team', 'Team Member')}</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    {t('user_active', 'User is active')}
                  </label>
                </div>
              </div>
            </div>
            
            {/* User Permissions Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-4">{t('permissions', 'Permissions')}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {t('permissions_note', 'Select which areas this user can access and what actions they can perform.')}
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('module', 'Module')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('view', 'View')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('create', 'Create')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('edit', 'Edit')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('delete', 'Delete')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('all', 'All')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {availableModules.map((module) => (
                      <tr key={module.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {t(module.id, module.name)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(module.id, 'canView')}
                            className={`h-5 w-5 rounded flex items-center justify-center ${
                              permissions[module.id].canView ? 'bg-green-600 text-white' : 'bg-gray-200'
                            }`}
                          >
                            {permissions[module.id].canView && <CheckIcon className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(module.id, 'canCreate')}
                            className={`h-5 w-5 rounded flex items-center justify-center ${
                              permissions[module.id].canCreate ? 'bg-green-600 text-white' : 'bg-gray-200'
                            }`}
                          >
                            {permissions[module.id].canCreate && <CheckIcon className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(module.id, 'canEdit')}
                            className={`h-5 w-5 rounded flex items-center justify-center ${
                              permissions[module.id].canEdit ? 'bg-green-600 text-white' : 'bg-gray-200'
                            }`}
                          >
                            {permissions[module.id].canEdit && <CheckIcon className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(module.id, 'canDelete')}
                            className={`h-5 w-5 rounded flex items-center justify-center ${
                              permissions[module.id].canDelete ? 'bg-green-600 text-white' : 'bg-gray-200'
                            }`}
                          >
                            {permissions[module.id].canDelete && <CheckIcon className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => toggleAllPermissionsForModule(
                              module.id, 
                              !(permissions[module.id].canView && 
                                permissions[module.id].canCreate && 
                                permissions[module.id].canEdit && 
                                permissions[module.id].canDelete)
                            )}
                            className="text-gray-500 hover:text-green-600"
                          >
                            {permissions[module.id].canView && 
                              permissions[module.id].canCreate && 
                              permissions[module.id].canEdit && 
                              permissions[module.id].canDelete ? (
                              <XMarkIcon className="h-5 w-5" />
                            ) : (
                              <CheckIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/backend/users"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {t('cancel', 'Cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? t('updating', 'Updating...') : t('update_user', 'Update User')}
            </button>
          </div>
        </form>
      </div>
    </BackendLayout>
  );
}
