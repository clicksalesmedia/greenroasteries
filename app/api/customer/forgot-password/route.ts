import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with this email exists, you will receive password reset instructions.';

    if (!user) {
      return NextResponse.json({
        success: true,
        message: successMessage
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send reset email using fetch directly to Brevo API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegreenroasteries.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    try {
      const brevoApiKey = process.env.BREVO_API_KEY;
      const supportEmail = process.env.BREVO_SUPPORT_EMAIL || 'support@thegreenroasteries.com';
      
      if (brevoApiKey && brevoApiKey !== 'mock_brevo_api_key') {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': brevoApiKey
          },
          body: JSON.stringify({
            sender: {
              name: 'Green Roasteries',
              email: supportEmail
            },
            to: [{ email: user.email }],
            subject: '🔐 Reset Your Password - Green Roasteries',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hello ${user.name || 'Customer'},</p>
                <p>We received a request to reset your password for your Green Roasteries account.</p>
                <p><a href="${resetUrl}" style="background-color: #2d5a27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset My Password</a></p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <p>Best regards,<br>The Green Roasteries Team</p>
              </div>
            `
          })
        });
      }
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: successMessage
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 