import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

interface TrackingConfigRequest {
  // Google Tag Manager
  gtmEnabled?: boolean;
  gtmContainerId?: string;
  
  // Google Analytics 4
  ga4Enabled?: boolean;
  ga4MeasurementId?: string;
  ga4ApiSecret?: string;
  
  // Meta Ads (Facebook Pixel)
  metaEnabled?: boolean;
  metaPixelId?: string;
  metaAccessToken?: string;
  
  // Google Ads
  googleAdsEnabled?: boolean;
  googleAdsConversionId?: string;
  googleAdsConversionLabel?: string;
  googleAdsCustomerId?: string;
  googleAdsAccessToken?: string;
  
  // Server-side Tracking
  serverSideEnabled?: boolean;
  facebookConversionsApi?: boolean;
  googleConversionsApi?: boolean;
  
  // Advanced Settings
  dataRetentionDays?: number;
  anonymizeIp?: boolean;
  cookieConsent?: boolean;
  debugMode?: boolean;
}

// Get or create tracking configuration
async function getOrCreateConfig() {
  let config = await prisma.trackingConfiguration.findFirst();
  
  if (!config) {
    config = await prisma.trackingConfiguration.create({
      data: {
        gtmEnabled: false,
        ga4Enabled: false,
        metaEnabled: false,
        googleAdsEnabled: false,
        serverSideEnabled: false,
        facebookConversionsApi: false,
        googleConversionsApi: false,
        dataRetentionDays: 90,
        anonymizeIp: true,
        cookieConsent: true,
        debugMode: false,
      }
    });
  }
  
  return config;
}

// Update configuration status based on settings
function updateConfigStatus(data: any) {
  // GTM Status
  if (data.gtmEnabled && data.gtmContainerId) {
    data.gtmStatus = 'ACTIVE';
  } else if (data.gtmEnabled && !data.gtmContainerId) {
    data.gtmStatus = 'ERROR';
  } else {
    data.gtmStatus = 'INACTIVE';
  }
  
  // GA4 Status
  if (data.ga4Enabled && data.ga4MeasurementId) {
    data.ga4Status = 'ACTIVE';
  } else if (data.ga4Enabled && !data.ga4MeasurementId) {
    data.ga4Status = 'ERROR';
  } else {
    data.ga4Status = 'INACTIVE';
  }
  
  // Meta Status
  if (data.metaEnabled && data.metaPixelId) {
    data.metaStatus = 'ACTIVE';
  } else if (data.metaEnabled && !data.metaPixelId) {
    data.metaStatus = 'ERROR';
  } else {
    data.metaStatus = 'INACTIVE';
  }
  
  // Google Ads Status
  if (data.googleAdsEnabled && data.googleAdsConversionId && data.googleAdsConversionLabel) {
    data.googleAdsStatus = 'ACTIVE';
  } else if (data.googleAdsEnabled && (!data.googleAdsConversionId || !data.googleAdsConversionLabel)) {
    data.googleAdsStatus = 'ERROR';
  } else {
    data.googleAdsStatus = 'INACTIVE';
  }
  
  // Server-side Status
  if (data.serverSideEnabled && (data.facebookConversionsApi || data.googleConversionsApi)) {
    data.serverSideStatus = 'ACTIVE';
  } else if (data.serverSideEnabled && !data.facebookConversionsApi && !data.googleConversionsApi) {
    data.serverSideStatus = 'ERROR';
  } else {
    data.serverSideStatus = 'INACTIVE';
  }
  
  return data;
}

// Format config for frontend response
function formatConfigResponse(config: any) {
  return {
    googleTagManager: {
      enabled: config.gtmEnabled,
      containerId: config.gtmContainerId || '',
      status: config.gtmStatus?.toLowerCase() || 'inactive'
    },
    googleAnalytics: {
      enabled: config.ga4Enabled,
      measurementId: config.ga4MeasurementId || '',
      status: config.ga4Status?.toLowerCase() || 'inactive'
    },
    metaAds: {
      enabled: config.metaEnabled,
      pixelId: config.metaPixelId || '',
      accessToken: config.metaAccessToken ? '***hidden***' : '',
      status: config.metaStatus?.toLowerCase() || 'inactive'
    },
    googleAds: {
      enabled: config.googleAdsEnabled,
      conversionId: config.googleAdsConversionId || '',
      conversionLabel: config.googleAdsConversionLabel || '',
      status: config.googleAdsStatus?.toLowerCase() || 'inactive'
    },
    serverSideTracking: {
      enabled: config.serverSideEnabled,
      facebookConversionsApi: config.facebookConversionsApi,
      googleConversionsApi: config.googleConversionsApi,
      status: config.serverSideStatus?.toLowerCase() || 'inactive'
    },
    advanced: {
      dataRetentionDays: config.dataRetentionDays,
      anonymizeIp: config.anonymizeIp,
      cookieConsent: config.cookieConsent,
      debugMode: config.debugMode
    }
  };
}

// GET - Retrieve tracking configuration
export async function GET() {
  try {
    const config = await getOrCreateConfig();
    return NextResponse.json(formatConfigResponse(config));
  } catch (error) {
    console.error('Error retrieving tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tracking configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Update tracking configuration
export async function POST(request: NextRequest) {
  try {
    const body: TrackingConfigRequest = await request.json();
    
    // Get current config
    const currentConfig = await getOrCreateConfig();
    
    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    };
    
    // Update status based on configuration
    const dataWithStatus = updateConfigStatus(updateData);
    
    // Update the configuration
    const updatedConfig = await prisma.trackingConfiguration.update({
      where: { id: currentConfig.id },
      data: dataWithStatus
    });
    
    return NextResponse.json(formatConfigResponse(updatedConfig));
  } catch (error) {
    console.error('Error updating tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Reset configuration to defaults
export async function PUT() {
  try {
    const currentConfig = await getOrCreateConfig();
    
    const resetConfig = await prisma.trackingConfiguration.update({
      where: { id: currentConfig.id },
      data: {
        gtmEnabled: false,
        gtmContainerId: null,
        gtmStatus: 'INACTIVE',
        ga4Enabled: false,
        ga4MeasurementId: null,
        ga4ApiSecret: null,
        ga4Status: 'INACTIVE',
        metaEnabled: false,
        metaPixelId: null,
        metaAccessToken: null,
        metaStatus: 'INACTIVE',
        googleAdsEnabled: false,
        googleAdsConversionId: null,
        googleAdsConversionLabel: null,
        googleAdsCustomerId: null,
        googleAdsAccessToken: null,
        googleAdsStatus: 'INACTIVE',
        serverSideEnabled: false,
        facebookConversionsApi: false,
        googleConversionsApi: false,
        serverSideStatus: 'INACTIVE',
        dataRetentionDays: 90,
        anonymizeIp: true,
        cookieConsent: true,
        debugMode: false,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(formatConfigResponse(resetConfig));
  } catch (error) {
    console.error('Error resetting tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to reset tracking configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 