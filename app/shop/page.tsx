import { Suspense } from 'react';
import ShopContent from '../components/ShopContent';
import Loading from '../components/Loading';

export const dynamic = 'force-dynamic';

export default function ShopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShopContent />
    </Suspense>
  );
} 