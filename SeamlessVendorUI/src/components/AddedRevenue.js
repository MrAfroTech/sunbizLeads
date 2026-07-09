import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const AddedRevenue = () => {
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
      <div className="page-header">
        <div className="gradient-overlay"></div>
        <div className="header-content">
          <h1 className="fade-in">Added Revenue: The QR Code Revolution</h1>
          <p className="fade-in">Turn Every Customer Into a Revenue Generator with Mobile QR Ordering</p>
        </div>
      </div>
      
      <div className="page-container">
        <section className="content-section fade-in">
          <h2>The $25 Billion Problem You're Missing</h2>
          <p className="intro-text">
            <strong>Customers abandon lines after 8 minutes</strong> - <strong>15% of potential customers leave without ordering</strong> - <strong>Lost revenue from abandoned orders</strong> - <strong>Lost repeat customers due to poor experience</strong>. The hospitality industry is bleeding $25 billion annually in lost revenue from customers who simply won't wait. <strong>Every abandoned customer represents $50-200 in lost revenue</strong> and <strong>one negative experience costs you 22% of potential customers</strong>. While you're focused on food preparation, customers are walking out the door.
          </p>
          
          <div className="grid-layout">
            <div className="grid-item">
              <div className="icon-container">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>8+ Minute Wait Times</h3>
              <p>Customers abandon lines after 8 minutes, representing 15% of your potential revenue walking out the door. Every minute over 6 minutes costs you customers and money.</p>
            </div>
            
            <div className="grid-item">
              <div className="icon-container">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Staff Overwhelmed</h3>
              <p>Your staff juggles order-taking and food preparation, leading to mistakes, delays, and frustrated customers. Peak hours become chaos instead of profit opportunities.</p>
            </div>
            
            <div className="grid-item">
              <div className="icon-container">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Lost Repeat Business</h3>
              <p>Frustrated customers don't return. One bad experience costs you 22% of potential customers and creates negative word-of-mouth that spreads to 10 people.</p>
            </div>
          </div>
        </section>
        
        <section className="content-section fade-in">
          <h2>The QR Code Solution: Skip the Line, Add Revenue</h2>
          <p className="intro-text">
            <strong>Customers scan QR code to order</strong> - <strong>Skip physical lines entirely</strong> - <strong>Staff focus on food preparation only</strong> - <strong>Orders flow directly to your POS</strong>. Seamless QR ordering eliminates the friction points that cost you revenue, turning every customer interaction into a smooth, profitable experience.
          </p>
        </section>
        
        <section className="content-section fade-in">
          <h2>How QR Ordering Adds Revenue</h2>
          
          <div className="feature-list">
            <div className="feature-item">
              <h3>Eliminate Abandoned Orders</h3>
              <p>No more customers walking out after 8 minutes. QR ordering lets customers place orders instantly from anywhere in your venue, capturing every potential sale.</p>
            </div>
            
            <div className="feature-item">
              <h3>Increase Order Volume</h3>
              <p>Faster service means more customers served per hour. Turn peak chaos into peak profit with streamlined ordering that keeps the line moving.</p>
            </div>
            
            <div className="feature-item">
              <h3>Boost Average Order Value</h3>
              <p>Digital menus with photos and descriptions encourage larger orders. Customers can browse at their own pace and add items they might have missed.</p>
            </div>
            
            <div className="feature-item">
              <h3>Improve Customer Retention</h3>
              <p>Happy customers return more often. When service is fast and efficient, customers become regulars who bring friends and spend more per visit.</p>
            </div>
            
            <div className="feature-item">
              <h3>Optimize Staff Efficiency</h3>
              <p>Staff focuses on food preparation and service, not order-taking. This reduces mistakes, speeds up service, and creates a better experience for everyone.</p>
            </div>
          </div>
        </section>
        
        <section className="content-section fade-in">
          <h2>The Free 3-Month Trial: No Risk, All Potential</h2>
          <p className="intro-text">
            <strong>Zero upfront costs</strong> - <strong>No commitment required</strong> - <strong>Full system access</strong> - <strong>Proven ROI before payment</strong>. We're so confident QR ordering will increase your revenue that we're offering a completely free 3-month trial. See the results for yourself before making any commitment.
          </p>
          
          <div className="trial-benefits">
            <div className="trial-benefit">
              <div className="benefit-icon">💰</div>
              <div className="benefit-content">
                <h4>Keep 100% of Revenue</h4>
                <p>No commission fees, no hidden costs. Every dollar from QR orders goes directly to your bottom line.</p>
              </div>
            </div>
            
            <div className="trial-benefit">
              <div className="benefit-icon">⚡</div>
              <div className="benefit-content">
                <h4>Instant POS Integration</h4>
                <p>Works with your existing POS system - Square, Lightspeed, Clover, and more. No new hardware required.</p>
              </div>
            </div>
            
            <div className="trial-benefit">
              <div className="benefit-icon">📱</div>
              <div className="benefit-content">
                <h4>Mobile-First Design</h4>
                <p>Optimized for customers scanning QR codes on their phones. Large buttons, clear navigation, fast loading.</p>
              </div>
            </div>
            
            <div className="trial-benefit">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-content">
                <h4>Real-Time Analytics</h4>
                <p>Track orders, revenue, and customer behavior in real-time. See exactly how QR ordering impacts your business.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="content-section fade-in">
          <h2>Revenue Impact Calculator</h2>
          <p className="intro-text">
            See how much additional revenue QR ordering could generate for your business:
          </p>
          
          <div className="calculator-section">
            <div className="calculator-inputs">
              <div className="input-group">
                <label>Average Daily Customers</label>
                <input type="number" placeholder="100" />
              </div>
              <div className="input-group">
                <label>Average Order Value</label>
                <input type="number" placeholder="25" />
              </div>
              <div className="input-group">
                <label>Current Abandonment Rate</label>
                <input type="number" placeholder="15" />
              </div>
            </div>
            
            <div className="calculator-results">
              <div className="result-item">
                <h4>Current Daily Revenue</h4>
                <span className="result-value">$2,125</span>
              </div>
              <div className="result-item">
                <h4>With QR Ordering</h4>
                <span className="result-value">$2,750</span>
              </div>
              <div className="result-item highlight">
                <h4>Additional Daily Revenue</h4>
                <span className="result-value">$625</span>
              </div>
              <div className="result-item highlight">
                <h4>Additional Monthly Revenue</h4>
                <span className="result-value">$18,750</span>
              </div>
            </div>
          </div>
        </section>
        
        <section className="content-section cta-section fade-in">
          <h2>Start Adding Revenue Today</h2>
          <p>Join hundreds of restaurants already increasing revenue with QR ordering. <strong>Free 3-month trial - no risk, all potential.</strong></p>
          <div className="cta-buttons">
            <button className="primary-button large">Start Your Free Trial</button>
            <button className="secondary-button large">Calculate Your Revenue Impact</button>
          </div>
          <p className="guarantee">3-month free trial. No commitment required. Cancel anytime.</p>
        </section>
      </div>
    </div>
  );
};

export default AddedRevenue;
