
import React, { useState } from 'react';
import './LeadMagnetForm.css'; // You'll need to create this CSS file

const LeadMagnetForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    venueType: 'bar',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prevState => ({
        ...prevState,
        [name]: ''
      }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Bar/Restaurant name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        // Call the API endpoint to send the lead magnet
        const response = await fetch('/api/send-seven-profits-lead-magnet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-vercel-protection-bypass': process.env.NEXT_PUBLIC_BYPASS_SECRET || ''
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error sending lead magnet');
        }
        
        // Show success message
        setSubmitSuccess(true);
        
        // Store successful submission in localStorage for backup
        try {
          const existingLeads = JSON.parse(localStorage.getItem('ezdrink_leads') || '[]');
          localStorage.setItem('ezdrink_leads', JSON.stringify([
            ...existingLeads,
            {
              ...formData,
              submittedAt: new Date().toISOString()
            }
          ]));
        } catch (storageError) {
          console.error('Error storing lead data in localStorage:', storageError);
        }
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(formData);
          }, 2000);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setSubmitError(error.message || 'There was an error sending your request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // If submission was successful, show success message
  if (submitSuccess) {
    return (
      <div className="lead-magnet-form success-container">
        <div className="success-header">
          <h2 className="success-title">Success!</h2>
          <p className="success-message">
            Your "7 Bar Profit Secrets" guide has been sent to your email.
          </p>
        </div>
        
        <div className="success-content">
          <p>Please check your inbox at <strong>{formData.email}</strong> for your guide.</p>
          <p>If you don't see it within a few minutes, please check your spam folder.</p>
          
          <p className="next-steps">
            <strong>Next Steps:</strong> Book your free consultation to see how these profit-boosting 
            strategies can be customized for {formData.businessName}.
          </p>
          
          <div className="success-buttons">
            <a href="https://ezdrink.us/demo" className="primary-button">Book Your Free Demo</a>
            <button 
              onClick={onClose} 
              className="secondary-button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="lead-magnet-form">
      <div className="form-header">
        <h2 className="form-title">
          Get Your Free Guide: <span className="highlight">7 Venue Profit Secrets</span>
        </h2>
        <p className="form-subtitle">
          Discover how the top 1% of venues maintain consistently high profits
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Smith"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@yourbar.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number (Optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="businessName">Bar/Restaurant Name *</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="The Tipsy Tavern"
            className={errors.businessName ? 'error' : ''}
          />
          {errors.businessName && <span className="error-message">{errors.businessName}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="venueType">Venue Type</label>
          <select
            id="venueType"
            name="venueType"
            value={formData.venueType}
            onChange={handleChange}
          >
            <option value="bar">Bar</option>
            <option value="restaurant">Restaurant</option>
            <option value="nightclub">Nightclub</option>
            <option value="brewery">Brewery</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Any specific challenges you're facing? (Optional)</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your current challenges or what you'd like to improve..."
            rows="3"
          />
        </div>
        
        {submitError && (
          <div className="error-notification">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{submitError}</span>
          </div>
        )}
        
        <div className="form-footer">
          <button 
            type="submit" 
            className="primary-button submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Me The 7 Profit Secrets'}
          </button>
          <p className="privacy-note">
            We respect your privacy. Your information will never be sold or shared.
          </p>
        </div>
      </form>
    </div>
  );
};

export default LeadMagnetForm;