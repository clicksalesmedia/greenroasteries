'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface TrackingConfig {
  googleTagManager: {
    enabled: boolean;
    containerId: string;
    status: string;
  };
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
    status: string;
  };
  metaAds: {
    enabled: boolean;
    pixelId: string;
    accessToken: string;
    status: string;
  };
  googleAds: {
    enabled: boolean;
    conversionId: string;
    conversionLabel: string;
    status: string;
  };
  serverSideTracking: {
    enabled: boolean;
    facebookConversionsApi: boolean;
    googleConversionsApi: boolean;
    status: string;
  };
}

export default function TrackingScripts() {
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/tracking/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error loading tracking config:', error);
        // Fallback to default config
        setConfig({
          googleTagManager: {
            enabled: true,
            containerId: 'GTM-W6X2NGX7',
            status: 'active'
          },
          googleAnalytics: {
            enabled: true,
            measurementId: 'G-RYC9K25QGQ',
            status: 'active'
          },
          metaAds: {
            enabled: true,
            pixelId: '3805848799548541',
            accessToken: 'EAAX7Xr0jeMQBO2lCgCyyRhnG1AVnKMdILdHv6gRwomuZBVF4Aoz1beFjoLhzDf3njCZAB2eg3u9bw2EjnlEuyvnaxH7h3gZCtWFBw0QZAxacZCBs3ieR2OP1KUyAevlrMTdCb62pfkJZBoVPkkAvBvoIKWeXVxgUbBnMBm6KuZCAT2d1k1N6DZCRl1I9fwP96T3IZCQZDZD',
            status: 'active'
          },
          googleAds: {
            enabled: true,
            conversionId: 'AW-123456789',
            conversionLabel: 'abcdefghijk',
            status: 'active'
          },
          serverSideTracking: {
            enabled: true,
            facebookConversionsApi: true,
            googleConversionsApi: true,
            status: 'active'
          }
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadConfig();
  }, []);

  if (!isLoaded || !config) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      {config.googleTagManager.enabled && config.googleTagManager.containerId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${config.googleTagManager.containerId}');
              `,
            }}
          />
          {/* GTM NoScript */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${config.googleTagManager.containerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 Script */}
      {config.googleAnalytics.enabled && config.googleAnalytics.measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.measurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${config.googleAnalytics.measurementId}', {
                  page_title: document.title,
                  page_location: window.location.href
                });
              `,
            }}
          />
        </>
      )}

      {/* Facebook Pixel Script */}
      {config.metaAds.enabled && config.metaAds.pixelId && (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${config.metaAds.pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          {/* Facebook Pixel NoScript */}
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${config.metaAds.pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Ads Script */}
      {config.googleAds.enabled && config.googleAds.conversionId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAds.conversionId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-ads-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${config.googleAds.conversionId}');
              `,
            }}
          />
        </>
      )}

      {/* Enhanced tracking initialization */}
      <Script
        id="tracking-initialization"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Initialize enhanced tracking
            window.trackingConfig = ${JSON.stringify(config)};
            
            // Set up automatic page view tracking
            if (typeof window !== 'undefined') {
              // Track initial page view
              setTimeout(() => {
                if (window.gtag) {
                  window.gtag('event', 'page_view', {
                    page_title: document.title,
                    page_location: window.location.href,
                    page_path: window.location.pathname
                  });
                }
                
                if (window.fbq) {
                  window.fbq('track', 'PageView');
                }
              }, 100);
            }
          `,
        }}
      />
    </>
  );
} 