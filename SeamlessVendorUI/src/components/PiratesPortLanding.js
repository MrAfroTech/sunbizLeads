import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, Repeat, Anchor, Settings, TrendingUp, ArrowRight } from 'lucide-react';
import '../styles/ContentPage.css';

const PiratesPortLanding = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Pirates Port | Drop Your Anchor";
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  const valueCards = [
    {
      title: 'Potential for 42,000+ Qualified Impressions Per Season',
      description: '7 home games with 8-10K fans checking the app for pre and post-game plans. Your establishment featured directly to fans actively looking for where to go. No algorithm battles, no scroll competition—just direct visibility when it matters most.',
      icon: <Eye size={32} />
    },
    {
      title: 'The New Customer Opportunity',
      description: 'With 42,000 impressions to fans planning their game day, even modest conversion rates create significant foot traffic. Industry benchmarks suggest 5-10% of highly qualified audiences take action. Each new customer represents $25-40 in immediate revenue opportunity.',
      icon: <Users size={32} />
    },
    {
      title: 'Build Your Regular Customer Base',
      description: 'Game day visitors who live locally often become regulars—it\'s the nature of great experiences. Industry data shows 15-20% of satisfied first-time customers return regularly. A few hundred new regulars visiting 10-15 times annually creates substantial recurring revenue. The long-term value compounds season after season.',
      icon: <Repeat size={32} />
    },
    {
      title: 'One of Only 5-10 Port Anchors',
      description: 'Anchor establishments form the core of Pirates Port. Limited to 2-3 per category maximum. Once the anchors are set, the Port is built. These positions don\'t reopen. First establishments in become the permanent foundation that captures the majority of recommendation-driven traffic.',
      icon: <Anchor size={32} />
    },
    {
      title: 'The Platform Behind the Port',
      description: 'Monthly Seamlessly subscription includes enhanced mobile ordering, better inventory management, consolidated tech stack, digital ticketing for private events, and lower delivery service costs. Platform operational savings often offset the subscription cost. Pirates Port visibility is your growth engine on top of efficiency gains.',
      icon: <Settings size={32} />
    },
    {
      title: 'Positioned for Market Growth',
      description: 'Semi-pro football is experiencing nationwide momentum. Orlando\'s growing sports culture creates expansion opportunity. Anchor establishments are positioned to benefit as attendance grows year over year. Early positioning matters—once the anchors are set, new venues compete for what\'s left.',
      icon: <TrendingUp size={32} />
    }
  ];

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        
        {/* Hero Section */}
        <section className="content-section fade-in" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(224, 184, 65, 0.3)',
            borderRadius: '20px',
            marginBottom: '20px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '1px',
              color: '#d4af37',
              textTransform: 'uppercase'
            }}>
              Dock Spots Available • Limited to 5-10 Establishments
            </span>
          </div>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '15px'
          }}>
            Drop YOUR Anchor in Pirates Port
          </h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: 'linear-gradient(to right, #e0b841, rgba(224, 184, 65, 0.3))',
            margin: '0 auto 20px'
          }}></div>
          <p className="intro-text" style={{ 
            textAlign: 'center',
            marginBottom: '15px',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '15px'
          }}>
            Become one of 5-10 anchor establishments in Orlando's new game day destination
          </p>
          <p style={{ 
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.8',
            maxWidth: '800px',
            margin: '0 auto 15px'
          }}>
            Pirates Port is where thousands of Orlando football fans gather before, during, and after games. 
            The Port is built around 5-10 anchor establishments—the core spots that define the neighborhood. 
            Once the anchors are set, the Port is complete.
          </p>
          <p style={{ 
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500',
            fontStyle: 'italic',
            margin: 0
          }}>
            The dock spots are being set now. Will your establishment be one of them?
          </p>
        </section>

        {/* Value Cards Grid */}
        <section className="content-section fade-in" style={{ marginBottom: '40px' }}>
          <div className="grid-layout" style={{ 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            {valueCards.map((card, index) => (
              <div 
                key={index}
                className="grid-item"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(224, 184, 65, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="icon-container">
                  {card.icon}
                </div>
                <h3 style={{ 
                  color: '#fff', 
                  fontWeight: '700',
                  marginBottom: '15px',
                  fontSize: '20px'
                }}>
                  {card.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.7',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="content-section fade-in" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(224, 184, 65, 0.2)',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              fontSize: '2rem'
            }}>
              Anchor Your Spot in the Port
            </h2>
            <p style={{ 
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '30px',
              lineHeight: '1.8'
            }}>
              We're setting the anchors for Pirates Port now. Once the 5-10 core establishments are in place, 
              the Port is complete. These positions are permanent—anchor establishments become the foundation 
              of Orlando's football game day culture.
            </p>
            <Link 
              to="/vendor-registration" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 35px',
                background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                color: '#0a0a0a',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Drop Your Anchor
              <ArrowRight size={20} />
            </Link>
            <p style={{ 
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '20px',
              marginBottom: 0,
              fontStyle: 'italic'
            }}>
              Anchor positions are being finalized. Once set, the Port is built.
            </p>
          </div>
        </section>

        {/* Footer Explainer Section */}
        <section className="content-section fade-in" style={{ marginBottom: '0', textAlign: 'center' }}>
          <h2 style={{ 
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '1.8rem'
          }}>
            What Does It Mean to Anchor in Pirates Port?
          </h2>
          <div style={{
            width: '80px',
            height: '3px',
            background: 'linear-gradient(to right, #e0b841, rgba(224, 184, 65, 0.3))',
            margin: '0 auto 20px'
          }}></div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(224, 184, 65, 0.2)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <p style={{ 
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.8',
              margin: '0 0 15px 0'
            }}>
              When you drop your anchor in Pirates Port, you become one of 5-10 core establishments that define 
              Orlando's football game day experience. Fans don't see endless options when they open the app—they see 
              the Port. The anchors. The spots that ARE the neighborhood.
            </p>
            <p style={{ 
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.8',
              margin: 0
            }}>
              Pirates Port is built on the Seamlessly platform, giving you the operational tools to run efficiently 
              while the Port positioning drives traffic to your doors. Once anchored, you're permanent. The Port is 
              built around you.
            </p>
          </div>
        </section>

      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .grid-layout {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          .grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PiratesPortLanding;
