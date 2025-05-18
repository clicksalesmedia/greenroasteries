import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

/**
 * GET handler for searching variations (beans, types, sizes)
 * @param request Request with query parameter
 * @returns Search results for variations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    // Return empty results if no query provided
    if (!query || query.trim() === '') {
      return NextResponse.json({
        beans: [],
        types: [],
        sizes: []
      });
    }
    
    // Perform a case-insensitive search across different variation types
    const [beans, types, sizes] = await Promise.all([
      // Search beans
      prisma.variationBeans.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { arabicName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        },
        orderBy: { name: 'asc' },
        take: 5 // Limit to 5 results
      }),
      
      // Search types (additions)
      prisma.variationType.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { arabicName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        },
        orderBy: { name: 'asc' },
        take: 5 // Limit to 5 results
      }),
      
      // Search sizes
      prisma.variationSize.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        },
        orderBy: { value: 'asc' },
        take: 5 // Limit to 5 results
      })
    ]);
    
    return NextResponse.json({
      beans,
      types,
      sizes
    });
  } catch (error) {
    console.error('Error searching variations:', error);
    return NextResponse.json(
      { error: 'Failed to search variations' },
      { status: 500 }
    );
  }
} 