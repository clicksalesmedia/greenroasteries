-- AlterTable
ALTER TABLE "Slider" ADD COLUMN     "imageAnimation" TEXT DEFAULT 'fade-in',
ADD COLUMN     "textAnimation" TEXT DEFAULT 'fade-up',
ADD COLUMN     "transitionSpeed" TEXT DEFAULT 'medium';
