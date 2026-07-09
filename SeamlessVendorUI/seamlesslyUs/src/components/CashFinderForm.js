import React, { useState, useEffect } from 'react';
import '../styles/CashFinderForm.css';

const CashFinderForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    averageRevenue: '',
    casesPurchased: '',
    bestNightRevenue: '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    barName: initialData?.company || '' // Map company from lead form to barName
  });
  
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // Always start at step 1 (revenue questions)

  useEffect(() => {
    // If initial data is provided, update form data
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        barName: initialData.company || ''
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For revenue fields, handle currency formatting
    if (name === 'averageRevenue' || name === 'bestNightRevenue') {
      // Remove non-numeric characters except decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.averageRevenue) {
      newErrors.averageRevenue = 'Please enter your average night revenue';
    }
    
    if (!formData.casesPurchased) {
      newErrors.casesPurchased = 'Please enter cases purchased per week';
    } else if (isNaN(formData.casesPurchased) || formData.casesPurchased <= 0) {
      newErrors.casesPurchased = 'Please enter a valid number';
    }
    
    if (!formData.bestNightRevenue) {
      newErrors.bestNightRevenue = 'Please enter your best night revenue';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContinue = (e) => {
    e.preventDefault();
    
    if (validateStep1()) {
      // Skip to submission if we already have user info
      if (initialData) {
        // Calculate opportunity values right away
        const averageRevenue = parseFloat(formData.averageRevenue);
        const bestNightRevenue = parseFloat(formData.bestNightRevenue);
        const casesPurchased = parseInt(formData.casesPurchased);
        
        const peakOpportunity = (bestNightRevenue - averageRevenue) * 4.3;
        const inventoryOpportunity = casesPurchased * 20 * 4.3; // Assuming $20 savings per case
        const totalOpportunity = (peakOpportunity + inventoryOpportunity) * 12;
        
        const calculatedData = {
          ...formData,
          peakOpportunity,
          inventoryOpportunity,
          totalOpportunity
        };
        
        // Pass data to parent component
        if (onSubmit) {
          onSubmit(calculatedData);
        }
      } else {
        // If no initial data, proceed to step 2 to collect user info
        setStep(2);
      }
    }
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    }
    
    if (!formData.barName.trim()) {
      newErrors.barName = 'Please enter your bar/restaurant name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateStep2()) {
      // Calculate opportunity values
      const averageRevenue = parseFloat(formData.averageRevenue);
      const bestNightRevenue = parseFloat(formData.bestNightRevenue);
      const casesPurchased = parseInt(formData.casesPurchased);
      
      const peakOpportunity = (bestNightRevenue - averageRevenue) * 4.3;
      const inventoryOpportunity = casesPurchased * 20 * 4.3; // Assuming $20 savings per case
      const totalOpportunity = (peakOpportunity + inventoryOpportunity) * 12;
      
      const calculatedData = {
        ...formData,
        peakOpportunity,
        inventoryOpportunity,
        totalOpportunity
      };
      
      // Pass data to parent component
      if (onSubmit) {
        onSubmit(calculatedData);
      }
    }
  };

  return (
    <div className="funnel-container">
      <div className="funnel-step">
        <div className="funnel-header">
          <h2 className="funnel-title">
            <span className="gradient-text">Get Your Free Cash Finder Report</span>
          </h2>
          <p className="funnel-subtitle">
            Discover exactly how much more revenue your bar could generate with the right systems in place.
          </p>
        </div>
        
        {step === 1 ? (
          <form className="funnel-form" onSubmit={handleContinue}>
            <div className="form-group">
              <label htmlFor="averageRevenue">Average Night's Revenue *</label>
              <div className="input-with-icon">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  id="averageRevenue"
                  name="averageRevenue"
                  value={formData.averageRevenue}
                  onChange={handleChange}
                  placeholder="2,500"
                  className={errors.averageRevenue ? 'error' : ''}
                />
              </div>
              {errors.averageRevenue && <span className="error-message">{errors.averageRevenue}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="casesPurchased">Cases Purchased Per Week *</label>
              <input
                type="number"
                id="casesPurchased"
                name="casesPurchased"
                value={formData.casesPurchased}
                onChange={handleChange}
                placeholder="25"
                min="1"
                className={errors.casesPurchased ? 'error' : ''}
              />
              {errors.casesPurchased && <span className="error-message">{errors.casesPurchased}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="bestNightRevenue">Best Night Revenue Total *</label>
              <div className="input-with-icon">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  id="bestNightRevenue"
                  name="bestNightRevenue"
                  value={formData.bestNightRevenue}
                  onChange={handleChange}
                  placeholder="4,000"
                  className={errors.bestNightRevenue ? 'error' : ''}
                />
              </div>
              {errors.bestNightRevenue && <span className="error-message">{errors.bestNightRevenue}</span>}
            </div>
            
            <div className="benefits-highlights">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Reduced Wait</h4>
                  <p>30% less wait time</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Increased Revenue</h4>
                  <p>25% boost</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Staff Efficiency</h4>
                  <p>40% productivity</p>
                </div>
              </div>
            </div>
            
            <div className="funnel-footer">
              <button type="submit" className="primary-button submit-button">
                {initialData ? 'Tap In: Get Your Cash Finder Report' : 'Continue to Unlock Your Insights →'}
              </button>
            </div>
          </form>
        ) : (
          <form className="funnel-form" onSubmit={handleSubmit}>
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
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="barName">Bar/Restaurant Name *</label>
              <input
                type="text"
                id="barName"
                name="barName"
                value={formData.barName}
                onChange={handleChange}
                placeholder="The Tipsy Tavern"
                className={errors.barName ? 'error' : ''}
              />
              {errors.barName && <span className="error-message">{errors.barName}</span>}
            </div>
            
            <div className="form-buttons">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="secondary-button back-button"
              >
                ← Back
              </button>
              
              <button type="submit" className="primary-button submit-button">
                Tap In: Get Your Cash Finder Report
              </button>
            </div>
            
            <p className="privacy-note">
              We respect your privacy. Your information will never be sold or shared.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default CashFinderForm;