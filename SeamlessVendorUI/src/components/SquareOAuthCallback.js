import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SquareOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing Square integration...');
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔍 Square OAuth Callback - Debug Info:');
        console.log('  - Code:', code ? 'Present' : 'Missing');
        console.log('  - State:', state || 'None');
        console.log('  - Error:', errorParam || 'None');
        console.log('  - Error Description:', errorDescription || 'None');

        if (errorParam) {
          console.error('Square OAuth error:', errorParam, errorDescription);
          setError(`OAuth authorization failed: ${errorParam}`);
          setErrorDetails(errorDescription || 'Square rejected the authorization request');
          return;
        }

        if (!code) {
          setError('Authorization code is missing');
          setErrorDetails('Square did not return an authorization code. Please try connecting again.');
          return;
        }

        setStatus('Completing Square integration...');

        // Get the Square lambda URL from environment
        const squareLambdaUrl = process.env.REACT_APP_SQUARE_LAMBDA_URL;
        
        console.log('🔍 Square Lambda URL:', squareLambdaUrl ? 'Configured' : 'Missing');
        
        if (!squareLambdaUrl || squareLambdaUrl.includes('your-square-lambda-url')) {
          const errorMsg = 'Square Lambda URL not configured. Please contact support.';
          console.error('❌', errorMsg);
          setError(errorMsg);
          setErrorDetails('The Square integration service is not properly configured. Please contact support at support@seamlessly.us');
          return;
        }

        // Build the callback URL with proper encoding
        const callbackUrl = `${squareLambdaUrl}/oauth-callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
        
        console.log('🔗 Calling Square Lambda:', callbackUrl.replace(squareLambdaUrl, '[LAMBDA_URL]'));

        // Call the Square lambda to complete OAuth
        const response = await fetch(callbackUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('📡 Lambda Response Status:', response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = `Lambda error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error('❌ Lambda Error Details:', errorData);
          } catch (e) {
            const errorText = await response.text();
            console.error('❌ Lambda Error Text:', errorText);
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Lambda Response:', result);
        
        if (result.success) {
          setStatus('Square integration completed successfully!');
          
          // Redirect to success page
          setTimeout(() => {
            if (result.redirect_url) {
              console.log('🔗 Redirecting to:', result.redirect_url);
              window.location.href = result.redirect_url;
            } else {
              // Default redirect to square-success page
              console.log('🔗 Redirecting to square-success page');
              navigate('/square-success?integration=square&status=success');
            }
          }, 2000);
          
        } else {
          const errorMsg = result.error || result.message || 'Failed to complete Square integration';
          console.error('❌ Integration failed:', errorMsg);
          throw new Error(errorMsg);
        }

      } catch (error) {
        console.error('❌ Square OAuth callback error:', error);
        setError(error.message || 'An unexpected error occurred');
        setErrorDetails(error.stack || 'Please try again or contact support if the problem persists.');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ color: '#dc3545', marginBottom: '20px', fontSize: '24px' }}>Square Integration Failed</h1>
          <p style={{ color: '#333', marginBottom: '15px', fontSize: '16px', fontWeight: '500' }}>{error}</p>
          {errorDetails && (
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>{errorDetails}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/vendor-integration')}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = 'mailto:support@seamlessly.us?subject=Square Integration Issue'}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Contact Support
            </button>
          </div>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
            <p>If this problem persists, please contact support with the error details above.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h1 style={{ color: '#28a745', marginBottom: '20px' }}>Processing Square Integration</h1>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>{status}</p>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e9ecef',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#28a745',
            animation: 'pulse 2s infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SquareOAuthCallback;
