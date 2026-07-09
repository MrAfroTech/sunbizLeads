import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>End User License Agreement (EULA)</h1>
        <h2>SeamlessUI End User License Agreement</h2>
        <p className="last-updated">Effective Date: August 25, 2025</p>
        
        <section>
          <h2>1. Agreement</h2>
          <p>This End User License Agreement ("Agreement") governs your use of SeamlessUI ("Software") provided by Southeast Consulting ("Company"). By installing or using the Software, you agree to these terms.</p>
        </section>

        <section>
          <h2>2. License Grant</h2>
          <p>Company grants you a non-exclusive, revocable license to use SeamlessUI in connection with your Clover POS system for commercial food and beverage operations.</p>
        </section>

        <section>
          <h2>3. Permitted Use</h2>
          <p>You may use SeamlessUI to manage online orders, synchronize menu data, and process customer transactions through the integrated marketplace platform.</p>
        </section>

        <section>
          <h2>4. Restrictions</h2>
          <p>You may not: (a) modify or reverse engineer the Software; (b) share access credentials; (c) use the Software for unlawful purposes; (d) interfere with the Software's operation.</p>
        </section>

        <section>
          <h2>5. Data and Privacy</h2>
          <p>You retain ownership of your business data. Company processes data according to our Privacy Policy to provide services and maintain platform functionality.</p>
        </section>

        <section>
          <h2>6. Payment Terms</h2>
          <p>Fees are as specified in your subscription agreement. Payments are non-refundable except as required by law.</p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>Either party may terminate this Agreement with 30 days' notice. Upon termination, your access to the Software will cease.</p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>Company's liability is limited to the amount paid for the Software in the preceding 12 months. Company is not liable for indirect or consequential damages.</p>
        </section>

        <section>
          <h2>9. Support</h2>
          <p>Technical support is provided during business hours via email and phone as specified in the Software documentation.</p>
        </section>

        <section>
          <h2>10. Contact Information</h2>
          <p>If you have any questions about this Agreement, please contact us at:</p>
          <p><strong>Email:</strong> team@ezdrink.us</p>
        </section>

        <div className="legal-footer">
          <p>By using SeamlessUI, you acknowledge that you have read, understood, and agree to be bound by this End User License Agreement.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
