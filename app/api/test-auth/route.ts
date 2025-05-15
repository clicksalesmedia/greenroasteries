import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// JWT secret key should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies using the request
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'No token found',
        allCookies: request.cookies.getAll().map(c => c.name)
      });
    }

    try {
      // Verify token using jose
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secretKey);
      
      return NextResponse.json({ 
        authorized: true,
        user: payload,
        message: 'Token valid'
      });
    } catch (jwtError) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'Invalid token',
        error: String(jwtError)
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking auth',
      message: String(error)
    });
  }
} 