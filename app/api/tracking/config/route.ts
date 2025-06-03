import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

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
  try {
    console.log('Attempting to find existing tracking configuration...');
    let config = await prisma.trackingConfiguration.findFirst();
    
    if (!config) {
      console.log('No existing config found, creating new one...');
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
      console.log('Created new tracking configuration:', config.id);
    } else {
      console.log('Found existing tracking configuration:', config.id);
    }
    
    return config;
  } catch (error) {
    console.error('Error in getOrCreateConfig:', error);
    throw error;
  }
}

// Update configuration status based on settings
function updateConfigStatus(data: any) {
  try {
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
  } catch (error) {
    console.error('Error in updateConfigStatus:', error);
    throw error;
  }
}

// Format config for frontend response
function formatConfigResponse(config: any) {
  try {
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
  } catch (error) {
    console.error('Error in formatConfigResponse:', error);
    throw error;
  }
}

// GET - Retrieve tracking configuration
export async function GET() {
  try {
    console.log('GET /api/tracking/config - Starting request');

    const config = await getOrCreateConfig();
    const response = formatConfigResponse(config);
    
    console.log('GET /api/tracking/config - Success');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving tracking config:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve tracking configuration',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}

// POST - Update tracking configuration
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/tracking/config - Starting request');
    
    const body = await request.json();
    console.log('Received configuration update:', JSON.stringify(body, null, 2));
    
    // Get current config
    const currentConfig = await getOrCreateConfig();
    
    // Map frontend structure to database fields
    const updateData: any = {
      updatedAt: new Date()
    };

    // Map Google Tag Manager
    if (body.googleTagManager) {
      updateData.gtmEnabled = body.googleTagManager.enabled;
      updateData.gtmContainerId = body.googleTagManager.containerId || null;
    }

    // Map Google Analytics
    if (body.googleAnalytics) {
      updateData.ga4Enabled = body.googleAnalytics.enabled;
      updateData.ga4MeasurementId = body.googleAnalytics.measurementId || null;
    }

    // Map Meta Ads
    if (body.metaAds) {
      updateData.metaEnabled = body.metaAds.enabled;
      updateData.metaPixelId = body.metaAds.pixelId || null;
      updateData.metaAccessToken = body.metaAds.accessToken || null;
    }

    // Map Google Ads
    if (body.googleAds) {
      updateData.googleAdsEnabled = body.googleAds.enabled;
      updateData.googleAdsConversionId = body.googleAds.conversionId || null;
      updateData.googleAdsConversionLabel = body.googleAds.conversionLabel || null;
    }

    // Map Server-side Tracking
    if (body.serverSideTracking) {
      updateData.serverSideEnabled = body.serverSideTracking.enabled;
      updateData.facebookConversionsApi = body.serverSideTracking.facebookConversionsApi;
      updateData.googleConversionsApi = body.serverSideTracking.googleConversionsApi;
    }

    // Handle direct field updates (for backward compatibility)
    const directFields = [
      'gtmEnabled', 'gtmContainerId',
      'ga4Enabled', 'ga4MeasurementId', 'ga4ApiSecret',
      'metaEnabled', 'metaPixelId', 'metaAccessToken',
      'googleAdsEnabled', 'googleAdsConversionId', 'googleAdsConversionLabel', 
      'googleAdsCustomerId', 'googleAdsAccessToken',
      'serverSideEnabled', 'facebookConversionsApi', 'googleConversionsApi',
      'dataRetentionDays', 'anonymizeIp', 'cookieConsent', 'debugMode'
    ];

    directFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    console.log('Mapped update data:', JSON.stringify(updateData, null, 2));
    
    // Update status based on configuration
    const dataWithStatus = updateConfigStatus(updateData);
    
    // Update the configuration
    const updatedConfig = await prisma.trackingConfiguration.update({
      where: { id: currentConfig.id },
      data: dataWithStatus
    });
    
    const response = formatConfigResponse(updatedConfig);
    console.log('POST /api/tracking/config - Success');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating tracking config:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Failed to update tracking configuration',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}

// PUT - Reset configuration to defaults
export async function PUT() {
  try {
    console.log('PUT /api/tracking/config - Starting reset request');
    
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
    
    const response = formatConfigResponse(resetConfig);
    console.log('PUT /api/tracking/config - Success');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting tracking config:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Failed to reset tracking configuration',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
} 