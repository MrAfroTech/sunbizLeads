import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LightspeedSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [merchantId, setMerchantId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    const merchantIdParam = searchParams.get('merchant_id');
    const businessParam = searchParams.get('business');
    const emailParam = searchParams.get('email');
    
    if (merchantIdParam) {
      setMerchantId(merchantIdParam);
    }
    if (businessParam) {
      setBusinessName(businessParam);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/dashboard?integration=lightspeed&status=success');
  };

  const handleViewOrders = () => {
    // This would typically redirect to a dashboard showing Lightspeed orders
    navigate('/dashboard?view=orders&pos=lightspeed');
  };

  const completeVendorRegistration = async () => {
    setLoading(true);
    
    try {
      // Get the vendor management Lambda URL from environment
      const vendorLambdaUrl = process.env.REACT_APP_VENDOR_LAMBDA_URL;
      
      if (!vendorLambdaUrl) {
        throw new Error('Vendor Lambda URL not configured');
      }

      // Complete vendor registration by sending data to AWS
      const response = await fetch(`${vendorLambdaUrl}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantId,
          businessName: businessName,
          email: email,
          phone: '', // Phone not collected in Lightspeed OAuth flow
          accessToken: '', // We'll need to get this from the OAuth callback
          refreshToken: '' // We'll need to get this from the OAuth callback
        })
      });

      if (response.ok) {
        // Now invoke the customer bridge lambda to store the vendor data
        const customerBridgeUrl = process.env.REACT_APP_CUSTOMER_BRIDGE_URL;
        
        if (customerBridgeUrl) {
          try {
            const bridgeResponse = await fetch(`${customerBridgeUrl}/vendor-update`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                vendorId: merchantId,
                updateType: 'vendor_registered',
                data: {
                  businessName: businessName,
                  email: email,
                  posSystem: 'lightspeed',
                  status: 'active'
                }
              })
            });
            
            if (bridgeResponse.ok) {
              console.log('Customer bridge lambda invoked successfully');
            } else {
              console.warn('Customer bridge lambda call failed:', bridgeResponse.status);
            }
          } catch (bridgeError) {
            console.warn('Failed to invoke customer bridge lambda:', bridgeError);
          }
        }
        
        setRegistrationComplete(true);
        console.log('Vendor registration completed successfully');
      } else {
        const errorText = await response.text();
        console.error('Vendor registration failed:', response.status, errorText);
        throw new Error(`Vendor registration failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error completing vendor registration:', error);
      alert(`Failed to complete registration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h1>Registration Complete!</h1>
          <p>Your Lightspeed integration has been successfully completed.</p>
          
          <div className="success-details">
            <h3>Integration Details:</h3>
            <ul>
              <li><strong>Business:</strong> {businessName}</li>
              <li><strong>Email:</strong> {email}</li>
              <li><strong>Lightspeed Merchant ID:</strong> {merchantId}</li>
              <li><strong>Status:</strong> Active</li>
            </ul>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleContinue} className="btn-primary">
              Go to Dashboard
            </button>
            <button onClick={handleViewOrders} className="btn-secondary">
              View Orders
            </button>
          </div>
          
          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>Your business is now visible to customers</li>
              <li>Orders will automatically sync from Lightspeed</li>
              <li>You can manage your profile from the dashboard</li>
              <li>Check your email for setup instructions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h1>Lightspeed Integration Successful!</h1>
        <p>Your Lightspeed POS system has been successfully connected.</p>
        
        <div className="integration-details">
          <h3>Connection Details:</h3>
          <ul>
            <li><strong>Business:</strong> {businessName}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Lightspeed Merchant ID:</strong> {merchantId}</li>
            <li><strong>POS System:</strong> Lightspeed</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={completeVendorRegistration} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>
          
          <button onClick={handleContinue} className="btn-secondary">
            Continue to Dashboard
          </button>
        </div>
        
        <div className="integration-info">
          <h3>What This Means:</h3>
          <ul>
            <li>✅ Your Lightspeed account is now connected</li>
            <li>✅ Orders will automatically sync to our platform</li>
            <li>✅ Customers can find and order from your business</li>
            <li>✅ Real-time inventory and menu updates</li>
          </ul>
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
};

export default LightspeedSuccess;
