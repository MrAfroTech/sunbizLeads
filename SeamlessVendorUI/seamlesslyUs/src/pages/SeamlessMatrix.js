import React, { useState } from 'react';
import './SeamlessMatrix.css';
import BookingModal from '../components/BookingModal';

const SeamlessMatrix = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const totalPages = 1;

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: '1–5 Restaurants',
      price: '$899',
      period: '/month',
      features: [
        '2 staff accounts',
        '1,000 orders/month',
        'QR code ordering at the table',
        'Basic scheduling',
        'POS integration (basic)',
        'Mobile ordering (basic)',
        '100 QR codes',
        'Basic email support'
      ],
      color: '#10b981'
    },
    {
      id: 'professional',
      name: 'Professional',
      subtitle: '6–15 Restaurants',
      price: '$1,249',
      period: '/month',
      featured: true,
      badge: 'Most Popular',
      features: [
        '10 staff accounts',
        'Unlimited orders',
        'QR code ordering at the table',
        'Advanced scheduling with sync',
        'POS integration with advanced reporting',
        'Mobile ordering (unlimited)',
        'Unlimited QR codes',
        'Digital event ticketing',
        "What's Next concierge (before and after dinner recommendations)",
        'Priority support',
        'Custom integrations'
      ],
      color: '#d4af37'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      subtitle: '16+ Restaurants',
      price: '$1,600',
      period: '/month',
      features: [
        'Unlimited staff accounts',
        'Unlimited everything',
        'All features in Professional',
        'QR code ordering at the table',
        'Full POS integration',
        'Reservations management',
        'Delivery service integration',
        'Digital event ticketing',
        "What's Next concierge (before and after dinner recommendations)",
        'Brand customization',
        'Dedicated account manager',
        'Advanced analytics',
        'White-label options',
        'API access',
        'Custom development'
      ],
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="seamless-matrix-page">
      {/* Hero Section */}
      <div className="seamless-hero">
        <div className="seamless-hero-content">
          <div className="seamless-title">
            <h1>SEAMLESS BUSINESS</h1>
            <div className="seamless-subtitle">
              <span className="tagline-text">All-In-One Platform</span>
            </div>
            <p className="seamless-description">
              Everything Your Business Needs in One Powerful Platform
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Section */}
      <div className="pricing-section">
        <div className="pricing-header">
          <h2>CHOOSE YOUR PLAN</h2>
          <p>Start your seamless journey today</p>
        </div>

        <div className="pricing-tiers">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card ${tier.featured ? 'featured-tier' : ''}`}
            >
              {tier.badge && <div className="tier-badge">{tier.badge}</div>}
              
              <div className="tier-header">
                <h3>{tier.name}</h3>
                {tier.subtitle && <p className="tier-subtitle">{tier.subtitle}</p>}
              </div>
              
              <div className="tier-pricing">
                <div className="tier-price">{tier.price}</div>
                <div className="tier-period">{tier.period}</div>
              </div>
              
              <ul className="tier-features-list">
                {tier.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <button type="button" className="tier-cta-button" onClick={() => setBookingOpen(true)}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <p>All plans include a 30-day money-back guarantee. No setup fees.</p>
        </div>
      </div>

      {/* Feature Comparison Section */}
      <div className="feature-comparison">
        <h2>COMPLETE FEATURE COMPARISON</h2>
        
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-col">Feature</div>
            <div className="tier-col">Starter</div>
            <div className="tier-col">Professional</div>
            <div className="tier-col">Enterprise</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Staff Accounts</div>
            <div className="feature-value">2</div>
            <div className="feature-value">10</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Orders/Month</div>
            <div className="feature-value">1,000</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">QR Code Ordering at Table</div>
            <div className="feature-value">✅</div>
            <div className="feature-value">✅</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Scheduling</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Advanced + Sync</div>
            <div className="feature-value">Advanced + Sync</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">POS Integration</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Advanced Reporting</div>
            <div className="feature-value">Full</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Mobile Ordering</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">QR Codes</div>
            <div className="feature-value">100</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Digital Event Ticketing</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">What's Next Concierge</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Reservations Management</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Delivery Service Integration</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Brand Customization</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Support</div>
            <div className="feature-value">Basic Email</div>
            <div className="feature-value">Priority</div>
            <div className="feature-value">Dedicated Manager</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Custom Integrations</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Advanced Analytics</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">White-Label / API / Custom Dev</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="seamless-cta">
        <h2>READY TO GO SEAMLESS?</h2>
        <p>Join businesses revolutionizing their operations</p>
        <button type="button" className="main-cta-button" onClick={() => setBookingOpen(true)}>
          <span>START YOUR FREE TRIAL</span>
        </button>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default SeamlessMatrix;

