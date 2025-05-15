'use client';

import { ProductForm } from './ProductForm';
import BackendLayout from '../../components/BackendLayout';

export default function NewProductPage() {
  return (
    <BackendLayout activePage="products">
      <ProductForm />
    </BackendLayout>
  );
}
