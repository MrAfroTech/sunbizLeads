import React from 'react';
import '../styles/POSIntegrationSection.css';

const POSIntegrationSection = () => {
  const posPartners = [
    'Square',
    'Stripe', 
    'PayPal',
    'Clover',
    'Lightspeed',
    'Shopify',
    'SumUp'
  ];

  return (
    <section className="pos-integration-section">
      <div className="pos-container">
        <div className="pos-header">
          <h2 className="pos-title">Integrates with leading POS systems</h2>
          <p className="pos-subtitle">
            Seamless works with the tools you already use. No disruption to your existing workflow.
          </p>
        </div>
        
        <div className="pos-logos">
          {posPartners.map((partner, index) => (
            <div key={index} className="pos-logo-item">
              <div className="logo-container">
                <div className="logo-fallback">
                  {partner}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pos-features">
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <h3>Service Standardization</h3>
            <p>Consistent service delivery across all channels</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔄</div>
            <h3>Real-time Sync</h3>
            <p>Orders sync instantly with your POS</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3>Average Order Value</h3>
            <p>Track and optimize customer spending patterns</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default POSIntegrationSection;
