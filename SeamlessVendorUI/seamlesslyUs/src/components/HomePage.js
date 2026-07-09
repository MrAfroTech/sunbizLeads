import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContentPage.css';
import './BusinessQualificationFlow.css';
import BusinessQualificationFlow from './BusinessQualificationFlow';
import CaseStudies from './CaseStudies';
import TrustedMarquee from './TrustedMarquee';

const HomePage = ({ onOpenFunnel, onOpenBooking }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  const handleScheduleDemo = () => {
    if (typeof onOpenBooking === 'function') {
      onOpenBooking();
    }
  };

  const features = [
    {
      title: 'Increase Revenue',
      description: 'Seamless fixes that mobile ordering doesn\'t, staff shortages can\'t, and outdated systems won\'t. Turn every seat into a point of sale with instant ordering, premium pricing power, and zero operational friction. Revenue scales. Headcount doesn\'t.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Streamline Operations',
      description: 'Replace paper, phone calls, and manual tracking with a single digital platform. Orders flow directly to your kitchen. Payments process instantly. Staff spends time on service, not taking orders. Your operations become predictable, scalable, and stress-free.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      title: 'Elevate Fan Experience',
      description: 'First impression matters. Modern digital ordering isn\'t a feature—it\'s an expectation. Seamlessly delivers a premium, frictionless experience that matches your brand. Fans get what they want. Your venue looks like the premium destination it is.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Maximize Data Insights',
      description: 'Every transaction tells a story. Real-time data on what sells, when it sells, and who\'s buying. No more guessing on inventory, pricing, or staffing. Make decisions based on what your data shows, not what you think. Scale intelligently.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="content-page homepage-with-marquee">
      <TrustedMarquee />

      <section className="homepage-hero" aria-label="Hero">
        <div className="bqf-container">
          <div className="bqf-white-box">
            <h1 className="bqf-headline">Turn first-time visitors into regulars</h1>
            <p className="bqf-subheadline">
              Every guest has a story. We help you remember it and make your place a part of the next chapter.
            </p>
            <button
              type="button"
              className="bqf-cta-primary"
              onClick={handleScheduleDemo}
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      <BusinessQualificationFlow onOpenFunnel={onOpenFunnel} />

      {/* Orlando Pirates partner badge — hidden, not removed */}
      <div className="fade-in partner-badge-container" style={{ display: 'none' }} aria-hidden="true">
        <div className="partner-badge-circle">
          <img 
            src="/orlandopirateslogo.png"
            alt="Orlando Pirates Logo"
            className="partner-badge-logo"
            onError={(e) => {
              console.error('Orlando Pirates logo failed to load:', e.target.src);
            }}
          />
          <div className="partner-badge-text">
            Official<br />App Partner
          </div>
        </div>
      </div>

      <style>{`
        .partner-badge-container {
          position: fixed;
          top: 80px;
          left: 20px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .partner-badge-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          border: 2px solid rgba(37, 99, 235, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .partner-badge-circle:hover {
          border-color: rgba(37, 99, 235, 0.75);
          box-shadow: 0 6px 25px rgba(37, 99, 235, 0.22);
        }

        .partner-badge-logo {
          width: 50px;
          height: auto;
          max-height: 50px;
          object-fit: contain;
          margin-bottom: 5px;
        }

        .partner-badge-text {
          font-size: 9px;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .partner-badge-container {
            top: 70px;
            left: 10px;
          }

          .partner-badge-circle {
            width: 100px;
            height: 100px;
            padding: 12px;
          }

          .partner-badge-logo {
            width: 40px;
            max-height: 40px;
            margin-bottom: 4px;
          }

          .partner-badge-text {
            font-size: 8px;
          }
        }

        @media (max-width: 480px) {
          .partner-badge-container {
            top: 60px;
            left: 8px;
          }

          .partner-badge-circle {
            width: 80px;
            height: 80px;
            padding: 10px;
          }

          .partner-badge-logo {
            width: 35px;
            max-height: 35px;
            margin-bottom: 3px;
          }

          .partner-badge-text {
            font-size: 7px;
          }
        }
      `}</style>

      {/* Case studies — hidden, not removed */}
      <CaseStudies embedded hideOrlandoPirates />

      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <nav
          className="content-section fade-in"
          aria-label="Chaos Mastery Newsletter"
          style={{
            marginTop: '28px',
            marginBottom: '0',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(224, 184, 65, 0.45)',
            background: 'rgba(26, 42, 68, 0.55)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e0b841' }}>
              Weekly read
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '17px', fontWeight: 700, color: '#1a1410' }}>
              Chaos Mastery Newsletter
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'rgba(26, 20, 16, 0.88)', maxWidth: '520px', lineHeight: 1.5 }}>
              Hospitality strategy, one issue at a time. Browse every weekly edition in one place.
            </p>
          </div>
          <Link
            to="/chaos-mastery-newsletter"
            style={{
              display: 'inline-block',
              padding: '12px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #e0b841, #c9a132)',
              color: '#1a2a44',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View newsletters
          </Link>
        </nav>

        <section className="content-section fade-in" style={{ marginTop: '40px', marginBottom: '0px' }}>
          <h2 style={{ textAlign: 'left', marginBottom: '15px' }}>Bringing Hospitality Into The 21st Century</h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: 'linear-gradient(to right, #e0b841, rgba(224, 184, 65, 0.3))',
            margin: '0 0 20px 0'
          }}></div>
          <p className="fade-in" style={{ textAlign: 'center' }}>Guests abandon lines after 8 minutes. Staff burns out during rushes. Data stays locked in outdated systems. Seamlessly fixes all three—turning seats into revenue, staff into advocates, and data into decisions.</p>
        </section>
        
        <section className="content-section fade-in" style={{ marginTop: '40px', marginBottom: '0' }}>
          <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '0', marginBottom: '0' }}>
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

export default HomePage;
