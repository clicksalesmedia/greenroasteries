import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Paths that should be protected (require authentication)
const protectedPaths = [
  '/backend',
  '/api/variations',
  '/api/orders',
  '/api/promotions',
  '/api/users',
];

// Paths that are excluded from protection (login, public API, etc.)
const PUBLIC_PATHS = [
  '/backend/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/products',
  '/api/categories',
  '/api/auth/register',
];

// Note: This is a simple middleware example. In production, you might want to use a more sophisticated system.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Checking path: ${pathname}`);

  // Check if the path is in the protected list
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    console.log(`[Middleware] Protected path: ${pathname}, checking auth`);
    // Check if the request has auth token
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      console.log(`[Middleware] No auth token found, redirecting to login`);
      const loginUrl = new URL('/backend/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify JWT token
      const { payload } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      console.log(`[Middleware] Valid token, user: ${payload.email}`);
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to login
      console.log(`[Middleware] Invalid token, redirecting to login`);
      const loginUrl = new URL('/backend/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // Check if the path is explicitly public
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    if (isPublicPath) {
      console.log(`[Middleware] Non-protected or public path: ${pathname}, skipping auth check`);
      return NextResponse.next();
    }

    // For frontend/client pages, no auth needed
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|).*)'],
}; 