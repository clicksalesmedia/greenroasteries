import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET /api/leads/[id] - Get a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const lead = await prisma.customerLead.findUnique({
      where: { id },
      include: {
        convertedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
                total: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lead);
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update a specific lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      status,
      notes,
      tags,
      leadScore,
      nextFollowUpAt,
      convertedUserId
    } = body;
    
    // Check if lead exists
    const existingLead = await prisma.customerLead.findUnique({
      where: { id }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (tags) updateData.tags = tags;
    if (leadScore !== undefined) updateData.leadScore = leadScore;
    if (nextFollowUpAt) updateData.nextFollowUpAt = new Date(nextFollowUpAt);
    
    // Handle conversion to customer
    if (convertedUserId && status === 'CONVERTED') {
      updateData.convertedUserId = convertedUserId;
      updateData.convertedAt = new Date();
    }
    
    // Update contact tracking
    if (status && status !== existingLead.status) {
      updateData.contactCount = (existingLead.contactCount || 0) + 1;
      updateData.lastContactedAt = new Date();
    }
    
    const updatedLead = await prisma.customerLead.update({
      where: { id },
      data: updateData,
      include: {
        convertedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedLead);
    
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a specific lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if lead exists
    const existingLead = await prisma.customerLead.findUnique({
      where: { id }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    // Don't allow deletion of converted leads
    if (existingLead.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Cannot delete converted leads' },
        { status: 400 }
      );
    }
    
    await prisma.customerLead.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Lead deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
} 