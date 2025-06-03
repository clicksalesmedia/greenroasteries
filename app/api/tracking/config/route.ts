import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'tracking-config.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Default configuration
const defaultConfig: TrackingConfig = {
  googleTagManager: { enabled: false, containerId: '', status: 'inactive' },
  googleAnalytics: { enabled: false, measurementId: '', status: 'inactive' },
  metaAds: { enabled: false, pixelId: '', accessToken: '', status: 'inactive' },
  googleAds: { enabled: false, conversionId: '', conversionLabel: '', status: 'inactive' },
  serverSideTracking: { enabled: false, facebookConversionsApi: false, googleConversionsApi: false, status: 'inactive' }
};

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Read configuration from file
async function readConfig(): Promise<TrackingConfig> {
  try {
    await ensureDataDir();
    if (existsSync(CONFIG_FILE_PATH)) {
      const data = await readFile(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
    return defaultConfig;
  } catch (error) {
    console.error('Error reading tracking config:', error);
    return defaultConfig;
  }
}

// Write configuration to file
async function writeConfig(config: TrackingConfig): Promise<void> {
  try {
    await ensureDataDir();
    await writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing tracking config:', error);
    throw error;
  }
}

// Validate configuration
function validateConfig(config: TrackingConfig): string[] {
  const errors: string[] = [];

  if (config.googleTagManager.enabled && !config.googleTagManager.containerId) {
    errors.push('GTM Container ID is required when GTM is enabled');
  }

  if (config.googleAnalytics.enabled && !config.googleAnalytics.measurementId) {
    errors.push('GA4 Measurement ID is required when Google Analytics is enabled');
  }

  if (config.metaAds.enabled && !config.metaAds.pixelId) {
    errors.push('Facebook Pixel ID is required when Meta Ads is enabled');
  }

  if (config.googleAds.enabled && (!config.googleAds.conversionId || !config.googleAds.conversionLabel)) {
    errors.push('Google Ads Conversion ID and Label are required when Google Ads is enabled');
  }

  return errors;
}

// Update status based on configuration
function updateStatus(config: TrackingConfig): TrackingConfig {
  const updatedConfig = { ...config };

  // Update GTM status
  if (updatedConfig.googleTagManager.enabled && updatedConfig.googleTagManager.containerId) {
    updatedConfig.googleTagManager.status = 'active';
  } else if (updatedConfig.googleTagManager.enabled && !updatedConfig.googleTagManager.containerId) {
    updatedConfig.googleTagManager.status = 'error';
  } else {
    updatedConfig.googleTagManager.status = 'inactive';
  }

  // Update GA status
  if (updatedConfig.googleAnalytics.enabled && updatedConfig.googleAnalytics.measurementId) {
    updatedConfig.googleAnalytics.status = 'active';
  } else if (updatedConfig.googleAnalytics.enabled && !updatedConfig.googleAnalytics.measurementId) {
    updatedConfig.googleAnalytics.status = 'error';
  } else {
    updatedConfig.googleAnalytics.status = 'inactive';
  }

  // Update Meta Ads status
  if (updatedConfig.metaAds.enabled && updatedConfig.metaAds.pixelId) {
    updatedConfig.metaAds.status = 'active';
  } else if (updatedConfig.metaAds.enabled && !updatedConfig.metaAds.pixelId) {
    updatedConfig.metaAds.status = 'error';
  } else {
    updatedConfig.metaAds.status = 'inactive';
  }

  // Update Google Ads status
  if (updatedConfig.googleAds.enabled && updatedConfig.googleAds.conversionId && updatedConfig.googleAds.conversionLabel) {
    updatedConfig.googleAds.status = 'active';
  } else if (updatedConfig.googleAds.enabled && (!updatedConfig.googleAds.conversionId || !updatedConfig.googleAds.conversionLabel)) {
    updatedConfig.googleAds.status = 'error';
  } else {
    updatedConfig.googleAds.status = 'inactive';
  }

  // Update Server-side tracking status
  if (updatedConfig.serverSideTracking.enabled && (updatedConfig.serverSideTracking.facebookConversionsApi || updatedConfig.serverSideTracking.googleConversionsApi)) {
    updatedConfig.serverSideTracking.status = 'active';
  } else if (updatedConfig.serverSideTracking.enabled && !updatedConfig.serverSideTracking.facebookConversionsApi && !updatedConfig.serverSideTracking.googleConversionsApi) {
    updatedConfig.serverSideTracking.status = 'error';
  } else {
    updatedConfig.serverSideTracking.status = 'inactive';
  }

  return updatedConfig;
}

// GET - Retrieve tracking configuration
export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error retrieving tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tracking configuration' },
      { status: 500 }
    );
  }
}

// POST - Update tracking configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the configuration
    const errors = validateConfig(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Configuration validation failed', details: errors },
        { status: 400 }
      );
    }

    // Update status based on configuration
    const updatedConfig = updateStatus(body);

    // Save the configuration
    await writeConfig(updatedConfig);

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking configuration' },
      { status: 500 }
    );
  }
} 