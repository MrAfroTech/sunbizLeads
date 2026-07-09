import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PayPalCallback = () => {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Processing PayPal authorization...');
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Extract the authorization code from URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                
                if (!code) {
                    throw new Error('No authorization code received from PayPal');
                }

                // Parse the state parameter to get integration data
                let integrationData = {};
                try {
                    if (state) {
                        integrationData = JSON.parse(decodeURIComponent(state));
                    }
                } catch (e) {
                    console.warn('Could not parse state parameter:', e);
                }

                setMessage('Exchanging authorization code for access token...');

                // Send the code to your Lambda function
                const response = await fetch(`${process.env.REACT_APP_PAYPAL_API_URL}/exchange-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        state: integrationData,
                        redirect_uri: process.env.REACT_APP_PAYPAL_REDIRECT_URI
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to exchange token');
                }

                const result = await response.json();
                
                setStatus('success');
                setMessage('PayPal account connected successfully!');

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    navigate('/dashboard', { 
                        state: { 
                            message: 'PayPal integration completed successfully!',
                            integrationData: result
                        }
                    });
                }, 2000);

            } catch (error) {
                console.error('PayPal callback error:', error);
                setStatus('error');
                setMessage(`Error: ${error.message}`);
                
                // Redirect to error page or dashboard after delay
                setTimeout(() => {
                    navigate('/dashboard', { 
                        state: { 
                            error: 'PayPal integration failed. Please try again.',
                            errorDetails: error.message
                        }
                    });
                }, 3000);
            }
        };

        handleCallback();
    }, [navigate]);

    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
                return '⏳';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '⏳';
        }
    };

    const getStatusClass = () => {
        switch (status) {
            case 'loading':
                return 'loading';
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            default:
                return 'loading';
        }
    };

    return (
        <div className="paypal-callback-container">
            <div className={`callback-status ${getStatusClass()}`}>
                <div className="status-icon">
                    {getStatusIcon()}
                </div>
                <h1>PayPal Integration</h1>
                <p className="status-message">{message}</p>
                
                {status === 'loading' && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="error-actions">
                        <button 
                            onClick={() => window.history.back()}
                            className="btn-retry"
                        >
                            ← Go Back
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="btn-dashboard"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayPalCallback;
