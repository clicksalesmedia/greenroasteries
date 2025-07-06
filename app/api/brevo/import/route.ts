import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { emailService } from '../../../../lib/email';

const prisma = new PrismaClient();

// POST /api/brevo/import - Import existing customers and leads to Brevo
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();

    if (!type || !['customers', 'leads', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "customers", "leads", or "all"' },
        { status: 400 }
      );
    }

    const results = {
      customersImported: 0,
      leadsImported: 0,
      errors: [] as string[]
    };

    // Import customers if requested
    if (type === 'customers' || type === 'all') {
      console.log('🔄 Starting customer import to Brevo...');
      
      try {
        // Get all customers with their order statistics
        const customers = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER'
          },
          include: {
            orders: {
              where: {
                status: {
                  in: ['DELIVERED', 'SHIPPED', 'PROCESSING']
                }
              },
              select: {
                total: true,
                createdAt: true
              }
            }
          }
        });

        console.log(`📊 Found ${customers.length} customers to import`);

        for (const customer of customers) {
          try {
            const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
            const orderCount = customer.orders.length;
            const lastPurchaseDate = customer.orders.length > 0 
              ? new Date(Math.max(...customer.orders.map(o => new Date(o.createdAt).getTime())))
              : undefined;

            const success = await emailService.addCustomerToBrevo({
              email: customer.email,
              name: customer.name || 'Unknown',
              phone: customer.phone as string | undefined,
              city: undefined, // We might not have this data for existing customers
              emirate: undefined,
              totalSpent,
              orderCount,
              lastPurchaseDate
            });

            if (success) {
              results.customersImported++;
              console.log(`✅ Imported customer: ${customer.email}`);
            } else {
              results.errors.push(`Failed to import customer: ${customer.email}`);
              console.error(`❌ Failed to import customer: ${customer.email}`);
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            const errorMsg = `Error importing customer ${customer.email}: ${error}`;
            results.errors.push(errorMsg);
            console.error('❌', errorMsg);
          }
        }

        console.log(`✅ Customer import completed: ${results.customersImported}/${customers.length}`);

      } catch (error) {
        const errorMsg = `Error fetching customers: ${error}`;
        results.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    // Import leads if requested
    if (type === 'leads' || type === 'all') {
      console.log('🔄 Starting leads import to Brevo...');
      
      try {
        const leads = await prisma.customerLead.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log(`📊 Found ${leads.length} leads to import`);

        for (const lead of leads) {
          try {
            const success = await emailService.addLeadToBrevo({
              email: lead.email,
              fullName: lead.fullName,
              phone: lead.phone || undefined,
              city: lead.city || undefined,
              emirate: lead.emirate || undefined,
              status: lead.status,
              leadScore: lead.leadScore || 0,
              cartValue: lead.cartValue || undefined
            });

            if (success) {
              results.leadsImported++;
              console.log(`✅ Imported lead: ${lead.email}`);
            } else {
              results.errors.push(`Failed to import lead: ${lead.email}`);
              console.error(`❌ Failed to import lead: ${lead.email}`);
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            const errorMsg = `Error importing lead ${lead.email}: ${error}`;
            results.errors.push(errorMsg);
            console.error('❌', errorMsg);
          }
        }

        console.log(`✅ Leads import completed: ${results.leadsImported}/${leads.length}`);

      } catch (error) {
        const errorMsg = `Error fetching leads: ${error}`;
        results.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results
    });

  } catch (error) {
    console.error('Brevo import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data to Brevo' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/brevo/import - Check import status and get statistics
export async function GET(request: NextRequest) {
  try {
    // Get current statistics
    const [customerCount, leadCount] = await Promise.all([
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.customerLead.count()
    ]);

    // Get Brevo lists to check current status
    const lists = await emailService.getAllLists();

    return NextResponse.json({
      statistics: {
        totalCustomers: customerCount,
        totalLeads: leadCount
      },
      brevoLists: lists.map(list => ({
        id: list.id,
        name: list.name,
        totalSubscribers: list.totalSubscribers,
        createdAt: list.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting import status:', error);
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 