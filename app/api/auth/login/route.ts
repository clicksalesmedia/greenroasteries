import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { cookies } from 'next/headers';
import { compare } from 'bcrypt';
import * as jose from 'jose';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log(`Login attempt for email: ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`User ${email} is inactive`);
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await compare(password, user.password);
    
    console.log(`Password match result for ${email}: ${passwordMatch}`);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Only users with ADMIN, MANAGER, or TEAM roles can access the backend
    if (!['ADMIN', 'MANAGER', 'TEAM'].includes(user.role)) {
      console.log(`User ${email} has insufficient role: ${user.role}`);
      return NextResponse.json(
        { error: 'You do not have permission to access this area' },
        { status: 403 }
      );
    }

    // Create JWT token (expires in 1 day) using jose
    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretKey);

    console.log(`Generated JWT token for ${email}`);

    // Create response with user info and add no-cache headers
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set the cookie in the response object
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day in seconds
      sameSite: 'lax',
    });

    console.log(`Set auth_token cookie for ${email} in response object`);

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 