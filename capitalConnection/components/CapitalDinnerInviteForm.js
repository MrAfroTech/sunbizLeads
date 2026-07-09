import React, { useState, useEffect } from 'react';
import '../styles/CapitalDinnerForm.css';

const CapitalDinnerInviteForm = ({ isOpen, onClose, audience }) => {
  const isFounder = audience === 'founder';
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyOrFundName: '',
    description: '',
    investmentFocus: '',
    arrOrFundingStatus: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.companyOrFundName?.trim()) {
      newErrors.companyOrFundName = isFounder ? 'Company name is required' : 'Fund name is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Brief description is required';
    } else if (formData.description.length > 600) {
      newErrors.description = 'Please keep to 2–3 sentences (max 600 characters)';
    }
    if (isFounder) {
      if (!formData.arrOrFundingStatus?.trim()) {
        newErrors.arrOrFundingStatus = 'Current ARR or funding status is required';
      }
    } else {
      if (!formData.investmentFocus?.trim()) {
        newErrors.investmentFocus = 'Investment focus is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        audience,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        companyOrFundName: formData.companyOrFundName.trim(),
        description: formData.description.trim(),
      };
      if (isFounder) {
        payload.arrOrFundingStatus = formData.arrOrFundingStatus.trim();
      } else {
        payload.investmentFocus = formData.investmentFocus.trim();
      }

      const apiBase = process.env.REACT_APP_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/capital-dinner-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || result.message || `Request failed (${response.status})`);
      }
      if (result.success === false) {
        throw new Error(result.error || result.message || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container capital-dinner-form" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {submitted ? (
          <div className="thank-you-message">
            <h3>Request Received</h3>
            <p>
              Thanks for your interest in The Capital Dinner. We&apos;ll review your request and be in touch soon.
            </p>
            <button type="button" className="primary-button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className="popup-content">
            <div className="popup-header">
              <h3 className="popup-title">Request an Invitation</h3>
              <p className="popup-subtitle">
                {isFounder ? 'Founder' : 'Investor'} — The Capital Dinner
              </p>
            </div>

            <form onSubmit={handleSubmit} className="popup-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
                {errors.fullName && <p className="form-error">{errors.fullName}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="companyOrFundName">
                  {isFounder ? 'Company Name' : 'Fund / Firm Name'} *
                </label>
                <input
                  type="text"
                  id="companyOrFundName"
                  name="companyOrFundName"
                  value={formData.companyOrFundName}
                  onChange={handleChange}
                  placeholder={isFounder ? 'Acme Inc.' : 'Acme Ventures'}
                />
                {errors.companyOrFundName && <p className="form-error">{errors.companyOrFundName}</p>}
              </div>

              {isFounder ? (
                <div className="form-group">
                  <label htmlFor="arrOrFundingStatus">Current ARR or Funding Status *</label>
                  <input
                    type="text"
                    id="arrOrFundingStatus"
                    name="arrOrFundingStatus"
                    value={formData.arrOrFundingStatus}
                    onChange={handleChange}
                    placeholder="e.g. $500K ARR, or Pre-seed from XYZ Angels"
                  />
                  {errors.arrOrFundingStatus && (
                    <p className="form-error">{errors.arrOrFundingStatus}</p>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="investmentFocus">Investment Focus *</label>
                  <input
                    type="text"
                    id="investmentFocus"
                    name="investmentFocus"
                    value={formData.investmentFocus}
                    onChange={handleChange}
                    placeholder="e.g. SaaS, AI, early-stage"
                  />
                  {errors.investmentFocus && (
                    <p className="form-error">{errors.investmentFocus}</p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Brief description (2–3 sentences) *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={
                    isFounder
                      ? "What you're building and why you're a fit for this dinner."
                      : 'Your focus and what you look for in founders.'
                  }
                  rows={4}
                  maxLength={600}
                  className="capital-dinner-textarea"
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              {errors.submit && <p className="form-error">{errors.submit}</p>}

              <button
                type="submit"
                className="primary-button submit-button"
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Request Invitation'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapitalDinnerInviteForm;
