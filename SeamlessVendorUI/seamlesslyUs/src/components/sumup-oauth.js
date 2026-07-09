import React, { useState, useEffect } from 'react';
import '../styles/VendorIntegration.css';

const SumUpOAuth = () => {
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
            // Construct SumUp OAuth URL
            const sumupOAuthUrl = `https://api.sumup.com/authorize?client_id=${process.env.REACT_APP_SUMUP_CLIENT_ID || 'your_sumup_client_id'}&scope=payments transactions merchants&redirect_uri=${encodeURIComponent(window.location.origin + '/sumup/callback')}&response_type=code&state=${encodeURIComponent(JSON.stringify({
                token: integrationData.token,
                email: integrationData.email,
                businessName: integrationData.businessName,
                selectedPlan: integrationData.selectedPlan
            }))}`;

            console.log('Redirecting to SumUp OAuth:', sumupOAuthUrl);
            
            // Redirect to SumUp OAuth
            window.location.href = sumupOAuthUrl;
            
        } catch (err) {
            console.error('Error starting SumUp integration:', err);
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
                    <p>Please wait while we prepare your SumUp integration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vendor-integration-container">
            <div className="integration-header">
                <h1>🔗 SumUp Integration</h1>
                <p>Connect your SumUp account to Seamless</p>
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
                        <span>SumUp Payment Processing</span>
                    </div>
                </div>
            </div>

            <div className="integration-benefits">
                <h2>What You'll Get</h2>
                <ul>
                    <li>✅ Payment processing analytics and insights</li>
                    <li>✅ Transaction pattern analysis</li>
                    <li>✅ Revenue optimization recommendations</li>
                    <li>✅ Automated profit tracking and reporting</li>
                    <li>✅ Performance benchmarking</li>
                    <li>✅ Mobile payment insights</li>
                    <li>✅ Fraud protection analytics</li>
                </ul>
            </div>

            <div className="integration-actions">
                <button 
                    className="btn-integrate"
                    onClick={handleStartIntegration}
                    disabled={isLoading}
                >
                    {isLoading ? '⏳ Connecting...' : '💳 Connect Your SumUp Account'}
                </button>
                
                <p className="integration-note">
                    This will securely connect your SumUp account to Seamless. 
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

export default SumUpOAuth;
