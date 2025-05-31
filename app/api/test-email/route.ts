import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = 'welcome', email = 'test@example.com' } = body;

    let success = false;

    switch (type) {
      case 'welcome':
        success = await emailService.sendWelcomeEmail({
          customerName: 'Test Customer',
          email: email,
          password: 'TempPass123',
          orderId: 'TEST-ORDER-001'
        });
        break;

      case 'thankyou':
        success = await emailService.sendThankYouEmail({
          customerName: 'Test Customer',
          email: email,
          orderId: 'TEST-ORDER-002',
          orderTotal: 99.99,
          items: [
            { name: 'Ethiopian Coffee Beans', quantity: 2, price: 29.99 },
            { name: 'Colombian Coffee Beans', quantity: 1, price: 39.99 }
          ]
        });
        break;

      case 'forgot-password':
        success = await emailService.sendForgotPasswordEmail({
          customerName: 'Test Customer',
          email: email,
          resetToken: 'test-reset-token-123',
          resetUrl: 'http://localhost:3000/reset-password?token=test-reset-token-123'
        });
        break;

      case 'order-status':
        success = await emailService.sendOrderStatusEmail({
          customerName: 'Test Customer',
          email: email,
          orderId: 'TEST-ORDER-003',
          status: 'SHIPPED',
          trackingNumber: 'TRK123456789'
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success,
      message: success ? `${type} email sent successfully` : `Failed to send ${type} email`,
      type
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 