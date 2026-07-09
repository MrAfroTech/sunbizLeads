import React, { useEffect, useRef } from 'react';
import '../styles/HeroSection.css';

const HeroSection = ({ onOpenPopup }) => {
  const textRef = useRef(null);
  
  // Single static background image for better SEO and performance
  const backgroundImage = '/pexels-imin-technology-276315592-12935077.jpg';

  useEffect(() => {
    // Fade in text elements with staggered timing
    const text = textRef.current;
    if (text) {
      const elements = text.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('visible');
        }, 1000 + (index * 200));
      });
    }
  }, []);

  return (
    <section className="hero-section">
      {/* Professional Business Background */}
      <div className="hero-background">
        <div className="image-background">
          <img
            src={backgroundImage}
            alt="Professional restaurant POS system with crowd management technology background"
            className="image-element active"
          />
          <div className="image-overlay"></div>
          <div className="gradient-overlay"></div>
          <div className="grid-pattern"></div>
        </div>
      </div>
      
      <div className="hero-container">
        <div className="hero-content" ref={textRef}>
          <div className="hero-left">
            <p className="hero-subheadline fade-in">
              Customers abandon lines after 8 minutes -- leading to a $25 billion problem! Seamlessly fixes that. By integrating with any POS system, connecting views, vendors & venues. From California to New York, Florida to Maine. 
              From food trucks to Local bars to massive festivals. Customers scan a QR code, order, and skip the line entirely. Reducing wait times to under 6 minutes could increase industry revenue by 30% to $132 billion. 
            </p>
          </div>
          
          <div className="hero-right">
            <div className="hero-benefits fade-in">
              <div className="benefit-item">
                <div className="benefit-icon">⏱️</div>
                <div className="benefit-text">Cut Wait Times by 62% - From Over 8 minutes to under 3 minutes</div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-text">Dynamic Pricing Optimization - Maximize revenue per order</div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-text">Universal POS Integration - Lightspeed, Square, Clover equate to cross-selling opportunities and vendor alliances</div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <div className="benefit-text">No Additional Hardware Required - Works with existing systems</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <span>Scroll</span>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19" stroke="currentColor" strokeWidth="2"/>
          <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      
    </section>
  );
};

export default HeroSection;