'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';
import React from 'react';

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const { t, contentByLang } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete', 'Are you sure you want to delete this category?'))) {
      return;
    }
    
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }
      
      // Remove deleted category from state
      setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category status');
      }
      
      // Update the local state
      setCategories(categories.map(category => {
        if (category.id === id) {
          return { ...category, isActive: !currentStatus };
        }
        // Also check children
        if (category.children) {
          const updatedChildren = category.children.map(child => {
            if (child.id === id) {
              return { ...child, isActive: !currentStatus };
            }
            return child;
          });
          return { ...category, children: updatedChildren };
        }
        return category;
      }));
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category status');
    }
  };

  const renderCategoryRow = (category: Category, isChild = false) => (
    <tr key={category.id} className={`${isChild ? 'bg-gray-50' : ''} hover:bg-gray-100`}>
      <td className="py-3 px-4">
        {isChild && <span className="ml-4">↳ </span>}
        {category.imageUrl ? (
          <Image 
            src={category.imageUrl}
            alt={contentByLang(category.name, category.nameAr || category.name)}
            width={40}
            height={40}
            className="inline-block mr-2 rounded-md object-cover"
          />
        ) : (
          <div className="w-10 h-10 inline-block mr-2 bg-gray-200 rounded-md"></div>
        )}
        {contentByLang(category.name, category.nameAr || category.name)}
      </td>
      <td className="py-3 px-4">/{category.slug}</td>
      <td className="py-3 px-4">
        {category._count?.products || 0} {t('products', 'products')}
      </td>
      <td className="py-3 px-4">
        {category.isActive ? (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            {t('active', 'Active')}
          </span>
        ) : (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
            {t('inactive', 'Inactive')}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex space-x-2">
          <button
            onClick={() => handleToggleActive(category.id, category.isActive)}
            className={`px-3 py-1 rounded text-xs ${
              category.isActive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {category.isActive ? t('deactivate', 'Deactivate') : t('activate', 'Activate')}
          </button>
          <button
            onClick={() => router.push(`/backend/categories/edit/${category.id}`)}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs"
          >
            {t('edit', 'Edit')}
          </button>
          <button
            onClick={() => handleDelete(category.id)}
            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs"
            disabled={!!category.children?.length || (category._count?.products || 0) > 0}
            title={!!category.children?.length || (category._count?.products || 0) > 0 ? 
              t('cannot_delete_category_with_children', 'Cannot delete category with subcategories or products') : 
              t('delete_category', 'Delete category')}
          >
            {t('delete', 'Delete')}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <BackendLayout activePage="categories">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t('manage_categories', 'Manage Categories')}</h1>
          <Link 
            href="/backend/categories/new" 
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
          >
            {t('add_new_category', 'Add New Category')}
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">{t('category_name', 'Category Name')}</th>
                  <th className="py-3 px-4 text-left">{t('slug', 'Slug')}</th>
                  <th className="py-3 px-4 text-left">{t('products', 'Products')}</th>
                  <th className="py-3 px-4 text-left">{t('status', 'Status')}</th>
                  <th className="py-3 px-4 text-left">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  <>
                    {categories.map(category => (
                      <React.Fragment key={category.id}>
                        {renderCategoryRow(category)}
                        {category.children?.map(child => renderCategoryRow(child, true))}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {t('no_categories_found', 'No categories found. Click "Add New Category" to create one.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BackendLayout>
  );
}
