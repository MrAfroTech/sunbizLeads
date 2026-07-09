import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <h2>SeamlessUI Privacy Policy</h2>
        <p className="last-updated">Effective Date: August 25, 2025</p>
        
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information necessary to provide marketplace and POS integration services:</p>
          <ul>
            <li>Business information (name, address, contact details)</li>
            <li>Menu data and pricing information</li>
            <li>Transaction data for order processing</li>
            <li>Usage analytics to improve service performance</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Process and fulfill customer orders</li>
            <li>Synchronize data with your Clover POS system</li>
            <li>Provide customer support and technical assistance</li>
            <li>Improve platform functionality and user experience</li>
            <li>Comply with legal and regulatory requirements</li>
          </ul>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>We share information only as necessary:</p>
          <ul>
            <li>With Clover for POS integration functionality</li>
            <li>With payment processors for transaction handling</li>
            <li>With customers for order fulfillment</li>
            <li>As required by law or legal process</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures including encryption, secure data transmission, and access controls to protect your information.</p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>We retain business data for the duration of your service agreement plus 7 years for tax and regulatory compliance purposes.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and update your business information</li>
            <li>Request data deletion upon service termination</li>
            <li>Opt out of non-essential communications</li>
            <li>Receive copies of your data</li>
          </ul>
        </section>

        <section>
          <h2>7. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to maintain login sessions and analyze platform usage for service improvements.</p>
        </section>

        <section>
          <h2>8. Third-Party Services</h2>
          <p>Our platform integrates with Clover and other third-party services, each governed by their respective privacy policies.</p>
        </section>

        <section>
          <h2>9. Changes to Policy</h2>
          <p>We will notify you of material changes to this Privacy Policy via email and platform notifications.</p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p><strong>Email:</strong> team@ezdrink.us</p>
        </section>

        <div className="legal-footer">
          <p>By using SeamlessUI, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

