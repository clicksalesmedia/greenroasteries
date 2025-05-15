import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from './db';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface PermissionCheck {
  module: string;
  action?: 'view' | 'create' | 'edit' | 'delete';
}

// Helper function to verify a token with the Request object
export async function verifyTokenWithRequest(request: NextRequest, requiredRoles = ['ADMIN', 'MANAGER', 'TEAM']) {
  try {
    console.log(`[Auth] Checking auth for roles: ${requiredRoles.join(', ')}`);
    
    // Get token directly from request
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      console.log('[Auth] No auth token found');
      return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    console.log('[Auth] Verifying token');
    
    try {
      // Verify token using jose
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secretKey);
      
      // Cast payload to our expected type
      const decodedPayload = payload as unknown as JwtPayload;
      
      console.log(`[Auth] Token verified for user: ${decodedPayload.email}, role: ${decodedPayload.role}`);
      
      // Check if user has required role
      if (!requiredRoles.includes(decodedPayload.role)) {
        console.log(`[Auth] User role ${decodedPayload.role} not in required roles: ${requiredRoles.join(', ')}`);
        return { authorized: false, error: 'Forbidden', status: 403 };
      }

      console.log('[Auth] Authorization successful');
      return { authorized: true, userId: decodedPayload.id, role: decodedPayload.role };
    } catch (jwtError) {
      console.error('[Auth] JWT verification error:', jwtError);
      return { authorized: false, error: 'Invalid token', status: 401 };
    }
  } catch (error) {
    console.error('[Auth] Auth check error:', error);
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }
}

// Main authentication and authorization check function
export async function checkAuth(requiredRoles = ['ADMIN', 'MANAGER', 'TEAM'], permissionCheck?: PermissionCheck) {
  try {
    // Get cookies from Next.js - properly await the cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      console.log('[Auth] No auth token found');
      return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    // Verify token using jose
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Cast payload to our expected type
    const decodedPayload = payload as unknown as JwtPayload;
    
    console.log(`[Auth] Token verified for user: ${decodedPayload.email}, role: ${decodedPayload.role}`);
    
    // ADMIN role always has full access
    if (decodedPayload.role === 'ADMIN') {
      return { authorized: true, userId: decodedPayload.id, role: decodedPayload.role };
    }
    
    // Check if user has required role
    if (!requiredRoles.includes(decodedPayload.role)) {
      console.log(`[Auth] User role ${decodedPayload.role} not in required roles: ${requiredRoles.join(', ')}`);
      return { authorized: false, error: 'Forbidden', status: 403 };
    }

    // If specific module permission check is required
    if (permissionCheck) {
      // Check if user has required permission for the module
      const userPermission = await prisma.permission.findFirst({
        where: {
          userId: decodedPayload.id,
          module: permissionCheck.module
        }
      });
      
      if (!userPermission) {
        console.log(`[Auth] User does not have any permissions for module: ${permissionCheck.module}`);
        return { authorized: false, error: 'Forbidden - No access to this module', status: 403 };
      }
      
      // Check if user has the required action permission
      if (permissionCheck.action) {
        const permissionMap = {
          'view': 'canView',
          'create': 'canCreate',
          'edit': 'canEdit',
          'delete': 'canDelete'
        };
        
        const permissionKey = permissionMap[permissionCheck.action];
        if (!userPermission[permissionKey as keyof typeof userPermission]) {
          console.log(`[Auth] User does not have ${permissionCheck.action} permission for module: ${permissionCheck.module}`);
          return { authorized: false, error: `Forbidden - Cannot ${permissionCheck.action} in this module`, status: 403 };
        }
      }
    }

    console.log('[Auth] Authorization successful');
    return { authorized: true, userId: decodedPayload.id, role: decodedPayload.role };
  } catch (error) {
    console.error('[Auth] Auth check error:', error);
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }
}

export async function withAuth(
  handler: (request: NextRequest, auth: any) => Promise<NextResponse>,
  request: NextRequest,
  requiredRoles = ['ADMIN', 'MANAGER', 'TEAM']
) {
  const auth = await verifyTokenWithRequest(request, requiredRoles);
  
  if (!auth.authorized) {
    console.log(`[Auth] Request not authorized: ${auth.error}`);
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }
  
  return handler(request, auth);
} 