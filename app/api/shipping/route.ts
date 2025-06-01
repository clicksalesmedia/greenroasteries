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

// GET - Fetch all shipping rules from database
export async function GET() {
  try {
    const shippingRules = await prisma.shippingRule.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(shippingRules);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rules' },
      { status: 500 }
    );
  }
}

// POST - Create new shipping rule in database
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

    // Map the frontend type to database enum if needed
    let mappedType = body.type;
    if (body.type === 'FIXED') {
      mappedType = 'STANDARD';
    } else if (body.type === 'PERCENTAGE') {
      mappedType = 'STANDARD'; // Treat percentage as standard with calculated cost
    }

    const newRule = await prisma.shippingRule.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        type: mappedType,
        cost: body.type === 'FREE' ? 0 : (body.cost || 0),
        freeShippingThreshold: body.minOrderAmount || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        estimatedDays: body.estimatedDays || null,
        cities: body.cities || []
      }
    });
    
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping rule' },
      { status: 500 }
    );
  }
} 