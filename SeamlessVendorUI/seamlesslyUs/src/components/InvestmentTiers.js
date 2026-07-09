import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/InvestmentTiers.css';

const InvestmentTiers = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Fade in animation for elements
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  return (
    <div className="content-page">
      <div className="page-header dark">
        <div className="gradient-overlay"></div>
        <div className="header-content">
          <h1 className="fade-in">Strategic Partnership Opportunities Available</h1>
          <p className="fade-in">Join Us in Transforming Customer Experiences</p>
        </div>
      </div>
      
      <div className="page-container">
        <section className="content-section fade-in">
          <h2>Partnership Opportunities in Hospitality Technology</h2>
          <p className="intro-text">
            <strong>We're growing steadily and offering strategic partnership opportunities.</strong> We're seeking aligned partners who share our vision of transforming hospitality experiences. <strong>Limited equity available to maintain focused ownership and execution.</strong> Your investment accelerates our mission to help venues succeed while maintaining the operational control needed for focused growth.
          </p>
        </section>
        
        <section className="content-section fade-in">
          <h2>Investment Tiers - Maximum 20% Total Equity</h2>
          
          <div className="investment-tiers">
            <div className="tier-card tier-1">
              <div className="tier-header">
                <h3>Tier 1 - Ground Floor</h3>
                <div className="tier-badge">Limited Availability</div>
              </div>
              <div className="tier-investment">
                <div className="investment-amount">$1,250</div>
                <div className="equity-amount">0.1% Equity</div>
              </div>
              <div className="tier-details">
                <p><strong>Target:</strong> Individual investors, early believers</p>
                <p><strong>Tagline:</strong> "Your foot in the door"</p>
                <p><strong>Availability:</strong> Limited to first 100 investors (10% total equity max)</p>
              </div>
              <Link to="/investor-scheduling" className="tier-button">Invest Now</Link>
            </div>
            
            <div className="tier-card tier-2">
              <div className="tier-header">
                <h3>Tier 2 - Strategic Partner</h3>
                <div className="tier-badge">Exclusive</div>
              </div>
              <div className="tier-investment">
                <div className="investment-amount">$11,000</div>
                <div className="equity-amount">1% Equity</div>
              </div>
              <div className="tier-details">
                <p><strong>Target:</strong> Serious investors, small funds</p>
                <p><strong>Tagline:</strong> "Meaningful stake in the future"</p>
                <p><strong>Availability:</strong> Maximum 10 strategic partners (10% total equity max)</p>
              </div>
              <Link to="/investor-scheduling" className="tier-button">Invest Now</Link>
            </div>
            
            <div className="tier-card tier-3">
              <div className="tier-header">
                <h3>Tier 3 - Industry Transformer</h3>
                <div className="tier-badge">Ultra-Exclusive</div>
              </div>
              <div className="tier-investment">
                <div className="investment-amount">$98,000</div>
                <div className="equity-amount">10% Equity</div>
                <div className="equity-note">(after EBITDA positive)</div>
              </div>
              <div className="tier-details">
                <p><strong>Target:</strong> Major investors, venture funds</p>
                <p><strong>Tagline:</strong> "Maximum available equity stake"</p>
                <p><strong>Availability:</strong> Only ONE major stakeholder (10% equity)</p>
                <p><strong>Special Note:</strong> Equity vests after EBITDA profitability</p>
              </div>
              <Link to="/investor-scheduling" className="tier-button">Invest Now</Link>
            </div>
          </div>
        </section>
        
        <section className="content-section fade-in">
          <h2>Mathematical Reality - Investment Calculator</h2>
          
          <div className="investment-calculator">
            <div className="calculator-section">
              <h3>Total Available: 20%</h3>
              <div className="calculation-grid">
                <div className="calculation-item">
                  <h4>If all Tier 1 slots fill:</h4>
                  <p>$125,000 raised (10% equity)</p>
                </div>
                <div className="calculation-item">
                  <h4>If all Tier 2 slots fill:</h4>
                  <p>$110,000 raised (10% equity)</p>
                </div>
                <div className="calculation-item">
                  <h4>Tier 3 single investor:</h4>
                  <p>$98,000 (10% equity)</p>
                </div>
              </div>
              <div className="total-cap">
                <h3>Maximum Possible Raise: $333,000 for 30%</h3>
                <p><strong>BUT WE'RE CAPPING AT 20%</strong></p>
                <p><em>Investment tiers are subject to availability. Total equity available to all external investors is capped at 20%. First come, first served basis.</em></p>
                <p><strong>When 20% is allocated, investment closes permanently.</strong></p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="content-section dark-section fade-in">
          <h2>Strategic Investment Approach</h2>
          <p className="intro-text">
            We're accelerating growth through strategic partnerships. Looking for investors who believe in improving hospitality experiences. When our partnership goals are met, we'll focus on execution and growth.
          </p>
          
          <div className="exclusivity-points">
            <div className="exclusivity-item">
              <h3>Aligned Partnership Focus</h3>
              <p>We're seeking partners who share our vision of transforming hospitality experiences, not just financial returns. We value strategic alignment over just capital.</p>
            </div>
            
            <div className="exclusivity-item">
              <h3>Focused Growth Strategy</h3>
              <p>Once we reach our partnership targets, we'll focus on execution and scaling. This ensures we can deliver on our promises to venues and customers.</p>
            </div>
            
            <div className="exclusivity-item">
              <h3>Maintaining Execution Focus</h3>
              <p>We maintain majority ownership to ensure we can execute our vision effectively. This focused approach benefits all stakeholders in the long term.</p>
            </div>
          </div>
        </section>
        
        <section className="content-section cta-section fade-in">
          <h2>Ready to Partner with Seamless?</h2>
          <p><strong>Join us in transforming hospitality experiences. Investment tiers are subject to availability. Total equity available to all external investors is capped at 20% to maintain focused execution.</strong></p>
          <div className="cta-buttons">
            <button className="primary-button large">Schedule Partnership Discussion</button>
            <button className="secondary-button large">Download Investment Materials</button>
          </div>
          <p className="guarantee">Due diligence materials available upon request. Accredited investors only.</p>
        </section>
      </div>
    </div>
  );
};

export default InvestmentTiers;
