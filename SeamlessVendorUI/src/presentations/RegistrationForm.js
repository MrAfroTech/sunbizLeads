import React, { useState } from 'react';
import '../styles/RegistrationForm.css';

const RegistrationForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    phone: '',
    businessType: '',
    currentVolume: '',
    biggestChallenge: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Please select your business type';
    }
    
    if (!formData.currentVolume) {
      newErrors.currentVolume = 'Please select your current volume';
    }
    
    if (!formData.biggestChallenge.trim()) {
      newErrors.biggestChallenge = 'Please tell us your biggest challenge';
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
      
      // In a real implementation, you would send the data to your backend
      console.log('Registration data:', formData);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="registration-modal-overlay">
        <div className="registration-modal success-modal">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>You're In!</h2>
            <p>
              Thank you for registering for "From Overwhelmed to Overjoyed" webinar. 
              You'll receive a confirmation email with the webinar details shortly.
            </p>
            <div className="success-details">
              <p><strong>Webinar Date:</strong> [Date will be sent via email]</p>
              <p><strong>Duration:</strong> 12 minutes</p>
              <p><strong>Format:</strong> Online (link will be provided)</p>
            </div>
            <button className="primary-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-modal-overlay">
      <div className="registration-modal">
        <div className="modal-header">
          <h2>Reserve Your Spot</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="webinar-info">
            <h3>The 12-Minute "From Overwhelmed to Overjoyed" Webinar</h3>
            <p>Learn how to handle 3x more orders with LESS stress</p>
            <div className="webinar-details">
              <div className="detail-item">
                <span className="detail-icon">⏱️</span>
                <span>12 minutes</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">💰</span>
                <span>Free</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📱</span>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? 'error' : ''}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? 'error' : ''}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={errors.businessName ? 'error' : ''}
                placeholder="Enter your business name"
              />
              {errors.businessName && <span className="error-message">{errors.businessName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={errors.phone ? 'error' : ''}
                placeholder="Enter your phone number"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessType">Business Type *</label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className={errors.businessType ? 'error' : ''}
                >
                  <option value="">Select your business type</option>
                  <option value="food-truck">Food Truck</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="catering">Catering</option>
                  <option value="food-stand">Food Stand</option>
                  <option value="other">Other</option>
                </select>
                {errors.businessType && <span className="error-message">{errors.businessType}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="currentVolume">Current Daily Orders *</label>
                <select
                  id="currentVolume"
                  name="currentVolume"
                  value={formData.currentVolume}
                  onChange={handleInputChange}
                  className={errors.currentVolume ? 'error' : ''}
                >
                  <option value="">Select your current volume</option>
                  <option value="1-25">1-25 orders/day</option>
                  <option value="26-50">26-50 orders/day</option>
                  <option value="51-100">51-100 orders/day</option>
                  <option value="101-200">101-200 orders/day</option>
                  <option value="200+">200+ orders/day</option>
                </select>
                {errors.currentVolume && <span className="error-message">{errors.currentVolume}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="biggestChallenge">What's your biggest challenge with order management? *</label>
              <textarea
                id="biggestChallenge"
                name="biggestChallenge"
                value={formData.biggestChallenge}
                onChange={handleInputChange}
                className={errors.biggestChallenge ? 'error' : ''}
                placeholder="Tell us about your biggest challenge..."
                rows="3"
              />
              {errors.biggestChallenge && <span className="error-message">{errors.biggestChallenge}</span>}
            </div>
            
            {errors.submit && (
              <div className="error-message submit-error">{errors.submit}</div>
            )}
            
            <button 
              type="submit" 
              className="primary-button large"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Reserve My Spot'}
            </button>
            
            <p className="form-disclaimer">
              By registering, you agree to receive webinar details and occasional updates from SeamlessMarketplace. 
              You can unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
