import React from 'react';
import '../styles/MobileMadness.css';

const MobileMadness = () => {
  return (
    <div className="mobile-madness-page">
            
      {/* Financial Pain Points Section */}
      <section className="pain-points-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Financial Bleeding</span>
          </h2>
          
          <div className="pain-points-grid">
            <div className="pain-point-card">
              
              <h3>Commission Fees: </h3>
              <h3>15-30% Per Order</h3>
              <p>
                DoorDash and Uber Eats charge up to <strong>30% commission</strong> on every order. 
                Some reports show DoorDash charging up to <strong>40%</strong> in high-demand areas. 
                That's nearly $3 out of every $10 in revenue gone before you see a penny.
              </p>
              <div className="cost-highlight">
                <strong>Real Impact:</strong> $50,000 in evenue = $15,000 in commissions
              </div>
            </div>
            
            <div className="pain-point-card">
              
              <h3>Additional</h3>
              <h3>Hidden Fees</h3>
              <p>
                Beyond base commissions, platforms charge marketing fees, service fees, 
                & ayment processing fees. These stack on top of your commission, 
                often adding another 5-10% to your costs. All these fees and no control 
                over the driver, quality, and final delivery
              </p>
              <div className="cost-highlight">
                <strong>Hidden Cost:</strong> Marketing fees alone can add $2,000+ monthly
              </div>
            </div>
            
            <div className="pain-point-card">
              
              <h3>Vulnerability To </h3>
              <h3>Policy Changes</h3>
              <p>
                Platforms can increase commission rates at any time without warning. 
                You have no control over your pricing structure or profit margins. 
                One policy change can devastate your already thin margins. You got in 
                business to maintain control not lose it
              </p>
              <div className="cost-highlight">
                <strong>Risk:</strong> Your entire delivery revenue depends on platform goodwill
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Data Loss Section */}
      <section className="data-loss-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Your Customers, Their Data</span>
          </h2>
          
          <div className="data-loss-content">
            <div className="data-loss-text">
              <h3>The Customer Relationship Theft</h3>
              <p>
                When customers order through third-party platforms, <strong>you lose them forever</strong>. 
                You have no access to their email addresses, phone numbers, or ordering patterns. 
                You can't build loyalty programs, send promotions, or create repeat business.
              </p>
              
              <div className="data-points">
                <div className="data-point">
                  <div className="data-icon">❌</div>
                  <div className="data-text">
                    <strong>No Customer Emails:</strong> Can't build your email list or send direct promotions
                  </div>
                </div>
                <div className="data-point">
                  <div className="data-icon">❌</div>
                  <div className="data-text">
                    <strong>No Order History:</strong> Can't track preferences or suggest repeat orders
                  </div>
                </div>
                <div className="data-point">
                  <div className="data-icon">❌</div>
                  <div className="data-text">
                    <strong>No Loyalty Programs:</strong> Can't reward repeat customers or build brand loyalty
                  </div>
                </div>
              </div>
              
              <div className="legal-note">
                <strong>Recent Legal Ruling:</strong> In September 2024, a federal court struck down NYC's law 
                requiring platforms to share customer data with restaurants. The platforms keep your customer 
                information locked away forever.
              </div>
            </div>
            
            <div className="data-visual">
              <div className="customer-flow">
                <div className="flow-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Customer finds your restaurant on DoorDash/Uber Eats</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">2</div>
                  <div className="step-text">They place an order through the platform</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step lost">
                  <div className="step-number">3</div>
                  <div className="step-text">Platform keeps all customer data - you get nothing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Damage Section */}
      <section className="brand-damage-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Brand Damage You Can't Control</span>
          </h2>
          
          <div className="brand-damage-grid">
            <div className="damage-card">
              <div className="damage-icon">🚚</div>
              <h3>Delivery Quality Issues Reflect on You</h3>
              <p>
                When delivery drivers are late, food arrives cold, or orders are wrong, 
                customers blame <strong>your restaurant</strong>, not the platform. 
                Your reputation suffers for issues completely outside your control.
              </p>
            </div>
            
            <div className="damage-card">
              <div className="damage-icon">😤</div>
              <h3>No Direct Communication</h3>
              <p>
                You can't explain specials, apologize for delays, or build emotional connections 
                with customers. Every interaction is filtered through the platform, 
                making your brand feel cold and impersonal.
              </p>
            </div>
            
            <div className="damage-card">
              <div className="damage-icon">🏷️</div>
              <h3>Commoditization Risk</h3>
              <p>
                On platforms, you're just another restaurant listing. Customers choose based on 
                price and ratings, not brand loyalty. You become interchangeable with competitors, 
                losing your unique value proposition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="solution-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Take Back Control</span>
          </h2>
          
          <div className="solution-content">
            <div className="solution-text">
              <h3>Own Your Customers. Own Your Data. Own Your Profits.</h3>
              <p>
                With Seamless, you keep 100% of your revenue while building direct relationships 
                with every customer. No more paying competitors to steal your customers.
              </p>
              
              <div className="solution-benefits">
                <div className="benefit-item">
                  <div className="benefit-icon">💯</div>
                  <div className="benefit-text">
                    <strong>Keep 100% of Revenue:</strong> No commission fees, no hidden costs
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📧</div>
                  <div className="benefit-text">
                    <strong>Own Customer Data:</strong> Build email lists, track preferences, create loyalty programs
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🎯</div>
                  <div className="benefit-text">
                    <strong>Direct Relationships:</strong> Communicate directly with customers, build brand loyalty
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <div className="benefit-text">
                    <strong>Instant Integration:</strong> Works with your existing POS system
                  </div>
                </div>
              </div>
            </div>
            
            <div className="solution-visual">
              <div className="comparison-chart">
                <div className="chart-header">
                  <h4>Platform vs. Seamless</h4>
                </div>
                <div className="chart-row">
                  <div className="chart-label">Commission Fees</div>
                  <div className="chart-value platform">30%</div>
                  <div className="chart-value seamless">0%</div>
                </div>
                <div className="chart-row">
                  <div className="chart-label">Customer Data</div>
                  <div className="chart-value platform">❌ None</div>
                  <div className="chart-value seamless">✅ All</div>
                </div>
                <div className="chart-row">
                  <div className="chart-label">Direct Communication</div>
                  <div className="chart-value platform">❌ No</div>
                  <div className="chart-value seamless">✅ Yes</div>
                </div>
                <div className="chart-row">
                  <div className="chart-label">Brand Control</div>
                  <div className="chart-value platform">❌ None</div>
                  <div className="chart-value seamless">✅ Complete</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="cta-section">
            <h3>Stop Paying Competitors to Steal Your Customers</h3>
            <p>
              Every day you wait is another day of lost revenue and lost customers. 
              Take back control of your business today.
            </p>
            <div className="cta-buttons">
              <button className="primary-button large">
                Schedule a Demo
              </button>
              <button className="secondary-button large">
                See How Much You're Losing
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileMadness;
