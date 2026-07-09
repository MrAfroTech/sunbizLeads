import React, { useState, useEffect } from 'react';
import '../styles/VendorIntegration.css';

const VendorIntegration = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vendorData, setVendorData] = useState(null);
  const [posSystem, setPosSystem] = useState('square'); // Default to Square

  // POS system configurations
  const posSystems = {
    square: {
      name: 'Square',
      icon: '💳',
      description: 'Connect your Square POS system',
      lambdaUrl: process.env.REACT_APP_SQUARE_LAMBDA_URL || 'https://your-square-lambda-url.lambda-url.us-east-1.on.aws',
      scope: 'MERCHANT_PROFILE_READ PAYMENTS_READ ORDERS_READ ORDERS_WRITE'
    },
    lightspeed: {
      name: 'Lightspeed',
      icon: '⚡',
      description: 'Connect your Lightspeed POS system',
      lambdaUrl: process.env.REACT_APP_LIGHTSPEED_LAMBDA_URL || '',
      scope: 'employee:all',
      configured: !!process.env.REACT_APP_LIGHTSPEED_LAMBDA_URL
    },
    clover: {
      name: 'Clover',
      icon: '📱',
      description: 'Connect your Clover POS system',
      oauthUrl: 'https://clover.com/oauth/authorize',
      clientId: process.env.REACT_APP_CLOVER_CLIENT_ID || '8JBVMZPB4R54C',
              redirectUri: process.env.REACT_APP_CLOVER_REDIRECT_URI || 'https://seamlessly.us/api/clover/oauth/callback',
      scope: 'merchants.read'
    },
    ncr_aloha: {
      name: 'NCR Aloha',
      icon: '🏢',
      description: 'Connect your NCR Aloha POS system',
      oauthUrl: 'https://gateway-staging.ncrcloud.com/oauth/authorize',
      clientId: process.env.REACT_APP_NCR_CLIENT_ID || 'YOUR_NCR_CLIENT_ID',
      redirectUri: process.env.REACT_APP_NCR_REDIRECT_URI || 'https://your-ncr-lambda-url.lambda-url.us-east-1.on.aws/',
      scope: 'SITES ORDERS MENU CUSTOMERS'
    },
    touchbistro: {
      name: 'TouchBistro',
      icon: '📱',
      description: 'Connect your TouchBistro POS system',
      oauthUrl: 'https://sandbox.touchbistro.com/v1/oauth/authorize',
      clientId: process.env.REACT_APP_TOUCHBISTRO_CLIENT_ID || 'YOUR_TOUCHBISTRO_CLIENT_ID',
      redirectUri: process.env.REACT_APP_TOUCHBISTRO_REDIRECT_URI || 'https://your-touchbistro-lambda-url.lambda-url.us-east-1.on.aws/',
      scope: 'read_orders read_menu read_locations'
    },
    toast: {
      name: 'Toast',
      icon: '🍞',
      description: 'Connect your Toast POS system',
      oauthUrl: 'https://toasttab.com/oauth/authorize',
      clientId: process.env.REACT_APP_TOAST_CLIENT_ID || 'YOUR_TOAST_CLIENT_ID',
      redirectUri: process.env.REACT_APP_TOAST_REDIRECT_URI || 'https://your-toast-lambda-url.lambda-url.us-east-1.on.aws/',
      scope: 'orders.read menu.read locations.read'
    },
    stripe: {
      name: 'Stripe',
      icon: '💳',
      description: 'Connect your Stripe account',
      oauthUrl: 'https://connect.stripe.com/oauth/authorize',
      clientId: process.env.REACT_APP_STRIPE_CLIENT_ID || 'pk_test_51RrQBtHVOwiLBsJy0cc1vkrKWpq3TdqmeSSxfJKra7YynHn0gxRgJcVAhMEriYS4bsdLdxAVDf0ry0XHaGiZ8Sl700MRTa5Ilu',
      redirectUri: process.env.REACT_APP_STRIPE_REDIRECT_URI || 'https://5sr6lhch3bzapg7yg6yn5o6xtq0grmpa.lambda-url.us-east-1.on.aws/stripe/oauth/callback',
      scope: 'read_write'
    },
    paypal: {
      name: 'PayPal',
      icon: '💰',
      description: 'Connect your PayPal account',
      oauthUrl: 'https://www.paypal.com/connect',
      clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || '',
      redirectUri: process.env.REACT_APP_PAYPAL_REDIRECT_URI || 'https://ugs5ub2hbdzrtougtftgvk4ynm0pisyk.lambda-url.us-east-1.on.aws/ppal/oauth/callback',
      scope: 'openid email profile'
    },
    shopify: {
      name: 'Shopify',
      icon: '🛍️',
      description: 'Connect your Shopify store',
      oauthUrl: 'https://your-shop-name.myshopify.com/admin/oauth/authorize',
      clientId: process.env.REACT_APP_SHOPIFY_CLIENT_ID || '',
      redirectUri: process.env.REACT_APP_SHOPIFY_REDIRECT_URI || 'https://f3sowgn4koagzmdfn56q6flzsa0qiqtb.lambda-url.us-east-1.on.aws/shopify-partner/oauth/callback',
      scope: 'read_products read_orders read_customers'
    },
    sumup: {
      name: 'SumUp',
      icon: '💰',
      description: 'Connect your SumUp payment processing',
      oauthUrl: 'https://api.sumup.com/authorize',
      clientId: process.env.REACT_APP_SUMUP_CLIENT_ID || '',
      redirectUri: process.env.REACT_APP_SUMUP_REDIRECT_URI || 'https://tn7qeexh7h6737ighkfwt43cbi0ywpov.lambda-url.us-east-1.on.aws/sumup/oauth/callback',
      scope: 'payments.read transactions.read'
    }
  };

  // Check for URL parameters from registration flow (for backward compatibility)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const phoneParam = urlParams.get('phone');
    const posParam = urlParams.get('pos');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (phoneParam) {
      setPhone(phoneParam);
      // Auto-lookup vendor data if phone is provided in URL
      handlePhoneLookup(phoneParam);
    } else if (emailParam) {
      // Fallback to email lookup if no phone provided
      handleEmailLookup(emailParam);
    }
    
    if (posParam && posSystems[posParam]) {
      console.log('🔧 Setting POS system from URL parameter:', posParam);
      setPosSystem(posParam);
    }
  }, []);

  const handlePhoneLookup = async (phoneToLookup) => {
    if (!phoneToLookup || !phoneToLookup.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    setVendorData(null);

    try {
      console.log('🔍 DEBUG: Starting vendor lookup process by phone');
      console.log('🔍 DEBUG: Looking up vendor data for phone:', phoneToLookup);
      
      // Call customer bridge lambda to find vendor by phone
      const customerBridgeLambdaUrl = process.env.REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL || 'https://e6v7rbwuqctzlkkcqtsxd4tgdy0iaogt.lambda-url.us-east-1.on.aws';
      
      console.log('🔍 DEBUG: Customer bridge lambda URL:', customerBridgeLambdaUrl);
      console.log('🔍 DEBUG: Full request URL:', `${customerBridgeLambdaUrl}/vendor-info?phone=${encodeURIComponent(phoneToLookup)}&limit=5`);
      
      const response = await fetch(`${customerBridgeLambdaUrl}/vendor-info?phone=${encodeURIComponent(phoneToLookup)}&limit=5`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Customer bridge response:', result);
      console.log('🔍 DEBUG: Response updates array:', result.updates);
      console.log('🔍 DEBUG: Number of updates found:', result.updates ? result.updates.length : 0);

      if (!result.updates || result.updates.length === 0) {
        console.log('🔍 DEBUG: No updates found in response');
        throw new Error('No vendor registration found for this phone number. Please check your phone number or complete the registration process first.');
      }

      // Log all updates for debugging
      console.log('🔍 DEBUG: All updates found:');
      result.updates.forEach((update, index) => {
        console.log(`🔍 DEBUG: Update ${index}:`, {
          updateType: update.updateType,
          phone: update.data?.phone,
          email: update.data?.email,
          businessName: update.data?.businessName,
          posSystem: update.data?.posSystem
        });
      });

      // Find the most recent vendor_registered record
      const vendorRecord = result.updates.find(update => 
        update.updateType === 'vendor_registered' && 
        update.data && 
        update.data.phone && 
        update.data.phone === phoneToLookup
      );

      console.log('🔍 DEBUG: Vendor record found:', vendorRecord);
      console.log('🔍 DEBUG: Phone comparison - looking for:', phoneToLookup);
      console.log('🔍 DEBUG: Available phones in updates:', result.updates.map(u => u.data?.phone));

      if (!vendorRecord) {
        console.log('🔍 DEBUG: No matching vendor record found');
        throw new Error('Vendor registration found but no valid registration data. Please contact support.');
      }

      console.log('✅ DEBUG: Found vendor data:', vendorRecord);
      setVendorData(vendorRecord);
      
      // Set POS system if it was specified during registration, but only if no URL parameter was provided
      if (!window.location.search.includes('pos=') && vendorRecord.data && vendorRecord.data.posSystem && posSystems[vendorRecord.data.posSystem.toLowerCase()]) {
        console.log('🔧 Setting POS system from database:', vendorRecord.data.posSystem.toLowerCase());
        setPosSystem(vendorRecord.data.posSystem.toLowerCase());
      } else if (window.location.search.includes('pos=')) {
        console.log('🔧 Keeping POS system from URL parameter, not overriding with database value');
      }

    } catch (error) {
      console.error('❌ DEBUG: Error looking up vendor data:', error);
      console.error('❌ DEBUG: Error message:', error.message);
      console.error('❌ DEBUG: Error stack:', error.stack);
      setError(error.message || 'Failed to look up vendor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLookup = async (emailToLookup) => {
    if (!emailToLookup || !emailToLookup.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setVendorData(null);

    try {
      console.log('🔍 DEBUG: Starting vendor lookup process');
      console.log('🔍 DEBUG: Looking up vendor data for email:', emailToLookup);
      console.log('🔍 DEBUG: Email to lookup (trimmed):', emailToLookup.trim());
      console.log('🔍 DEBUG: Email to lookup (lowercase):', emailToLookup.toLowerCase());
      
      // Call customer bridge lambda to find vendor by email
      const customerBridgeLambdaUrl = process.env.REACT_APP_CUSTOMER_BRIDGE_LAMBDA_URL || 'https://e6v7rbwuqctzlkkcqtsxd4tgdy0iaogt.lambda-url.us-east-1.on.aws';
      
      console.log('🔍 DEBUG: Customer bridge lambda URL:', customerBridgeLambdaUrl);
      console.log('🔍 DEBUG: Full request URL:', `${customerBridgeLambdaUrl}/vendor-info?email=${encodeURIComponent(emailToLookup)}&limit=5`);
      
      const response = await fetch(`${customerBridgeLambdaUrl}/vendor-info?email=${encodeURIComponent(emailToLookup)}&limit=5`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Customer bridge response:', result);
      console.log('🔍 DEBUG: Response updates array:', result.updates);
      console.log('🔍 DEBUG: Number of updates found:', result.updates ? result.updates.length : 0);

      if (!result.updates || result.updates.length === 0) {
        console.log('🔍 DEBUG: No updates found in response');
        throw new Error('No vendor registration found for this email address. Please check your email or complete the registration process first.');
      }

      // Log all updates for debugging
      console.log('🔍 DEBUG: All updates found:');
      result.updates.forEach((update, index) => {
        console.log(`🔍 DEBUG: Update ${index}:`, {
          updateType: update.updateType,
          email: update.data?.email,
          businessName: update.data?.businessName,
          posSystem: update.data?.posSystem
        });
      });

      // Find the most recent vendor_registered record
      const vendorRecord = result.updates.find(update => 
        update.updateType === 'vendor_registered' && 
        update.data && 
        update.data.email && 
        update.data.email.toLowerCase() === emailToLookup.toLowerCase()
      );

      console.log('🔍 DEBUG: Vendor record found:', vendorRecord);
      console.log('🔍 DEBUG: Email comparison - looking for:', emailToLookup.toLowerCase());
      console.log('🔍 DEBUG: Available emails in updates:', result.updates.map(u => u.data?.email?.toLowerCase()));

      if (!vendorRecord) {
        console.log('🔍 DEBUG: No matching vendor record found');
        throw new Error('Vendor registration found but no valid registration data. Please contact support.');
      }

      console.log('✅ DEBUG: Found vendor data:', vendorRecord);
      setVendorData(vendorRecord);
      
      // Set POS system if it was specified during registration, but only if no URL parameter was provided
      if (!window.location.search.includes('pos=') && vendorRecord.data && vendorRecord.data.posSystem && posSystems[vendorRecord.data.posSystem.toLowerCase()]) {
        console.log('🔧 Setting POS system from database:', vendorRecord.data.posSystem.toLowerCase());
        setPosSystem(vendorRecord.data.posSystem.toLowerCase());
      } else if (window.location.search.includes('pos=')) {
        console.log('🔧 Keeping POS system from URL parameter, not overriding with database value');
      }

    } catch (error) {
      console.error('❌ DEBUG: Error looking up vendor data:', error);
      console.error('❌ DEBUG: Error message:', error.message);
      console.error('❌ DEBUG: Error stack:', error.stack);
      setError(error.message || 'Failed to look up vendor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone) {
      handlePhoneLookup(phone);
    } else if (email) {
      handleEmailLookup(email);
    } else {
      setError('Please enter either a phone number or email address');
    }
  };

  const startIntegration = async () => {
    if (!vendorData) {
      setError('Please look up your vendor data first');
      return;
    }

    // For Square integration, call the seamless-square-oauth lambda
    if (posSystem === 'square') {
      try {
        console.log('🔗 Starting Square integration via Lambda...');
        
        // Get the Square lambda URL from environment
        const squareLambdaUrl = process.env.REACT_APP_SQUARE_LAMBDA_URL || 'https://your-square-lambda-url.lambda-url.us-east-1.on.aws';
        
        if (!squareLambdaUrl || squareLambdaUrl.includes('your-square-lambda-url')) {
          throw new Error('Square Lambda URL not configured. Please contact support.');
        }
        
        // Call Square lambda to start OAuth with email parameter
        const response = await fetch(`${squareLambdaUrl}/start-oauth?email=${encodeURIComponent(vendorData.data.email)}&business=${encodeURIComponent(vendorData.data.businessName)}&customer_id=${encodeURIComponent(vendorData.vendorId)}`);
        
        if (!response.ok) {
          throw new Error(`Square Lambda error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.authUrl) {
          console.log('✅ Square OAuth URL received, redirecting...');
          window.location.href = result.authUrl;
        } else {
          throw new Error(result.error || 'Failed to get Square OAuth URL');
        }
        
      } catch (error) {
        console.error('❌ Square integration error:', error);
        alert(`Square integration failed: ${error.message}`);
      }
      return;
    }

    // For Lightspeed integration, call the seamless-lightspeed-oauth lambda
    if (posSystem === 'lightspeed') {
      try {
        console.log('🔗 Starting Lightspeed integration via Lambda...');
        
        // Get the Lightspeed lambda URL from environment
        const lightspeedLambdaUrl = process.env.REACT_APP_LIGHTSPEED_LAMBDA_URL;
        
        if (!lightspeedLambdaUrl) {
          throw new Error('Lightspeed Lambda URL not configured. Please contact support to complete the setup.');
        }
        
        // Call Lightspeed lambda to start OAuth with email parameter
        const response = await fetch(`${lightspeedLambdaUrl}/start-oauth?email=${encodeURIComponent(vendorData.data.email)}&business=${encodeURIComponent(vendorData.data.businessName)}&customer_id=${encodeURIComponent(vendorData.vendorId)}`);
        
        if (!response.ok) {
          throw new Error(`Lightspeed Lambda error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.authUrl) {
          console.log('✅ Lightspeed OAuth URL received, redirecting...');
          window.location.href = result.authUrl;
        } else {
          throw new Error(result.error || 'Failed to get Lightspeed OAuth URL');
        }
        
      } catch (error) {
        console.error('❌ Lightspeed integration error:', error);
        alert(`Lightspeed integration failed: ${error.message}`);
      }
      return;
    }

    // For other POS systems - use direct OAuth (existing logic)
    const selectedSystem = posSystems[posSystem];
    
    if (!selectedSystem) {
      console.error('Selected POS system not found:', posSystem);
      alert(`Integration for ${posSystem} is not yet available. Please contact support.`);
      return;
    }

    const isConfigured = selectedSystem.clientId && 
                        selectedSystem.clientId.trim() !== '' &&
                        selectedSystem.redirectUri && 
                        selectedSystem.redirectUri.trim() !== '';

    if (!isConfigured) {
      console.error('POS system not properly configured:', selectedSystem);
      alert(`${selectedSystem.name} integration is not yet configured. Please contact support to complete the setup.`);
      return;
    }

    const stateData = {
      token: `integration_${Date.now()}`,
      email: vendorData.data.email,
      businessName: vendorData.data.businessName,
      selectedPlan: vendorData.data.plan || 'Premium',
      posSystem: posSystem,
      customer_id: vendorData.vendorId
    };
    
    const encodedState = encodeURIComponent(JSON.stringify(stateData));
    const clientId = selectedSystem.clientId;
    const redirectUri = selectedSystem.redirectUri;
    const scope = selectedSystem.scope;
    
    const oauthUrl = `${selectedSystem.oauthUrl}?client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodedState}`;
    
    console.log(`Starting ${selectedSystem.name} OAuth:`, oauthUrl);
    
    // Check if delay is enabled via environment variable
    const delayEnabled = process.env.REACT_APP_OAUTH_DELAY_ENABLED === 'true';
    const delayDuration = parseInt(process.env.REACT_APP_OAUTH_DELAY_MS) || 30000;
    
    if (delayEnabled) {
      // Add configurable delay before redirect
      console.log(`🚀 Waiting ${delayDuration/1000} seconds before redirecting to ${selectedSystem.name} OAuth...`);
      setTimeout(() => {
        console.log(`🚀 Now redirecting to ${selectedSystem.name} OAuth...`);
        window.location.href = oauthUrl;
      }, delayDuration);
    } else {
      // No delay - redirect immediately
      console.log(`🚀 Redirecting immediately to ${selectedSystem.name} OAuth...`);
      window.location.href = oauthUrl;
    }
  };

  const currentPOS = posSystems[posSystem] || posSystems.square;
  console.log('🔧 Current POS system for button:', posSystem, '->', currentPOS.name);

  return (
    <div className="vendor-integration-page">
      <div className="congratulations-container">
        <div className="congratulations-content" style={{ padding: '15px 20px' }}>
          <div className="success-icon" style={{ fontSize: '40px', marginBottom: '5px' }}>🚀</div>
          <h1>WELCOME TO OPERATIONAL EXCELLENCE</h1>
          <h2 style={{ marginBottom: '8px' }}>Distinguished. Elite. Unstoppable.</h2>
          
          <div className="welcome-message" style={{ margin: '0 auto 8px' }}>
            <p className="powerful-copy" style={{ marginBottom: '8px', lineHeight: '1.4' }}>
              You're about to operate at the level reserved for true industry titans. Every transaction flows through technology so advanced, your competitors won't even understand what hit them. This is where legends begin.
            </p>
          </div>

          {/* Email Lookup Form - Hidden but functionality preserved */}
          <div className="email-lookup-section" style={{ display: 'none' }}>
            <form onSubmit={handleSubmit} className="email-form">
              <div className="form-group">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number (e.g., (305) 434-0738)"
                  required
                  className="email-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address (optional)"
                  className="email-input"
                  disabled={loading}
                />
              </div>
            </form>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {vendorData && (
              <div className="vendor-info-display">
                <div className="success-badge">✅ Vendor Found!</div>
                <div className="vendor-details">
                  <h4>Business: {vendorData.data.businessName}</h4>
                  <p>Email: {vendorData.data.email}</p>
                  <p>Plan: {vendorData.data.plan || 'Premium'}</p>
                  <p>Status: {vendorData.data.status || 'Active'}</p>
                </div>
                <button 
                  className="not-you-button"
                  onClick={() => {
                    setVendorData(null);
                    setEmail('');
                    setError('');
                  }}
                >
                  Not You?
                </button>
              </div>
            )}
          </div>

          {/* Connect Section */}
          {vendorData && (
            <div className="connect-section" style={{ marginTop: '8px', padding: '12px' }}>
              <div className="selected-platform" style={{ marginBottom: '8px' }}>
                <p>CLICK BELOW</p>
              </div>
              
              {/* Check if POS system is properly configured */}
              {(() => {
                // Special configuration check for Square and Lightspeed
                let isConfigured;
                if (currentPOS.name === 'Square') {
                  isConfigured = currentPOS.lambdaUrl && 
                                 currentPOS.lambdaUrl.trim() !== '' &&
                                 !currentPOS.lambdaUrl.includes('your-square-lambda-url');
                } else if (currentPOS.name === 'Lightspeed') {
                  isConfigured = currentPOS.lambdaUrl && 
                                 currentPOS.lambdaUrl.trim() !== '';
                } else {
                  // For other POS systems, check clientId and redirectUri
                  isConfigured = currentPOS.clientId && 
                                currentPOS.clientId.trim() !== '' &&
                                currentPOS.redirectUri && 
                                currentPOS.redirectUri.trim() !== '';
                }
                
                if (!isConfigured) {
                  return (
                    <div className="pos-config-warning">
                      <p className="warning-title">
                        ⚠️ {currentPOS.name} Integration Setup Required
                      </p>
                      <p className="warning-message">
                        This POS system needs to be configured with proper credentials. 
                        Please contact support to complete the setup.
                      </p>
                    </div>
                  );
                }
                
                return (
                  <button
                    className="connect-button"
                    onClick={startIntegration}
                  >
                    SEAMLESSLY CONNECT WITH {currentPOS.name.toUpperCase()}
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorIntegration;
