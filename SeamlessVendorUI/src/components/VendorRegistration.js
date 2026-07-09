import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorRegistration.css';

const VendorRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send to Klaviyo - this will trigger your email sequence
      const response = await fetch('/api/klaviyo/add-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'vendor_registration',
          trigger_email: true
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
                vendorId: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                updateType: 'vendor_registered',
                data: {
                  businessName: formData.businessName,
                  email: formData.email,
                  phone: formData.phone,
                  posSystem: 'square',
                  status: 'pending',
                  source: 'vendor_registration'
                }
              })
            });
            
            if (bridgeResponse.ok) {
              console.log('✅ Customer bridge lambda invoked successfully');
            } else {
              console.warn('⚠️ Customer bridge lambda call failed:', bridgeResponse.status);
            }
          } catch (bridgeError) {
            console.warn('⚠️ Failed to invoke customer bridge lambda:', bridgeError);
          }
        } else {
          console.warn('⚠️ Customer bridge URL not configured');
        }
        
        // Redirect to vendor integration with vendor data
        const params = new URLSearchParams({
          token: `vendor_${Date.now()}`,
          email: formData.email,
          business: formData.businessName,
          plan: 'Premium',
          pos: 'square'
        });
        navigate(`/vendor-integration?${params.toString()}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="vendor-registration">
      <div className="registration-container">
        <h1>Join EzDrink Marketplace</h1>
        <p className="subtitle">
          Accept mobile orders in 2 minutes. Connect your Square account and start receiving orders today.
        </p>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              placeholder="Your business name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="(555) 123-4567"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? '⏳ Submitting...' : 'Complete Registration with Square'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="benefits">
          <h3>Why EzDrink?</h3>
          <ul>
            <li>✅ Connect your Square account in 2 minutes</li>
            <li>✅ Start receiving mobile orders immediately</li>
            <li>✅ No monthly fees</li>
            <li>✅ No new equipment needed</li>
            <li>✅ QR codes for easy ordering</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration; 