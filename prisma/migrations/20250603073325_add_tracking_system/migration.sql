-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'TESTING');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'BEGIN_CHECKOUT', 'ADD_PAYMENT_INFO', 'SIGN_UP', 'LOGIN', 'SEARCH', 'VIEW_ITEM', 'VIEW_CATEGORY', 'ADD_TO_WISHLIST', 'SHARE', 'DOWNLOAD', 'VIDEO_PLAY', 'VIDEO_COMPLETE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TrackingPlatform" AS ENUM ('GA4', 'FACEBOOK_PIXEL', 'GOOGLE_ADS', 'GTM', 'SERVER_SIDE', 'CUSTOM');

-- CreateTable
CREATE TABLE "TrackingConfiguration" (
    "id" TEXT NOT NULL,
    "gtmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gtmContainerId" TEXT,
    "gtmStatus" "TrackingStatus" NOT NULL DEFAULT 'INACTIVE',
    "ga4Enabled" BOOLEAN NOT NULL DEFAULT false,
    "ga4MeasurementId" TEXT,
    "ga4ApiSecret" TEXT,
    "ga4Status" "TrackingStatus" NOT NULL DEFAULT 'INACTIVE',
    "metaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metaPixelId" TEXT,
    "metaAccessToken" TEXT,
    "metaStatus" "TrackingStatus" NOT NULL DEFAULT 'INACTIVE',
    "googleAdsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleAdsConversionId" TEXT,
    "googleAdsConversionLabel" TEXT,
    "googleAdsCustomerId" TEXT,
    "googleAdsAccessToken" TEXT,
    "googleAdsStatus" "TrackingStatus" NOT NULL DEFAULT 'INACTIVE',
    "serverSideEnabled" BOOLEAN NOT NULL DEFAULT false,
    "facebookConversionsApi" BOOLEAN NOT NULL DEFAULT false,
    "googleConversionsApi" BOOLEAN NOT NULL DEFAULT false,
    "serverSideStatus" "TrackingStatus" NOT NULL DEFAULT 'INACTIVE',
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "anonymizeIp" BOOLEAN NOT NULL DEFAULT true,
    "cookieConsent" BOOLEAN NOT NULL DEFAULT true,
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventType" "TrackingEventType" NOT NULL,
    "platform" "TrackingPlatform" NOT NULL,
    "eventData" JSONB NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "pageUrl" TEXT,
    "pageTitle" TEXT,
    "transactionId" TEXT,
    "value" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'AED',
    "items" JSONB,
    "conversionValue" DOUBLE PRECISION,
    "conversionType" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTimestamp" TIMESTAMP(3),
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomEvent" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggers" JSONB NOT NULL,
    "parameters" JSONB NOT NULL,
    "conversionValue" DOUBLE PRECISION,
    "trackGA4" BOOLEAN NOT NULL DEFAULT true,
    "trackFacebook" BOOLEAN NOT NULL DEFAULT true,
    "trackGoogleAds" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomEventInstance" (
    "id" TEXT NOT NULL,
    "customEventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "parameters" JSONB NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'AED',
    "pageUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomEventInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION,
    "avgSessionDuration" DOUBLE PRECISION,
    "transactions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageOrderValue" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "customEvents" INTEGER NOT NULL DEFAULT 0,
    "addToCarts" INTEGER NOT NULL DEFAULT 0,
    "checkouts" INTEGER NOT NULL DEFAULT 0,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "paidTraffic" INTEGER NOT NULL DEFAULT 0,
    "socialTraffic" INTEGER NOT NULL DEFAULT 0,
    "directTraffic" INTEGER NOT NULL DEFAULT 0,
    "referralTraffic" INTEGER NOT NULL DEFAULT 0,
    "desktopUsers" INTEGER NOT NULL DEFAULT 0,
    "mobileUsers" INTEGER NOT NULL DEFAULT 0,
    "tabletUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionFunnel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionFunnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelSession" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "stepData" JSONB NOT NULL,

    CONSTRAINT "FunnelSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "landingPage" TEXT,
    "exitPage" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "cartValue" DOUBLE PRECISION,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingConfiguration_id_key" ON "TrackingConfiguration"("id");

-- CreateIndex
CREATE INDEX "TrackingEvent_eventName_timestamp_idx" ON "TrackingEvent"("eventName", "timestamp");

-- CreateIndex
CREATE INDEX "TrackingEvent_sessionId_idx" ON "TrackingEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TrackingEvent_userId_idx" ON "TrackingEvent"("userId");

-- CreateIndex
CREATE INDEX "TrackingEvent_platform_idx" ON "TrackingEvent"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "CustomEvent_configId_name_key" ON "CustomEvent"("configId", "name");

-- CreateIndex
CREATE INDEX "CustomEventInstance_customEventId_timestamp_idx" ON "CustomEventInstance"("customEventId", "timestamp");

-- CreateIndex
CREATE INDEX "CustomEventInstance_sessionId_idx" ON "CustomEventInstance"("sessionId");

-- CreateIndex
CREATE INDEX "Analytics_date_idx" ON "Analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_configId_date_key" ON "Analytics"("configId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionFunnel_name_key" ON "ConversionFunnel"("name");

-- CreateIndex
CREATE INDEX "FunnelSession_sessionId_idx" ON "FunnelSession"("sessionId");

-- CreateIndex
CREATE INDEX "FunnelSession_funnelId_startedAt_idx" ON "FunnelSession"("funnelId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_firstSeen_idx" ON "UserSession"("firstSeen");

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TrackingConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEvent" ADD CONSTRAINT "CustomEvent_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TrackingConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEventInstance" ADD CONSTRAINT "CustomEventInstance_customEventId_fkey" FOREIGN KEY ("customEventId") REFERENCES "CustomEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEventInstance" ADD CONSTRAINT "CustomEventInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TrackingConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelSession" ADD CONSTRAINT "FunnelSession_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "ConversionFunnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelSession" ADD CONSTRAINT "FunnelSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
