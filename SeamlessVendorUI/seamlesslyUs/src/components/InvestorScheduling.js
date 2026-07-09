import React, { useEffect } from 'react';
import '../styles/InvestorScheduling.css';

const InvestorScheduling = () => {
    useEffect(() => {
        // Load Calendly widget script
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup script when component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div className="investor-scheduling-container">
            <div className="investor-scheduling-content">
                <h1>Schedule Your Investment Discussion</h1>
                <p>Book Your Confidential Investment Meeting</p>
                <p className="subtitle">Discuss partnership opportunities and growth projections</p>
                
                <div className="investment-focus-areas">
                    <p>Due Diligence Materials</p>
                    <p>Financial Projections</p>
                    <p>Market Analysis</p>
                    <p>Competitive Positioning</p>
                    <p>Exit Strategy Discussion</p>
                    <p>Partnership Terms</p>
                    <p>Growth Trajectory</p>
                    <p>Revenue Model Deep Dive</p>
                </div>
                
                <div className="meeting-types">
                    <h3>Available Meeting Types:</h3>
                    <div className="meeting-options">
                        <div className="meeting-option">
                            <strong>Investment Overview Call (30 min)</strong>
                            <p>Initial discussion of partnership opportunities</p>
                        </div>
                        <div className="meeting-option">
                            <strong>Due Diligence Meeting (60 min)</strong>
                            <p>Comprehensive review of financials and projections</p>
                        </div>
                        <div className="meeting-option">
                            <strong>Partnership Discussion (45 min)</strong>
                            <p>Strategic alignment and partnership terms</p>
                        </div>
                    </div>
                </div>
                
                <div className="calendly-widget-container">
                    <iframe 
                        src="https://calendly.com/team-ezdrink/30min"
                        width="100%" 
                        height="630"
                        frameBorder="0">
                    </iframe>
                </div>
                
                <div className="confirmation-messaging">
                    <h3>What to Expect:</h3>
                    <ul>
                        <li>We'll review financials, projections, and partnership terms</li>
                        <li>Present our growth strategy and market opportunity</li>
                        <li>Discuss competitive positioning and market analysis</li>
                        <li>Explore partnership alignment and investment tiers</li>
                        <li>Answer due diligence questions and provide materials</li>
                    </ul>
                </div>
                
                <div className="cta-buttons">
                    <button className="primary-button">Schedule Investment Call</button>
                    <button className="secondary-button">Book Due Diligence Meeting</button>
                    <button className="tertiary-button">Reserve Your Slot</button>
                </div>
                
                <div className="trust-signals">
                    <p className="guarantee">Confidential discussions. Accredited investors only. Due diligence materials available upon request.</p>
                    <div className="security-badges">
                        <span className="security-badge">🔒 Confidential</span>
                        <span className="security-badge">📊 Accredited Only</span>
                        <span className="security-badge">📋 Due Diligence Ready</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestorScheduling;

