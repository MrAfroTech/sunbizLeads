import React, { useState, useEffect } from 'react';
import '../styles/LeadCapturePopup.css';

const LeadCapturePopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    userType: 'bar_owner' // Default value
  });
  
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    // Disable body scroll when popup is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleNext = () => {
    // Validate email
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    
    setStep(2);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // In a real app, you would send the data to your server here
    // For now, just show the success message
    setSubmitted(true);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>
        
        {submitted ? (
          <div className="thank-you-message">
            <h3>Thank You!</h3>
            <p>We'll be in touch soon with information on how EzDrink can help your business save time and increase revenue.</p>
            <button className="primary-button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div className="popup-content">
            <div className="popup-header">
              <h3 className="popup-title">
                Boost Your Bar's Revenue
              </h3>
              <p className="popup-subtitle">
                Bars using EzDrink report:
              </p>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span className="benefit-text">30% shorter wait times</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <span className="benefit-text">25% increase in average order value</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🍹</span>
                  <span className="benefit-text">40% increase in staff efficiency</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="popup-form">
              {step === 1 ? (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="userType">I am a:</label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                    >
                      <option value="bar_owner">Bar Owner/Manager</option>
                      <option value="customer">Customer</option>
                      <option value="investor">Investor</option>
                    </select>
                  </div>
                  
                  <button 
                    type="button" 
                    className="primary-button next-button"
                    onClick={handleNext}
                  >
                    Get Free ROI Analysis
                  </button>
                  
                  <p className="form-disclaimer">
                    By continuing, you agree to receive emails from EzDrink. 
                    You can unsubscribe at any time.
                  </p>
                </div>
              ) : (
                <div className="form-step">
                  <h4>Almost There!</h4>
                  <p>Add your phone number to receive your personalized ROI analysis via text (optional).</p>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="primary-button submit-button"
                  >
                    Get My Free Analysis
                  </button>
                  
                  <button 
                    type="button" 
                    className="text-button back-button"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCapturePopup;