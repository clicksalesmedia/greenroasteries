import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../../lib/email';

// POST /api/brevo/setup - Set up Brevo lists and test integration
export async function POST(request: NextRequest) {
  try {
    const { action, testEmail } = await request.json();

    if (action === 'setup-lists') {
      console.log('🔄 Setting up Brevo lists...');
      
      const listsToCreate = [
        'Customers',
        'Leads',
        'Leads - LEAD',
        'Leads - PROSPECT', 
        'Leads - QUALIFIED',
        'Leads - CONVERTED',
        'Leads - ABANDONED',
        'Leads - LOST'
      ];

      const results = {
        listsCreated: [] as string[],
        listsExisting: [] as string[],
        errors: [] as string[]
      };

      for (const listName of listsToCreate) {
        try {
          console.log(`📋 Creating/checking list: ${listName}`);
          const listId = await emailService.getOrCreateList(listName);
          
          if (listId) {
            // Check if list was newly created by checking if it exists
            const allLists = await emailService.getAllLists();
            const existingList = allLists.find(list => list.id === listId);
            
            if (existingList) {
              if (existingList.totalSubscribers === 0) {
                results.listsCreated.push(listName);
              } else {
                results.listsExisting.push(listName);
              }
            }
          } else {
            results.errors.push(`Failed to create list: ${listName}`);
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          const errorMsg = `Error creating list ${listName}: ${error}`;
          results.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      return NextResponse.json({
        message: 'Brevo lists setup completed',
        results
      });

    } else if (action === 'test-integration' && testEmail) {
      console.log(`🧪 Testing Brevo integration with email: ${testEmail}`);
      
      const testResults = {
        contactCreated: false,
        listsAdded: [] as string[],
        errors: [] as string[]
      };

      try {
        // Test creating a contact
        const success = await emailService.addLeadToBrevo({
          email: testEmail,
          fullName: 'Test User',
          phone: '+971501234567',
          city: 'Dubai',
          emirate: 'Dubai',
          status: 'LEAD',
          leadScore: 10,
          cartValue: 100
        });

        if (success) {
          testResults.contactCreated = true;
          testResults.listsAdded.push('Leads', 'Leads - LEAD');
          console.log('✅ Test contact created successfully');
        } else {
          testResults.errors.push('Failed to create test contact');
        }

      } catch (error) {
        testResults.errors.push(`Test error: ${error}`);
        console.error('❌ Test failed:', error);
      }

      return NextResponse.json({
        message: 'Brevo integration test completed',
        results: testResults
      });

    } else if (action === 'get-status') {
      console.log('📊 Getting Brevo status...');
      
      try {
        const lists = await emailService.getAllLists();
        
        return NextResponse.json({
          message: 'Brevo status retrieved',
          results: {
            isConfigured: lists.length > 0,
            totalLists: lists.length,
            lists: lists.map(list => ({
              id: list.id,
              name: list.name,
              totalSubscribers: list.totalSubscribers,
              createdAt: list.createdAt
            }))
          }
        });

      } catch (error) {
        return NextResponse.json({
          message: 'Failed to get Brevo status',
          error: String(error)
        }, { status: 500 });
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "setup-lists", "test-integration", or "get-status"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Brevo setup error:', error);
    return NextResponse.json(
      { error: 'Failed to execute Brevo setup' },
      { status: 500 }
    );
  }
}

// GET /api/brevo/setup - Get current Brevo configuration status
export async function GET(request: NextRequest) {
  try {
    const lists = await emailService.getAllLists();
    
    const expectedLists = [
      'Customers',
      'Leads',
      'Leads - LEAD',
      'Leads - PROSPECT',
      'Leads - QUALIFIED',
      'Leads - CONVERTED',
      'Leads - ABANDONED',
      'Leads - LOST'
    ];

    const existingListNames = lists.map(list => list.name);
    const missingLists = expectedLists.filter(name => !existingListNames.includes(name));

    return NextResponse.json({
      isConfigured: missingLists.length === 0,
      totalLists: lists.length,
      expectedLists: expectedLists.length,
      missingLists,
      lists: lists.map(list => ({
        id: list.id,
        name: list.name,
        totalSubscribers: list.totalSubscribers,
        uniqueSubscribers: list.uniqueSubscribers,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error getting Brevo configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get Brevo configuration' },
      { status: 500 }
    );
  }
} 