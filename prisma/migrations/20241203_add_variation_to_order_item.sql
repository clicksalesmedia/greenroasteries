-- Migration to add variationId to OrderItem
-- This allows tracking which specific variation was ordered

ALTER TABLE "OrderItem" ADD COLUMN "variationId" TEXT;

-- Add foreign key constraint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variationId_fkey" 
FOREIGN KEY ("variationId") REFERENCES "ProductVariation"("id") ON DELETE SET NULL ON UPDATE CASCADE; 