'use client';

export default function RefundPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            We want you to be completely satisfied with your purchase. Please read our refund policy below.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg">
            <h2>1. Satisfaction Guarantee</h2>
            <p>
              At Green Roasteries, we take pride in the quality of our coffee products. We want you to be completely 
              satisfied with your purchase. If for any reason you are not 100% satisfied, we offer a straightforward 
              refund policy as detailed below.
            </p>

            <h2>2. Return Eligibility</h2>
            <p>
              To be eligible for a return, please ensure that:
            </p>
            <ul>
              <li>The request is made within 14 days of receiving your order</li>
              <li>The product is in its original packaging</li>
              <li>The product is unused (except in cases where the product is defective)</li>
              <li>You have proof of purchase (order number, receipt, or confirmation email)</li>
            </ul>

            <h2>3. Non-Returnable Items</h2>
            <p>
              The following items cannot be returned:
            </p>
            <ul>
              <li>Products that have been opened, unless they are defective</li>
              <li>Gift cards</li>
              <li>Downloadable products</li>
              <li>Custom or personalized orders</li>
              <li>Products marked as final sale or clearance</li>
            </ul>

            <h2>4. Return Process</h2>
            <p>
              To initiate a return, please follow these steps:
            </p>
            <ol>
              <li>Contact our customer service team at returns@greenroasteries.com or call +971 (50) 123-4567</li>
              <li>Provide your order number and details about the item(s) you wish to return</li>
              <li>Our team will provide you with a Return Authorization Number (RA#) and instructions for shipping the item back</li>
              <li>Package the item securely in its original packaging if possible</li>
              <li>Include the RA# on the outside of the package</li>
              <li>Ship the item to the address provided by our customer service team</li>
            </ol>

            <h2>5. Refund Processing</h2>
            <p>
              Once we receive and inspect your return, we will notify you about the status of your refund:
            </p>
            <ul>
              <li>If approved, your refund will be processed immediately</li>
              <li>The refund will be issued to the original payment method used for the purchase</li>
              <li>Depending on your payment provider, it may take 5-10 business days for the refund to appear in your account</li>
            </ul>

            <h2>6. Return Shipping</h2>
            <p>
              Shipping costs for returns are the responsibility of the customer, except in cases where the product 
              is defective or was shipped incorrectly. If the return is due to our error (you received an incorrect 
              or defective item), we will cover the return shipping costs.
            </p>

            <h2>7. Damaged or Defective Products</h2>
            <p>
              If you receive a damaged or defective product, please contact us within 48 hours of receiving your order. 
              Please provide photos of the damaged products and packaging to expedite the process. We will arrange for 
              a replacement or issue a full refund including any shipping costs.
            </p>

            <h2>8. Exchanges</h2>
            <p>
              We do not offer direct exchanges. If you would like to exchange an item, please return the unwanted 
              item following our return process and place a new order for the desired item.
            </p>

            <h2>9. Late or Missing Refunds</h2>
            <p>
              If you haven't received your refund within the timeframe mentioned above, please check your bank account 
              again, and then contact your credit card company or bank as it may take some time for the refund to be 
              officially posted. If you've done this and still have not received your refund, please contact our 
              customer service team.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately 
              upon posting to the Website. It is your responsibility to review this policy periodically.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us:
            </p>
            <p>
              Email: returns@greenroasteries.com<br />
              Phone: +971 (50) 123-4567<br />
              Address: 123 Coffee St, Brewing District, Dubai, UAE
            </p>

            <div className="border-t border-gray-200 pt-8 mt-8">
              <p className="text-sm text-gray-500">
                Last Updated: May 15, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 