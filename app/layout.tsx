'use client';

import "./globals.css";
import "./styles/toast.css";
import Header from './components/Header';
import Footer from './components/Footer';
import TrackingScripts from './components/TrackingScripts';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="ar" suppressHydrationWarning={true}>
      <head>
        <title>Green Roasteries - Premium Coffee</title>
        <meta name="description" content="Discover exceptional coffee beans roasted to perfection. Premium quality coffee from around the world." />
        <meta name="keywords" content="coffee, beans, roasting, premium, arabica, specialty coffee" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#c9a961" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning={true}
        style={{ fontFamily: "'Cairo', 'Poppins', sans-serif", color: "#333" }}
      >
        <TrackingScripts />
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <LanguageProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              </div>
            }>
              <ToastProvider>
                <CartProvider>
                  {!pathname.startsWith('/backend') && <Header />}
                  <main>{children}</main>
                  {!pathname.startsWith('/backend') && <Footer />}
                </CartProvider>
              </ToastProvider>
            </Suspense>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
