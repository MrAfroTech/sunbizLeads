import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const GuestBenefits = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  const guestPainPoints = [
    {
      title: 'Excessive Waiting steals the night.',
      description: 'Guests spend up to 40% of event time waiting instead of enjoying the experience. Lines over 8 minutes cause 20–30% of guests to abandon orders, leading to direct revenue loss of $25M annually across a mid-sized festival.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Decision fatigue and frustration',
      description: 'Scanning multiple lines forces guests to compromise on choices, reducing average spend per person by 15–20%.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Quality drops when demand spikes',
      description: 'Overwhelmed staff make mistakes 1 in 5 orders, triggering complaints and chargebacks that can cost $500K+ per event.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Disconnected experiences',
      description: 'Fragmented apps for tickets, food, drinks, and reservations reduce engagement and lead to 10–15% lower customer retention per event.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Hidden fees and poor delivery experiences',
      description: 'Third-party services add 5–15% in hidden fees, deliver cold or late orders 15–20% of the time, and shift complaints and refunds onto the venue, costing $1M+ per year for a typical venue network.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  const guestBenefit = {
    title: 'Seamlessly\'s Solution: Frictionless End-to-End Experience',
    description: 'Guests order ahead, skip lines, move seamlessly from entry to seat to service to after-event—feeling like insiders, not outsiders.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* Guests Section */}
        <section className="content-section fade-in" style={{ marginTop: '40px', marginBottom: '60px' }}>
          {/* Guest Items - 2x3 grid (3 columns, 2 rows) */}
          <div className="grid-layout guest-benefits-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {/* Pain Points */}
            {guestPainPoints.map((point, index) => (
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
                  {point.icon}
                </div>
                <h3 style={{ 
                  color: '#1a1410', 
                  fontWeight: '700',
                  marginBottom: '15px',
                  fontSize: '20px'
                }}>
                  {point.title}
                </h3>
                <p style={{ 
                  color: 'rgba(26, 20, 16, 0.9)',
                  lineHeight: '1.7',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {point.description}
                </p>
              </div>
            ))}
            {/* Benefit */}
            <div 
              className="grid-item"
              style={{
                background: 'rgba(224, 184, 65, 0.15)',
                border: '2px solid rgba(224, 184, 65, 0.4)',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="icon-container">
                {guestBenefit.icon}
              </div>
              <h3 style={{ 
                color: '#1a1410', 
                fontWeight: '700',
                marginBottom: '15px',
                fontSize: '20px'
              }}>
                {guestBenefit.title}
              </h3>
              <p style={{ 
                color: 'rgba(26, 20, 16, 0.9)',
                lineHeight: '1.7',
                fontSize: '16px',
                margin: 0
              }}>
                {guestBenefit.description}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default GuestBenefits;
