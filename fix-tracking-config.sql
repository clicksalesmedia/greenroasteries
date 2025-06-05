-- Fix Tracking Configuration Script
-- This will update the database with the correct tracking IDs and enable all platforms

-- Delete any existing tracking configuration
DELETE FROM "TrackingConfiguration";

-- Insert the correct tracking configuration with all provided IDs
INSERT INTO "TrackingConfiguration" (
  id,
  -- Google Tag Manager
  "gtmEnabled",
  "gtmContainerId", 
  "gtmStatus",
  
  -- Google Analytics 4
  "ga4Enabled",
  "ga4MeasurementId",
  "ga4Status",
  
  -- Meta Ads (Facebook Pixel)
  "metaEnabled",
  "metaPixelId",
  "metaAccessToken",
  "metaStatus",
  
  -- Google Ads
  "googleAdsEnabled",
  "googleAdsConversionId",
  "googleAdsConversionLabel",
  "googleAdsStatus",
  
  -- Server-side Tracking
  "serverSideEnabled",
  "facebookConversionsApi",
  "googleConversionsApi",
  "serverSideStatus",
  
  -- Advanced Settings
  "dataRetentionDays",
  "anonymizeIp",
  "cookieConsent",
  "debugMode",
  
  "createdAt",
  "updatedAt"
) VALUES (
  '65320996-520c-4210-ae8c-2c24fd7c20cf',
  
  -- Google Tag Manager - ENABLED
  true,
  'GTM-W6X2NGX7',
  'ACTIVE',
  
  -- Google Analytics 4 - ENABLED  
  true,
  'G-RYC9K25QGQ',
  'ACTIVE',
  
  -- Meta Ads (Facebook Pixel) - ENABLED
  true,
  '3805848799548541',
  'EAAX7Xr0jeMQBO2lCgCyyRhnG1AVnKMdILdHv6gRwomuZBVF4Aoz1beFjoLhzDf3njCZAB2eg3u9bw2EjnlEuyvnaxH7h3gZCtWFBw0QZAxacZCBs3ieR2OP1KUyAevlrMTdCb62pfkJZBoVPkkAvBvoIKWeXVxgUbBnMBm6KuZCAT2d1k1N6DZCRl1I9fwP96T3IZCQZDZD',
  'ACTIVE',
  
  -- Google Ads - ENABLED (placeholder values for now)
  true,
  'AW-123456789',
  'abcdefghijk',
  'ACTIVE',
  
  -- Server-side Tracking - ENABLED
  true,
  true,
  true,
  'ACTIVE',
  
  -- Advanced Settings
  90,
  true,
  true,
  false,
  
  NOW(),
  NOW()
);

-- Verify the configuration was inserted correctly
SELECT 
  "gtmEnabled",
  "gtmContainerId",
  "ga4Enabled", 
  "ga4MeasurementId",
  "metaEnabled",
  "metaPixelId",
  "serverSideEnabled"
FROM "TrackingConfiguration"; 