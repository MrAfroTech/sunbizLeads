import React, { useState, useEffect } from 'react';
import '../styles/ContentPage.css';
import SeamlesslySchema from '../schemas/SeamlesslySchema';

const TwoMinuteDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, [currentSlide]);

  // Add JSON-LD structured data for SEO
  useEffect(() => {
    // Remove existing schema if any
    const existingSchema = document.getElementById('seamlessly-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Create structured data for both guests and hosts
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Seamlessly Two Minute Deck - Hospitality Solutions",
      "description": "Comprehensive overview of pain points and benefits for guests and hosts in the hospitality industry. Learn how Seamlessly reduces wait times, increases revenue, and improves customer experience.",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          // Guest Pain Points as FAQs
          ...SeamlesslySchema.guests.painPoints.map((item) => ({
            "@type": "Question",
            "name": item.title,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.description
            }
          })),
          // Guest Benefits as FAQs
          ...SeamlesslySchema.guests.benefits.map((item) => ({
            "@type": "Question",
            "name": item.title,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.description
            }
          })),
          // Host Pain Points as FAQs
          ...SeamlesslySchema.hosts.painPoints.map((item) => ({
            "@type": "Question",
            "name": item.title,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.description
            }
          })),
          // Host Benefits as FAQs
          ...SeamlesslySchema.hosts.benefits.map((item) => ({
            "@type": "Question",
            "name": item.title,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.description
            }
          }))
        ]
      },
      "about": {
        "@type": "SoftwareApplication",
        "name": "Seamlessly",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "description": "Unified hospitality platform that reduces wait times, increases revenue, and improves customer experience"
        }
      }
    };

    // Create and inject script tag
    const script = document.createElement('script');
    script.id = 'seamlessly-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const schemaToRemove = document.getElementById('seamlessly-schema');
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentSlide === 1) {
        setCurrentSlide(0);
      } else if (e.key === 'ArrowRight' && currentSlide === 0) {
        setCurrentSlide(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
  };

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
      <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', position: 'relative' }}>
        
        {/* Navigation Arrows */}
        {/* Left Arrow - Only show on slide 1 (Hosts) */}
        {currentSlide === 1 && (
          <button
            onClick={prevSlide}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(224, 184, 65, 0.8)',
              border: '2px solid #e0b841',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'all 0.3s ease',
              color: '#1a1410'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(224, 184, 65, 1)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(224, 184, 65, 0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Right Arrow - Only show on slide 0 (Guests) */}
        {currentSlide === 0 && (
          <button
            onClick={nextSlide}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(224, 184, 65, 0.8)',
              border: '2px solid #e0b841',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'all 0.3s ease',
              color: '#1a1410'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(224, 184, 65, 1)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(224, 184, 65, 0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Slide Indicator */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 10
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: currentSlide === 0 ? '#e0b841' : 'rgba(224, 184, 65, 0.3)',
            transition: 'all 0.3s ease'
          }}></div>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: currentSlide === 1 ? '#e0b841' : 'rgba(224, 184, 65, 0.3)',
            transition: 'all 0.3s ease'
          }}></div>
        </div>

        {/* Slide 0: Guests */}
        <div 
          className="fade-in"
          style={{
            display: currentSlide === 0 ? 'block' : 'none',
            minHeight: 'calc(100vh - 200px)',
            paddingTop: '40px'
          }}
        >
          <section className="content-section" style={{ marginBottom: '60px' }}>
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

        {/* Slide 1: Hosts */}
        <div 
          className="fade-in"
          style={{
            display: currentSlide === 1 ? 'block' : 'none',
            minHeight: 'calc(100vh - 200px)',
            paddingTop: '40px'
          }}
        >
          <section className="content-section" style={{ marginBottom: '60px' }}>
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
    </div>
  );
};

export default TwoMinuteDeck;
