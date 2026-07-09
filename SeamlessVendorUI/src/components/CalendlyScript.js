import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import '../styles/CalendlyScript.css';

const PLANS = [
    {
        id: 'free',
        name: 'Forever Free',
        price: '$0',
        period: '/month',
        features: [
            'Basic vendor profile',
            'QR code generation',
            'Basic analytics',
            'Email support'
        ],
        description: 'Perfect for getting started',
        color: '#10b981'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$39.99',
        period: '/month',
        features: [
            'Everything in Free',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'Multiple locations'
        ],
        description: 'Most popular choice',
        featured: true,
        color: '#3b82f6'
    },
    {
        id: 'ultimate',
        name: 'Ultimate',
        price: '$79.99',
        period: '/month',
        features: [
            'Everything in Pro',
            'White-label solution',
            'API access',
            'Dedicated account manager',
            'Custom integrations'
        ],
        description: 'For enterprise needs',
        color: '#8b5cf6'
    }
];

const CalendlyScriptForm = ({ stripeEnvironment }) => {
    useEffect(() => {
        document.title = "Seamless | Views, Vendors, Venues & Vibes";
    }, []);

    return (
        <div className="direct-signup-container">
            <div className="direct-signup-inner">
                {/* Pricing Tiers */}
                <div className="pricing-tiers-container">
                    <div className="pricing-tiers-horizontal">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                className={`pricing-tier ${plan.featured ? 'featured' : ''}`}
                            >
                                {plan.featured && <div className="tier-badge">Most Popular</div>}
                                <div className="tier-header">
                                    <h3>{plan.name}</h3>
                                </div>
                                <div className="tier-price">{plan.price}</div>
                                <div className="tier-period">{plan.period}</div>
                                <ul className="tier-features">
                                    {plan.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pricing-info">
                        <p>All plans include a 30-day money-back guarantee. No setup fees.</p>
                    </div>
                </div>

                {/* Registration Form */}
                <div className="registration-form-container">
                    <div className="direct-signup-form">
                        <div className="button-container">
                            <button className="cta-button" onClick={() => window.location.href = '/signup'}>
                                Let's Get Started
                            </button>
                            <button className="cta-button secondary" onClick={() => window.location.href = '/calendar-box'}>
                                I'm Curious... Let's Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendlyScript = () => {
    const [stripe, setStripe] = useState(null);
    const [stripeEnvironment, setStripeEnvironment] = useState('test');

    useEffect(() => {
        const initStripe = async () => {
            const environment = process.env.REACT_APP_STRIPE_ENVIRONMENT || 'test';
            setStripeEnvironment(environment);
            
            const stripeKey = environment === 'test' 
                ? process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY 
                : process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
            
            if (!stripeKey) {
                console.error('Stripe key not found for environment:', environment);
                return;
            }
            
            const stripeInstance = await loadStripe(stripeKey);
            setStripe(stripeInstance);
        };
        
        initStripe();
    }, []);

    if (!stripe) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '50px', 
                fontSize: '18px',
                color: '#666' 
            }}>
                <div>⏳ Loading payment system...</div>
                <div style={{ 
                    marginTop: '20px', 
                    fontSize: '14px', 
                    padding: '10px', 
                    backgroundColor: stripeEnvironment === 'test' ? '#fff3cd' : '#d1ecf1',
                    border: `1px solid ${stripeEnvironment === 'test' ? '#ffeaa7' : '#bee5eb'}`,
                    borderRadius: '8px',
                    color: stripeEnvironment === 'test' ? '#856404' : '#0c5460'
                }}>
                    🔧 Stripe Environment: {stripeEnvironment.toUpperCase()}
                    {stripeEnvironment === 'test' && ' (Test Mode - No real charges)'}
                    {stripeEnvironment === 'production' && ' (Production Mode - Real charges)'}
                </div>
            </div>
        );
    }

    return (
        <Elements stripe={stripe}>
            <CalendlyScriptForm stripeEnvironment={stripeEnvironment} />
        </Elements>
    );
};

export default CalendlyScript; 