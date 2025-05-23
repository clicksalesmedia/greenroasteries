-- AlterTable
ALTER TABLE "ProductVariation" ADD COLUMN     "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "discountType" TEXT DEFAULT 'PERCENTAGE';
