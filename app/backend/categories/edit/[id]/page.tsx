'use client';

// Server Component
import { CategoryEditForm } from './CategoryEditForm';
import { use } from 'react';
import BackendLayout from '@/app/backend/components/BackendLayout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return (
    <BackendLayout activePage="categories">
      <CategoryEditForm categoryId={resolvedParams.id} />
    </BackendLayout>
  );
}
