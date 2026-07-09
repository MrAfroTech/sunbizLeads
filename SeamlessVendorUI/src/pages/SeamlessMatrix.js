import React, { useState } from 'react';
import './SeamlessMatrix.css';

const SeamlessMatrix = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 1;

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$149',
      period: '/month',
      features: [
        '2 staff accounts',
        '1,000 appointments/month',
        'Massage booking system',
        'Basic scheduling',
        'POS with Square integration',
        'Mobile ordering (basic)',
        '5GB podcast storage',
        '100 QR codes',
        'Basic email support'
      ],
      color: '#10b981'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$249',
      period: '/month',
      featured: true,
      badge: 'Most Popular',
      features: [
        '10 staff accounts',
        'Unlimited appointments',
        'Full massage booking system',
        'Advanced scheduling with sync',
        'POS with Square + advanced reporting',
        'Mobile ordering (unlimited)',
        '50GB podcast storage',
        'Unlimited QR codes',
        'Event ticketing',
        'Priority support',
        'Custom integrations'
      ],
      color: '#d4af37'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$399',
      period: '/month',
      features: [
        'Unlimited staff accounts',
        'Unlimited everything',
        'All features in Professional',
        '200GB podcast storage',
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
              
              <button className="tier-cta-button">
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
            <div className="feature-name">Appointments/Month</div>
            <div className="feature-value">1,000</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Massage Booking System</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Full</div>
            <div className="feature-value">Full</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Scheduling</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Advanced + Sync</div>
            <div className="feature-value">Advanced + Sync</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">POS System</div>
            <div className="feature-value">Square Integration</div>
            <div className="feature-value">Square + Reporting</div>
            <div className="feature-value">Square + Reporting</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Mobile Ordering</div>
            <div className="feature-value">Basic</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Podcast Storage</div>
            <div className="feature-value">5GB</div>
            <div className="feature-value">50GB</div>
            <div className="feature-value">200GB</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">QR Codes</div>
            <div className="feature-value">100</div>
            <div className="feature-value">Unlimited</div>
            <div className="feature-value">Unlimited</div>
          </div>
          
          <div className="comparison-row">
            <div className="feature-name">Event Ticketing</div>
            <div className="feature-value">❌</div>
            <div className="feature-value">✅</div>
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
        </div>
      </div>

      {/* Call to Action */}
      <div className="seamless-cta">
        <h2>READY TO GO SEAMLESS?</h2>
        <p>Join businesses revolutionizing their operations</p>
        <button className="main-cta-button">
          <span>START YOUR FREE TRIAL</span>
        </button>
      </div>
    </div>
  );
};

export default SeamlessMatrix;

