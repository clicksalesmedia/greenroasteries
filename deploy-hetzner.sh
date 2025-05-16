#!/bin/bash
# Deployment script for Green Roasteries website to Hetzner server

# Connect to the server and run the following commands
echo "Deploying to Hetzner server..."
echo "Run these commands on your Hetzner server:"
echo ""
echo "cd /var/www/greenroasteries"
echo ""
echo "# Update middleware.ts file"
echo "cat > middleware.ts << 'EOL'
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
  '/api/auth/register',
  '/api/products',
  '/api/categories',
  '/api/sliders',
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
    console.log([Middleware] Non-protected or public path: ${pathname}, skipping auth check);
    return NextResponse.next();
  }
  
  console.log([Middleware] Protected path: ${pathname}, checking auth);
  
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
    
    console.log([Middleware] Valid token for user: ${JSON.stringify(user)});
    
    // Only users with appropriate roles can access backend
    if (pathname.startsWith('/backend/') && !['ADMIN', 'MANAGER', 'TEAM'].includes(user.role)) {
      console.log([Middleware] User role ${user.role} not authorized for backend);
      
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
    '/api/orders/:path*',
    '/api/promotions/:path*',
    '/api/users/:path*',
  ],
};
EOL"
echo ""
echo "# Update shop page file"
echo "mkdir -p app/shop"
echo "cat > app/shop/page.tsx << 'EOL'
// Import statements and other code remain the same...

// Component that uses search params wrapped in Suspense
function SearchParamsHandler({ onCategoryChange }: { onCategoryChange: (category: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    onCategoryChange(categoryParam);
  }, [searchParams, onCategoryChange]);
  
  return null; // This component doesn't render anything
}

// Handle category from URL
const handleCategoryFromParams = (category: string | null) => {
  if (category) {
    // Only update if the category is not already in filters
    setFilters(prev => {
      // Check if category is already in the filters
      if (prev.category.includes(category)) {
        return prev;
      }
      
      return {
        ...prev,
        category: [category]
      };
    });
  }
};

// Apply category filter
if (filters.category.length > 0) {
  filteredProducts = filteredProducts.filter(product => {
    try {
      // Handle different category formats
      let categoryName: string;
      
      if (product.category === undefined || product.category === null) {
        return false; // Skip products with no category
      } else if (typeof product.category === 'string') {
        // If category is directly a string
        categoryName = product.category;
      } else if (typeof product.category === 'object' && 'name' in product.category) {
        // If category is an object with a name property
        categoryName = product.category.name;
      } else {
        return false; // Skip if category format is unknown
      }
      
      // Case-insensitive comparison with the category name
      return filters.category.some(cat => {
        if (cat === undefined || cat === null) return false;
        return categoryName.toLowerCase() === String(cat).toLowerCase();
      });
    } catch (error) {
      console.error("Error filtering product", product.id, error);
      return false; // Exclude product if there's an error
    }
  });
}
EOL"
echo ""
echo "# Rebuild and restart Docker containers"
echo "docker-compose build"
echo "docker-compose up -d"
echo ""
echo "# Check logs"
echo "docker-compose logs -f app"

echo ""
echo "Deployment instructions ready. SSH into the Hetzner server and run these commands." 