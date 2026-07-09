import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';

const DynamicPricing = () => {
  const navigate = useNavigate();

  const handleStartEarning = () => {
    navigate('/directsignup');
  };

  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Dynamic Pricing</h1>
        <h2>We eliminate wait times that kill sales</h2>
        <p className="last-updated">Your POS stays the same, your workflow gets better, your customers skip lines and order from multiple vendors in one transaction. Less waiting = more buying.</p>
        
        <section>
          <h2>Dynamic pricing leads to more revenue</h2>
          <p>Higher visibility gets you found first. We market your business through the platform. Customers come back automatically. More profitable, less work.</p>
          <p><strong>Start your free trial today and see the difference in your first week.</strong></p>
        </section>

        <section>
          <h2>Why Dynamic Pricing?</h2>
          <p>Our dynamic pricing lets customers pay a premium to get their orders faster - without affecting anyone else's promised delivery time.</p>
        </section>

        <section>
          <h2>How it increases your revenue:</h2>
          <ul>
            <li>Customers in a rush pay extra for priority fulfillment</li>
            <li>Your kitchen gets additional revenue per order without extra work</li>
            <li>Existing customers keep their promised times - no one gets pushed back</li>
            <li>You fulfill the same orders, just earn more from time-sensitive customers</li>
          </ul>
          <p><strong>Try it free for 2 months - no credit card required.</strong></p>
        </section>

        <section>
          <h2>Example:</h2>
          <p>Customer sees 15-minute wait, pays $3 extra to get it in 8 minutes. You still deliver everyone else's orders on time, just pocket the premium.</p>
          <p><strong>Join thousands of vendors already earning more with our free trial.</strong></p>
        </section>

        <section>
          <h2>Industry Insight</h2>
          <p>The industry is moving toward premium speed options because customers will pay for convenience. Vendors using priority pricing see 20-30% revenue increases from the same order volume.</p>
          <p><strong>Get started for free and be part of the revenue revolution.</strong></p>
        </section>

        <div className="legal-footer">
          <p><strong>Ready to boost your revenue? Start your free trial today!</strong></p>
          <button 
            className="cta-button"
            onClick={handleStartEarning}
            style={{
              background: '#d4af37',
              color: '#0a0a0a',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '20px',
              transition: 'all 0.3s ease'
            }}
          >
            Get Started for Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicPricing;
