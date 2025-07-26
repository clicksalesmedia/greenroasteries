import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { emailService } from '../../../lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/test-lead-collection - Test the enhanced lead collection system
 * 
 * This endpoint demonstrates how the enhanced lead collection system works
 * and provides examples of different lead scenarios.
 */
export async function POST(request: NextRequest) {
  try {
    const results = {
      tests: [] as any[],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0
      }
    };

    // Test scenarios
    const testScenarios = [
      {
        name: 'Contact Form Lead',
        data: {
          name: 'Ahmed Al-Rashid',
          email: 'ahmed.test@example.com',
          phone: '+971501234567',
          source: 'contact_form',
          message: 'Interested in your premium coffee blends'
        }
      },
      {
        name: 'Newsletter Signup with Location',
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.test@example.com',
          source: 'newsletter',
          city: 'Dubai',
          emirate: 'Dubai'
        }
      },
      {
        name: 'Abandoned Cart Lead',
        data: {
          name: 'Mohammed Hassan',
          email: 'mohammed.test@example.com',
          phone: '+971507654321',
          source: 'abandoned_cart',
          cartValue: 285.50,
          city: 'Abu Dhabi',
          emirate: 'Abu Dhabi'
        }
      },
      {
        name: 'Landing Page Lead',
        data: {
          name: 'Fatima Al-Zahra',
          email: 'fatima.test@example.com',
          source: 'landing_page',
          city: 'Sharjah',
          emirate: 'Sharjah',
          address: '123 Coffee Street, Al Majaz'
        }
      },
      {
        name: 'Update Existing Lead',
        data: {
          name: 'Ahmed Al-Rashid',
          email: 'ahmed.test@example.com', // Same email as first test
          phone: '+971501234567',
          source: 'checkout',
          city: 'Dubai',
          emirate: 'Dubai',
          cartValue: 150.00
        }
      }
    ];

    // Run test scenarios
    for (const scenario of testScenarios) {
      results.summary.totalTests++;
      
      try {
        // Call the lead collection API
        const leadResponse = await fetch(`${request.nextUrl.origin}/api/leads/collect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Test-Agent/1.0',
            'referer': 'https://thegreenroasteries.com/test'
          },
          body: JSON.stringify(scenario.data)
        });

        const leadResult = await leadResponse.json();

        if (leadResponse.ok) {
          results.tests.push({
            scenario: scenario.name,
            status: 'PASSED',
            data: scenario.data,
            result: {
              success: leadResult.success,
              leadId: leadResult.lead?.id,
              leadStatus: leadResult.lead?.status,
              leadScore: leadResult.lead?.leadScore,
              message: leadResult.message
            }
          });
          results.summary.passed++;
        } else {
          results.tests.push({
            scenario: scenario.name,
            status: 'FAILED',
            data: scenario.data,
            error: leadResult.error || 'Unknown error'
          });
          results.summary.failed++;
        }

      } catch (error) {
        results.tests.push({
          scenario: scenario.name,
          status: 'ERROR',
          data: scenario.data,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    // Get lead statistics
    const statsResponse = await fetch(`${request.nextUrl.origin}/api/leads/collect?days=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const statsResult = await statsResponse.json();

    // Get current lead count from database
    const leadCount = await prisma.customerLead.count({
      where: {
        email: {
          contains: 'test@example.com'
        }
      }
    });

    // Check Brevo integration status
    let brevoStatus = 'Not configured';
    try {
      const brevoLists = await emailService.getAllLists();
      brevoStatus = brevoLists.length > 0 ? 'Connected' : 'No lists found';
    } catch (error) {
      brevoStatus = 'Connection error';
    }

    return NextResponse.json({
      message: 'Lead collection system test completed',
      testResults: results,
      currentStats: statsResult,
      databaseStatus: {
        testLeadsInDatabase: leadCount,
        message: leadCount > 0 ? 'Test leads found in database' : 'No test leads found'
      },
      brevoIntegration: {
        status: brevoStatus,
        message: brevoStatus === 'Connected' ? 'Brevo integration is working' : 'Check Brevo configuration'
      },
      systemStatus: {
        leadCollection: results.summary.passed > 0 ? 'WORKING' : 'FAILED',
        databaseIntegration: 'WORKING',
        brevoIntegration: brevoStatus === 'Connected' ? 'WORKING' : 'CHECK_CONFIG'
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test-lead-collection - Get test system status
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const leadCount = await prisma.customerLead.count();
    
    // Check Brevo integration
    let brevoStatus = 'Not configured';
    let brevoLists: any[] = [];
    try {
      brevoLists = await emailService.getAllLists();
      brevoStatus = brevoLists.length > 0 ? 'Connected' : 'No lists found';
    } catch (error) {
      brevoStatus = 'Connection error';
    }

    // Get recent leads for testing
    const recentLeads = await prisma.customerLead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        source: true,
        leadScore: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      system: {
        databaseConnection: 'WORKING',
        brevoIntegration: brevoStatus,
        totalLeads: leadCount,
        leadCollectionAPI: 'READY'
      },
      brevoLists: brevoLists.map(list => ({
        id: list.id,
        name: list.name,
        subscribers: list.totalSubscribers
      })),
      recentLeads,
      endpoints: {
        collectLead: '/api/leads/collect',
        viewLeads: '/api/leads',
        leadStats: '/api/leads/collect?days=30',
        testSystem: '/api/test-lead-collection'
      }
    });

  } catch (error) {
    console.error('System check error:', error);
    return NextResponse.json(
      { 
        error: 'System check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 