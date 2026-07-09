import React, { useState } from 'react';

const EzFestVendorContract = () => {
  const [formData, setFormData] = useState({
    // Vendor Information
    businessName: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyEmail: '',
    
    // POS System Information
    currentPOS: '',
    posVersion: '',
    integrationContact: '',
    
    // Payment Information
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    
    // Signature
    signatureDate: new Date().toISOString().split('T')[0],
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    const requiredFields = [
      'businessName', 'contactName', 'contactTitle', 'contactPhone', 
      'contactEmail', 'currentPOS', 'cardNumber', 'expirationMonth', 
      'expirationYear', 'cvv', 'cardholderName', 'billingAddress', 
      'billingCity', 'billingState', 'billingZip'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    // Phone validation
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.contactPhone && !phoneRegex.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }
    
    // Credit card validation (basic)
    if (formData.cardNumber && formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    // CVV validation
    if (formData.cvv && (formData.cvv.length < 3 || formData.cvv.length > 4)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store in localStorage for demo purposes
      localStorage.setItem('ezfest_vendor_contract', JSON.stringify({
        ...formData,
        submittedAt: new Date().toISOString()
      }));
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting contract:', error);
      alert('There was an error submitting your contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px 20px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        color: 'white',
        borderRadius: '10px'
      }}>
        <h2 style={{ color: '#e0b841', marginBottom: '20px' }}>Contract Submitted Successfully!</h2>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Thank you, {formData.contactName}! Your EzFest vendor contract has been received.
        </p>
        <p style={{ marginBottom: '30px' }}>
          We'll begin setting up your integration immediately and contact you within 24 hours to complete the setup process.
        </p>
        <div style={{
          background: 'rgba(224, 184, 65, 0.1)',
          border: '1px solid #e0b841',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#e0b841', marginBottom: '10px' }}>Next Steps:</h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <li>You'll receive a confirmation email within 5 minutes</li>
            <li>Our technical team will contact you within 24 hours</li>
            <li>Setup and integration will be completed within 5 minutes of your POS access</li>
            <li>Your 3-month free trial begins immediately after setup</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Montserrat', Arial, sans-serif",
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#121212',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        color: 'white',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '10px 10px 0 0'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          margin: '0 0 10px 0' 
        }}>
          <span style={{ color: '#e0b841' }}>EzFest</span> Vendor Service Agreement
        </h1>
        <p style={{ fontSize: '18px', opacity: '0.9', margin: '0' }}>
          Digital Contract Completion
        </p>
      </div>

      {/* Form Container */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        color: '#ffffff'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Service Overview */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#e0b841', 
              borderBottom: '2px solid #e0b841', 
              paddingBottom: '10px',
              fontSize: '24px'
            }}>
              Service Overview
            </h2>
            <div style={{
              background: 'rgba(224, 184, 65, 0.1)',
              border: '2px solid #e0b841',
              padding: '20px',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#e0b841', marginTop: '0' }}>What You Get:</h3>
              <ul style={{ lineHeight: '1.6' }}>
                <li><strong>3 months FREE trial</strong> - No upfront payment required</li>
                <li><strong>5-minute setup</strong> with any POS system</li>
                <li><strong>QR code ordering</strong> for customers</li>
                <li><strong>Real-time analytics</strong> and reporting</li>
                <li><strong>24/7 support</strong> during events</li>
              </ul>
              <p style={{ 
                fontWeight: '700', 
                color: '#e0b841', 
                marginBottom: '0',
                fontSize: '18px'
              }}>
                After trial: $39.99/month automatically charged
              </p>
            </div>
          </div>

          {/* Vendor Information */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#e0b841', 
              borderBottom: '2px solid #e0b841', 
              paddingBottom: '10px' 
            }}>
              Vendor Information
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#ffffff'
                }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.businessName ? '2px solid #e74c3c' : '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="Your Business Name"
                />
                {errors.businessName && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.businessName}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.contactName ? '2px solid #e74c3c' : '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="John Smith"
                />
                {errors.contactName && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.contactName}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="contactTitle"
                  value={formData.contactTitle}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.contactTitle ? '2px solid #e74c3c' : '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="Owner / Manager"
                />
                {errors.contactTitle && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.contactTitle}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.contactPhone ? '2px solid #e74c3c' : '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="(555) 123-4567"
                />
                {errors.contactPhone && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.contactPhone}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.contactEmail ? '2px solid #e74c3c' : '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="john@yourbar.com"
                />
                {errors.contactEmail && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#e0b841', marginBottom: '15px' }}>Emergency Contact Information</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="Emergency Contact Name"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#ffffff'
                  }}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Emergency Email
                </label>
                <input
                  type="email"
                  name="emergencyEmail"
                  value={formData.emergencyEmail}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="emergency@yourbar.com"
                />
              </div>
            </div>
          </div>

          {/* POS System Information */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#3b0d63', 
              borderBottom: '2px solid #d4af37', 
              paddingBottom: '10px' 
            }}>
              POS System Information
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Current POS System *
                </label>
                <select
                  name="currentPOS"
                  value={formData.currentPOS}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.currentPOS ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select POS System</option>
                  <option value="Square">Square</option>
                  <option value="Clover">Clover</option>
                  <option value="Toast">Toast</option>
                  <option value="Shopify POS">Shopify POS</option>
                  <option value="Stripe Terminal">Stripe Terminal</option>
                  <option value="SumUp">SumUp</option>
                  <option value="Other">Other</option>
                </select>
                {errors.currentPOS && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.currentPOS}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Version/Model
                </label>
                <input
                  type="text"
                  name="posVersion"
                  value={formData.posVersion}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Version or Model"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Integration Contact
                </label>
                <input
                  type="text"
                  name="integrationContact"
                  value={formData.integrationContact}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Who handles POS integration?"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#3b0d63', 
              borderBottom: '2px solid #d4af37', 
              paddingBottom: '10px' 
            }}>
              Payment Information
            </h2>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #e0b841',
              borderRadius: '8px',
              padding: '15px',
              margin: '20px 0'
            }}>
              <p style={{ margin: '0', fontWeight: '600', color: '#856404' }}>
                💳 Credit card will be charged $39.99 monthly beginning 91 days after service activation
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Credit Card Number *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.cardNumber ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="1234 5678 9012 3456"
                />
                {errors.cardNumber && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.cardNumber}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Expiration Month *
                </label>
                <select
                  name="expirationMonth"
                  value={formData.expirationMonth}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.expirationMonth ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Month</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={String(i+1).padStart(2, '0')}>
                      {String(i+1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                {errors.expirationMonth && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.expirationMonth}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Expiration Year *
                </label>
                <select
                  name="expirationYear"
                  value={formData.expirationYear}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.expirationYear ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Year</option>
                  {Array.from({length: 10}, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
                {errors.expirationYear && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.expirationYear}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  CVV *
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  maxLength="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.cvv ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="123"
                />
                {errors.cvv && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.cvv}
                  </span>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.cardholderName ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="John Smith"
                />
                {errors.cardholderName && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.cardholderName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#e0b841', marginBottom: '15px' }}>Billing Address</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  Address *
                </label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.billingAddress ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="123 Main Street"
                />
                {errors.billingAddress && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.billingAddress}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  City *
                </label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.billingCity ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="City"
                />
                {errors.billingCity && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.billingCity}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  State *
                </label>
                <input
                  type="text"
                  name="billingState"
                  value={formData.billingState}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.billingState ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="State"
                />
                {errors.billingState && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.billingState}
                  </span>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '5px',
                  color: '#333'
                }}>
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="billingZip"
                  value={formData.billingZip}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.billingZip ? '2px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="12345"
                />
                {errors.billingZip && (
                  <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                    {errors.billingZip}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#3b0d63', 
              borderBottom: '2px solid #d4af37', 
              paddingBottom: '10px' 
            }}>
              Terms and Conditions
            </h2>
            
            <div style={{
              background: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              maxHeight: '300px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <h3 style={{ marginTop: '0', color: '#e0b841' }}>Key Terms Summary:</h3>
              <ul>
                <li><strong>3-Month Free Trial:</strong> No charges for first 91 days</li>
                <li><strong>Monthly Fee:</strong> $39.99/month after trial period</li>
                <li><strong>Automatic Billing:</strong> Credit card charged monthly on same date</li>
                <li><strong>Setup:</strong> 5-minute integration with your POS system</li>
                <li><strong>Support:</strong> 24/7 technical support during events</li>
                <li><strong>Cancellation:</strong> Cancel anytime with 30 days notice</li>
                <li><strong>Service Level:</strong> 99% uptime guarantee during event hours</li>
                <li><strong>Data Protection:</strong> Your customer and sales data remains confidential</li>
              </ul>
              
              <h4 style={{ color: '#e0b841', marginTop: '20px' }}>Service Obligations:</h4>
              <p>Vendor agrees to display QR codes prominently and use EzFest as primary ordering method during contracted events. EzFest will provide setup, training, and ongoing support.</p>
              
              <h4 style={{ color: '#e0b841', marginTop: '20px' }}>Liability Limitations:</h4>
              <p>EzFest liability limited to monthly service fees. Not responsible for lost sales due to vendor POS system failures. Force majeure events exempt from service level agreements.</p>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  style={{
                    marginTop: '4px',
                    transform: 'scale(1.2)'
                  }}
                />
                <span>
                  I agree to the terms and conditions outlined above and authorize EzFest to charge my credit card $39.99 monthly beginning 91 days after service activation. I understand I can cancel anytime with 30 days written notice.
                </span>
              </label>
              {errors.agreeToTerms && (
                <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                  {errors.agreeToTerms}
                </div>
              )}
            </div>
          </div>

          {/* Electronic Signature */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#3b0d63', 
              borderBottom: '2px solid #d4af37', 
              paddingBottom: '10px' 
            }}>
              Electronic Signature
            </h2>
            
            <div style={{
              background: 'rgba(224, 184, 65, 0.1)',
              border: '2px solid #e0b841',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0'
            }}>
              <p style={{ margin: '0 0 15px 0', fontWeight: '600' }}>
                By submitting this form, you agree that your electronic signature has the same legal effect as a handwritten signature.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '5px',
                    color: '#333'
                  }}>
                    Electronic Signature
                  </label>
                  <div style={{
                    padding: '12px',
                    border: '2px dashed #e0b841',
                    borderRadius: '5px',
                    backgroundColor: '#333',
                    fontSize: '16px',
                    fontStyle: 'italic',
                    color: '#ffffff'
                  }}>
                    {formData.contactName || 'Your name will appear here'}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '5px',
                    color: '#333'
                  }}>
                    Date
                  </label>
                  <input
                    type="date"
                    name="signatureDate"
                    value={formData.signatureDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting 
                  ? '#666' 
                  : 'linear-gradient(135deg, #e0b841 0%, #d4af37 100%)',
                color: '#000',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(224, 184, 65, 0.3)'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(224, 184, 65, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(224, 184, 65, 0.3)';
                }
              }}
            >
              {isSubmitting ? 'Processing Contract...' : 'Submit Contract & Start Free Trial'}
            </button>
            
            <p style={{ 
              marginTop: '15px', 
              fontSize: '14px', 
              color: '#666',
              maxWidth: '500px',
              margin: '15px auto 0'
            }}>
              Your free trial begins immediately after submission. We'll contact you within 24 hours to complete the setup process.
            </p>
          </div>

          {/* Contact Information */}
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '40px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#e0b841', marginTop: '0' }}>Questions about this contract?</h3>
            <p style={{ margin: '10px 0' }}>
              <strong>Phone:</strong> (305) 434-0738<br/>
              <strong>Email:</strong> maurice.sanders@ezdrink.us<br/>
              <strong>Website:</strong> ezdrink.us
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EzFestVendorContract;