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
  '/api/contacts',
  '/api/webhooks/stripe',
  '/api/webhooks/stripe-test',
  '/api/payments/check-incomplete',
  '/api/payments/recover-missing',
];

// Cache control helper function
function setCacheHeaders(response: NextResponse, pathname: string) {
  // Handle API routes with specific cache strategies
  if (pathname.startsWith('/api/')) {
    
    // Dynamic content that changes frequently (sliders, banners, content)
    if (pathname.match(/\/api\/(sliders|banners|offer-banners|content)/)) {
      response.headers.set(
        'Cache-Control', 
        'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
      );
      response.headers.set('ETag', `"${pathname}-${Date.now()}"`);
    }
    
    // Semi-static content (products, categories)
    else if (pathname.match(/\/api\/(products|categories)/)) {
      response.headers.set(
        'Cache-Control', 
        'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
      );
    }
    
    // User-specific or frequently changing data (orders, cart, auth)
    else if (pathname.match(/\/api\/(orders|auth|cart|checkout|contacts)/)) {
      response.headers.set(
        'Cache-Control', 
        'private, max-age=0, no-cache, no-store, must-revalidate'
      );
    }
    
    // Default API cache (5 minutes)
    else {
      response.headers.set(
        'Cache-Control', 
        'public, max-age=300, s-maxage=300'
      );
    }
    
    // Add common headers for all API routes
    response.headers.set('Vary', 'Accept-Encoding, Authorization');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // Handle static assets
  else if (pathname.startsWith('/_next/static/') || pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    response.headers.set(
      'Cache-Control', 
      'public, max-age=31536000, immutable'
    );
  }
  
  // Handle uploaded images/files
  else if (pathname.startsWith('/uploads/') || pathname.startsWith('/images/')) {
    response.headers.set(
      'Cache-Control', 
      'public, max-age=2592000, stale-while-revalidate=86400'
    );
  }
  
  // Handle pages with dynamic content
  else if (pathname === '/' || pathname.startsWith('/shop') || pathname.startsWith('/product/')) {
    response.headers.set(
      'Cache-Control', 
      'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
    );
  }
  
  // Handle static pages
  else if (pathname.match(/\/(about|contact|privacy|terms)/)) {
    response.headers.set(
      'Cache-Control', 
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    );
  }
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  return response;
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response object
  let response = NextResponse.next();
  
  // Apply cache headers to all responses
  response = setCacheHeaders(response, pathname);
  
  // Skip auth check for non-protected paths
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
    return response;
  }
  
  console.log(`[Middleware] Protected path: ${pathname}, checking auth`);
  
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    console.log('[Middleware] No auth token found, redirecting to login');
    
    // Return different responses based on the route type (API or frontend)
    if (pathname.startsWith('/api/')) {
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      // No cache for unauthorized responses
      errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return errorResponse;
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
    return response;
  } catch (error) {
    console.error('[Middleware] Token verification error:', error);
    
    // Return different responses based on the route type (API or frontend)
    if (pathname.startsWith('/api/')) {
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      // No cache for error responses
      errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return errorResponse;
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
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
