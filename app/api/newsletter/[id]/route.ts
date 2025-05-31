import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET - Get specific subscriber
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: params.id }
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

// PATCH - Update subscriber status/details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, notes } = body;

    // Validate status if provided
    const validStatuses = ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedSubscriber = await prisma.emailSubscriber.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedSubscriber);

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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailSubscriber.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Subscriber deleted successfully' }
    );

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