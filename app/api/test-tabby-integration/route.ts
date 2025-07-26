import { NextRequest, NextResponse } from 'next/server';
import { tabbyService } from '@/app/lib/tabby';
import { TabbyCustomerDataService } from '@/app/lib/tabby-customer-data';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Tabby integration for QA approval...');
    
    // Test 1: Environment Configuration
    const envConfig = {
      TABBY_PUBLIC_KEY: !!process.env.TABBY_PUBLIC_KEY,
      TABBY_SECRET_KEY: !!process.env.TABBY_SECRET_KEY,
      TABBY_MERCHANT_CODE: process.env.TABBY_MERCHANT_CODE || 'Not set',
      TABBY_AUTO_CAPTURE: process.env.TABBY_AUTO_CAPTURE,
      TABBY_WEBHOOK_SECRET: !!process.env.TABBY_WEBHOOK_SECRET,
    };
    
    console.log('📊 Environment Configuration:', envConfig);
    
    // Test 2: Customer Data Service (loyalty_level and order_history)
    const testEmail = 'test@greenroasteries.com';
    console.log('🔍 Testing customer data service for:', testEmail);
    
    const customerData = await TabbyCustomerDataService.getCustomerData(testEmail);
    console.log('📄 Customer data result:', {
      loyalty_level: customerData.buyer_history.loyalty_level,
      order_history_count: customerData.order_history.length,
      registered_since: customerData.buyer_history.registered_since,
      is_email_verified: customerData.buyer_history.is_email_verified,
      is_phone_verified: customerData.buyer_history.is_phone_number_verified
    });
    
    // Test 3: Check for real customer with orders
    const realCustomer = await prisma.user.findFirst({
      where: {
        orders: {
          some: {
            status: {
              in: ['DELIVERED', 'SHIPPED', 'PROCESSING']
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            status: {
              in: ['DELIVERED', 'SHIPPED', 'PROCESSING']
            }
          },
          take: 5
        }
      }
    });
    
    let realCustomerData = null;
    if (realCustomer) {
      realCustomerData = await TabbyCustomerDataService.getCustomerData(realCustomer.email);
      console.log('🔍 Real customer data:', {
        email: realCustomer.email,
        loyalty_level: realCustomerData.buyer_history.loyalty_level,
        order_history_count: realCustomerData.order_history.length,
        orders_in_db: realCustomer.orders.length
      });
    }
    
    // Test 4: Test capture functionality
    console.log('🔍 Testing capture functionality...');
    
    // Test 5: Check recent webhook logs
    const recentWebhookLogs = await prisma.payment.findMany({
      where: {
        paymentProvider: 'TABBY',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            customerEmail: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log('📊 Recent Tabby payments:', recentWebhookLogs.length);
    
    return NextResponse.json({
      success: true,
      test_results: {
        environment_config: envConfig,
        customer_data_service: {
          test_email: testEmail,
          loyalty_level: customerData.buyer_history.loyalty_level,
          order_history_count: customerData.order_history.length,
          buyer_history: customerData.buyer_history,
          sample_order_history: customerData.order_history.slice(0, 2)
        },
        real_customer_test: realCustomer ? {
          email: realCustomer.email,
          loyalty_level: realCustomerData?.buyer_history.loyalty_level,
          order_history_count: realCustomerData?.order_history.length,
          orders_in_db: realCustomer.orders.length
        } : 'No real customer with orders found',
        auto_capture_config: {
          enabled: process.env.TABBY_AUTO_CAPTURE === 'true',
          environment_value: process.env.TABBY_AUTO_CAPTURE
        },
        recent_tabby_payments: recentWebhookLogs.map(payment => ({
          id: payment.id,
          tabby_payment_id: payment.tabbyPaymentId,
          status: payment.status,
          amount: payment.amount,
          order_status: payment.order?.status,
          created_at: payment.createdAt
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Tabby integration test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payment_id, test_capture } = body;
    
    if (action === 'test_capture' && payment_id) {
      console.log('🧪 Testing capture for payment:', payment_id);
      
      // First, get the payment details
      const paymentDetails = await tabbyService.getPayment(payment_id);
      console.log('📄 Payment details:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency
      });
      
      if (paymentDetails.status !== 'AUTHORIZED') {
        return NextResponse.json({
          success: false,
          error: `Payment status is "${paymentDetails.status}", not "AUTHORIZED". Cannot capture.`
        }, { status: 400 });
      }
      
      // Test capture
      const captureResult = await tabbyService.capturePayment(payment_id, {
        amount: paymentDetails.amount,
        reference_id: `test_capture_${payment_id}_${Date.now()}`,
        tax_amount: paymentDetails.order?.tax_amount || "0.00",
        shipping_amount: paymentDetails.order?.shipping_amount || "0.00",
        discount_amount: paymentDetails.order?.discount_amount || "0.00",
        items: paymentDetails.order?.items || []
      });
      
      return NextResponse.json({
        success: true,
        message: 'Capture test completed successfully',
        capture_result: captureResult,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'test_customer_data' && body.email) {
      console.log('🧪 Testing customer data for:', body.email);
      
      const customerData = await TabbyCustomerDataService.getCustomerData(body.email);
      
      return NextResponse.json({
        success: true,
        message: 'Customer data test completed',
        customer_data: customerData,
        validation: {
          loyalty_level_valid: typeof customerData.buyer_history.loyalty_level === 'number',
          order_history_valid: Array.isArray(customerData.order_history),
          buyer_history_complete: !!(
            customerData.buyer_history.registered_since &&
            typeof customerData.buyer_history.loyalty_level === 'number' &&
            typeof customerData.buyer_history.wishlist_count === 'number'
          )
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Tabby integration POST test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 