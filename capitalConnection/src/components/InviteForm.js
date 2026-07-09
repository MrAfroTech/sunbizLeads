import React, { useState, useEffect, useRef } from 'react';
import '../styles/InviteForm.css';

const STORAGE_KEY = 'capital-connection-invites';

function InviteForm({ isOpen, onClose, audience }) {
  const isFounder = audience === 'founder';
  const firstInputRef = useRef(null);
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
      setFormData({
        fullName: '',
        email: '',
        companyOrFundName: '',
        description: '',
        investmentFocus: '',
        arrOrFundingStatus: '',
      });
      setErrors({});
      setSubmitted(false);
      requestAnimationFrame(() => firstInputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.companyOrFundName?.trim()) {
      newErrors.companyOrFundName = isFounder ? 'Company name is required' : 'Fund name is required';
    }
    if (!formData.description?.trim()) newErrors.description = 'Brief description is required';
    else if (formData.description.length > 600) {
      newErrors.description = 'Please keep to 2–3 sentences (max 600 characters)';
    }
    if (isFounder && !formData.arrOrFundingStatus?.trim()) {
      newErrors.arrOrFundingStatus = 'Current ARR or funding status is required';
    }
    if (!isFounder && !formData.investmentFocus?.trim()) {
      newErrors.investmentFocus = 'Investment focus is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const payload = {
      audience,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      companyOrFundName: formData.companyOrFundName.trim(),
      description: formData.description.trim(),
      submittedAt: new Date().toISOString(),
    };
    if (isFounder) payload.arrOrFundingStatus = formData.arrOrFundingStatus.trim();
    else payload.investmentFocus = formData.investmentFocus.trim();

    const apiBase = process.env.REACT_APP_API_BASE_URL || '';

    try {
      if (apiBase) {
        const response = await fetch(`${apiBase}/api/capital-connection-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          throw new Error(result.error || result.message || `Request failed (${response.status})`);
        }
      } else {
        // MVP: store in localStorage and log to console
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        stored.push({ ...payload, id: `cd_${Date.now()}` });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        console.log('Capital Connection invite (MVP):', payload);
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
      <div
        className="popup-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-form-title"
      >
        <button type="button" className="popup-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {submitted ? (
          <div className="thank-you-message">
            <h3>Request Received</h3>
            <p>Thanks for your interest in The Capital Connection. We&apos;ll review your request and be in touch soon.</p>
            <button type="button" className="primary-button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="popup-header">
              <h3 id="invite-form-title" className="popup-title">Request an Invitation</h3>
              <p className="popup-subtitle">{isFounder ? 'Founder' : 'Investor'} — The Capital Connection</p>
            </div>

            <form onSubmit={handleSubmit} className="popup-form" noValidate>
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  ref={firstInputRef}
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
                <label htmlFor="companyOrFundName">{isFounder ? 'Company Name' : 'Fund / Firm Name'} *</label>
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
                  {errors.arrOrFundingStatus && <p className="form-error">{errors.arrOrFundingStatus}</p>}
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
                  {errors.investmentFocus && <p className="form-error">{errors.investmentFocus}</p>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Brief description (2–3 sentences, max 600 characters) *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={isFounder ? "What you're building and why you're a fit for this dinner." : 'Your focus and what you look for in founders.'}
                  rows={4}
                  maxLength={600}
                />
                <span className="form-hint">{formData.description.length}/600</span>
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              {errors.submit && <p className="form-error">{errors.submit}</p>}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Submitting…' : 'Request Invitation'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default InviteForm;
