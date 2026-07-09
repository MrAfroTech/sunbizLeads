
import React, { useState, useEffect } from 'react';
import './FestivalPromoFlyer.css';

const FestivalPromoFlyer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGetStartedClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="promo-container">
      <div className={`promo-flyer ${isVisible ? 'visible' : ''}`}>
        <div className="gold-bar"></div>
        
        <div className="header">
          <div className="logo">EZ<span>DRINK</span></div>
          <div className="event-badge">FESTIVAL EXCLUSIVE</div>
        </div>
        
        <div className="content-section">
          <h1 className="headline">
            <span className="headline-accent">SKIP THE LINES.</span>
            <span className="headline-main">BOOST YOUR SALES.</span>
          </h1>
          
          <div className="offer-box">
            <div className="offer-label">LIMITED TIME OFFER</div>
            <div className="price-section">
              <div className="price-comparison">
                <span className="original-price">$2,500</span>
                <span className="price-slash"></span>
              </div>
              <div className="current-price">$999</div>
            </div>
            <div className="offer-includes">
              <div className="includes-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Full EzDrink Festival Integration</span>
              </div>
              <div className="includes-item highlight">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>200 Drink Tickets <span className="value-tag">$500 VALUE</span></span>
              </div>
              <div className="includes-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Real-time ordering metrics</span>
              </div>
            </div>
            <div className="actual-cost">Your Actual Cost: <span>$499</span></div>
          </div>
          
          <div className="value-proposition">
            <div className="proposition-item">
              <div className="proposition-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="proposition-text">
                <h3>Boost Revenue</h3>
                <p>30% increased drink purchases when lines are eliminated</p>
              </div>
            </div>
            
            <div className="proposition-item">
              <div className="proposition-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="proposition-text">
                <h3>Save Time</h3>
                <p>Serve 3x more customers during peak hours</p>
              </div>
            </div>
            
            <div className="proposition-item">
              <div className="proposition-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 8l-8 8M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="proposition-text">
                <h3>Zero Net Cost</h3>
                <p>Get $100 credit for each vendor you refer (up to 5)</p>
              </div>
            </div>
          </div>
          
          <div className="pricing-details">
            <h2>How It Works</h2>
            <div className="pricing-grid">
              <div className="pricing-item">
                <div className="pricing-icon">1</div>
                <div className="pricing-text">
                  <h4>One-time fee</h4>
                  <p>$999 flat fee (includes 200 drink tickets)</p>
                </div>
              </div>
              
              <div className="pricing-item">
                <div className="pricing-icon">2</div>
                <div className="pricing-text">
                  <h4>Festival gets</h4>
                  <p>$4.25 from each $5 ticket & $9.25 from each $10 ticket</p>
                </div>
              </div>
              
              <div className="pricing-item">
                <div className="pricing-icon">3</div>
                <div className="pricing-text">
                  <h4>We get</h4>
                  <p>$0.75 per additional transaction</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="roi-calculator">
            <div className="roi-header">
              <h3>THE MATH DOESN'T LIE</h3>
              <p>You'll recover your $499 investment after just...</p>
            </div>
            
            <div className="roi-calculation">
              <div className="roi-item">
                <div className="roi-number">118</div>
                <div className="roi-text">Additional $5 Drinks</div>
              </div>
              <div className="or-divider">OR</div>
              <div className="roi-item">
                <div className="roi-number">54</div>
                <div className="roi-text">Additional $10 Drinks</div>
              </div>
            </div>
            
            <div className="roi-note">
              With 2,000 attendees, that's just <span>6%</span> more drinks sold to break even!
            </div>
          </div>
        </div>
        
        <div className="action-section">
          <button className="cta-button" onClick={handleGetStartedClick}>
            SECURE YOUR SPOT NOW
          </button>
          <div className="limited-spots">Only 3 festival spots remaining for this month</div>
        </div>
        
        <div className="testimonial-section">
          <div className="testimonial">
            "EzDrink paid for itself in the first 2 hours of our festival. Bar revenue was up 37% compared to last year with the same attendance."
            <span className="testimonial-author">— Kate R., Desert Music Festival</span>
          </div>
        </div>
      </div>
      
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2>Let's Get Your Festival Ready!</h2>
            <p>Fill out the form below and we'll contact you within 24 hours to set everything up.</p>
            
            <form className="contact-form">
              <div className="form-group">
                <label>Festival Name</label>
                <input type="text" placeholder="Enter festival name" />
              </div>
              
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" placeholder="(123) 456-7890" />
              </div>
              
              <div className="form-group">
                <label>Festival Date</label>
                <input type="date" />
              </div>
              
              <div className="form-group">
                <label>Estimated Attendance</label>
                <select>
                  <option>Under 1,000</option>
                  <option selected>1,000 - 3,000</option>
                  <option>3,001 - 5,000</option>
                  <option>5,001 - 10,000</option>
                  <option>10,001+</option>
                </select>
              </div>
              
              <button type="submit" className="submit-button">LOCK IN YOUR RATE</button>
              
              <div className="guarantee">30-day money-back guarantee if you're not completely satisfied</div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalPromoFlyer;