import "./globals.css";
import "./styles/toast.css";
import "./styles/performance.css";
import { headers } from 'next/headers';
import LayoutClient from './components/LayoutClient';
import TrackingScripts from './components/TrackingScripts';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get language from middleware headers
  const headersList = await headers();
  const detectedLanguage = headersList.get('x-language') || 'en';
  const isArabic = detectedLanguage === 'ar';

  return (
    <html lang={detectedLanguage} dir={isArabic ? 'rtl' : 'ltr'} suppressHydrationWarning={true}>
      <head>
        <title>Green Roasteries - Premium Coffee</title>
        <meta name="description" content="Discover exceptional coffee beans roasted to perfection. Premium quality coffee from around the world." />
        <meta name="keywords" content="coffee, beans, roasting, premium, arabica, specialty coffee" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#c9a961" />
        <meta name="x-language" content={detectedLanguage} />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
          media="print" 
        />
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var link = document.querySelector('link[media="print"]');
                if(link) link.media = 'all';
              })();
            `
          }}
        />
        <noscript>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </noscript>
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
                  <LayoutClient>{children}</LayoutClient>
                </CartProvider>
              </ToastProvider>
            </Suspense>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
