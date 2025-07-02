-- Fix phantom database entries for non-existent images
-- Run this on the server to clean up broken image references

-- Remove phantom product images
UPDATE "Product" 
SET "imageUrl" = NULL 
WHERE "imageUrl" IN (
  '/uploads/products/9acedb0f-2d22-4091-8e75-b77dec2cebd6.webp',
  '/uploads/products/e50f1243-f091-44cd-9533-409155e085ee.webp',
  '/uploads/products/a287a081-4e75-4cf5-ba6e-54885b8e3ddf.webp',
  '/uploads/products/77454441-bfb8-4f5e-99e3-7dcff5711b53.webp',
  '/uploads/products/9819d8e3-9cd2-4495-96ee-31f9987f8d99.webp',
  '/uploads/products/ee696246-8bbd-46e5-b39e-21d8383c5c61.webp'
);

-- Remove phantom category images  
UPDATE "Category"
SET "imageUrl" = NULL
WHERE "imageUrl" IN (
  '/uploads/categories/ba00fca7-44b7-42d5-8f10-7be4121ce4e1.webp',
  '/uploads/categories/3795c038-242b-41a2-a408-6482949c6569.webp'
);

-- Remove phantom variation images
UPDATE "ProductVariation"
SET "imageUrl" = NULL
WHERE "imageUrl" LIKE '/uploads/products/%' 
AND "imageUrl" NOT IN (
  SELECT '/uploads/products/' || filename 
  FROM (
    SELECT DISTINCT SUBSTRING("imageUrl" FROM '/uploads/products/(.+)') as filename
    FROM "Product" 
    WHERE "imageUrl" IS NOT NULL 
    AND "imageUrl" LIKE '/uploads/products/%'
  ) working_files
);

-- Show results
SELECT 'Products with NULL images' as type, COUNT(*) as count FROM "Product" WHERE "imageUrl" IS NULL
UNION ALL
SELECT 'Categories with NULL images', COUNT(*) FROM "Category" WHERE "imageUrl" IS NULL
UNION ALL  
SELECT 'Variations with NULL images', COUNT(*) FROM "ProductVariation" WHERE "imageUrl" IS NULL; 