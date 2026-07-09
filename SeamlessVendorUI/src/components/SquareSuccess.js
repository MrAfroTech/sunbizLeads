import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SquareSuccess = () => {
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
    navigate('/dashboard?integration=square&status=success');
  };

  const handleViewOrders = () => {
    // This would typically redirect to a dashboard showing Square orders
    navigate('/dashboard?view=orders&pos=square');
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
          phone: '', // Phone not collected in Square OAuth flow
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
                  posSystem: 'square',
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Vendor registration failed');
      }
    } catch (error) {
      console.error('Error completing vendor registration:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ color: '#28a745', marginBottom: '20px', fontSize: '32px' }}>
          Square Integration Complete!
        </h1>
        
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <p style={{ color: '#155724', margin: '0', fontSize: '18px' }}>
            <strong>Congratulations!</strong> Your Square account has been successfully connected.
          </p>
        </div>

        {merchantId && (
          <div style={{
            background: '#e2e3e5',
            border: '1px solid #d6d8db',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#495057' }}>
              Integration Details:
            </p>
            <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Merchant ID:</strong> {merchantId}
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Business:</strong> {businessName}
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Email:</strong> {email}
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              <strong>Status:</strong> <span style={{ color: '#ffc107' }}>⏳ Pending Registration</span>
            </p>
          </div>
        )}

        {!registrationComplete && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>🚀 Complete Vendor Registration</h4>
            <p style={{ margin: '0 0 20px 0', color: '#856404' }}>
              Your Square account is connected! Now complete your vendor registration to start receiving orders.
            </p>
            <button
              onClick={completeVendorRegistration}
              disabled={loading}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Completing Registration...' : '✅ Complete Registration'}
            </button>
          </div>
        )}

        {registrationComplete && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#155724' }}>🎉 Registration Complete!</h4>
            <p style={{ margin: '0', color: '#155724' }}>
              Your vendor registration is complete! You're now set up to receive orders from customers.
            </p>
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>🚀 What's Next?</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404' }}>
            <li>Start receiving orders from your customers</li>
            <li>View real-time transaction data</li>
            <li>Manage your menu and inventory</li>
            <li>Track sales performance</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleViewOrders}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '150px'
            }}
          >
            📊 View Orders
          </button>
          
          <button
            onClick={handleContinue}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '150px'
            }}
          >
            🏠 Go to Dashboard
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
            <strong>Need help?</strong> Our support team is available 24/7 to assist you with any questions about your Square integration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SquareSuccess;
