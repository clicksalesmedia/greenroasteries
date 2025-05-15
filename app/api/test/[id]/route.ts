import { NextRequest, NextResponse } from 'next/server';

export function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ id: 'test-id' });
} 