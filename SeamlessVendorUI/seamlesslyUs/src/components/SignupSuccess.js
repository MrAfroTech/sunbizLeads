import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../styles/SignupSuccess.css';

const SignupSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // In a real implementation, you might want to verify the session with your backend
      console.log('Payment successful for session:', sessionId);
      setSessionData({ sessionId });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="signup-success">
        <div className="success-container">
          <div className="loading-spinner"></div>
          <h2>Processing your payment...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-success">
      <div className="success-container">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1>Welcome to EzDrink!</h1>
        <p className="success-message">
          Your payment was successful and your account has been created. 
          You'll receive a confirmation email shortly with your login details.
        </p>
        
        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>Check your email for login credentials</li>
            <li>Download the EzDrink mobile app</li>
            <li>Set up your inventory and menu items</li>
            <li>Start tracking your sales and profits</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="btn-primary">
            Return to Homepage
          </Link>
          <a 
            href="https://apps.apple.com/app/ezdrink" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Download Mobile App
          </a>
        </div>
        
        <div className="support-info">
          <p>
            Need help getting started? Contact our support team at{' '}
            <a href="mailto:support@ezdrink.us">support@ezdrink.us</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess; 