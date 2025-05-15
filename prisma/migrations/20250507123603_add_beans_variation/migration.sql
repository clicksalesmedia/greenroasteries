-- AlterTable
ALTER TABLE "ProductVariation" ADD COLUMN     "beansId" TEXT;

-- CreateTable
CREATE TABLE "VariationBeans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arabicName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariationBeans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductVariation" ADD CONSTRAINT "ProductVariation_beansId_fkey" FOREIGN KEY ("beansId") REFERENCES "VariationBeans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
