import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderAmount, productIds = [] } = body;
    
    // DEBUG: Log the coupon validation request
    console.log('🎟️ Coupon Validation Request:', {
      code,
      orderAmount,
      productIds: productIds.length
    });
    
    if (!code || !orderAmount) {
      return NextResponse.json(
        { error: 'Coupon code and order amount are required' },
        { status: 400 }
      );
    }
    
    // Find the promotion by code
    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });
    
    // DEBUG: Log promotion lookup result
    console.log('🔍 Promotion Lookup:', {
      code: code.toUpperCase(),
      found: !!promotion,
      promotionId: promotion?.id,
      type: promotion?.type,
      value: promotion?.value,
      isActive: promotion?.isActive
    });
    
    if (!promotion) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      );
    }
    
    // Check if promotion is active
    if (!promotion.isActive) {
      return NextResponse.json(
        { error: 'This coupon code is no longer active' },
        { status: 400 }
      );
    }
    
    // Check if promotion is within valid date range
    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return NextResponse.json(
        { error: 'This coupon code has expired or is not yet active' },
        { status: 400 }
      );
    }
    
    // Check usage limits
    if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
      return NextResponse.json(
        { error: 'This coupon code has reached its usage limit' },
        { status: 400 }
      );
    }
    
    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ${promotion.minOrderAmount} AED required for this coupon` },
        { status: 400 }
      );
    }
    
    // Check if coupon applies to specific products
    if (promotion.products.length > 0) {
      const promotionProductIds = promotion.products.map(p => p.productId);
      const hasApplicableProduct = productIds.some((id: string) => promotionProductIds.includes(id));
      
      if (!hasApplicableProduct) {
        return NextResponse.json(
          { error: 'This coupon code is not applicable to items in your cart' },
          { status: 400 }
        );
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (promotion.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * promotion.value) / 100;
    } else if (promotion.type === 'FIXED_AMOUNT') {
      discountAmount = promotion.value;
    }
    
    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);
    
    // DEBUG: Log discount calculation
    console.log('💸 Discount Calculation:', {
      type: promotion.type,
      value: promotion.value,
      orderAmount,
      calculatedDiscount: discountAmount,
      finalDiscount: discountAmount
    });

    const response = {
      valid: true,
      promotionId: promotion.id,
      discountAmount: discountAmount,
      discountType: promotion.type,
      discountValue: promotion.value,
      name: promotion.name,
      description: promotion.description,
      minOrderAmount: promotion.minOrderAmount,
      maxUses: promotion.maxUses,
      currentUses: promotion.currentUses,
      applicableProducts: promotion.products.map(p => ({
        id: p.productId,
        name: p.product.name
      }))
    };

    // DEBUG: Log final response
    console.log('✅ Coupon Validation Response:', {
      valid: response.valid,
      discountAmount: response.discountAmount,
      discountType: response.discountType,
      promotionId: response.promotionId
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
} 