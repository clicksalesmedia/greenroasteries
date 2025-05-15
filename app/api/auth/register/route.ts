import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { hash } from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role = 'ADMIN' } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Only allow ADMIN creation in development or if there's a special key
    if (
      process.env.NODE_ENV !== 'development' && 
      body.secretKey !== process.env.ADMIN_SECRET_KEY
    ) {
      return NextResponse.json(
        { error: 'Not authorized to create an admin account' },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: role,
        isActive: true,
      },
    });

    // Return user (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Admin user created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 