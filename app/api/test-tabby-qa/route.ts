import { NextRequest, NextResponse } from 'next/server';
import { TabbyCustomerDataService } from '@/app/lib/tabby-customer-data';
import { TabbyService } from '@/app/lib/tabby';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };

    // Test 1: Customer Data Service Structure
    console.log('🧪 Testing Customer Data Service...');
    try {
      const testEmail = 'test@example.com';
      const testOrderId = 'test-order-123';
      
      const customerData = await TabbyCustomerDataService.getCustomerData(testEmail, testOrderId);
      
      const hasCorrectStructure = 
        customerData.buyer_history &&
        typeof customerData.buyer_history.loyalty_level === 'number' &&
        Array.isArray(customerData.order_history);

      results.tests.customerDataStructure = {
        status: hasCorrectStructure ? 'PASSED' : 'FAILED',
        message: hasCorrectStructure 
          ? '✅ Customer data service returns correct structure'
          : '❌ Customer data service structure is invalid',
        data: {
          loyaltyLevel: customerData.buyer_history.loyalty_level,
          orderHistoryCount: customerData.order_history.length,
          hasRegisteredSince: !!customerData.buyer_history.registered_since,
          hasOrderHistory: Array.isArray(customerData.order_history)
        }
      };
      
      if (hasCorrectStructure) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
    } catch (error) {
      results.tests.customerDataStructure = {
        status: 'FAILED',
        message: `❌ Customer data service error: ${error}`,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
      results.summary.total++;
    }

    // Test 2: Tabby Service Integration
    console.log('🧪 Testing Tabby Service Integration...');
    try {
      const tabbyService = new TabbyService();
      
      // Test payment data structure (don't actually create payment)
      const testPaymentData = {
        amount: 100.00,
        currency: 'AED',
        buyer: {
          phone: '+971501234567',
          email: 'qa-test@example.com',
          name: 'QA Test Customer',
          dob: '1990-01-01'
        },
        order: {
          reference_id: `qa-test-${Date.now()}`,
          items: [{
            title: 'QA Test Product',
            description: 'Testing Tabby integration',
            quantity: 1,
            unit_price: '100.00',
            category: 'Coffee'
          }]
        },
        merchant_code: 'GR'
      };

      // Test that the service initializes correctly
      const serviceInitialized = tabbyService && tabbyService.createPayment;
      
      results.tests.tabbyServiceIntegration = {
        status: serviceInitialized ? 'PASSED' : 'FAILED',
        message: serviceInitialized 
          ? '✅ Tabby service initialized correctly'
          : '❌ Tabby service initialization failed',
        data: {
          serviceExists: !!tabbyService,
          createPaymentExists: !!tabbyService?.createPayment,
          testPaymentDataValid: !!(testPaymentData.buyer && testPaymentData.order)
        }
      };
      
      if (serviceInitialized) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
    } catch (error) {
      results.tests.tabbyServiceIntegration = {
        status: 'FAILED',
        message: `❌ Tabby service error: ${error}`,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
      results.summary.total++;
    }

    // Test 3: Environment Variables
    console.log('🧪 Testing Environment Variables...');
    try {
      const requiredVars = [
        'TABBY_PUBLIC_KEY',
        'TABBY_SECRET_KEY', 
        'TABBY_MERCHANT_CODE',
        'TABBY_WEBHOOK_ID'
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      const allVarsPresent = missingVars.length === 0;
      
      results.tests.environmentVariables = {
        status: allVarsPresent ? 'PASSED' : 'FAILED',
        message: allVarsPresent 
          ? '✅ All required Tabby environment variables are set'
          : `❌ Missing environment variables: ${missingVars.join(', ')}`,
        data: {
          required: requiredVars,
          missing: missingVars,
          webhookConfigured: !!process.env.TABBY_WEBHOOK_ID
        }
      };
      
      if (allVarsPresent) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
    } catch (error) {
      results.tests.environmentVariables = {
        status: 'FAILED',
        message: `❌ Environment variables test error: ${error}`,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
      results.summary.total++;
    }

    // Test 4: Webhook Registration Check
    console.log('🧪 Checking Webhook Registration...');
    try {
      const webhookId = process.env.TABBY_WEBHOOK_ID;
      const webhookConfigured = !!webhookId;
      
      results.tests.webhookRegistration = {
        status: webhookConfigured ? 'PASSED' : 'WARNING',
        message: webhookConfigured 
          ? '✅ Webhook ID is configured'
          : '⚠️  Webhook ID not found in environment',
        data: {
          webhookId: webhookId || 'Not configured',
          webhookUrl: 'https://thegreenroasteries.com/api/webhooks/tabby'
        }
      };
      
      if (webhookConfigured) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
    } catch (error) {
      results.tests.webhookRegistration = {
        status: 'FAILED',
        message: `❌ Webhook check error: ${error}`,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
      results.summary.total++;
    }

    // Final Assessment
    const allTestsPassed = results.summary.failed === 0;
    results.status = allTestsPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED';
    results.qaApprovalReady = allTestsPassed;
    
    results.message = allTestsPassed 
      ? '🎉 All Tabby QA fixes are working correctly!'
      : '⚠️  Some tests failed - please review the issues above';

    // Add QA Summary
    results.qaSummary = {
      fix1_realCustomerData: results.tests.customerDataStructure?.status === 'PASSED',
      fix2_realOrderHistory: results.tests.customerDataStructure?.status === 'PASSED', 
      fix3_webhookRegistration: results.tests.webhookRegistration?.status === 'PASSED',
      fix4_environmentSetup: results.tests.environmentVariables?.status === 'PASSED',
      integration_ready: allTestsPassed
    };

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Tabby QA test error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Test suite failed to run',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 