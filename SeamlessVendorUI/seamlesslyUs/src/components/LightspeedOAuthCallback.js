import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LightspeedOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing Lightspeed integration...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          console.error('Lightspeed OAuth error:', error);
          setError(`OAuth authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setError('Authorization code is missing');
          return;
        }

        setStatus('Completing Lightspeed integration...');

        // Get the Lightspeed lambda URL from environment
        const lightspeedLambdaUrl = process.env.REACT_APP_LIGHTSPEED_LAMBDA_URL;
        
        if (!lightspeedLambdaUrl) {
          throw new Error('Lightspeed Lambda URL not configured');
        }

        // Call the Lightspeed lambda to complete OAuth
        const response = await fetch(`${lightspeedLambdaUrl}/oauth-callback?code=${code}&state=${state || ''}`);
        
        if (!response.ok) {
          throw new Error(`Lambda error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setStatus('✅ Lightspeed integration completed successfully!');
          
          // Redirect to success page with merchant data
          const successUrl = `/lightspeed-success?merchant_id=${result.merchant_id}&business=${encodeURIComponent(result.business)}&email=${encodeURIComponent(result.email)}`;
          
          setTimeout(() => {
            navigate(successUrl);
          }, 2000);
          
        } else {
          throw new Error(result.error || 'Failed to complete Lightspeed integration');
        }
        
      } catch (error) {
        console.error('❌ Lightspeed OAuth callback error:', error);
        setError(`Integration failed: ${error.message}`);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="oauth-callback-container">
        <div className="oauth-callback-content">
          <div className="error-icon">❌</div>
          <h1>Lightspeed Integration Failed</h1>
          <p className="error-message">{error}</p>
          
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/vendor-integration')}
              className="btn-primary"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
          
          <div className="support-info">
            <p>
              <strong>Need Help?</strong> Contact our support team at{' '}
              <a href="mailto:support@seamless.us">support@seamless.us</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-content">
        <div className="loading-icon">⏳</div>
        <h1>Processing Lightspeed Integration</h1>
        <p className="status-message">{status}</p>
        
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        
        <div className="info-message">
          <p>Please wait while we complete your Lightspeed integration...</p>
          <p>This may take a few moments.</p>
        </div>
      </div>
    </div>
  );
};

export default LightspeedOAuthCallback;
