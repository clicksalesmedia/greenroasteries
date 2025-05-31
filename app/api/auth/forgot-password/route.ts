import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Create reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;

      // Send reset email
      try {
        await emailService.sendForgotPasswordEmail({
          customerName: user.name || user.email.split('@')[0],
          email: user.email,
          resetToken,
          resetUrl,
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Continue anyway - don't reveal if email sending failed
      }
    }

    // Always return success message
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 