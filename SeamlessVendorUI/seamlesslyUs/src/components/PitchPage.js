import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const PitchPage = () => {
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
      title: 'Long wait times kill the experience',
      description: 'Guests spend a huge portion of events waiting in lines instead of enjoying why they came.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Decision fatigue and frustration',
      description: 'Guests scan lines instead of menus, choosing "shortest wait" over what they actually want.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Inconsistent service quality',
      description: 'Overwhelmed staff leads to rushed orders, mistakes, and unmet expectations.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Disconnected experiences',
      description: 'Tickets, food, drinks, reservations, and after-event plans live in separate apps with zero continuity.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Hidden fees and poor delivery experiences',
      description: 'Third-party services overcharge guests and deliver cold, late, or cancelled orders.',
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
    title: 'Seamlessly benefit: frictionless, end-to-end experience',
    description: 'Guests order ahead, skip lines, move seamlessly from entry to seat to service to after-event—feeling like insiders, not outsiders.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  const hostPainPoints = [
    {
      title: 'Massive revenue leakage from abandoned lines',
      description: 'Guests avoid or abandon lines over ~8 minutes, quietly draining millions from top-line revenue.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Staff burnout and extreme turnover',
      description: 'Complaints + chaos shorten employee tenure, creating a constant cycle of hiring, training, and lost productivity.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Slim margins and high failure rates',
      description: 'Operational friction, inefficiency, and stress compound in an already low-margin industry.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Disjointed tech stacks and bloated fees',
      description: 'Ticketing, POS, scheduling, delivery, and reservations all live in silos—each with its own costs and headaches.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Loss of data ownership',
      description: 'Third-party platforms control customer data, weakening retention, personalization, and revenue per guest.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  const hostBenefit = {
    title: 'Seamlessly benefit: a unified, revenue-optimizing platform',
    description: 'Seamlessly reduces wait times under 6 minutes, increases revenue per order, lowers tech costs, reduces staff stress, improves retention, and turns fragmented systems into one connected network—unlocking network effects, better forecasting, and long-term profitability.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        
        {/* Guests Section */}
        <section className="content-section fade-in" style={{ marginTop: '40px', marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Guests</h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: 'linear-gradient(to right, #e0b841, rgba(224, 184, 65, 0.3))',
            margin: '0 auto 30px auto'
          }}></div>
          <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', color: '#1a1410' }}>
            <strong>Pain Points → Benefits</strong>
          </p>

          {/* Guest Pain Points */}
          <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
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
          </div>

          {/* Guest Benefit */}
          <div style={{
            background: 'rgba(224, 184, 65, 0.15)',
            border: '2px solid rgba(224, 184, 65, 0.4)',
            borderRadius: '12px',
            padding: '30px',
            marginTop: '40px'
          }}>
            <div className="icon-container" style={{ marginBottom: '20px' }}>
              {guestBenefit.icon}
            </div>
            <h3 style={{ 
              color: '#1a1410', 
              fontWeight: '700',
              marginBottom: '15px',
              fontSize: '22px',
              textAlign: 'center'
            }}>
              {guestBenefit.title}
            </h3>
            <p style={{ 
              color: 'rgba(26, 20, 16, 0.9)',
              lineHeight: '1.7',
              fontSize: '17px',
              margin: 0,
              textAlign: 'center'
            }}>
              {guestBenefit.description}
            </p>
          </div>
        </section>

        {/* Hosts Section */}
        <section className="content-section fade-in" style={{ marginTop: '60px', marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Hosts (Views, Vendors, Venues)</h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: 'linear-gradient(to right, #e0b841, rgba(224, 184, 65, 0.3))',
            margin: '0 auto 30px auto'
          }}></div>
          <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', color: '#1a1410' }}>
            <strong>Pain Points → Benefits</strong>
          </p>

          {/* Host Pain Points */}
          <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {hostPainPoints.map((point, index) => (
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
          </div>

          {/* Host Benefit */}
          <div style={{
            background: 'rgba(224, 184, 65, 0.15)',
            border: '2px solid rgba(224, 184, 65, 0.4)',
            borderRadius: '12px',
            padding: '30px',
            marginTop: '40px'
          }}>
            <div className="icon-container" style={{ marginBottom: '20px' }}>
              {hostBenefit.icon}
            </div>
            <h3 style={{ 
              color: '#1a1410', 
              fontWeight: '700',
              marginBottom: '15px',
              fontSize: '22px',
              textAlign: 'center'
            }}>
              {hostBenefit.title}
            </h3>
            <p style={{ 
              color: 'rgba(26, 20, 16, 0.9)',
              lineHeight: '1.7',
              fontSize: '17px',
              margin: 0,
              textAlign: 'center'
            }}>
              {hostBenefit.description}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default PitchPage;
