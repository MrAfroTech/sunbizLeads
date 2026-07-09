import React, { useState, useEffect } from 'react';
import '../styles/VendorIntegration.css';

const StripeOAuth = () => {
    const [integrationData, setIntegrationData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Extract integration data from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        const businessName = urlParams.get('businessName');
        const selectedPlan = urlParams.get('selectedPlan');

        if (token && email) {
            setIntegrationData({
                token,
                email,
                businessName: businessName || 'Your Business',
                selectedPlan: selectedPlan || 'Standard'
            });
        } else {
            setError('Missing required integration parameters');
        }
    }, []);

    const handleStartIntegration = async () => {
        if (!integrationData) {
            setError('Integration data not available');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Construct Stripe OAuth URL
            const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?client_id=${process.env.REACT_APP_STRIPE_CLIENT_ID || 'your_stripe_client_id'}&scope=read_write&redirect_uri=${encodeURIComponent(process.env.REACT_APP_STRIPE_REDIRECT_URI || window.location.origin + '/stripe/callback')}&response_type=code&state=${encodeURIComponent(JSON.stringify({
                token: integrationData.token,
                email: integrationData.email,
                businessName: integrationData.businessName,
                selectedPlan: integrationData.selectedPlan
            }))}`;

            console.log('Redirecting to Stripe OAuth:', stripeOAuthUrl);
            
            // Redirect to Stripe OAuth
            window.location.href = stripeOAuthUrl;
            
        } catch (err) {
            console.error('Error starting Stripe integration:', err);
            setError('Failed to start integration. Please try again.');
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="vendor-integration-container">
                <div className="error-message">
                    <h2>❌ Integration Error</h2>
                    <p>{error}</p>
                    <p>Please check your integration link and try again.</p>
                </div>
            </div>
        );
    }

    if (!integrationData) {
        return (
            <div className="vendor-integration-container">
                <div className="loading-message">
                    <h2>⏳ Loading Integration...</h2>
                    <p>Please wait while we prepare your Stripe integration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vendor-integration-container">
            <div className="integration-header">
                <h1>🔗 Stripe Integration</h1>
                <p>Connect your Stripe account to Seamless</p>
            </div>

            <div className="integration-details">
                <h2>Business Information</h2>
                <div className="details-grid">
                    <div className="detail-item">
                        <strong>Business Name:</strong>
                        <span>{integrationData.businessName}</span>
                    </div>
                    <div className="detail-item">
                        <strong>Email:</strong>
                        <span>{integrationData.email}</span>
                    </div>
                    <div className="detail-item">
                        <strong>Plan:</strong>
                        <span>{integrationData.selectedPlan}</span>
                    </div>
                    <div className="detail-item">
                        <strong>Integration:</strong>
                        <span>Stripe Connect</span>
                    </div>
                </div>
            </div>

            <div className="integration-benefits">
                <h2>What You'll Get</h2>
                <ul>
                    <li>✅ Real-time payment analytics and insights</li>
                    <li>✅ Customer behavior and transaction patterns</li>
                    <li>✅ Revenue optimization recommendations</li>
                    <li>✅ Automated profit tracking and reporting</li>
                    <li>✅ Performance benchmarking against industry standards</li>
                    <li>✅ Subscription and recurring revenue insights</li>
                    <li>✅ Fraud detection and risk management</li>
                </ul>
            </div>

            <div className="stripe-specific-features">
                <h2>💳 Stripe-Specific Benefits</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">💳</div>
                        <h3>Payment Analytics</h3>
                        <p>Track payment methods, transaction volumes, and processing fees across all channels</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Multi-Channel Insights</h3>
                        <p>Monitor performance across web, mobile, and in-person transactions</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔄</div>
                        <h3>Subscription Analytics</h3>
                        <p>Track recurring revenue, churn rates, and subscription lifecycle</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Advanced Reporting</h3>
                        <p>Comprehensive dashboards for business intelligence and decision making</p>
                    </div>
                </div>
            </div>

            <div className="integration-actions">
                <button 
                    className="btn-integrate"
                    onClick={handleStartIntegration}
                    disabled={isLoading}
                >
                    {isLoading ? '⏳ Connecting...' : '💳 Connect Your Stripe Account'}
                </button>
                
                <p className="integration-note">
                    This will securely connect your Stripe Connect account to Seamless. 
                    No sensitive payment data is stored on our servers.
                </p>
            </div>

            <div className="security-info">
                <h3>🔒 Security & Privacy</h3>
                <ul>
                    <li>OAuth 2.0 secure authentication</li>
                    <li>No access to customer payment details</li>
                    <li>Read-only access to business analytics</li>
                    <li>256-bit SSL encryption</li>
                    <li>SOC 2 Type II compliant</li>
                </ul>
            </div>

            <div className="integration-footer">
                <p>Need help? Contact us at support@seamless.us</p>
                <p>This integration link expires in 7 days for security reasons.</p>
            </div>
        </div>
    );
};

export default StripeOAuth;
