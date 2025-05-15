'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PromotionForm from '@/app/backend/promotions/new/PromotionForm';
import Link from 'next/link';
import BackendLayout from '@/app/backend/components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useLanguage();
  
  const [promotion, setPromotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/promotions/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch promotion');
        }
        
        const data = await response.json();
        setPromotion(data);
      } catch (err) {
        console.error('Error fetching promotion:', err);
        setError('Failed to load promotion. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPromotion();
    }
  }, [id]);
  
  if (loading) {
    return (
      <BackendLayout activePage="promotions">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </BackendLayout>
    );
  }
  
  if (error || !promotion) {
    return (
      <BackendLayout activePage="promotions">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">{t('error', 'Error')}</h1>
          <p className="text-red-600 mb-6">{error || t('promotion_not_found', 'Promotion not found')}</p>
          <Link 
            href="/backend/promotions" 
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
          >
            {t('back_to_promotions', 'Back to Promotions')}
          </Link>
        </div>
      </BackendLayout>
    );
  }
  
  return (
    <BackendLayout activePage="promotions">
      <PromotionForm promotion={promotion} isEditing={true} />
    </BackendLayout>
  );
}
