import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || '8Vgq2eXQ4XYwfvXf19GKrOdnw22Y69P71A9ceb6e24k= ';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Paths that should be protected (require authentication)
const protectedPaths = [
  '/backend',
  '/api/variations',
  '/api/promotions',
  '/api/users',
];

// Paths that are excluded from protection (login, public API, etc.)
const PUBLIC_PATHS = [
  '/backend/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/products',
  '/api/categories',
  '/api/sliders',
  '/api/orders',
  '/api/create-payment-intent',
  '/api/test-email',
];

// Middleware for auth checks
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip for non-protected paths
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path) && 
    // Skip if this is a static asset
    !pathname.includes('_next') && 
    !pathname.includes('favicon')
  );
  
  // Skip if the path is in the PUBLIC_PATHS list
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  if (!isProtectedPath || isPublicPath) {
    console.log(`[Middleware] Non-protected or public path: ${pathname}, skipping auth check`);
    return NextResponse.next();
  }
  
  console.log(`[Middleware] Protected path: ${pathname}, checking auth`);
  
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    console.log('[Middleware] No auth token found, redirecting to login');
    
    // Return different responses based on the route type (API or frontend)
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Redirect to login page for frontend routes
    const url = new URL('/backend/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  try {
    // Verify token
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const user = payload as unknown as JwtPayload;
    
    console.log(`[Middleware] Valid token for user: ${JSON.stringify(user)}`);
    
    // Only users with appropriate roles can access backend
    if (pathname.startsWith('/backend/') && !['ADMIN', 'MANAGER', 'TEAM'].includes(user.role)) {
      console.log(`[Middleware] User role ${user.role} not authorized for backend`);
      
      // Redirect to login page
      const url = new URL('/backend/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // Continue with the request
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Token verification error:', error);
    
    // Return different responses based on the route type (API or frontend)
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Redirect to login page for frontend routes
    const url = new URL('/backend/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    // Match all backend routes
    '/backend/:path*',
    // Match protected API routes
    '/api/variations/:path*',
    '/api/promotions/:path*',
    '/api/users/:path*',
  ],
};
