-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OfferBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "subtitle" TEXT NOT NULL,
    "subtitleAr" TEXT,
    "buttonText" TEXT NOT NULL,
    "buttonTextAr" TEXT,
    "buttonLink" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT DEFAULT '#000000',
    "buttonColor" TEXT DEFAULT '#000000',
    "overlayColor" TEXT DEFAULT 'rgba(0,0,0,0.3)',
    "overlayOpacity" DOUBLE PRECISION DEFAULT 30,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferBanner_pkey" PRIMARY KEY ("id")
);
