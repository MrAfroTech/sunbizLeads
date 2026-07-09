import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const Investors = () => {
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

  const features = [
    {
      title: 'Tier 1 - Ground Floor',
      description: '$1,250 for 0.1% equity. Limited to first 100 investors (10% total equity max). Your foot in the door. Perfect for individual investors and early believers who want to be part of the transformation.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Tier 2 - Strategic Partner',
      description: '$11,000 for 1% equity. Maximum 10 strategic partners (10% total equity max). Meaningful stake in the future. Ideal for serious investors and small funds seeking strategic alignment.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Tier 3 - Industry Transformer',
      description: '$98,000 for 10% equity (after EBITDA positive). Only ONE major stakeholder. Maximum available equity stake. Reserved for major investors and venture funds.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Strategic Investment Approach',
      description: 'We\'re seeking aligned partners who share our vision of transforming hospitality experiences. Limited equity available to maintain focused ownership and execution. Your investment accelerates our mission.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Maximum 20% Total Equity',
      description: 'Total equity available to all external investors is capped at 20% to maintain focused execution. When 20% is allocated, investment closes permanently. First come, first served basis.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Partnership Opportunities',
      description: 'We\'re growing steadily and offering strategic partnership opportunities in hospitality technology. Join us in transforming customer experiences with limited equity available to maintain focused ownership.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <section className="content-section fade-in">
          <h2 style={{ textAlign: 'center' }}>Strategic Partnership Opportunities</h2>
          <p className="intro-text" style={{ textAlign: 'center', marginBottom: '30px' }}>
            We're seeking aligned partners who share our vision of transforming hospitality experiences. Limited equity available to maintain focused ownership and execution. Your investment accelerates our mission to help venues succeed.
          </p>
          
          <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className="grid-item"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="icon-container">
                  {feature.icon}
                </div>
                <h3 style={{ 
                  color: '#1a1410', 
                  fontWeight: '700',
                  marginBottom: '15px',
                  fontSize: '20px'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'rgba(26, 20, 16, 0.9)',
                  lineHeight: '1.7',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Investors;
