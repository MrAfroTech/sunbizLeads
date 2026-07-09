import React, { useState, useEffect, useRef } from 'react';
import '../styles/EventPlannersPlaybookLanding.css';

const WHATS_INSIDE = [
  'How to connect digital ticketing + mobile ordering into one frictionless experience',
  "Custom branded mobile wallet cards that keep your event in guests' pockets",
  'Parking integration that eliminates the #1 guest frustration',
  'The "halo effect": Extending your event through after-party connections',
  'Strategic partnerships with local establishments that create recurring revenue streams',
  'The complete tech stack that turns one-time guests into loyal regulars',
  'The cool factor that will give your events the hidden WOW factor to match the rest of their experience',
];

const EventPlannersPlaybookLanding = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentSms, setConsentSms] = useState(false);
  const [consentPromo, setConsentPromo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    document.title = "Event Planner's Playbook | Seamlessly";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (success && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setDebugInfo(null);
    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      consent_sms: consentSms,
      consent_promo: consentPromo,
    };

    const url = `${window.location.origin}/api/submit-lead`;
    console.log('[Playbook] 1. Click: sending POST to', url, 'payload:', payload);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (_) {
        responseData = { raw: responseText };
      }

      console.log('[Playbook] 2. Response:', response.status, response.statusText, responseData);

      if (response.ok) {
        console.log('[Playbook] 3. Expected: success → show success message, hide form');
        setSuccess(true);
      } else {
        console.warn('[Playbook] 3. Unexpected:', response.status, '→ show error, re-enable button. Body:', responseData);
        setDebugInfo({ status: response.status, statusText: response.statusText, body: responseData });
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('[Playbook] 3. Network/request failed:', err.message, err);
      setDebugInfo({ error: err.message });
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="playbook-landing-page">
      <div className="playbook-container">
        <div className="playbook-card" ref={cardRef}>
          <h1>The Event Planner's Playbook: Connect Every Touchpoint From Purchase To After-Party</h1>

          <div className="whats-inside">
            <h2>What's Inside:</h2>
            <ul>
              {WHATS_INSIDE.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="social-proof">
            Official Partner of <span>the Orlando Pirates (Kia Center)</span>
          </p>

          {success && (
            <div className="success-message">
              🎉 Check your email! Your Event Planner's Playbook is on its way.
            </div>
          )}

          {error && (
            <div className="error-message">
              <div>Something went wrong. Please try again or email us at team@ezdrink.us</div>
              {debugInfo && (
                <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
                  <strong>Debug:</strong>{' '}
                  {debugInfo.status != null && `HTTP ${debugInfo.status} ${debugInfo.statusText || ''}`}
                  {debugInfo.error && ` ${debugInfo.error}`}
                  {debugInfo.body?.error && ` — ${debugInfo.body.error}`}
                </div>
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  Phone <span style={{ color: 'rgba(26, 20, 16, 0.5)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="consent_sms"
                    checked={consentSms}
                    onChange={(e) => setConsentSms(e.target.checked)}
                  />
                  <span>I'd like to receive updates via SMS. By checking, I consent to receive texts at the number provided. Msg & data rates may apply.</span>
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="consent_promo"
                    checked={consentPromo}
                    onChange={(e) => setConsentPromo(e.target.checked)}
                  />
                  <span>Yes! Send me strategies to make great events even better</span>
                </label>
              </div>

              <button type="submit" className="cta-button" disabled={loading}>
                {loading ? 'Sending your playbook...' : 'GET MY FREE PLAYBOOK NOW'}
              </button>

              <p className="urgency-text">Instant access - start creating loyal repeat guests today</p>
              <p className="privacy-text">We respect your privacy. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPlannersPlaybookLanding;
