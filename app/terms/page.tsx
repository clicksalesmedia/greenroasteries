'use client';

export default function TermsPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Please read these terms and conditions carefully before using our website and services.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Green Roasteries. These Terms & Conditions govern your use of our website 
              located at www.greenroasteries.com (the "Website") and all related services offered by 
              Green Roasteries ("we," "us," or "our").
            </p>
            <p>
              By accessing our Website and purchasing our products, you agree to be bound by these 
              Terms & Conditions and our Privacy Policy. If you do not agree with any part of these 
              terms, please do not use our Website or services.
            </p>

            <h2>2. Use of Our Website</h2>
            <p>
              You may use our Website for lawful purposes only and in accordance with these Terms & Conditions. 
              You agree not to use our Website:
            </p>
            <ul>
              <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," or "spam."</li>
              <li>To impersonate or attempt to impersonate Green Roasteries, a Green Roasteries employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Website, or which may harm Green Roasteries or users of the Website.</li>
            </ul>

            <h2>3. Products and Services</h2>
            <p>
              All products displayed on our Website are subject to availability. We reserve the right to 
              discontinue any product at any time. Prices for our products are subject to change without 
              notice. We shall not be liable to you or to any third party for any modification, suspension, 
              or discontinuance of any product.
            </p>
            <p>
              We have made every effort to display as accurately as possible the colors and images of our 
              products. We cannot guarantee that your computer monitor's display of any color will be accurate.
            </p>

            <h2>4. Orders and Payment</h2>
            <p>
              When you place an order on our Website, you are making an offer to purchase our products. 
              All orders are subject to acceptance and availability. We reserve the right to refuse any order 
              you place with us.
            </p>
            <p>
              Payment must be made in full at the time of ordering. We accept various payment methods as 
              indicated on our Website. By submitting your payment information, you represent and warrant 
              that you have the legal right to use any payment method(s) utilized.
            </p>

            <h2>5. Shipping and Delivery</h2>
            <p>
              Shipping costs are calculated during checkout based on weight, dimensions, and destination. 
              Delivery times are estimates and commence from the date of shipping, rather than the date of order.
            </p>
            <p>
              Green Roasteries is not liable for any delays in delivery that are beyond our control, including 
              but not limited to delays caused by shipping carriers, weather conditions, or customs processing.
            </p>

            <h2>6. Intellectual Property Rights</h2>
            <p>
              The Website and its entire contents, features, and functionality (including but not limited to all 
              information, software, text, displays, images, video, and audio) are owned by Green Roasteries, 
              its licensors, or other providers of such material and are protected by copyright, trademark, 
              patent, trade secret, and other intellectual property laws.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall Green Roasteries, its directors, employees, partners, agents, suppliers, or 
              affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
              resulting from your access to or use of or inability to access or use the Website.
            </p>

            <h2>8. Changes to Terms & Conditions</h2>
            <p>
              We may revise these Terms & Conditions from time to time. The most current version will always be posted 
              on our Website. By continuing to access or use our Website after those revisions become effective, 
              you agree to be bound by the revised terms.
            </p>

            <h2>9. Contact Information</h2>
            <p>
              Questions about the Terms & Conditions should be sent to us at info@greenroasteries.com or through 
              our Contact page.
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