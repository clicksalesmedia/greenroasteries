-- Database Performance Optimization Script for Green Roasteries
-- This script adds indexes and optimizations without changing function logic

-- ================================
-- INDEXES FOR PRODUCT TABLE
-- ================================

-- Index for category filtering (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

-- Index for stock status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_inStock_idx" ON "Product"("inStock");

-- Index for ordering by updatedAt (default sort)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_updatedAt_idx" ON "Product"("updatedAt" DESC);

-- Index for ordering by createdAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt" DESC);

-- Composite index for category + stock filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_categoryId_inStock_idx" ON "Product"("categoryId", "inStock");

-- Index for text search on product names
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_nameAr_trgm_idx" ON "Product" USING gin ("nameAr" gin_trgm_ops);

-- Index for search by origin
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_origin_idx" ON "Product"("origin");

-- Index for price range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_price_idx" ON "Product"("price");

-- ================================
-- INDEXES FOR CATEGORY TABLE
-- ================================

-- Index for category name searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Category_name_idx" ON "Category"("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Category_nameAr_idx" ON "Category"("nameAr");

-- Index for active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Category_isActive_idx" ON "Category"("isActive");

-- ================================
-- INDEXES FOR PRODUCT VARIATIONS
-- ================================

-- Index for product variations filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductVariation_productId_isActive_idx" ON "ProductVariation"("productId", "isActive");

-- Index for variation price queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductVariation_price_idx" ON "ProductVariation"("price");

-- ================================
-- INDEXES FOR PRODUCT IMAGES
-- ================================

-- Index for product images
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");

-- ================================
-- INDEXES FOR PROMOTIONS
-- ================================

-- Index for active promotions by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Promotion_active_dates_idx" ON "Promotion"("isActive", "startDate", "endDate");

-- Index for product promotions
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductPromotion_productId_idx" ON "ProductPromotion"("productId");

-- ================================
-- ANALYZE TABLES
-- ================================

-- Update table statistics for better query planning
ANALYZE "Product";
ANALYZE "Category";
ANALYZE "ProductVariation";
ANALYZE "ProductImage";
ANALYZE "Promotion";
ANALYZE "ProductPromotion"; 