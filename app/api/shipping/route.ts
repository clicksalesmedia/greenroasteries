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

// In-memory storage for demo purposes
// In a real application, this would be stored in a database
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

// GET - Fetch all shipping rules
export async function GET() {
  try {
    // Sort by priority (lower numbers first)
    const sortedRules = [...shippingRules].sort((a, b) => a.priority - b.priority);
    return NextResponse.json(sortedRules);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rules' },
      { status: 500 }
    );
  }
}

// POST - Create new shipping rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Generate new ID
    const newId = (Math.max(...shippingRules.map(r => parseInt(r.id)), 0) + 1).toString();
    
    const newRule: ShippingRule = {
      id: newId,
      name: body.name,
      nameAr: body.nameAr,
      type: body.type,
      cost: body.type === 'FREE' ? 0 : (body.cost || 0),
      minOrderAmount: body.minOrderAmount,
      maxOrderAmount: body.maxOrderAmount,
      isActive: body.isActive !== undefined ? body.isActive : true,
      priority: body.priority || shippingRules.length + 1,
      description: body.description,
      descriptionAr: body.descriptionAr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shippingRules.push(newRule);
    
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping rule' },
      { status: 500 }
    );
  }
} 