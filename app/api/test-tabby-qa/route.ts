import { NextRequest, NextResponse } from 'next/server';
import { TabbyCustomerDataService } from '@/app/lib/tabby-customer-data';
import TabbyService from '@/app/lib/tabby';

export async function POST(request: NextRequest) {
  try {
    const { email, orderId } = await request.json();
    
    console.log('🧪 Testing Tabby Customer Data Service');
    console.log('📧 Email:', email);
    console.log('🆔 Order ID:', orderId);
    
    // Test the customer data service
    const customerData = await TabbyCustomerDataService.getCustomerData(email, orderId);
    
    console.log('✅ Customer data retrieved:', {
      buyer_history: customerData.buyer_history,
      order_history_count: customerData.order_history.length
    });
    
    return NextResponse.json({
      success: true,
      buyer_history: customerData.buyer_history,
      order_history: customerData.order_history,
      message: 'Customer data service working correctly'
    });
    
  } catch (error) {
    console.error('❌ Customer data service error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Tabby QA Test Endpoint',
    description: 'Use POST with { email, orderId } to test customer data service'
  });
} 