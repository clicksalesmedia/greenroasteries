import { NextRequest, NextResponse } from 'next/server';

interface ShippingRule {
  id: string;
  name: string;
  nameAr?: string;
  type: 'FREE' | 'FIXED' | 'PERCENTAGE';
  cost: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  isActive: boolean;
  priority: number;
  description?: string;
  descriptionAr?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShippingCalculation {
  shippingCost: number;
  shippingRule: ShippingRule | null;
  freeShippingThreshold?: number;
  amountToFreeShipping?: number;
}

// Import the same in-memory storage (in a real app, this would be a database)
let shippingRules: ShippingRule[] = [
  {
    id: '1',
    name: 'Free Shipping',
    nameAr: 'شحن مجاني',
    type: 'FREE',
    cost: 0,
    minOrderAmount: 200,
    isActive: true,
    priority: 1,
    description: 'Free shipping for orders over 200 AED',
    descriptionAr: 'شحن مجاني للطلبات التي تزيد عن 200 درهم',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Standard Shipping',
    nameAr: 'شحن عادي',
    type: 'FIXED',
    cost: 25,
    isActive: true,
    priority: 2,
    description: 'Standard shipping rate',
    descriptionAr: 'سعر الشحن العادي',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// POST - Calculate shipping cost for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderTotal, items = [] } = body;
    
    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      );
    }
    
    // Get active shipping rules sorted by priority
    const activeRules = shippingRules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);
    
    let applicableRule: ShippingRule | null = null;
    let shippingCost = 0;
    
    // Find the first applicable rule based on priority
    for (const rule of activeRules) {
      const meetsMinimum = !rule.minOrderAmount || orderTotal >= rule.minOrderAmount;
      const meetsMaximum = !rule.maxOrderAmount || orderTotal <= rule.maxOrderAmount;
      
      if (meetsMinimum && meetsMaximum) {
        applicableRule = rule;
        
        // Calculate shipping cost based on rule type
        switch (rule.type) {
          case 'FREE':
            shippingCost = 0;
            break;
          case 'FIXED':
            shippingCost = rule.cost;
            break;
          case 'PERCENTAGE':
            shippingCost = (orderTotal * rule.cost) / 100;
            break;
        }
        
        break; // Use the first applicable rule (highest priority)
      }
    }
    
    // If no rule applies, use the default shipping rule (if any)
    if (!applicableRule) {
      const defaultRule = activeRules.find(rule => 
        !rule.minOrderAmount && !rule.maxOrderAmount
      );
      
      if (defaultRule) {
        applicableRule = defaultRule;
        
        switch (defaultRule.type) {
          case 'FREE':
            shippingCost = 0;
            break;
          case 'FIXED':
            shippingCost = defaultRule.cost;
            break;
          case 'PERCENTAGE':
            shippingCost = (orderTotal * defaultRule.cost) / 100;
            break;
        }
      }
    }
    
    // Find the lowest free shipping threshold for display purposes
    const freeShippingRule = activeRules.find(rule => 
      rule.type === 'FREE' && rule.minOrderAmount && rule.minOrderAmount > orderTotal
    );
    
    const result: ShippingCalculation = {
      shippingCost: Math.round(shippingCost * 100) / 100, // Round to 2 decimal places
      shippingRule: applicableRule,
      freeShippingThreshold: freeShippingRule?.minOrderAmount,
      amountToFreeShipping: freeShippingRule?.minOrderAmount 
        ? Math.max(0, freeShippingRule.minOrderAmount - orderTotal)
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
    
    if (isNaN(orderTotal) || orderTotal < 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      );
    }
    
    // Reuse the POST logic
    const mockRequest = new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({ orderTotal }),
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