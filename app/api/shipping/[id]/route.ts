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

// GET - Fetch specific shipping rule from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await prisma.shippingRule.findUnique({
      where: { id }
    });
    
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

// PUT - Update shipping rule in database
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if rule exists
    const existingRule = await prisma.shippingRule.findUnique({
      where: { id }
    });
    
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Shipping rule not found' },
        { status: 404 }
      );
    }
    
    // Map the frontend type to database enum if needed
    let mappedType = body.type;
    if (body.type === 'FIXED') {
      mappedType = 'STANDARD';
    } else if (body.type === 'PERCENTAGE') {
      mappedType = 'STANDARD'; // Treat percentage as standard with calculated cost
    }
    
    // Update the rule in database
    const updatedRule = await prisma.shippingRule.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.nameAr !== undefined && { nameAr: body.nameAr || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr || null }),
        ...(body.type && { type: mappedType }),
        ...(body.cost !== undefined && { cost: body.type === 'FREE' ? 0 : body.cost }),
        ...(body.minOrderAmount !== undefined && { freeShippingThreshold: body.minOrderAmount || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.estimatedDays !== undefined && { estimatedDays: body.estimatedDays || null }),
        ...(body.cities !== undefined && { cities: body.cities || [] }),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping rule from database
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if rule exists
    const existingRule = await prisma.shippingRule.findUnique({
      where: { id }
    });
    
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Shipping rule not found' },
        { status: 404 }
      );
    }
    
    // Delete the rule from database
    await prisma.shippingRule.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Shipping rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping rule' },
      { status: 500 }
    );
  }
} 