interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface WelcomeEmailData {
  customerName: string;
  email: string;
  password: string;
  orderId: string;
}

interface ThankYouEmailData {
  customerName: string;
  email: string;
  orderId: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface ForgotPasswordEmailData {
  customerName: string;
  email: string;
  resetToken: string;
  resetUrl: string;
}

interface OrderStatusEmailData {
  customerName: string;
  email: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
}

class EmailService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@greenroasteries.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Green Roasteries';
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  private async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === 'mock_brevo_api_key') {
        console.log('📧 Mock Email Sent (No API Key):', {
          from: `${this.senderName} <${this.senderEmail}>`,
          to: data.to,
          subject: data.subject,
          content: data.htmlContent
        });
        return true;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          sender: {
            name: this.senderName,
            email: this.senderEmail
          },
          to: [{ email: data.to }],
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent || data.subject
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Brevo API Error:', response.status, errorData);
        return false;
      }

      const result = await response.json();
      console.log('📧 Email sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Green Roasteries</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px 20px; background-color: #ffffff; }
          .credentials { background-color: #f8fdf8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2d5a27; }
          .credentials h3 { margin-top: 0; color: #2d5a27; }
          .button { display: inline-block; background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
          .features { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features ul { margin: 0; padding-left: 20px; }
          .features li { margin: 8px 0; }
          .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 14px; background-color: #f5f5f5; }
          .logo { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .order-info { background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱 Green Roasteries</div>
            <h1>Welcome to Our Community!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for your order <strong>#${data.orderId}</strong>! We're thrilled to welcome you to the Green Roasteries family.</p>
            
            <div class="order-info">
              <p><strong>🎉 Great news!</strong> We've created a personal account for you to enhance your shopping experience.</p>
            </div>
            
            <div class="credentials">
              <h3>🔐 Your Account Credentials</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
              <p style="color: #666; font-size: 14px; margin-top: 15px;"><em>🔒 For your security, please change this password after your first login.</em></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/customer/login" class="button">
                🚀 Access Your Account
              </a>
            </div>
            
            <div class="features">
              <h3>✨ What you can do in your account:</h3>
              <ul>
                <li>📦 Track your current and past orders</li>
                <li>🚚 View detailed shipping information</li>
                <li>👤 Update your profile and preferences</li>
                <li>📍 Manage your delivery addresses</li>
                <li>❤️ Save your favorite products</li>
                <li>🔔 Get notified about special offers</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance, our customer support team is here to help. Simply reply to this email or contact us through your account.</p>
            
            <p>Thank you for choosing Green Roasteries for your premium coffee needs!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Green Roasteries Team</strong><br>
              <span style="color: #666;">Your Premium Coffee Partner</span>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
            <p>🌍 Bringing you the finest coffee from around the world</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Green Roasteries!

Hello ${data.customerName},

Thank you for your order #${data.orderId}! We've created an account for you.

Your Account Details:
Email: ${data.email}
Temporary Password: ${data.password}

Please change your password after your first login for security.

Access your account at: ${this.baseUrl}/customer/login

Best regards,
The Green Roasteries Team
    `;

    return this.sendEmail({
      to: data.email,
      subject: `🌱 Welcome to Green Roasteries - Order #${data.orderId}`,
      htmlContent,
      textContent
    });
  }

  async sendThankYouEmail(data: ThankYouEmailData): Promise<boolean> {
    const itemsList = data.items.map(item => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${item.price.toFixed(2)} AED</td>
      </tr>`
    ).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank You for Your Order</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px 20px; background-color: #ffffff; }
          .order-summary { background-color: #f8fdf8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e8f5e8; }
          .order-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .order-table th { background-color: #2d5a27; color: white; padding: 12px; text-align: left; }
          .order-table th:last-child { text-align: right; }
          .total-row { font-weight: bold; background-color: #f0f8f0; }
          .button { display: inline-block; background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 14px; background-color: #f5f5f5; }
          .status-badge { background-color: #4CAF50; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>🌱 Green Roasteries</div>
            <h1>Thank You for Your Order!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for your order <strong>#${data.orderId}</strong>! We're processing it with care and will notify you once it ships.</p>
            
            <div class="order-summary">
              <h3>📦 Order Summary</h3>
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                  <tr class="total-row">
                    <td colspan="2" style="padding: 15px; font-weight: bold;">Total</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold;">${data.orderTotal.toFixed(2)} AED</td>
                  </tr>
                </tbody>
              </table>
              <p style="margin-top: 15px;">
                <span class="status-badge">PROCESSING</span>
                <span style="margin-left: 10px; color: #666;">Your order is being prepared</span>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/customer/orders" class="button">
                📱 Track Your Order
              </a>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📬 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>We'll send you tracking information once your order ships</li>
                <li>You can track your order status in your account</li>
                <li>Estimated delivery: 2-5 business days</li>
              </ul>
            </div>
            
            <p>Thank you for choosing Green Roasteries! We appreciate your business and can't wait for you to enjoy your premium coffee.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Green Roasteries Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Thank you for your order!

Hello ${data.customerName},

Thank you for your order #${data.orderId}!

Order Summary:
${data.items.map(item => `${item.name} - Qty: ${item.quantity} - ${item.price.toFixed(2)} AED`).join('\n')}

Total: ${data.orderTotal.toFixed(2)} AED

Track your order at: ${this.baseUrl}/customer/orders

Best regards,
The Green Roasteries Team
    `;

    return this.sendEmail({
      to: data.email,
      subject: `📦 Order Confirmation #${data.orderId} - Green Roasteries`,
      htmlContent,
      textContent
    });
  }

  async sendForgotPasswordEmail(data: ForgotPasswordEmailData): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px 20px; background-color: #ffffff; }
          .reset-section { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 14px; background-color: #f5f5f5; }
          .security-note { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>🌱 Green Roasteries</div>
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>We received a request to reset your password for your Green Roasteries account.</p>
            
            <div class="reset-section">
              <h3>🔐 Reset Your Password</h3>
              <p>Click the button below to create a new password. This link will expire in 1 hour for security reasons.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">
                🔑 Reset My Password
              </a>
            </div>
            
            <div class="security-note">
              <h4>🛡️ Security Notice</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your current password remains unchanged until you complete the reset</li>
                <li>For security, we recommend using a strong, unique password</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
              ${data.resetUrl}
            </p>
            
            <p>If you didn't request this password reset, please contact our support team immediately.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Green Roasteries Security Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
            <p>This is an automated security email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Password Reset Request - Green Roasteries

Hello ${data.customerName},

We received a request to reset your password.

Reset your password by visiting this link:
${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

Best regards,
The Green Roasteries Security Team
    `;

    return this.sendEmail({
      to: data.email,
      subject: `🔐 Reset Your Password - Green Roasteries`,
      htmlContent,
      textContent
    });
  }

  async sendOrderStatusEmail(data: OrderStatusEmailData): Promise<boolean> {
    const statusInfo = {
      PROCESSING: { icon: '⏳', message: 'Your order is being prepared', color: '#ffc107' },
      SHIPPED: { icon: '🚚', message: 'Your order has shipped', color: '#17a2b8' },
      DELIVERED: { icon: '📦', message: 'Your order has been delivered', color: '#28a745' },
      CANCELLED: { icon: '❌', message: 'Your order has been cancelled', color: '#dc3545' }
    };

    const status = statusInfo[data.status as keyof typeof statusInfo] || statusInfo.PROCESSING;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .status-update { background-color: #f8fdf8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${status.color}; }
          .status-badge { background-color: ${status.color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
          .tracking-section { background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #2d5a27 0%, #4a7c59 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 14px; background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>🌱 Green Roasteries</div>
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>We have an update on your order <strong>#${data.orderId}</strong>.</p>
            
            <div class="status-update">
              <h3>${status.icon} Order Status Updated</h3>
              <p><span class="status-badge">${data.status}</span></p>
              <p style="margin-top: 15px; font-size: 16px;">${status.message}</p>
            </div>
            
            ${data.trackingNumber ? `
            <div class="tracking-section">
              <h3>📍 Tracking Information</h3>
              <p><strong>Tracking Number:</strong> <code>${data.trackingNumber}</code></p>
              <p>Use this tracking number to monitor your shipment's progress.</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/customer/orders" class="button">
                📱 View Order Details
              </a>
            </div>
            
            <p>Thank you for your patience and for choosing Green Roasteries!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Green Roasteries Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Order Status Update - Green Roasteries

Hello ${data.customerName},

Your order #${data.orderId} status has been updated to: ${data.status}

${status.message}

${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}

View your order details at: ${this.baseUrl}/customer/orders

Best regards,
The Green Roasteries Team
    `;

    return this.sendEmail({
      to: data.email,
      subject: `${status.icon} Order #${data.orderId} - ${data.status}`,
      htmlContent,
      textContent
    });
  }
}

export const emailService = new EmailService(); 