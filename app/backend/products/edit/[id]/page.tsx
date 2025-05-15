'use client';

import { ProductEditForm } from './ProductEditForm';
import { use } from 'react';
import BackendLayout from '@/app/backend/components/BackendLayout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return (
    <BackendLayout activePage="products">
      <ProductEditForm productId={resolvedParams.id} />
    </BackendLayout>
  );
}
