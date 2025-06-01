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
    
    // Get active shipping rules from database, ordered by cost (cheapest first)
    const activeRules = await prisma.shippingRule.findMany({
      where: { isActive: true },
      orderBy: [
        { cost: 'asc' }, // Prefer cheaper shipping first
        { createdAt: 'asc' } // Then by creation date
      ]
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
    
    // Find the best applicable rule based on order total and city
    for (const rule of activeRules) {
      // Check if rule applies to this city (if cities are specified)
      const cityMatches = rule.cities.length === 0 || !city || rule.cities.includes(city);
      
      // Check if order meets free shipping threshold
      const meetsFreeShippingThreshold = !rule.freeShippingThreshold || orderTotal >= rule.freeShippingThreshold;
      
      if (cityMatches) {
        applicableRule = rule;
        
        // Calculate shipping cost based on rule type
        switch (rule.type) {
          case 'FREE':
            // Free shipping if threshold is met, otherwise use cost
            shippingCost = meetsFreeShippingThreshold ? 0 : rule.cost;
            break;
          case 'STANDARD':
          case 'EXPRESS':
          case 'PICKUP':
            // If there's a free shipping threshold and it's met, shipping is free
            if (meetsFreeShippingThreshold && rule.freeShippingThreshold) {
              shippingCost = 0;
            } else {
              shippingCost = rule.cost;
            }
            break;
          default:
            shippingCost = rule.cost;
        }
        
        // If we found a free shipping option, use it immediately
        if (shippingCost === 0) {
          break;
        }
      }
    }
    
    // If no rule applies, use a default shipping rule
    if (!applicableRule) {
      // Try to find any active rule as fallback
      applicableRule = activeRules[0] || null;
      shippingCost = applicableRule ? applicableRule.cost : 25;
    }
    
    // Find the lowest free shipping threshold for display purposes
    const freeShippingRule = activeRules.find(rule => 
      rule.freeShippingThreshold && rule.freeShippingThreshold > orderTotal
    );
    
    const result: ShippingCalculation = {
      shippingCost: Math.round(shippingCost * 100) / 100, // Round to 2 decimal places
      shippingRule: applicableRule,
      freeShippingThreshold: freeShippingRule?.freeShippingThreshold || undefined,
      amountToFreeShipping: freeShippingRule?.freeShippingThreshold 
        ? Math.max(0, freeShippingRule.freeShippingThreshold - orderTotal)
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