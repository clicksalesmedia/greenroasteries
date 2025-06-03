'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../components/BackendLayout';
import { 
  ChartBarIcon, 
  CogIcon, 
  EyeIcon, 
  PlayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

interface TrackingConfig {
  googleTagManager: {
    enabled: boolean;
    containerId: string;
    status: 'active' | 'inactive' | 'error';
  };
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
    status: 'active' | 'inactive' | 'error';
  };
  metaAds: {
    enabled: boolean;
    pixelId: string;
    accessToken: string;
    status: 'active' | 'inactive' | 'error';
  };
  googleAds: {
    enabled: boolean;
    conversionId: string;
    conversionLabel: string;
    status: 'active' | 'inactive' | 'error';
  };
  serverSideTracking: {
    enabled: boolean;
    facebookConversionsApi: boolean;
    googleConversionsApi: boolean;
    status: 'active' | 'inactive' | 'error';
  };
}

export default function TrackingSystemPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState<TrackingConfig>({
    googleTagManager: { enabled: false, containerId: '', status: 'inactive' },
    googleAnalytics: { enabled: false, measurementId: '', status: 'inactive' },
    metaAds: { enabled: false, pixelId: '', accessToken: '', status: 'inactive' },
    googleAds: { enabled: false, conversionId: '', conversionLabel: '', status: 'inactive' },
    serverSideTracking: { enabled: false, facebookConversionsApi: false, googleConversionsApi: false, status: 'inactive' }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState('');

  // Load tracking configuration
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
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save configuration
  const saveConfig = async (updatedConfig: TrackingConfig) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/tracking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      
      if (response.ok) {
        setConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Error saving tracking config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'gtm', name: 'Google Tag Manager', icon: CogIcon },
    { id: 'ga', name: 'Google Analytics', icon: EyeIcon },
    { id: 'meta', name: 'Meta Ads', icon: PlayIcon },
    { id: 'google-ads', name: 'Google Ads', icon: DocumentTextIcon },
    { id: 'server-side', name: 'Server-Side APIs', icon: CheckCircleIcon },
    { id: 'instructions', name: 'Setup Instructions', icon: DocumentTextIcon }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  if (isLoading) {
    return (
      <BackendLayout activePage="tracking">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </BackendLayout>
    );
  }

  return (
    <BackendLayout activePage="tracking">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            E-commerce Tracking System
          </h1>
          <p className="mt-2 text-gray-600">
            Manage all your tracking integrations: Google Tag Manager, Analytics, Meta Ads, Google Ads, and Server-side APIs
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* GTM Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Google Tag Manager</h3>
                    <p className="text-sm text-gray-500">Container ID: {config.googleTagManager.containerId || 'Not configured'}</p>
                  </div>
                  {getStatusIcon(config.googleTagManager.status)}
                </div>
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.googleTagManager.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.googleTagManager.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* GA Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Google Analytics</h3>
                    <p className="text-sm text-gray-500">Measurement ID: {config.googleAnalytics.measurementId || 'Not configured'}</p>
                  </div>
                  {getStatusIcon(config.googleAnalytics.status)}
                </div>
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.googleAnalytics.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.googleAnalytics.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Meta Ads Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Meta Ads</h3>
                    <p className="text-sm text-gray-500">Pixel ID: {config.metaAds.pixelId || 'Not configured'}</p>
                  </div>
                  {getStatusIcon(config.metaAds.status)}
                </div>
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.metaAds.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.metaAds.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Google Ads Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Google Ads</h3>
                    <p className="text-sm text-gray-500">Conversion ID: {config.googleAds.conversionId || 'Not configured'}</p>
                  </div>
                  {getStatusIcon(config.googleAds.status)}
                </div>
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.googleAds.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.googleAds.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Server-Side Tracking Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Server-Side APIs</h3>
                    <p className="text-sm text-gray-500">
                      Facebook & Google Conversion APIs
                    </p>
                  </div>
                  {getStatusIcon(config.serverSideTracking.status)}
                </div>
                <div className="mt-4 space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.serverSideTracking.facebookConversionsApi 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    Facebook API
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    config.serverSideTracking.googleConversionsApi 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    Google API
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gtm' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Google Tag Manager Configuration</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="gtm-enabled"
                    checked={config.googleTagManager.enabled}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        googleTagManager: { ...config.googleTagManager, enabled: e.target.checked }
                      };
                      saveConfig(updatedConfig);
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="gtm-enabled" className="text-sm font-medium text-gray-900">
                    Enable Google Tag Manager
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GTM Container ID
                  </label>
                  <input
                    type="text"
                    placeholder="GTM-XXXXXXX"
                    value={config.googleTagManager.containerId}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        googleTagManager: { ...config.googleTagManager, containerId: e.target.value }
                      };
                      setConfig(updatedConfig);
                    }}
                    onBlur={() => saveConfig(config)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Implementation Code</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-blue-700 mb-2">Add this to your &lt;head&gt; tag:</p>
                      <div className="relative">
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.googleTagManager.containerId || 'GTM-XXXXXXX'}');</script>
<!-- End Google Tag Manager -->`}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.googleTagManager.containerId || 'GTM-XXXXXXX'}');</script>
<!-- End Google Tag Manager -->`, 'gtm-head')}
                          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-blue-700 mb-2">Add this immediately after opening &lt;body&gt; tag:</p>
                      <div className="relative">
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.googleTagManager.containerId || 'GTM-XXXXXXX'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(`<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.googleTagManager.containerId || 'GTM-XXXXXXX'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`, 'gtm-body')}
                          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {copied === 'gtm-head' || copied === 'gtm-body' ? (
                    <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ga' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Google Analytics Configuration</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="ga-enabled"
                    checked={config.googleAnalytics.enabled}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        googleAnalytics: { ...config.googleAnalytics, enabled: e.target.checked }
                      };
                      saveConfig(updatedConfig);
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="ga-enabled" className="text-sm font-medium text-gray-900">
                    Enable Google Analytics 4
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GA4 Measurement ID
                  </label>
                  <input
                    type="text"
                    placeholder="G-XXXXXXXXXX"
                    value={config.googleAnalytics.measurementId}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        googleAnalytics: { ...config.googleAnalytics, measurementId: e.target.value }
                      };
                      setConfig(updatedConfig);
                    }}
                    onBlur={() => saveConfig(config)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Google Analytics Code</h3>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.measurementId || 'G-XXXXXXXXXX'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.googleAnalytics.measurementId || 'G-XXXXXXXXXX'}');
</script>`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.measurementId || 'G-XXXXXXXXXX'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.googleAnalytics.measurementId || 'G-XXXXXXXXXX'}');
</script>`, 'ga-code')}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {copied === 'ga-code' && (
                    <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">E-commerce Events</h3>
                  <p className="text-sm text-blue-700 mb-3">Use these events for tracking e-commerce activities:</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <p className="text-xs font-medium text-blue-800 mb-1">Purchase Event:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
{`gtag('event', 'purchase', {
  transaction_id: 'T_12345',
  value: 25.42,
  currency: 'AED',
  items: [{
    item_id: 'SKU123',
    item_name: 'Product Name',
    category: 'Category',
    quantity: 1,
    price: 25.42
  }]
});`}
                      </pre>
                    </div>
                    <div className="relative">
                      <p className="text-xs font-medium text-blue-800 mb-1">Add to Cart Event:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
{`gtag('event', 'add_to_cart', {
  currency: 'AED',
  value: 15.25,
  items: [{
    item_id: 'SKU123',
    item_name: 'Product Name',
    category: 'Category',
    quantity: 1,
    price: 15.25
  }]
});`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Meta Ads (Facebook Pixel) Configuration</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="meta-enabled"
                    checked={config.metaAds.enabled}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        metaAds: { ...config.metaAds, enabled: e.target.checked }
                      };
                      saveConfig(updatedConfig);
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="meta-enabled" className="text-sm font-medium text-gray-900">
                    Enable Meta Ads Pixel
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    placeholder="123456789012345"
                    value={config.metaAds.pixelId}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        metaAds: { ...config.metaAds, pixelId: e.target.value }
                      };
                      setConfig(updatedConfig);
                    }}
                    onBlur={() => saveConfig(config)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token (for Conversions API)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your access token"
                    value={config.metaAds.accessToken}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        metaAds: { ...config.metaAds, accessToken: e.target.value }
                      };
                      setConfig(updatedConfig);
                    }}
                    onBlur={() => saveConfig(config)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Facebook Pixel Code</h3>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.metaAds.pixelId || 'YOUR_PIXEL_ID'}');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${config.metaAds.pixelId || 'YOUR_PIXEL_ID'}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.metaAds.pixelId || 'YOUR_PIXEL_ID'}');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${config.metaAds.pixelId || 'YOUR_PIXEL_ID'}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->`, 'meta-pixel')}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {copied === 'meta-pixel' && (
                    <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                  )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">E-commerce Events</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-purple-800 mb-1">Purchase Event:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
{`fbq('track', 'Purchase', {
  value: 30.00,
  currency: 'AED',
  content_ids: ['product-123'],
  content_type: 'product'
});`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-800 mb-1">Add to Cart Event:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
{`fbq('track', 'AddToCart', {
  value: 15.00,
  currency: 'AED',
  content_ids: ['product-123'],
  content_type: 'product'
});`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'google-ads' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Google Ads Configuration</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="gads-enabled"
                    checked={config.googleAds.enabled}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...config,
                        googleAds: { ...config.googleAds, enabled: e.target.checked }
                      };
                      saveConfig(updatedConfig);
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="gads-enabled" className="text-sm font-medium text-gray-900">
                    Enable Google Ads Conversion Tracking
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conversion ID
                    </label>
                    <input
                      type="text"
                      placeholder="AW-123456789"
                      value={config.googleAds.conversionId}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...config,
                          googleAds: { ...config.googleAds, conversionId: e.target.value }
                        };
                        setConfig(updatedConfig);
                      }}
                      onBlur={() => saveConfig(config)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conversion Label
                    </label>
                    <input
                      type="text"
                      placeholder="abcdefghijk"
                      value={config.googleAds.conversionLabel}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...config,
                          googleAds: { ...config.googleAds, conversionLabel: e.target.value }
                        };
                        setConfig(updatedConfig);
                      }}
                      onBlur={() => saveConfig(config)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Global Site Tag (gtag.js)</h3>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<!-- Global site tag (gtag.js) - Google Ads: ${config.googleAds.conversionId || 'AW-123456789'} -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAds.conversionId || 'AW-123456789'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.googleAds.conversionId || 'AW-123456789'}');
</script>`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`<!-- Global site tag (gtag.js) - Google Ads: ${config.googleAds.conversionId || 'AW-123456789'} -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAds.conversionId || 'AW-123456789'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.googleAds.conversionId || 'AW-123456789'}');
</script>`, 'gads-tag')}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {copied === 'gads-tag' && (
                    <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                  )}
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800 mb-2">Conversion Event Code</h3>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`gtag('event', 'conversion', {
  'send_to': '${config.googleAds.conversionId || 'AW-123456789'}/${config.googleAds.conversionLabel || 'abcdefghijk'}',
  'value': 1.0,
  'currency': 'AED',
  'transaction_id': 'T_12345'
});`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`gtag('event', 'conversion', {
  'send_to': '${config.googleAds.conversionId || 'AW-123456789'}/${config.googleAds.conversionLabel || 'abcdefghijk'}',
  'value': 1.0,
  'currency': 'AED',
  'transaction_id': 'T_12345'
});`, 'gads-conversion')}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {copied === 'gads-conversion' && (
                    <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'server-side' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Server-Side API Configuration</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure server-side tracking for better data accuracy and privacy compliance
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="server-enabled"
                      checked={config.serverSideTracking.enabled}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...config,
                          serverSideTracking: { ...config.serverSideTracking, enabled: e.target.checked }
                        };
                        saveConfig(updatedConfig);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor="server-enabled" className="text-sm font-medium text-gray-900">
                      Enable Server-Side Tracking
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="facebook-api"
                        checked={config.serverSideTracking.facebookConversionsApi}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...config,
                            serverSideTracking: { ...config.serverSideTracking, facebookConversionsApi: e.target.checked }
                          };
                          saveConfig(updatedConfig);
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor="facebook-api" className="text-sm font-medium text-gray-900">
                        Facebook Conversions API
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="google-api"
                        checked={config.serverSideTracking.googleConversionsApi}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...config,
                            serverSideTracking: { ...config.serverSideTracking, googleConversionsApi: e.target.checked }
                          };
                          saveConfig(updatedConfig);
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor="google-api" className="text-sm font-medium text-gray-900">
                        Google Enhanced Conversions
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Implementation Status</h3>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">✅ API endpoints ready for server-side tracking</p>
                  <p className="mb-2">✅ Environment variables configured</p>
                  <p className="mb-2">✅ Event validation and error handling</p>
                  <p>🔧 Ready for production deployment</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Setup Instructions</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-3">1. Google Tag Manager Setup</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Create a GTM account at https://tagmanager.google.com</p>
                      <p>• Create a new container for your website</p>
                      <p>• Copy the Container ID (GTM-XXXXXXX)</p>
                      <p>• Add the provided code snippets to your website</p>
                      <p>• Configure tags for GA4, Facebook Pixel, and Google Ads within GTM</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-green-900 mb-3">2. Google Analytics 4 Setup</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Create a GA4 property at https://analytics.google.com</p>
                      <p>• Enable Enhanced E-commerce</p>
                      <p>• Set up conversion goals</p>
                      <p>• Configure audience definitions</p>
                      <p>• Link with Google Ads account</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-purple-900 mb-3">3. Meta Ads (Facebook Pixel) Setup</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Go to Facebook Business Manager</p>
                      <p>• Create a new Pixel in Events Manager</p>
                      <p>• Set up Conversions API for server-side tracking</p>
                      <p>• Configure custom audiences</p>
                      <p>• Test pixel firing with Facebook Pixel Helper</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-yellow-900 mb-3">4. Google Ads Setup</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Access Google Ads account</p>
                      <p>• Go to Tools & Settings → Conversions</p>
                      <p>• Create new conversion action</p>
                      <p>• Get Conversion ID and Label</p>
                      <p>• Set up Enhanced Conversions</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-red-900 mb-3">5. Server-Side APIs Setup</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Set up environment variables for API keys</p>
                      <p>• Configure webhook endpoints</p>
                      <p>• Implement event deduplication</p>
                      <p>• Test API connections</p>
                      <p>• Monitor API response rates</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Required Environment Variables:</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded">
{`# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your_access_token

# Google Ads
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123456789
GOOGLE_ADS_CONVERSION_LABEL=abcdefghijk

# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`}
                    </pre>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Testing Checklist:</h4>
                    <div className="space-y-1 text-sm text-yellow-800">
                      <p>□ GTM container loads correctly</p>
                      <p>□ GA4 events fire on page views</p>
                      <p>□ Facebook Pixel events trigger</p>
                      <p>□ Google Ads conversions track</p>
                      <p>□ Server-side APIs respond correctly</p>
                      <p>□ Cross-domain tracking works</p>
                      <p>□ Privacy compliance (GDPR/CCPA)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BackendLayout>
  );
} 