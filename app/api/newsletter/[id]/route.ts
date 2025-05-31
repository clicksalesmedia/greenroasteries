import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET - Get specific subscriber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id }
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscriber);

  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update subscriber status or notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status if provided
    if (status && !['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = new Date();

    const subscriber = await prisma.emailSubscriber.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Subscriber updated successfully',
      subscriber
    });

  } catch (error: any) {
    console.error('Error updating subscriber:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.emailSubscriber.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Subscriber deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting subscriber:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 