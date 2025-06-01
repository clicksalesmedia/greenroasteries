import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

interface ShippingRule {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  type: 'STANDARD' | 'EXPRESS' | 'FREE' | 'PICKUP';
  cost: number;
  freeShippingThreshold?: number | null;
  isActive: boolean;
  estimatedDays?: number | null;
  cities: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ShippingCalculation {
  shippingCost: number;
  shippingRule: ShippingRule | null;
  freeShippingThreshold?: number;
  amountToFreeShipping?: number;
}

// POST - Calculate shipping cost for an order using database rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderTotal, items = [], city = null } = body;
    
    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      );
    }
    
    // Get active shipping rules from database
    const activeRules = await prisma.shippingRule.findMany({
      where: { isActive: true }
    });
    
    if (activeRules.length === 0) {
      // Fallback to default if no rules configured
      return NextResponse.json({
        shippingCost: orderTotal >= 200 ? 0 : 25,
        shippingRule: null,
        freeShippingThreshold: 200,
        amountToFreeShipping: orderTotal >= 200 ? 0 : 200 - orderTotal
      });
    }
    
    let applicableRule: ShippingRule | null = null;
    let shippingCost = 0;
    
    // Simple logic: Check if free shipping threshold is met
    const freeShippingRule = activeRules.find(rule => 
      rule.type === 'FREE' && rule.freeShippingThreshold && orderTotal >= rule.freeShippingThreshold
    );
    
    if (freeShippingRule) {
      // Order qualifies for free shipping
      applicableRule = freeShippingRule;
      shippingCost = 0;
    } else {
      // Order does not qualify for free shipping, use standard shipping
      const standardRule = activeRules.find(rule => 
        rule.type === 'STANDARD' || rule.type === 'EXPRESS' || rule.type === 'PICKUP'
      );
      
      if (standardRule) {
        applicableRule = standardRule;
        shippingCost = standardRule.cost;
      } else {
        // Fallback
        applicableRule = activeRules[0] || null;
        shippingCost = 25;
      }
    }
    
    // Find free shipping threshold for display
    const freeThresholdRule = activeRules.find(rule => 
      rule.type === 'FREE' && rule.freeShippingThreshold && rule.freeShippingThreshold > orderTotal
    );
    
    const result: ShippingCalculation = {
      shippingCost: Math.round(shippingCost * 100) / 100,
      shippingRule: applicableRule,
      freeShippingThreshold: freeThresholdRule?.freeShippingThreshold || undefined,
      amountToFreeShipping: freeThresholdRule?.freeShippingThreshold 
        ? Math.max(0, freeThresholdRule.freeShippingThreshold - orderTotal)
        : undefined
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}

// GET - Get shipping calculation for query parameters (alternative method)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderTotal = parseFloat(searchParams.get('orderTotal') || '0');
    const city = searchParams.get('city') || null;
    
    if (isNaN(orderTotal) || orderTotal < 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      );
    }
    
    // Reuse the POST logic
    const mockRequest = new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({ orderTotal, city }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    return POST(mockRequest as NextRequest);
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
} 