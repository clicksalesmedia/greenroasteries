'use client';

import PromotionForm from '@/app/backend/promotions/new/PromotionForm';
import BackendLayout from '../../components/BackendLayout';

export default function NewPromotionPage() {
  return (
    <BackendLayout activePage="promotions">
      <PromotionForm />
    </BackendLayout>
  );
}
