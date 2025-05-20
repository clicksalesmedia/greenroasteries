-- AlterTable
ALTER TABLE "Slider" ADD COLUMN     "buttonColor" TEXT DEFAULT '#111111',
ADD COLUMN     "overlayColor" TEXT DEFAULT 'rgba(0,0,0,0)',
ADD COLUMN     "overlayOpacity" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "textColor" TEXT DEFAULT '#111111';
