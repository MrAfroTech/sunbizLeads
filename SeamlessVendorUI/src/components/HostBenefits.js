import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const HostBenefits = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  const hostPainPoints = [
    {
      title: 'Massive revenue leakage from abandoned lines',
      description: 'Guests abandon lines over 5–10 minutes, reducing top-line revenue by 10–25%, depending on event type and size.',
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
      description: 'Front-line hospitality staff average ~110 days per role, forcing constant hiring and training cycles. Replacement costs per employee range $2,000–$6,000, including recruiting, training, and lost productivity.',
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
      description: 'Profit margins are typically 3–5%, meaning small inefficiencies or lost orders have outsized impact. High turnover, long waits, and operational friction contribute to industry failure rates of 60–70%.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Disjointed tech stacks and bloated fees',
      description: 'Ticketing, POS, scheduling, delivery, and reservations all live in silos. Fragmented systems account for ~13–19% of operating costs through inefficiency, duplicated work, and errors.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Loss of data ownership',
      description: 'Third-party platforms control customer data, reducing ability to personalize offers, forecast demand, and improve retention. This can lower revenue per guest by ~10–15%.',
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
    description: 'Seamlessly connects all systems under the Eventbrella, reducing tech costs, streamlining operations, and giving venues full control of customer data. Minimizing wait times under 6 minutes can increase revenue per order by 20–30% and reduce staff turnover by 30–40%, improving forecasting, inventory, and expense management.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* Hosts Section */}
        <section className="content-section fade-in" style={{ marginTop: '40px', marginBottom: '60px' }}>
          {/* Host Items - 2x3 grid (3 columns, 2 rows) */}
          <div className="grid-layout host-benefits-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {/* Pain Points */}
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
                {hostBenefit.icon}
              </div>
              <h3 style={{ 
                color: '#1a1410', 
                fontWeight: '700',
                marginBottom: '15px',
                fontSize: '20px'
              }}>
                {hostBenefit.title}
              </h3>
              <p style={{ 
                color: 'rgba(26, 20, 16, 0.9)',
                lineHeight: '1.7',
                fontSize: '16px',
                margin: 0
              }}>
                {hostBenefit.description}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HostBenefits;
