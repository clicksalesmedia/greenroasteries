'use client';

import "./globals.css";
import "./styles/toast.css";
import Header from './components/Header';
import Footer from './components/Footer';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="ar" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning={true}
        style={{ fontFamily: "'Cairo', 'Poppins', sans-serif", color: "#333" }}
      >
        <LanguageProvider>
          <ToastProvider>
            <CartProvider>
              {!pathname.startsWith('/backend') && <Header />}
              <main>{children}</main>
              {!pathname.startsWith('/backend') && <Footer />}
            </CartProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
