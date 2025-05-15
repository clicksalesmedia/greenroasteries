'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export default function UsersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove user from state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting user:', err);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'TEAM':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <BackendLayout activePage="users">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('manage_users', 'Manage Users')}</h1>
          <p className="text-gray-600">{t('users_description', 'Create and manage admin users and their permissions')}</p>
        </div>
        <Link 
          href="/backend/users/new" 
          className="bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('add_user', 'Add User')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
          <p className="mt-2">{t('loading', 'Loading...')}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('no_users', 'No users found')}</p>
          <Link 
            href="/backend/users/new" 
            className="mt-4 inline-block bg-green-600 text-white py-2 px-4 rounded-md"
          >
            {t('create_first_user', 'Create Your First User')}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">{t('name', 'Name')}</th>
                <th className="py-3 px-4 text-left">{t('email', 'Email')}</th>
                <th className="py-3 px-4 text-left">{t('role', 'Role')}</th>
                <th className="py-3 px-4 text-left">{t('status', 'Status')}</th>
                <th className="py-3 px-4 text-left">{t('created_at', 'Created')}</th>
                <th className="py-3 px-4 text-right">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="py-3 px-4">{user.name || '-'}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link 
                        href={`/backend/users/edit/${user.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title={t('edit_user', 'Edit User')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                        title={t('delete_user', 'Delete User')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BackendLayout>
  );
}
