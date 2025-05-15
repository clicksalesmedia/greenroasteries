'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBackendPath = pathname?.startsWith('/backend') || false;
  
  return (
    <>
      {!isBackendPath && <Header />}
      <main>{children}</main>
      {!isBackendPath && <Footer />}
    </>
  );
} 