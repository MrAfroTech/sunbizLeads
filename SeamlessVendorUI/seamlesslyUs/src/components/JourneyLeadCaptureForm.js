import React from 'react';

/**
 * Collects name, email, phone for journey tables when contact is not already in the URL.
 */
const JourneyLeadCaptureForm = ({ fullName, email, phone, onChange }) => (
  <div className="watch-vs-order-lead-block" style={{ marginBottom: '20px' }}>
    <div className="watch-vs-order-field-group">
      <div className="watch-vs-order-field-label">Your name</div>
      <input
        className="watch-vs-order-field-input"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={(e) => onChange('fullName', e.target.value)}
      />
    </div>
    <div className="watch-vs-order-field-group">
      <div className="watch-vs-order-field-label">Work email</div>
      <input
        className="watch-vs-order-field-input"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => onChange('email', e.target.value)}
      />
    </div>
    <div className="watch-vs-order-field-group">
      <div className="watch-vs-order-field-label">Best number to reach you</div>
      <input
        className="watch-vs-order-field-input"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => onChange('phone', e.target.value)}
      />
    </div>
  </div>
);

export default JourneyLeadCaptureForm;
