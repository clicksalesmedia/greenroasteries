'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SeedCategoriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleSeedCategories = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/seed/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      console.error('Error seeding categories:', error);
    } finally {
      setIsLoading(false);
    }
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
                <a href="/backend/categories" className="block py-2 px-4 rounded bg-green-800">
                  Categories
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Seed Categories</h1>
              <Link 
                href="/backend/categories" 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Back to Categories
              </Link>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will add the following categories to your database:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>ARABICA COFFEE</li>
                <li>MEDIUM ROAST</li>
                <li>ESPRESSO ROAST</li>
                <li>TURKISH ROAST</li>
                <li>NUTS & DRIED FRUITS</li>
              </ul>
            </div>

            {result && (
              <div className={`p-4 mb-6 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.success && result.message && (
                  <p>{result.message}</p>
                )}
                {result.error && (
                  <p>Error: {result.error}</p>
                )}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleSeedCategories}
                disabled={isLoading}
                className={`bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Adding Categories...' : 'Add Categories'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 