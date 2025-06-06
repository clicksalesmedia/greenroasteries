#!/usr/bin/env node

const fetch = require('node-fetch');

async function checkMissingOrders() {
  console.log('Checking for missing orders from succeeded Stripe payments...\n');
  
  try {
    // Check incomplete payments
    const incompleteResponse = await fetch('https://thegreenroasteries.com/api/payments/check-incomplete');
    const incompleteData = await incompleteResponse.json();
    
    console.log(`Found ${incompleteData.total} incomplete payments`);
    console.log(`Status breakdown:`, incompleteData.summary.byStatus);
    
    // Check for succeeded payments without orders by querying Stripe directly
    // This would need to be implemented in a more comprehensive way
    console.log('\nTo check for succeeded payments without orders:');
    console.log('1. Run this periodically (e.g., every hour)');
    console.log('2. Check Stripe dashboard for succeeded payments');
    console.log('3. Use the /api/payments/recover-missing endpoint to recover any missing orders');
    
    if (incompleteData.incompletePayments && incompleteData.incompletePayments.length > 0) {
      console.log('\nRecent incomplete payments:');
      incompleteData.incompletePayments.slice(0, 5).forEach(payment => {
        console.log(`- ${payment.id}: ${payment.customer.email} - ${payment.amount} ${payment.currency} - ${payment.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking missing orders:', error);
  }
}

// Run the check
checkMissingOrders(); 