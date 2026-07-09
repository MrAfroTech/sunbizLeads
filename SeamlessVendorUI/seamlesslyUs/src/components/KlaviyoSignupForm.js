import React, { useState, useEffect } from 'react';
import './KlaviyoSignupForm.css';

const KlaviyoSignupForm = ({ 
  onSuccess, 
  onError, 
  defaultBusinessType = '',
  showBusinessType = true,
  showLocation = true,
  showPhone = true,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    businessType: defaultBusinessType,
    location: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Initialize Klaviyo when component mounts
  useEffect(() => {
    // Check if Klaviyo is already loaded
    if (typeof window.klaviyo !== 'undefined') {
      console.log('✅ Klaviyo already loaded');
      return;
    }

    // Load Klaviyo script if not present
    const script = document.createElement('script');
    script.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.REACT_APP_KLAVIYO_COMPANY_ID}`;
    script.async = true;
    script.onload = () => {
      console.log('✅ Klaviyo script loaded');
      // Initialize Klaviyo
      window.klaviyo = window.klaviyo || [];
      window.klaviyo.push(['open', 'viewed product', {
        product_id: 'ezdrink-signup',
        product_name: 'EzDrink Vendor Signup'
      }]);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Klaviyo script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setResult({ type: 'error', message: 'Email is required' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      // Check if Klaviyo is available
      if (typeof window.klaviyo === 'undefined') {
        throw new Error('Klaviyo not loaded. Please check your company ID configuration.');
      }

      // Track the signup event
      window.klaviyo.track('Vendor Signup', {
        email: formData.email.trim(),
        $first_name: formData.firstName.trim() || undefined,
        $last_name: formData.lastName.trim() || undefined,
        $company: formData.company.trim() || undefined,
        $phone_number: formData.phone.trim() || undefined,
        business_type: formData.businessType || undefined,
        location: formData.location.trim() || undefined,
        source: 'EzDrink React Form',
        signup_date: new Date().toISOString(),
        form_type: 'vendor_signup'
      });

      // Show success
      const successResult = {
        type: 'success',
        message: 'Successfully added to Klaviyo!',
        details: `Email: ${formData.email}`
      };
      
      setResult(successResult);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(formData, successResult);
      }

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        businessType: defaultBusinessType,
        location: ''
      });

    } catch (error) {
      console.error('Klaviyo signup error:', error);
      
      const errorResult = {
        type: 'error',
        message: 'Failed to add to Klaviyo',
        details: error.message
      };
      
      setResult(errorResult);
      
      // Call error callback if provided
      if (onError) {
        onError(error, errorResult);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`klaviyo-signup-form ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="company">Company/Bar Name</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Your Business Name"
            />
          </div>
        </div>

        {showPhone && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        )}

        {showBusinessType && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessType">Business Type</label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
              >
                <option value="">Select business type...</option>
                <option value="bar">Bar</option>
                <option value="restaurant">Restaurant</option>
                <option value="food-truck">Food Truck</option>
                <option value="nightclub">Nightclub</option>
                <option value="brewery">Brewery</option>
                <option value="winery">Winery</option>
                <option value="distillery">Distillery</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {showLocation && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State"
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding to Klaviyo...' : 'Add to Klaviyo List'}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className={`result ${result.type}`}>
          <h4>{result.type === 'success' ? '✅ Success!' : '❌ Error'}</h4>
          <p>{result.message}</p>
          {result.details && <p className="details">{result.details}</p>}
        </div>
      )}

      {/* Environment Check */}
      {!process.env.REACT_APP_KLAVIYO_COMPANY_ID && (
        <div className="warning">
          ⚠️ Warning: REACT_APP_KLAVIYO_COMPANY_ID not configured. 
          Add it to your .env file to enable Klaviyo integration.
        </div>
      )}
    </div>
  );
};

export default KlaviyoSignupForm; 