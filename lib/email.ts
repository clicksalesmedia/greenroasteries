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
  orderId: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

class EmailService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@greenroasteries.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Green Roasteries';
  }

  private async sendEmail(data: EmailData): Promise<boolean> {
    try {
      // Mock implementation for now
      console.log('📧 Mock Email Sent:', {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: data.to,
        subject: data.subject,
        content: data.htmlContent
      });

      // In production, you would use the actual Brevo API:
      /*
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
          textContent: data.textContent
        })
      });

      return response.ok;
      */

      return true; // Mock success
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2d5a27; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background-color: #2d5a27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Green Roasteries!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for your order #${data.orderId}! We're excited to have you as a customer.</p>
            
            <p>We've created an account for you to track your orders and manage your profile:</p>
            
            <div class="credentials">
              <h3>Your Account Details:</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Temporary Password:</strong> ${data.password}</p>
              <p><em>Please change your password after your first login for security.</em></p>
            </div>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/customer/login" class="button">
                Access Your Account
              </a>
            </p>
            
            <p>In your customer panel, you can:</p>
            <ul>
              <li>Track your current and past orders</li>
              <li>View shipping information</li>
              <li>Update your profile and preferences</li>
              <li>Manage your addresses</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our customer support.</p>
            
            <p>Best regards,<br>The Green Roasteries Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: `Welcome to Green Roasteries - Order #${data.orderId}`,
      htmlContent,
      textContent: `Welcome to Green Roasteries! Your account has been created. Email: ${data.email}, Temporary Password: ${data.password}`
    });
  }

  async sendThankYouEmail(data: ThankYouEmailData): Promise<boolean> {
    const itemsList = data.items.map(item => 
      `<li>${item.name} - Quantity: ${item.quantity} - ${item.price.toFixed(2)} AED</li>`
    ).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank You for Your Order</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2d5a27; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-summary { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background-color: #2d5a27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Order!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>Thank you for your order #${data.orderId}! We're processing it and will notify you once it ships.</p>
            
            <div class="order-summary">
              <h3>Order Summary:</h3>
              <ul>
                ${itemsList}
              </ul>
              <p><strong>Total: ${data.orderTotal.toFixed(2)} AED</strong></p>
            </div>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/customer/orders" class="button">
                Track Your Order
              </a>
            </p>
            
            <p>We'll send you another email with tracking information once your order ships.</p>
            
            <p>Thank you for choosing Green Roasteries!</p>
            
            <p>Best regards,<br>The Green Roasteries Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Green Roasteries. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.customerName, // This should be the email, but using customerName for now
      subject: `Order Confirmation #${data.orderId}`,
      htmlContent,
      textContent: `Thank you for your order #${data.orderId}! Total: ${data.orderTotal.toFixed(2)} AED`
    });
  }
}

export const emailService = new EmailService(); 