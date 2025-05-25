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

// Import the same in-memory storage (in a real app, this would be a database)
// For demo purposes, we'll recreate the initial data here
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

// GET - Fetch specific shipping rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = shippingRules.find(r => r.id === id);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Shipping rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rule' },
      { status: 500 }
    );
  }
}

// PUT - Update shipping rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ruleIndex = shippingRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return NextResponse.json(
        { error: 'Shipping rule not found' },
        { status: 404 }
      );
    }
    
    const existingRule = shippingRules[ruleIndex];
    
    // Update the rule
    const updatedRule: ShippingRule = {
      ...existingRule,
      ...body,
      id: id, // Ensure ID doesn't change
      cost: body.type === 'FREE' ? 0 : (body.cost !== undefined ? body.cost : existingRule.cost),
      updatedAt: new Date().toISOString()
    };
    
    shippingRules[ruleIndex] = updatedRule;
    
    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleIndex = shippingRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return NextResponse.json(
        { error: 'Shipping rule not found' },
        { status: 404 }
      );
    }
    
    // Remove the rule
    shippingRules.splice(ruleIndex, 1);
    
    return NextResponse.json({ message: 'Shipping rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping rule' },
      { status: 500 }
    );
  }
} 