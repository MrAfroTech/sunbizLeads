import React, { useEffect, useRef } from 'react';
import '../styles/FeatureSection.css';

const FeatureSection = () => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const features = sectionRef.current.querySelectorAll('.feature-card');
          features.forEach((feature, index) => {
            setTimeout(() => {
              feature.classList.add('animate');
            }, 200 * index);
          });
        }
      });
    }, { threshold: 0.2 });
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <section id="features" className="features-section" ref={sectionRef}>
      <div className="section-header">
        <h2 className="section-title">Seamless Fixes That</h2>
        <p className="section-subtitle">Integrates with any POS system. California to New York, Florida to Maine. From local bars to massive festivals with seasonal scalability. Scan QR code, order instantly, skip the line.</p>
      </div>
      
      <div className="features-container">
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 15V23" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 19H16" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Scale Revenue</h3>
          <p className="feature-description">
            Seamlessly reduce wait times and increase order volume with integrated digital ordering that works 24/7 across any venue type. Advanced crowd management and revenue maximization tools.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 15H16" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Integrate Any POS</h3>
          <p className="feature-description">
            Seamlessly integrate with any existing POS system across all venue types - no hardware changes required.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11C20 15.4183 16.4183 19 12 19C7.58172 19 4 15.4183 4 11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V11L15 13" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 22L18 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Track Performance</h3>
          <p className="feature-description">
            Seamlessly get instant insights into sales patterns, popular items, and customer behavior to optimize your operations across any venue type.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M17.5 7.5V7.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Manage Operations</h3>
          <p className="feature-description">
            Seamlessly update prices, add seasonal items, and manage inventory in real-time from anywhere across all venue types.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 9V6.5C2 4.01 4.01 2 6.5 2H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H17.5C19.99 2 22 4.01 22 6.5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 16V17.5C22 19.99 19.99 22 17.5 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22H6.5C4.01 22 2 19.99 2 17.5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 7V9C10.5 10.1 9.6 11 8.5 11H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 11H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 7H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 9H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 13H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 15H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.5 17H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 15H11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 17H11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Supported</h3>
          <p className="feature-description">
            Seamlessly get dedicated support whenever you need it - from setup to ongoing operations and troubleshooting across all venue types.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="feature-title">Seamlessly Reduce Costs</h3>
          <p className="feature-description">
            Seamlessly lower operational costs with automated ordering, reduced wait times, and optimized staff allocation across any venue type.
          </p>
        </div>
      </div>
      
      <div className="features-cta">
        <button className="primary-button">Discover Seamless Integration</button>
      </div>
    </section>
  );
};

export default FeatureSection;