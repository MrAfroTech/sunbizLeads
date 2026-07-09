import React, { useState, useEffect } from 'react';
import '../styles/VendorIntegration.css';

const CloverOAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [integrationData, setIntegrationData] = useState(null);

    // Get integration data from URL parameters (passed from Klaviyo email)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const businessName = urlParams.get('businessName') || urlParams.get('business_name');
        const email = urlParams.get('email');
        const selectedPlan = urlParams.get('selectedPlan') || urlParams.get('selected_plan') || 'premium';
        
        // For testing purposes, allow demo data if no real data is present
        if (token && businessName && email) {
            setIntegrationData({
                token,
                businessName,
                email,
                selectedPlan
            });
        } else if (window.location.search.includes('demo=true')) {
            // Demo mode for testing
            setIntegrationData({
                token: 'demo-token-123',
                businessName: 'Demo Restaurant',
                email: 'demo@restaurant.com',
                selectedPlan: 'premium'
            });
        } else {
            setError('Integration link is invalid or missing required information. Please check your email for the correct link.');
        }
        
        document.title = "Clover Integration | Seamless";
    }, []);

    const handleStartIntegration = async () => {
        setLoading(true);
        
        try {
            console.log('🚀 Starting Clover integration for:', integrationData.businessName);
            
            // Build Clover OAuth URL with proper scopes and state
            // Clover uses v2/OAuth flow with different endpoints than Square
            const cloverOAuthUrl = `https://clover.com/oauth/authorize?client_id=${process.env.REACT_APP_CLOVER_CLIENT_ID || 'your_clover_client_id'}&scope=merchants.read&redirect_uri=${encodeURIComponent(window.location.origin + '/clover/callback')}&response_type=code&state=${encodeURIComponent(JSON.stringify({ 
                token: integrationData.token, 
                email: integrationData.email,
                businessName: integrationData.businessName,
                selectedPlan: integrationData.selectedPlan
            }))}`;
            
            console.log('Redirecting to Clover OAuth:', cloverOAuthUrl);
            
            // Redirect user to Clover OAuth immediately
            window.location.href = cloverOAuthUrl;
            
        } catch (error) {
            console.error('❌ Integration failed:', error);
            setError('Failed to start Clover integration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="square-integration-container">
                <div className="integration-header">
                    <div className="logo">Seamless</div>
                    <h1>❌ Integration Error</h1>
                    <p>{error}</p>
                    <button className="btn-primary" onClick={() => window.history.back()}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!integrationData) {
        return (
            <div className="square-integration-container">
                <div className="integration-header">
                    <div className="logo">Seamless</div>
                    <h1>⏳ Loading Integration...</h1>
                    <p>Please wait while we prepare your Clover integration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="square-integration-container">
            <div className="integration-header">
                <div className="logo">Seamless</div>
                <div className="tagline">Unlock Your Business Potential</div>
            </div>

            <div className="integration-content">
                <div className="success-card">
                    <div className="success-icon">🎉</div>
                    <h1>Congratulations, {integrationData.businessName}!</h1>
                    <p className="success-message">
                        You're just one step away from unlocking powerful business insights and increasing your revenue.
                    </p>
                </div>

                <div className="integration-card">
                    <h2>🔗 Complete Your Clover Integration</h2>
                    <p>
                        We've detected you're using Clover for your business. Let's connect your Clover account to start tracking your performance and identifying opportunities to boost your bottom line.
                    </p>
                    
                    <div className="features-list">
                        <h3>What you'll get with Clover integration:</h3>
                        <ul>
                            <li>✅ Real-time sales analytics and trends</li>
                            <li>✅ Customer behavior insights</li>
                            <li>✅ Revenue optimization recommendations</li>
                            <li>✅ Automated profit tracking</li>
                            <li>✅ Performance benchmarking</li>
                            <li>✅ Inventory management insights</li>
                        </ul>
                    </div>

                    <div className="integration-actions">
                        <button 
                            className="btn-integrate"
                            onClick={handleStartIntegration}
                            disabled={loading}
                        >
                            {loading ? '⏳ Connecting...' : '🔗 Connect Your Clover Account'}
                        </button>
                        
                        <p className="integration-note">
                            This will securely connect your Clover account to Seamless using OAuth 2.0. No sensitive data is stored on our servers.
                        </p>
                    </div>
                </div>

                <div className="info-cards">
                    <div className="info-card">
                        <div className="card-icon">🔒</div>
                        <h3>Secure OAuth 2.0</h3>
                        <p>Uses Clover's secure v2/OAuth flow with expiring tokens and refresh capabilities.</p>
                    </div>
                    
                    <div className="info-card">
                        <div className="card-icon">⏰</div>
                        <h3>Link Expires</h3>
                        <p>This integration link will expire in 7 days for security reasons.</p>
                    </div>
                    
                    <div className="info-card">
                        <div className="card-icon">📧</div>
                        <h3>Need Help?</h3>
                        <p>If you have questions, reply to your email or contact us at support@seamless.us</p>
                    </div>
                </div>

                <div className="business-details">
                    <h3>📋 Your Business Details</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <strong>Business:</strong> {integrationData.businessName}
                        </div>
                        <div className="detail-item">
                            <strong>Email:</strong> {integrationData.email}
                        </div>
                        <div className="detail-item">
                            <strong>Plan:</strong> {integrationData.selectedPlan}
                        </div>
                        <div className="detail-item">
                            <strong>Integration:</strong> Clover POS
                        </div>
                    </div>
                </div>
            </div>

            <div className="integration-footer">
                <p>© 2024 Seamless. All rights reserved.</p>
                <p>This integration was requested for {integrationData.email}</p>
            </div>
        </div>
    );
};

export default CloverOAuth;
