import React, { useEffect, useState } from 'react';
import '../styles/ContentPage.css';

const CaseStudies = ({ embedded = false, hideOrlandoPirates = false }) => {
  const [expandedId, setExpandedId] = useState('orlando-pirates');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (embedded) {
      return;
    }

    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Fade in animation for elements
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [embedded]);

  const toggleAccordion = (id) => {
    if (!isMobile) {
      setExpandedId(expandedId === id ? null : id);
    }
  };

  const caseStudies = [
    {
      id: 'orlando-pirates',
      logo: '/orlandopirateslogo.png',
      title: 'Orlando Pirates × Seamlessly',
      tagline: 'Connecting a historic club to a new city — digitally, instantly, and at scale',
      challenge: 'As the Orlando Pirates expanded into a new market, they needed to activate fans, drive revenue, and streamline service without slowing down operations. They needed more than a payment tool — they needed a bridge between brand, venue, and fan experience.',
      keyResults: [
        {
          icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          title: 'Instant Mobile Ordering',
          description: 'Fans could order from their seats without missing a moment of the match'
        },
        {
          icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          title: 'Premium Fan Experience',
          description: 'Delivered a seamless, modern experience matching the club\'s premium brand'
        },
        {
          icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          title: 'Revenue Without Extra Staff',
          description: 'Generated increased revenue without requiring additional operational staff'
        },
        {
          icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          title: 'Digital Infrastructure from Day One',
          description: 'Launched in new market with complete digital ordering system ready to scale'
        }
      ],
      testimonial: '"We needed to connect with fans in a new city fast. Seamlessly let us turn every seat into a point of sale. Fans could order without missing a moment. Our staff could focus on service instead of taking orders. It wasn\'t just about selling more—it was about making the experience feel premium from day one."',
      attribution: '— Orlando Pirates Operations Team'
    }
  ];

  return (
    <div
      className="content-page"
      style={embedded ? { display: 'none' } : undefined}
      aria-hidden={embedded ? true : undefined}
    >
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <section className="content-section fade-in" style={{ marginBottom: '0px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Real Results From Real Views, Venues & Vendors</h2>
          <p className="intro-text" style={{ textAlign: 'center', marginBottom: '0' }}>
            Join the venues already transforming their operations. Real results from real views, venues, and vendors who've made the switch to Seamlessly. See how they're increasing revenue, streamlining operations, and keeping their best people happy
          </p>
        </section>
        <div style={{ marginTop: '-50px', marginBottom: '0' }}>
          {caseStudies.map((study) => {
            const isExpanded = isMobile || expandedId === study.id;
            
            const isOrlandoPirates = study.id === 'orlando-pirates';

            return (
              <div 
                key={study.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  display: hideOrlandoPirates && isOrlandoPirates ? 'none' : undefined,
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleAccordion(study.id)}
                  style={{
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 30px',
                    cursor: isMobile ? 'default' : 'pointer',
                    transition: 'background 0.3s ease',
                    gap: '20px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Logo */}
                  <img 
                    src={study.logo}
                    alt={`${study.title} Logo`}
                    style={{
                      height: '80px',
                      width: 'auto',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      console.error('Logo failed to load:', e.target.src);
                    }}
                  />
                  
                  {/* Title + Tagline */}
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      margin: '0 0 8px 0',
                      fontSize: '28px',
                      background: 'linear-gradient(135deg, #d4af37, #f5d76e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {study.title}
                    </h2>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      color: 'rgba(26, 20, 16, 0.9)',
                      fontStyle: 'italic'
                    }}>
                      {study.tagline}
                    </p>
                  </div>
                  
                  {/* Chevron Icon */}
                  {!isMobile && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: '24px',
                        height: '24px',
                        color: '#d4af37',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        flexShrink: 0
                      }}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Expanded Content */}
                <div
                  style={{
                    maxHeight: isExpanded ? '600px' : '0',
                    opacity: isExpanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    padding: isExpanded ? '0 30px 30px' : '0 30px'
                  }}
                >
                  {/* Challenge Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      color: '#d4af37',
                      marginBottom: '10px'
                    }}>
                      The Challenge
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      lineHeight: '1.7',
                      color: 'rgba(26, 20, 16, 0.9)',
                      margin: 0
                    }}>
                      {study.challenge}
                    </p>
                  </div>

                  {/* Key Results Grid */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      color: '#d4af37',
                      marginBottom: '15px'
                    }}>
                      Key Results
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
                      gap: '15px'
                    }}>
                      {study.keyResults.map((result, index) => (
                        <div
                          key={index}
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '15px',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, rgba(224, 184, 65, 0.1), rgba(224, 184, 65, 0.2))',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#5D4A1F',
                            flexShrink: 0
                          }}>
                            {result.icon}
                          </div>
                          <div>
                            <h4 style={{
                              fontSize: '16px',
                              color: '#1a1410',
                              margin: '0 0 5px 0'
                            }}>
                              {result.title}
                            </h4>
                            <p style={{
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: 'rgba(26, 20, 16, 0.9)',
                              margin: 0
                            }}>
                              {result.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonial */}
                  <blockquote style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    borderLeft: '4px solid #d4af37',
                    padding: '20px',
                    borderRadius: '8px',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: 'rgba(26, 20, 16, 0.9)' }}>
                      {study.testimonial}
                    </p>
                    <p style={{
                      margin: 0,
                      fontWeight: '600',
                      color: '#d4af37',
                      fontStyle: 'normal',
                      fontSize: '14px'
                    }}>
                      {study.attribution}
                    </p>
                  </blockquote>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CaseStudies;
