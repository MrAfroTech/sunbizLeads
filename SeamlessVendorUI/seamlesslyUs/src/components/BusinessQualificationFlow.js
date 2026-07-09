import React, { useState } from 'react';
import './BusinessQualificationFlow.css';

const BUSINESS_TYPES = [
  { id: 'food-truck', label: 'Food Truck', tagline: 'Mobile-first, event-ready' },
  { id: 'restaurant', label: 'Restaurant', tagline: 'Full-service & quick-service' },
  { id: 'bar-club', label: 'Bar / Club', tagline: 'High-volume, fast turnover' },
  { id: 'sports-team', label: 'Sports Team / Stadium', tagline: 'Game day operations, peak performance' },
  { id: 'catering', label: 'Event-Based Hospitality Operations', tagline: 'Off-site orders, on-point execution' },
  { id: 'coffee-shop', label: 'Coffee Shop / Café', tagline: 'Speed and simplicity' },
];

const INTENT_OPTIONS = [
  { id: 'payments', label: 'I need to accept payments', tagline: 'Card readers, mobile POS, integrations' },
  { id: 'online-ordering', label: 'I need online ordering', tagline: 'Web orders, delivery, skip-the-line' },
  { id: 'manage-business', label: 'I need to manage my business', tagline: 'Inventory, staff, reporting' },
  { id: 'exploring', label: "I'm exploring / comparing options", tagline: 'See demos, pricing, talk to sales' },
];

const OFFERINGS = {
  'digital-ticketing': {
    title: 'Digital Ticketing',
    description: 'Sell tickets online, manage events, and track attendance with our integrated ticketing platform.',
    icon: '🎫',
  },
  'inventory-management': {
    title: 'Inventory Management',
    description: 'Real-time stock tracking, automated reordering, and waste reduction analytics.',
    icon: '📦',
  },
  'scheduling': {
    title: 'Staff Scheduling',
    description: 'Optimize labor costs with intelligent scheduling, shift management, and time tracking.',
    icon: '📅',
  },
  'pos-integration': {
    title: 'POS Integration',
    description: 'Connect with Clover, Square, Lightspeed, and more. Unified reporting across all systems.',
    icon: '💳',
  },
  'delivery-aggregator': {
    title: 'Delivery Service Aggregator',
    description: 'Manage orders from DoorDash, Uber Eats, Grubhub, and more from one dashboard.',
    icon: '🚚',
  },
};

// Map business types and intents to relevant offerings
const getRelevantOfferings = (businessType, intent) => {
  const offerings = [];
  
  // Base offerings for all business types
  offerings.push('pos-integration');
  offerings.push('inventory-management');
  
  // Business type specific offerings
  if (businessType === 'sports-team') {
    offerings.push('digital-ticketing');
    offerings.push('scheduling');
  } else if (businessType === 'food-truck' || businessType === 'catering') {
    offerings.push('delivery-aggregator');
    offerings.push('scheduling');
  } else if (businessType === 'restaurant' || businessType === 'bar-club') {
    offerings.push('delivery-aggregator');
    offerings.push('scheduling');
  } else if (businessType === 'coffee-shop') {
    offerings.push('scheduling');
  }
  
  // Intent-based offerings
  if (intent === 'online-ordering') {
    if (!offerings.includes('delivery-aggregator')) {
      offerings.push('delivery-aggregator');
    }
  } else if (intent === 'manage-business') {
    if (!offerings.includes('scheduling')) {
      offerings.push('scheduling');
    }
  } else if (intent === 'payments') {
    // POS integration already included
  }
  
  // Remove duplicates and limit to 4-5 most relevant
  return [...new Set(offerings)].slice(0, 5);
};

const getPersonalizedMessage = (businessType, intent) => {
  const businessLabel = BUSINESS_TYPES.find((b) => b.id === businessType)?.label || '';
  const intentLabel = INTENT_OPTIONS.find((i) => i.id === intent)?.label || '';
  
  const messages = {
    'sports-team': {
      'payments': 'Streamline game day operations with integrated payment processing and ticketing.',
      'online-ordering': 'Enable fans to pre-order concessions and skip the lines on game day.',
      'manage-business': 'Manage inventory, staff schedules, and operations across all your venues.',
      'exploring': 'See how professional sports teams use Seamlessly to optimize game day revenue.',
    },
    'food-truck': {
      'payments': 'Accept payments anywhere with mobile POS and integrated payment processing.',
      'online-ordering': 'Take pre-orders, manage delivery platforms, and maximize every event.',
      'manage-business': 'Track inventory, schedule staff, and analyze performance across locations.',
      'exploring': 'Discover how food trucks scale operations and increase revenue with Seamlessly.',
    },
    'restaurant': {
      'payments': 'Unify payments across dine-in, takeout, and delivery with integrated POS systems.',
      'online-ordering': 'Consolidate orders from all delivery platforms into one streamlined workflow.',
      'manage-business': 'Optimize inventory, reduce waste, and manage staff schedules efficiently.',
      'exploring': 'See how restaurants increase efficiency and revenue with our all-in-one platform.',
    },
    'bar-club': {
      'payments': 'Handle high-volume transactions with fast, reliable payment processing.',
      'online-ordering': 'Offer table service ordering and manage delivery partnerships seamlessly.',
      'manage-business': 'Track inventory, schedule bartenders, and analyze peak hour performance.',
      'exploring': 'Learn how bars and clubs optimize operations during peak hours with Seamlessly.',
    },
    'catering': {
      'payments': 'Accept payments on-site and manage invoices for corporate and private events.',
      'online-ordering': 'Streamline order management across multiple events and delivery channels.',
      'manage-business': 'Coordinate inventory, staff, and equipment across multiple event locations.',
      'exploring': 'See how catering companies scale operations and manage complex event logistics.',
    },
    'coffee-shop': {
      'payments': 'Fast checkout with integrated payment processing and loyalty programs.',
      'online-ordering': 'Enable mobile ordering, curbside pickup, and delivery partnerships.',
      'manage-business': 'Track inventory, manage staff schedules, and optimize peak hour operations.',
      'exploring': 'Discover how coffee shops increase speed and efficiency with Seamlessly.',
    },
  };
  
  return messages[businessType]?.[intent] || 
    `Seamlessly is built for ${businessLabel.toLowerCase()} businesses like yours. Skip the complexity, scale revenue, and run everything from one platform.`;
};

const BusinessQualificationFlow = ({ onOpenFunnel }) => {
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState(null);
  const [intent, setIntent] = useState(null);

  const handleBusinessSelect = (type) => {
    setBusinessType(type);
    setStep(2);
  };

  const handleIntentSelect = (selectedIntent) => {
    setIntent(selectedIntent);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setBusinessType(null);
      setStep(1);
    } else if (step === 3) {
      setIntent(null);
      setStep(2);
    }
  };

  const handleStartOver = () => {
    setBusinessType(null);
    setIntent(null);
    setStep(1);
  };

  const handleCTAClick = () => {
    if (onOpenFunnel) {
      onOpenFunnel();
    }
  };

  const selectedBusinessLabel = BUSINESS_TYPES.find((b) => b.id === businessType)?.label || '';
  const selectedIntentLabel = INTENT_OPTIONS.find((i) => i.id === intent)?.label || '';

  return (
    <section className="bqf-section">
      <div className="bqf-container">
        <div className="bqf-white-box">
        {/* Step 1: Business Type */}
        {step === 1 && (
          <div className="bqf-step bqf-step-1">
            <h1 className="bqf-headline">What type of business are you?</h1>
            <p className="bqf-subheadline">Choose the one that best fits—we'll tailor everything to you.</p>
            <div className="bqf-grid bqf-business-grid">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  className="bqf-box"
                  onClick={() => handleBusinessSelect(type.id)}
                  type="button"
                >
                  <span className="bqf-box-label">{type.label}</span>
                  <span className="bqf-box-tagline">{type.tagline}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Intent */}
        {step === 2 && (
          <div className="bqf-step bqf-step-2">
            <button type="button" className="bqf-back" onClick={handleBack} aria-label="Go back">
              ← Back
            </button>
            <div className="bqf-breadcrumb">
              <span className="bqf-breadcrumb-item">{selectedBusinessLabel}</span>
            </div>
            <h1 className="bqf-headline">What are you looking for?</h1>
            <p className="bqf-subheadline">We'll show you exactly how Seamlessly fits your needs.</p>
            <div className="bqf-grid bqf-intent-grid">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className="bqf-box"
                  onClick={() => handleIntentSelect(opt.id)}
                  type="button"
                >
                  <span className="bqf-box-label">{opt.label}</span>
                  <span className="bqf-box-tagline">{opt.tagline}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Personalized CTA */}
        {step === 3 && (() => {
          const relevantOfferings = getRelevantOfferings(businessType, intent);
          const personalizedMessage = getPersonalizedMessage(businessType, intent);
          
          return (
            <div className="bqf-step bqf-step-3">
              <button type="button" className="bqf-back" onClick={handleBack} aria-label="Go back">
                ← Back
              </button>
              <div className="bqf-breadcrumb">
                <span className="bqf-breadcrumb-item">{selectedBusinessLabel}</span>
                <span className="bqf-breadcrumb-sep">→</span>
                <span className="bqf-breadcrumb-item">{selectedIntentLabel}</span>
              </div>
              <h1 className="bqf-headline">
                Perfect for {selectedBusinessLabel.toLowerCase()}
              </h1>
              <p className="bqf-subheadline bqf-cta-copy">
                {personalizedMessage}
              </p>
              
              {/* Relevant Offerings */}
              <div className="bqf-offerings">
                <h2 className="bqf-offerings-title">Here's what we can do for you:</h2>
                <div className="bqf-offerings-grid">
                  {relevantOfferings.map((offeringId) => {
                    const offering = OFFERINGS[offeringId];
                    if (!offering) return null;
                    return (
                      <div key={offeringId} className="bqf-offering-card">
                        <div className="bqf-offering-icon">{offering.icon}</div>
                        <h3 className="bqf-offering-title">{offering.title}</h3>
                        <p className="bqf-offering-description">{offering.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bqf-cta-actions">
                <button
                  type="button"
                  className="bqf-cta-primary"
                  onClick={handleCTAClick}
                >
                  Get Started — Book a Demo
                </button>
                <button
                  type="button"
                  className="bqf-cta-secondary"
                  onClick={handleStartOver}
                >
                  Start over
                </button>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </section>
  );
};

export default BusinessQualificationFlow;
