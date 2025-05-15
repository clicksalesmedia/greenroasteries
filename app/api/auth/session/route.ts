import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/app/lib/db';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function GET() {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      addCacheControlHeaders(response);
      return response;
    }

    // Verify token using jose
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secretKey);
      const decodedPayload = payload as unknown as JwtPayload;
      
      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decodedPayload.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        const response = NextResponse.json({ user: null }, { status: 401 });
        addCacheControlHeaders(response);
        return response;
      }

      // Only users with ADMIN, MANAGER, or TEAM roles can access the backend
      if (!['ADMIN', 'MANAGER', 'TEAM'].includes(user.role)) {
        const response = NextResponse.json({ user: null }, { status: 403 });
        addCacheControlHeaders(response);
        return response;
      }

      const response = NextResponse.json({ user });
      addCacheControlHeaders(response);
      return response;
    } catch (error) {
      console.error('Token verification error:', error);
      const response = NextResponse.json({ user: null }, { status: 401 });
      addCacheControlHeaders(response);
      return response;
    }
  } catch (error) {
    console.error('Session error:', error);
    const response = NextResponse.json(
      { error: 'An error occurred while fetching session' },
      { status: 500 }
    );
    addCacheControlHeaders(response);
    return response;
  }
}

// Helper function to add cache control headers
function addCacheControlHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
} 